// Mock för useSupabase hook
// Denna hook behövs för UI-tester som importerar från @hooks/useSupabase

/**
 * Mockad version av useSupabase hook
 * Returnerar ett objektträd med samtliga vanligt förekommande Supabase-metoder
 * inkluderande auth, storage, rpc, from/select/insert etc.
 */
export const useSupabase = () => {
  const mockSupabaseClient = {
    // Auth-metoder
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: { id: 'test-user-id', email: 'test@example.com' } } },
        error: null,
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
    },
    
    // Databasmetoder
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { id: 'test-id' },
            error: null,
          }),
          first: jest.fn().mockResolvedValue({
            data: { id: 'test-id' },
            error: null,
          }),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { id: 'test-id' },
            error: null,
          }),
        })),
        in: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue({
              data: [{ id: 'test-id' }],
              error: null,
            }),
          })),
        })),
        order: jest.fn(() => ({
          limit: jest.fn().mockResolvedValue({
            data: [{ id: 'test-id' }],
            error: null,
          }),
        })),
        limit: jest.fn().mockResolvedValue({
          data: [{ id: 'test-id' }],
          error: null,
        }),
      })),
      insert: jest.fn().mockResolvedValue({
        data: { id: 'test-id' },
        error: null,
      }),
      update: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({
          data: { id: 'test-id' },
          error: null,
        }),
        match: jest.fn().mockResolvedValue({
          data: { id: 'test-id' },
          error: null,
        }),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
        match: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })),
    })),
    
    // RPC metoder
    rpc: jest.fn().mockResolvedValue({
      data: null,
      error: null,
    }),
    
    // Storage metoder
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'test-path' },
          error: null,
        }),
        download: jest.fn().mockResolvedValue({
          data: new Blob(['test']),
          error: null,
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://test-url.com/image.jpg' },
        }),
        remove: jest.fn().mockResolvedValue({
          data: { path: 'test-path' },
          error: null,
        }),
        list: jest.fn().mockResolvedValue({
          data: [{ name: 'test-file.jpg' }],
          error: null,
        }),
      })),
    },
  };

  return mockSupabaseClient;
};

// Exportera som default och named export för att stödja båda importstilarna
export default useSupabase; 
// Denna hook behövs för UI-tester som importerar från @hooks/useSupabase

/**
 * Mockad version av useSupabase hook
 * Returnerar ett objektträd med samtliga vanligt förekommande Supabase-metoder
 * inkluderande auth, storage, rpc, from/select/insert etc.
 */
export const useSupabase = () => {
  const mockSupabaseClient = {
    // Auth-metoder
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: { id: 'test-user-id', email: 'test@example.com' } } },
        error: null,
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
    },
    
    // Databasmetoder
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { id: 'test-id' },
            error: null,
          }),
          first: jest.fn().mockResolvedValue({
            data: { id: 'test-id' },
            error: null,
          }),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { id: 'test-id' },
            error: null,
          }),
        })),
        in: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue({
              data: [{ id: 'test-id' }],
              error: null,
            }),
          })),
        })),
        order: jest.fn(() => ({
          limit: jest.fn().mockResolvedValue({
            data: [{ id: 'test-id' }],
            error: null,
          }),
        })),
        limit: jest.fn().mockResolvedValue({
          data: [{ id: 'test-id' }],
          error: null,
        }),
      })),
      insert: jest.fn().mockResolvedValue({
        data: { id: 'test-id' },
        error: null,
      }),
      update: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({
          data: { id: 'test-id' },
          error: null,
        }),
        match: jest.fn().mockResolvedValue({
          data: { id: 'test-id' },
          error: null,
        }),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
        match: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })),
    })),
    
    // RPC metoder
    rpc: jest.fn().mockResolvedValue({
      data: null,
      error: null,
    }),
    
    // Storage metoder
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'test-path' },
          error: null,
        }),
        download: jest.fn().mockResolvedValue({
          data: new Blob(['test']),
          error: null,
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://test-url.com/image.jpg' },
        }),
        remove: jest.fn().mockResolvedValue({
          data: { path: 'test-path' },
          error: null,
        }),
        list: jest.fn().mockResolvedValue({
          data: [{ name: 'test-file.jpg' }],
          error: null,
        }),
      })),
    },
  };

  return mockSupabaseClient;
};

// Exportera som default och named export för att stödja båda importstilarna
export default useSupabase; 