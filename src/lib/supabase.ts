import { createClient } from '@supabase/supabase-js';
import { Database } from '@types/supabase';

// Använd process.env direkt
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL och Anon Key måste konfigureras i .env-filen med EXPO_PUBLIC_SUPABASE_URL och EXPO_PUBLIC_SUPABASE_ANON_KEY'
  );
}

// Skapa en ny klient med inställningar för att tvinga uppdatering av schema-cachen
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  db: {
    schema: 'public',
  },
  // Forcera uppdatering av schema och relationsdata
  global: {
    headers: {
      'X-Client-Info': 'pling-mobile-app',
      'cache-control': 'no-cache',
      'Prefer': 'count=exact,resolution=ignore-duplicates,schema=public',
    },
  }
});

// Försök uppdatera schemacachen vid uppstart
(async () => {
  try {
    // Utför en enkel förfrågan som tvingar schema-cache uppdatering
    await supabase.from('user_profiles').select('count').limit(1);
    console.log('Schema cache uppdaterad vid uppstart');
  } catch (error) {
    console.warn('Kunde inte uppdatera schema cache vid uppstart:', error);
  }
})(); 