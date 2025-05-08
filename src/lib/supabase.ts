import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Använd process.env direkt
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL och Anon Key måste konfigureras i .env-filen med EXPO_PUBLIC_SUPABASE_URL och EXPO_PUBLIC_SUPABASE_ANON_KEY'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey); 