import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@12.0.0?dts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Skapa Supabase klient
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Använder service_role för att kunna skriva till tabeller
);

// Skapa Stripe klient
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2022-11-15',
});

// Hemlighet för att säkerställa att jobbkörning endast kan utföras av auktoriserade tjänster
const SCHEDULER_SECRET = Deno.env.get('SCHEDULER_SECRET') ?? '';

/**
 * Hanterar inkommande schemalagda jobb för prenumerationer
 */
async function handleSchedulerRequest(req: Request): Promise<Response> {
  // Tillåt OPTIONS-anrop för CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  
  // Endast godkänn POST-anrop
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Metoden stöds inte' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  try {
    // Parsera request body
    const { jobName, secret } = await req.json();
    
    // Verifiera hemlighet
    if (!secret || secret !== SCHEDULER_SECRET) {
      console.warn('Ogiltig hemlighet vid schemalagd körning');
      return new Response(JSON.stringify({ error: 'Åtkomst nekad' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Utför det schemalagda jobbet baserat på jobName
    switch (jobName) {
      case 'syncSubscriptionStatuses':
        await syncSubscriptionStatuses();
        break;
      
      case 'checkRenewalReminders':
        await checkRenewalReminders();
        break;
      
      case 'processExpiredSubscriptions':
        await processExpiredSubscriptions();
        break;
      
      case 'sendPaymentFailureReminders':
        await sendPaymentFailureReminders();
        break;
      
      case 'updateSubscriptionStatistics':
        await updateSubscriptionStatistics();
        break;
      
      default:
        throw new Error(`Okänt jobb: ${jobName}`);
    }
    
    return new Response(JSON.stringify({ success: true, job: jobName }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Fel vid körning av schemalagt jobb:', error);
    
    return new Response(JSON.stringify({ error: 'Ett fel inträffade under körningen av det schemalagda jobbet' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Synkroniserar prenumerationsstatus med Stripe
 */
async function syncSubscriptionStatuses(): Promise<void> {
  console.log('Kör schemalagt jobb: syncSubscriptionStatuses');
  
  try {
    // Hämta alla aktiva prenumerationer
    const { data: subscriptions, error } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .in('status', ['active', 'past_due', 'incomplete']);
    
    if (error) {
      throw error;
    }
    
    if (!subscriptions || subscriptions.length === 0) {
      console.log('Inga prenumerationer att synkronisera');
      return;
    }
    
    for (const subscription of subscriptions) {
      try {
        if (!subscription.stripe_subscription_id) {
          console.warn(`Prenumeration ${subscription.id} saknar stripe_subscription_id`);
          continue;
        }
        
        // Hämta prenumerationsinformation från Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
        
        // Uppdatera prenumerationsstatusinformation
        await supabaseClient
          .from('subscriptions')
          .update({
            status: stripeSubscription.status,
            current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: stripeSubscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscription.id);
        
        console.log(`Synkroniserade prenumerationsstatus för: ${subscription.id}`);
      } catch (subError) {
        console.error(`Fel vid synkronisering av prenumeration ${subscription.id}:`, subError);
        // Fortsätt med nästa prenumeration även om denna misslyckades
      }
    }
  } catch (error) {
    console.error('Fel vid körning av syncSubscriptionStatuses:', error);
    throw error;
  }
}

/**
 * Kontrollerar prenumerationer som är nära förnyelsedatum och skickar påminnelser
 */
async function checkRenewalReminders(): Promise<void> {
  console.log('Kör schemalagt jobb: checkRenewalReminders');
  
  try {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dagar framåt
    
    // Hämta prenumerationer som förnyas inom 7 dagar
    const { data: subscriptions, error } = await supabaseClient
      .from('subscriptions')
      .select('*, organizations(id, name, billing_email)')
      .eq('status', 'active')
      .gte('current_period_end', now.toISOString())
      .lte('current_period_end', in7Days.toISOString());
    
    if (error) {
      throw error;
    }
    
    if (!subscriptions || subscriptions.length === 0) {
      console.log('Inga prenumerationer att notifiera om förnyelse');
      return;
    }
    
    for (const subscription of subscriptions) {
      try {
        const organization = subscription.organizations;
        
        if (!organization) {
          console.warn(`Kunde inte hitta organisation för prenumeration: ${subscription.id}`);
          continue;
        }
        
        // Skapa notifikation i databasen
        const notificationType = subscription.cancel_at_period_end ? 'subscription_expiry' : 'subscription_renewal';
        const notificationTitle = subscription.cancel_at_period_end 
          ? 'Din prenumeration upphör snart'
          : 'Din prenumeration förnyas snart';
        const notificationBody = subscription.cancel_at_period_end
          ? `Din prenumeration upphör ${new Date(subscription.current_period_end).toLocaleDateString('sv-SE')}. Uppgradera för att behålla åtkomst.`
          : `Din prenumeration förnyas automatiskt ${new Date(subscription.current_period_end).toLocaleDateString('sv-SE')}.`;
        
        // Hämta administratörer för organisationen
        const { data: orgMembers, error: membersError } = await supabaseClient
          .from('organization_members')
          .select('user_id, role')
          .eq('organization_id', organization.id)
          .in('role', ['admin', 'owner']);
        
        if (membersError) {
          throw membersError;
        }
        
        // Skicka notifikation till varje admin
        for (const member of orgMembers || []) {
          await supabaseClient
            .from('notifications')
            .insert({
              user_id: member.user_id,
              title: notificationTitle,
              body: notificationBody,
              type: notificationType,
              metadata: {
                subscription_id: subscription.id,
                organization_id: organization.id,
                renewal_date: subscription.current_period_end,
              },
              is_read: false,
              created_at: new Date().toISOString(),
            });
        }
        
        console.log(`Skickade ${notificationType} notifiering för prenumeration: ${subscription.id}`);
        
        // Skapa händelsepost i prenumerationshistorik
        await supabaseClient
          .from('subscription_history')
          .insert({
            subscription_id: subscription.id,
            event_type: notificationType + '_notification_sent',
            event_data: {
              notification_time: new Date().toISOString(),
              renewal_date: subscription.current_period_end,
            },
          });
      } catch (subError) {
        console.error(`Fel vid notifiering om prenumeration ${subscription.id}:`, subError);
      }
    }
  } catch (error) {
    console.error('Fel vid körning av checkRenewalReminders:', error);
    throw error;
  }
}

/**
 * Stänger av utgångna prenumerationer
 */
async function processExpiredSubscriptions(): Promise<void> {
  console.log('Kör schemalagt jobb: processExpiredSubscriptions');
  
  try {
    const now = new Date();
    
    // Hämta prenumerationer där:
    // 1. De är markerade för att inte förnyas (cancel_at_period_end = true)
    // 2. Slutdatumet har passerats
    // 3. De fortfarande har status 'active'
    const { data: subscriptions, error } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('status', 'active')
      .eq('cancel_at_period_end', true)
      .lt('current_period_end', now.toISOString());
    
    if (error) {
      throw error;
    }
    
    if (!subscriptions || subscriptions.length === 0) {
      console.log('Inga utgångna prenumerationer att behandla');
      return;
    }
    
    for (const subscription of subscriptions) {
      try {
        // Uppdatera status till 'canceled'
        await supabaseClient
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: now.toISOString(),
          })
          .eq('id', subscription.id);
        
        // Skapa händelsepost i prenumerationshistorik
        await supabaseClient
          .from('subscription_history')
          .insert({
            subscription_id: subscription.id,
            event_type: 'subscription_expired',
            event_data: {
              expiry_date: subscription.current_period_end,
              processed_at: now.toISOString(),
            },
          });
        
        console.log(`Stängde av utgången prenumeration: ${subscription.id}`);
      } catch (subError) {
        console.error(`Fel vid avstängning av prenumeration ${subscription.id}:`, subError);
      }
    }
  } catch (error) {
    console.error('Fel vid körning av processExpiredSubscriptions:', error);
    throw error;
  }
}

/**
 * Skickar påminnelse till kunder med förfallna betalningar
 */
async function sendPaymentFailureReminders(): Promise<void> {
  console.log('Kör schemalagt jobb: sendPaymentFailureReminders');
  
  try {
    // Hämta prenumerationer med status 'past_due'
    const { data: subscriptions, error } = await supabaseClient
      .from('subscriptions')
      .select('*, organizations(id, name, billing_email)')
      .eq('status', 'past_due');
    
    if (error) {
      throw error;
    }
    
    if (!subscriptions || subscriptions.length === 0) {
      console.log('Inga prenumerationer med misslyckade betalningar att påminna om');
      return;
    }
    
    for (const subscription of subscriptions) {
      try {
        const organization = subscription.organizations;
        
        if (!organization) {
          console.warn(`Kunde inte hitta organisation för prenumeration: ${subscription.id}`);
          continue;
        }
        
        // Hämta senaste misslyckade betalningsförsöket från historik
        const { data: history, error: historyError } = await supabaseClient
          .from('subscription_history')
          .select('*')
          .eq('subscription_id', subscription.id)
          .eq('event_type', 'payment_failed')
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (historyError) {
          throw historyError;
        }
        
        // Hämta datum för nästa betalningsförsök (om tillgängligt)
        let nextAttemptDate = 'snart';
        if (history && history.length > 0 && history[0].event_data.next_payment_attempt) {
          const date = new Date(history[0].event_data.next_payment_attempt);
          nextAttemptDate = date.toLocaleDateString('sv-SE');
        }
        
        // Skapa notifikation i databasen
        const notificationTitle = 'Problem med din betalning';
        const notificationBody = `Vi kunde inte bearbeta betalningen för din prenumeration. Vi kommer att försöka igen ${nextAttemptDate}. Vänligen uppdatera din betalningsinformation.`;
        
        // Hämta administratörer för organisationen
        const { data: orgMembers, error: membersError } = await supabaseClient
          .from('organization_members')
          .select('user_id, role')
          .eq('organization_id', organization.id)
          .in('role', ['admin', 'owner']);
        
        if (membersError) {
          throw membersError;
        }
        
        // Skicka notifikation till varje admin
        for (const member of orgMembers || []) {
          await supabaseClient
            .from('notifications')
            .insert({
              user_id: member.user_id,
              title: notificationTitle,
              body: notificationBody,
              type: 'payment_failure',
              metadata: {
                subscription_id: subscription.id,
                organization_id: organization.id,
                next_attempt: nextAttemptDate,
              },
              is_read: false,
              created_at: new Date().toISOString(),
            });
        }
        
        // Skapa händelsepost i prenumerationshistorik
        await supabaseClient
          .from('subscription_history')
          .insert({
            subscription_id: subscription.id,
            event_type: 'payment_reminder_sent',
            event_data: {
              notification_time: new Date().toISOString(),
            },
          });
        
        console.log(`Skickade påminnelse om betalningsproblem för: ${subscription.id}`);
      } catch (subError) {
        console.error(`Fel vid påminnelse om prenumeration ${subscription.id}:`, subError);
      }
    }
  } catch (error) {
    console.error('Fel vid körning av sendPaymentFailureReminders:', error);
    throw error;
  }
}

/**
 * Uppdaterar statistik om prenumerationer
 */
async function updateSubscriptionStatistics(): Promise<void> {
  console.log('Kör schemalagt jobb: updateSubscriptionStatistics');
  
  try {
    const now = new Date();
    
    // Hämta statistik om aktiva prenumerationer per plan
    const { data: planStats, error: planStatsError } = await supabaseClient
      .rpc('get_subscription_stats_by_plan');
    
    if (planStatsError) {
      throw planStatsError;
    }
    
    // Hämta MRR (Monthly Recurring Revenue)
    const { data: mrrStats, error: mrrStatsError } = await supabaseClient
      .rpc('calculate_monthly_recurring_revenue');
    
    if (mrrStatsError) {
      throw mrrStatsError;
    }
    
    // Sammanställ statistiken
    const stats = {
      timestamp: now.toISOString(),
      by_plan: planStats || [],
      mrr: mrrStats && mrrStats.length > 0 ? mrrStats[0].mrr : 0,
      currency: 'SEK',
    };
    
    // Spara statistiken i databasen
    await supabaseClient
      .from('subscription_statistics')
      .insert({
        timestamp: now.toISOString(),
        statistics: stats,
      });
    
    console.log('Prenumerationsstatistik uppdaterad');
  } catch (error) {
    console.error('Fel vid körning av updateSubscriptionStatistics:', error);
    throw error;
  }
}

// Starta servern
serve(handleSchedulerRequest); 