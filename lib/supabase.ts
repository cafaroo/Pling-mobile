import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Skapa en singel instans av Supabase-klienten
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

// Kontrollera att miljövariabler finns tillgängliga
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anonymous Key is not defined in environment variables.');
}

// Skapa en singel instans av Supabase-klienten
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Exportera även som default för bakåtkompatibilitet
export default supabase;

// Exportera användbara typade selectors
export const getTypedTable = <T extends keyof Database['public']['Tables']>(
  table: T
) => supabase.from(table);

export const getTypedView = <T extends keyof Database['public']['Views']>(
  view: T
) => supabase.from(view); 