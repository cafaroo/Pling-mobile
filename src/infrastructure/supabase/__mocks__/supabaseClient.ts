import { SupabaseClient } from '@supabase/supabase-js';

export const supabase = {
  rpc: jest.fn(),
} as unknown as SupabaseClient; 