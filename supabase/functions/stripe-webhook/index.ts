import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@12.0.0?dts';

// Importera våra gemensamma hjälpmoduler
import { 
  createErrorResponse, 
  createSuccessResponse, 
  logError, 
  corsHeaders, 
  WebhookError, 
  ErrorCode,
  withErrorTracking
} from '../common/error-handler.ts';

import { 
  getSubscriptionByStripeId, 
  updateSubscription, 
  createSubscriptionHistoryEntry, 
  createNotification 
} from '../common/db-helper.ts';

import { 
  verifyStripeWebhookSignature, 
  getSubscriptionFromStripe, 
  getCustomerFromStripe,
  formatStripeTimestamp
} from '../common/stripe-helper.ts';

/**
 * Hanterar webhook-händelser från Stripe
 */
async function handleStripeWebhook(req: Request): Promise<Response> {
  // Endast acceptera POST-förfrågningar
  if (req.method !== 'POST') {
    return createErrorResponse(
      new WebhookError('Metoden stöds inte', 405),
      405,
      ErrorCode.METHOD_NOT_ALLOWED
    );
  }

  try {
    // Läs request body
    const body = await req.text();
    
    // Hämta Stripe-signatur från headers
    const signature = req.headers.get('stripe-signature');
    
    // Verifiera webhook-signatur
    const event = verifyStripeWebhookSignature(body, signature);
    
    // Logga webhook-typ
    console.log(`Mottagen Stripe webhook: ${event.type}`);
    
    // Hantera olika typer av händelser
    switch (event.type) {
      case 'checkout.session.completed':
        await withErrorTracking(
          'Handle checkout.session.completed',
          () => handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        );
        break;
        
      case 'invoice.payment_succeeded':
        await withErrorTracking(
          'Handle invoice.payment_succeeded',
          () => handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        );
        break;
        
      case 'invoice.payment_failed':
        await withErrorTracking(
          'Handle invoice.payment_failed',
          () => handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        );
        break;
        
      case 'customer.subscription.updated':
        await withErrorTracking(
          'Handle customer.subscription.updated',
          () => handleCustomerSubscriptionUpdated(event.data.object as Stripe.Subscription)
        );
        break;
        
      case 'customer.subscription.deleted':
        await withErrorTracking(
          'Handle customer.subscription.deleted',
          () => handleCustomerSubscriptionDeleted(event.data.object as Stripe.Subscription)
        );
        break;
        
      default:
        console.log(`Ohanterad händelsetyp: ${event.type}`);
    }
    
    // Returnera 200 OK för att bekräfta mottagningen
    return createSuccessResponse({ received: true });
  } catch (error) {
    // Logga felet
    logError(error, { webhook: 'stripe', method: req.method });
    
    if (error instanceof WebhookError) {
      return createErrorResponse(
        error,
        error.statusCode,
        ErrorCode.STRIPE_SIGNATURE_INVALID
      );
    }
    
    // För Stripe webhooks vill vi ofta returnera 200 OK även vid fel
    // för att förhindra att Stripe försöker igen med samma webhook
    // Vi loggar felet men returnerar fortfarande 200
    console.error('Fel vid hantering av webhook, returnerar ändå 200 OK:', error);
    return createSuccessResponse({ 
      received: true, 
      success: false,
      error: {
        message: 'Ett internt fel inträffade men webhooks bekräftades ändå'
      }
    });
  }
}

/**
 * Hanterar en slutförd checkout-session
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  if (!session.subscription || session.mode !== 'subscription') {
    console.log('Ignorerar icke-prenumerations checkout session');
    return;
  }
  
  // Hämta metadata från sessionen
  const metadata = session.metadata || {};
  const organizationId = metadata.organization_id;
  
  if (!organizationId) {
    throw new WebhookError('organization_id saknas i checkout session metadata', 400);
  }
  
  // Hämta prenumerationsinformation från Stripe med hjälpfunktion
  const subscriptionId = session.subscription as string;
  const subscription = await getSubscriptionFromStripe(subscriptionId);
  const customer = await getCustomerFromStripe(session.customer as string);
  
  // Skapa/uppdatera prenumeration i databasen
  const subscriptionData = {
    organization_id: organizationId,
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: session.customer as string,
    plan_id: metadata.plan_id || '',
    status: subscription.status,
    current_period_start: formatStripeTimestamp(subscription.current_period_start),
    current_period_end: formatStripeTimestamp(subscription.current_period_end),
    cancel_at_period_end: subscription.cancel_at_period_end,
    payment_provider: 'stripe',
    updated_at: new Date().toISOString(),
  };
  
  try {
    // Kolla först om prenumerationen redan finns
    let existingSubscription = null;
    try {
      existingSubscription = await getSubscriptionByStripeId(subscriptionId);
    } catch (error) {
      // Om prenumerationen inte hittades, fortsätt med att skapa ny
      console.log(`Ingen befintlig prenumeration hittades för Stripe ID: ${subscriptionId}, skapar ny`);
    }
    
    let subscriptionResult;
    if (existingSubscription) {
      // Uppdatera befintlig prenumeration
      subscriptionResult = await updateSubscription(existingSubscription.id, subscriptionData);
    } else {
      // Skapa ny prenumeration via direkt databasanrop
      const client = getSupabaseClient(true);
      const { data, error } = await client
        .from('subscriptions')
        .insert({
          ...subscriptionData,
          created_at: new Date().toISOString(),
        })
        .select('*')
        .single();
        
      if (error) {
        throw new WebhookError(`Kunde inte skapa prenumeration: ${error.message}`, 500);
      }
      
      subscriptionResult = data;
    }
    
    // Skapa en händelsepost i prenumerationshistorik
    await createSubscriptionHistoryEntry(
      subscriptionResult.id,
      'subscription_created',
      {
        checkout_session: session.id,
        customer: session.customer,
        status: subscription.status,
      }
    );
    
    console.log(`Prenumeration skapad/uppdaterad för organisation: ${organizationId}`);
  } catch (error) {
    throw new WebhookError(`Fel vid hantering av checkout.session.completed: ${error.message}`, 500);
  }
}

/**
 * Hanterar lyckade fakturabetalningar
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = invoice.subscription as string;
  
  if (!subscriptionId) {
    console.log('Ignorerar icke-prenumerations faktura');
    return;
  }
  
  try {
    // Hämta prenumerationen från Stripe
    const stripeSubscription = await getSubscriptionFromStripe(subscriptionId);
    
    // Hämta prenumerationen från databasen
    let dbSubscription;
    try {
      dbSubscription = await getSubscriptionByStripeId(subscriptionId);
    } catch (error) {
      throw new WebhookError(`Kunde inte hitta prenumeration för Stripe ID: ${subscriptionId}`, 404);
    }
    
    // Uppdatera prenumerationens status
    await updateSubscription(dbSubscription.id, {
      status: stripeSubscription.status,
      current_period_start: formatStripeTimestamp(stripeSubscription.current_period_start),
      current_period_end: formatStripeTimestamp(stripeSubscription.current_period_end),
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
    });
    
    // Skapa en händelsepost i prenumerationshistorik
    await createSubscriptionHistoryEntry(
      dbSubscription.id,
      'payment_succeeded',
      {
        invoice_id: invoice.id,
        amount: invoice.total,
        currency: invoice.currency,
        billing_reason: invoice.billing_reason,
      }
    );
    
    console.log(`Betalning lyckades för prenumeration: ${dbSubscription.id}`);
  } catch (error) {
    throw new WebhookError(`Fel vid hantering av invoice.payment_succeeded: ${error.message}`, 500);
  }
}

/**
 * Hanterar misslyckade fakturabetalningar
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = invoice.subscription as string;
  
  if (!subscriptionId) {
    console.log('Ignorerar icke-prenumerations faktura');
    return;
  }
  
  try {
    // Hämta prenumerationen från Stripe
    const stripeSubscription = await getSubscriptionFromStripe(subscriptionId);
    
    // Hämta prenumerationen från databasen
    let dbSubscription;
    try {
      dbSubscription = await getSubscriptionByStripeId(subscriptionId);
    } catch (error) {
      throw new WebhookError(`Kunde inte hitta prenumeration för Stripe ID: ${subscriptionId}`, 404);
    }
    
    // Uppdatera prenumerationens status
    await updateSubscription(dbSubscription.id, {
      status: stripeSubscription.status, // Troligen 'past_due' eller liknande
    });
    
    // Skapa en händelsepost i prenumerationshistorik
    await createSubscriptionHistoryEntry(
      dbSubscription.id,
      'payment_failed',
      {
        invoice_id: invoice.id,
        attempt_count: invoice.attempt_count,
        next_payment_attempt: invoice.next_payment_attempt ? 
          formatStripeTimestamp(invoice.next_payment_attempt) : null,
        status: invoice.status,
      }
    );
    
    // TODO: Hämta administratörer för organisationen och skicka notifikationer
    // (Implementeras när användarroller finns tillgängliga)
    
    console.log(`Betalning misslyckades för prenumeration: ${dbSubscription.id}`);
  } catch (error) {
    throw new WebhookError(`Fel vid hantering av invoice.payment_failed: ${error.message}`, 500);
  }
}

/**
 * Hanterar prenumerationsuppdateringar
 */
async function handleCustomerSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {
  try {
    // Hämta prenumerationen från databasen
    let dbSubscription;
    try {
      dbSubscription = await getSubscriptionByStripeId(stripeSubscription.id);
    } catch (error) {
      throw new WebhookError(`Kunde inte hitta prenumeration för Stripe ID: ${stripeSubscription.id}`, 404);
    }
    
    const previousStatus = dbSubscription.status;
    
    // Uppdatera prenumerationens status
    await updateSubscription(dbSubscription.id, {
      status: stripeSubscription.status,
      current_period_start: formatStripeTimestamp(stripeSubscription.current_period_start),
      current_period_end: formatStripeTimestamp(stripeSubscription.current_period_end),
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
    });
    
    // Skapa en händelsepost i prenumerationshistorik
    await createSubscriptionHistoryEntry(
      dbSubscription.id,
      'subscription_updated',
      {
        previous_status: previousStatus,
        new_status: stripeSubscription.status,
        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      }
    );
    
    console.log(`Prenumeration uppdaterad för: ${dbSubscription.id}`);
  } catch (error) {
    throw new WebhookError(`Fel vid hantering av customer.subscription.updated: ${error.message}`, 500);
  }
}

/**
 * Hanterar när en prenumeration tas bort
 */
async function handleCustomerSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
  try {
    // Hämta prenumerationen från databasen
    let dbSubscription;
    try {
      dbSubscription = await getSubscriptionByStripeId(stripeSubscription.id);
    } catch (error) {
      throw new WebhookError(`Kunde inte hitta prenumeration för Stripe ID: ${stripeSubscription.id}`, 404);
    }
    
    const previousStatus = dbSubscription.status;
    
    // Uppdatera prenumerationens status
    await updateSubscription(dbSubscription.id, {
      status: 'canceled',
    });
    
    // Skapa en händelsepost i prenumerationshistorik
    await createSubscriptionHistoryEntry(
      dbSubscription.id,
      'subscription_deleted',
      {
        previous_status: previousStatus,
        deleted_at: new Date().toISOString(),
      }
    );
    
    console.log(`Prenumeration avslutad för: ${dbSubscription.id}`);
  } catch (error) {
    throw new WebhookError(`Fel vid hantering av customer.subscription.deleted: ${error.message}`, 500);
  }
}

// Hantera OPTIONS-anrop för CORS
function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// Exportera getSupabaseClient funktionen eftersom vi använder den från db-helper
function getSupabaseClient(useServiceRole = false) {
  if (useServiceRole) {
    // Import dynamically only if needed
    const { getSupabaseClient } = import.meta.require('../common/db-helper.ts');
    return getSupabaseClient(true);
  }
  return null;
}

// Serve HTTP-anrop
serve(async (req) => {
  // CORS pre-flight request
  if (req.method === 'OPTIONS') {
    return handleOptions();
  }
  
  // Hantera Stripe webhook
  return await handleStripeWebhook(req);
}); 