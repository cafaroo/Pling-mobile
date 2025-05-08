import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { mockSupabaseClient } from '@/test-utils/mocks/SupabaseMock';

// Exportera den mockade Supabase-klienten för tester
export const supabaseTestClient = mockSupabaseClient;

// Hjälpfunktioner för testdatahantering
export const clearTestData = async () => {
  // I mocken behöver vi inte rensa några tabeller, 
  // men vi behåller funktionen för kompabilitet
  mockSupabaseClient.resetMockData();
  return Promise.resolve();
};

export const seedTestData = async (data: Record<string, any[]>) => {
  // Lagra mockdata som kan användas av mockade queries
  if (data.users) {
    mockSupabaseClient.setMockData('users', data.users);
  }
  
  if (data.user_profiles) {
    mockSupabaseClient.setMockData('user_profiles', data.user_profiles);
  }
  
  if (data.user_settings) {
    mockSupabaseClient.setMockData('user_settings', data.user_settings);
  }
  
  return Promise.resolve();
}; 