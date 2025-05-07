import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Konfigurera testdatabas URL och anon key från miljövariabler
const supabaseTestUrl = process.env.SUPABASE_TEST_URL;
const supabaseTestAnonKey = process.env.SUPABASE_TEST_ANON_KEY;

if (!supabaseTestUrl || !supabaseTestAnonKey) {
  throw new Error(
    'Testdatabaskonfiguration saknas. Säkerställ att SUPABASE_TEST_URL och SUPABASE_TEST_ANON_KEY är satta i .env.test'
  );
}

// Skapa Supabase-klient för testmiljön
export const supabaseTestClient = createClient<Database>(
  supabaseTestUrl,
  supabaseTestAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Hjälpfunktioner för testdatahantering
export const clearTestData = async () => {
  const tables = ['users', 'user_profiles', 'user_settings'];
  
  for (const table of tables) {
    const { error } = await supabaseTestClient
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (error) {
      throw new Error(`Kunde inte rensa testdata från ${table}: ${error.message}`);
    }
  }
};

export const seedTestData = async (data: Record<string, any[]>) => {
  for (const [table, records] of Object.entries(data)) {
    const { error } = await supabaseTestClient
      .from(table)
      .insert(records);
    
    if (error) {
      throw new Error(`Kunde inte seeda testdata i ${table}: ${error.message}`);
    }
  }
}; 