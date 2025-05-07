import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Database } from '@/types/supabase';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL och Anon Key måste konfigureras i app.config.js'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey); 