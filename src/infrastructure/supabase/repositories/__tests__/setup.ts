import { supabase } from '@/lib/supabase';

// Mock för Supabase-klienten
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  }
}));

// Hjälpfunktioner för tester
export const mockSupabaseResponse = (data: any) => {
  (supabase.single as jest.Mock).mockResolvedValueOnce({ data, error: null });
};

export const mockSupabaseError = (error: any) => {
  (supabase.single as jest.Mock).mockResolvedValueOnce({ data: null, error });
};

// Rensa mockar efter varje test
afterEach(() => {
  jest.clearAllMocks();
}); 