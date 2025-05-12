/**
 * Databashjälpfunktioner för Edge Functions
 */
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { DatabaseError } from './error-handler.ts';

let supabaseClient: SupabaseClient | null = null;

// Skapar och cachelagrar Supabase-klienten
export function getSupabaseClient(useServiceRole = false): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = useServiceRole
      ? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      : Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase-miljövariabler saknas');
    }
    
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  
  return supabaseClient;
}

// Säker databasoperation med felhantering
export async function safeDbOperation<T>(
  operationFn: (client: SupabaseClient) => Promise<{ data: T | null; error: any }>,
  errorMessage = 'Databas-operation misslyckades',
  useServiceRole = false
): Promise<T> {
  try {
    const client = getSupabaseClient(useServiceRole);
    const { data, error } = await operationFn(client);
    
    if (error) {
      throw new DatabaseError(`${errorMessage}: ${error.message}`, error);
    }
    
    if (data === null) {
      throw new DatabaseError(`${errorMessage}: Inga data returnerades`, new Error('No data'));
    }
    
    return data;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    } else {
      throw new DatabaseError(errorMessage, error);
    }
  }
}

// Uppdatera en prenumeration
export async function updateSubscription(
  subscriptionId: string, 
  updateData: Record<string, any>
): Promise<any> {
  return safeDbOperation(
    async (client) => {
      return await client
        .from('subscriptions')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        .select('*')
        .single();
    },
    `Kunde inte uppdatera prenumeration: ${subscriptionId}`,
    true // Använd service role för säker åtkomst
  );
}

// Skapa en prenumerationshistorikpost
export async function createSubscriptionHistoryEntry(
  subscriptionId: string,
  eventType: string,
  eventData: Record<string, any>
): Promise<any> {
  return safeDbOperation(
    async (client) => {
      return await client
        .from('subscription_history')
        .insert({
          subscription_id: subscriptionId,
          event_type: eventType,
          event_data: eventData,
          created_at: new Date().toISOString()
        })
        .select('*')
        .single();
    },
    `Kunde inte skapa historikpost för prenumeration: ${subscriptionId}`,
    true
  );
}

// Hämta prenumeration med stripe_subscription_id
export async function getSubscriptionByStripeId(
  stripeSubscriptionId: string
): Promise<any> {
  return safeDbOperation(
    async (client) => {
      const result = await client
        .from('subscriptions')
        .select('*')
        .eq('stripe_subscription_id', stripeSubscriptionId)
        .limit(1);
      
      // Omforma resultatet för att matcha förväntat format
      if (result.data && result.data.length > 0) {
        return { data: result.data[0], error: result.error };
      } else {
        return { data: null, error: result.error || new Error('Prenumeration hittades inte') };
      }
    },
    `Kunde inte hämta prenumeration med Stripe ID: ${stripeSubscriptionId}`,
    true
  );
}

// Skapa en notifikation
export async function createNotification(
  userId: string,
  title: string,
  body: string,
  type: string,
  metadata: Record<string, any> = {}
): Promise<any> {
  return safeDbOperation(
    async (client) => {
      return await client
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          body,
          type,
          metadata,
          is_read: false,
          created_at: new Date().toISOString()
        })
        .select('*')
        .single();
    },
    'Kunde inte skapa notifikation',
    true
  );
}

// Spara statistik för prenumerationer
export async function saveSubscriptionStatistics(
  statistics: Record<string, any>
): Promise<any> {
  return safeDbOperation(
    async (client) => {
      return await client
        .from('subscription_statistics')
        .insert({
          timestamp: new Date().toISOString(),
          statistics,
          created_at: new Date().toISOString()
        })
        .select('*')
        .single();
    },
    'Kunde inte spara prenumerationsstatistik',
    true
  );
} 