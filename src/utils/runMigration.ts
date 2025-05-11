import { supabase } from '@services/supabase';
import { Alert } from 'react-native';

/**
 * Hjälpfunktion för att köra SQL-migration
 */
export const runMigration = async (sql: string): Promise<{success: boolean, error?: string}> => {
  try {
    // Uppdatera databasschemat
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Migrationsfel:', error);
      return { success: false, error: error.message };
    }
    
    // Tvinga en uppdatering av schema-cachen efter migrationen
    try {
      await supabase.from('user_profiles').select('count').limit(1);
      console.log('Schema-cache uppdaterad efter migration');
    } catch (cacheError) {
      console.warn('Kunde inte uppdatera schema-cache:', cacheError);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Oväntat fel vid migration:', error);
    return { success: false, error: String(error) };
  }
};

/**
 * Kör migrationen för att fixa relationen mellan users och user_profiles
 */
export const fixUserProfilesRelation = async (): Promise<{success: boolean, error?: string}> => {
  try {
    // SQL för att fixa relationen mellan users och user_profiles
    const sql = `
    -- 1. Se till att user_profiles-tabellen har rätt relation till auth.users
    DO $$ 
    BEGIN
      -- Kontrollera om relationen finns och lägg till den om den saknas
      IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_profiles_user_id_fkey'
      ) THEN
        ALTER TABLE public.user_profiles
        DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;
        
        ALTER TABLE public.user_profiles 
        ADD CONSTRAINT user_profiles_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
      END IF;
    END $$;

    -- 2. Se till att phone_number används korrekt
    DO $$ 
    BEGIN
      -- Se till att phone_number finns i user_profiles
      IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'phone_number'
      ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN phone_number TEXT;
      END IF;
    END $$;

    -- 3. Uppdatera schema-cache
    NOTIFY pgrst, 'reload schema';
    `;
    
    return await runMigration(sql);
  } catch (error) {
    console.error('Fel vid fixande av user_profiles-relation:', error);
    return { success: false, error: String(error) };
  }
};

/**
 * Visar dialogen för att fixa databasrelationsproblem
 */
export const showFixDatabaseDialog = (): Promise<boolean> => {
  return new Promise((resolve) => {
    Alert.alert(
      'Databasrelationsfel',
      'Det verkar finnas ett problem med databasrelationen mellan users och user_profiles. Vill du försöka fixa det nu?',
      [
        {
          text: 'Avbryt',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: 'Fixa nu',
          onPress: async () => {
            const result = await fixUserProfilesRelation();
            if (result.success) {
              Alert.alert('Klart!', 'Databasschemat har uppdaterats. Starta om appen för att se ändringarna.');
              resolve(true);
            } else {
              Alert.alert('Fel', `Kunde inte fixa databasen: ${result.error}`);
              resolve(false);
            }
          },
        },
      ],
      { cancelable: false }
    );
  });
}; 