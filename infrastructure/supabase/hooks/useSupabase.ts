import { createClient } from '@supabase/supabase-js';

// En enkel mock för useSupabase för tester
export function useSupabase() {
  // Returner ett mockat supabase-objekt
  return {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: {}, error: null }),
          first: () => Promise.resolve({ data: {}, error: null })
        }),
        order: () => ({
          limit: () => Promise.resolve({ data: [], error: null })
        }),
        limit: () => Promise.resolve({ data: [], error: null })
      }),
      insert: () => Promise.resolve({ data: {}, error: null }),
      update: () => ({
        eq: () => Promise.resolve({ data: {}, error: null })
      }),
      delete: () => ({
        eq: () => Promise.resolve({ data: null, error: null })
      })
    }),
    auth: {
      signInWithPassword: () => Promise.resolve({ data: { user: {} }, error: null }),
      signOut: () => Promise.resolve(null)
    },
    rpc: () => Promise.resolve({ data: null, error: null })
  };
} 