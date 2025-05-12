/**
 * Stripe-hjälpfunktioner för Edge Functions
 */
import Stripe from 'https://esm.sh/stripe@12.0.0?dts';
import { WebhookError, ErrorCode, withRetry } from './error-handler.ts';

let stripeInstance: Stripe | null = null;

// Hämta en cachad Stripe-instans
export function getStripeClient(): Stripe {
  if (!stripeInstance) {
    const stripeApiKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!stripeApiKey) {
      throw new WebhookError('Stripe API-nyckel saknas i miljövariabler', 500);
    }
    
    stripeInstance = new Stripe(stripeApiKey, {
      apiVersion: '2022-11-15',
      maxNetworkRetries: 2, // Inbyggd retry-funktionalitet i Stripe-klienten
      timeout: 30000 // 30 sekunder timeout
    });
  }
  
  return stripeInstance;
}

// Verifiera Stripe webhook-signatur
export function verifyStripeWebhookSignature(
  requestBody: string,
  signature: string | null
): Stripe.Event {
  if (!signature) {
    throw new WebhookError(
      'Stripe signatur saknas i headers', 
      400
    );
  }
  
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  
  if (!webhookSecret) {
    throw new WebhookError(
      'Stripe webhook-hemlighet saknas i miljövariabler', 
      500
    );
  }
  
  try {
    const stripe = getStripeClient();
    return stripe.webhooks.constructEvent(requestBody, signature, webhookSecret);
  } catch (error) {
    throw new WebhookError(
      `Ogiltig Stripe-signatur: ${error.message}`, 
      400
    );
  }
}

// Hämta en prenumeration från Stripe med felhantering och retry
export async function getSubscriptionFromStripe(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  try {
    const stripe = getStripeClient();
    
    return await withRetry(async () => {
      return await stripe.subscriptions.retrieve(subscriptionId);
    }, 3);
  } catch (error) {
    throw new WebhookError(
      `Kunde inte hämta prenumeration från Stripe: ${error.message}`,
      error.statusCode || 500
    );
  }
}

// Hämta en kund från Stripe med felhantering och retry
export async function getCustomerFromStripe(
  customerId: string
): Promise<Stripe.Customer> {
  try {
    const stripe = getStripeClient();
    
    return await withRetry(async () => {
      return await stripe.customers.retrieve(customerId) as Stripe.Customer;
    }, 3);
  } catch (error) {
    throw new WebhookError(
      `Kunde inte hämta kund från Stripe: ${error.message}`,
      error.statusCode || 500
    );
  }
}

// Formatera Stripe-tidsstämplar till ISO-datumsträngar
export function formatStripeTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
} 