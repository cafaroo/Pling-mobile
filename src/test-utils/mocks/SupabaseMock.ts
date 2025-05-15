/**
 * Omfattande mock för Supabase klient
 * Används för att mocka Supabase i tester
 */

export const createSupabaseMock = () => {
  const queryBuilder = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    and: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockReturnThis(),
    csv: jest.fn().mockReturnThis(),
    then: jest.fn().mockImplementation(callback => Promise.resolve().then(() => callback({ data: [], error: null }))),
  };

  const authMock = {
    signUp: jest.fn().mockResolvedValue({ data: {}, error: null }),
    signIn: jest.fn().mockResolvedValue({ data: {}, error: null }),
    signInWithOAuth: jest.fn().mockResolvedValue({ data: {}, error: null }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: {}, error: null }),
    signInWithOtp: jest.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    onAuthStateChange: jest.fn().mockImplementation(() => {
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    }),
    updateUser: jest.fn().mockResolvedValue({ data: {}, error: null }),
    resetPasswordForEmail: jest.fn().mockResolvedValue({ data: {}, error: null }),
  };

  const storageMock = {
    from: jest.fn().mockReturnValue({
      upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
      download: jest.fn().mockResolvedValue({ data: {}, error: null }),
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/test.jpg' } }),
      move: jest.fn().mockResolvedValue({ data: {}, error: null }),
      copy: jest.fn().mockResolvedValue({ data: {}, error: null }),
      remove: jest.fn().mockResolvedValue({ data: {}, error: null }),
      list: jest.fn().mockResolvedValue({ data: [], error: null }),
    }),
  };

  return {
    from: jest.fn(() => queryBuilder),
    auth: authMock,
    storage: storageMock,
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    // Lägg till stöd för att tester kan konfigurera returvärden
    __setMockDataForQuery: (tableName, data, error = null) => {
      queryBuilder.then.mockImplementation(callback => Promise.resolve().then(() => callback({ data, error })));
    },
    __setMockErrorForQuery: (tableName, error) => {
      queryBuilder.then.mockImplementation(callback => Promise.resolve().then(() => callback({ data: null, error })));
    },
    __resetMocks: () => {
      Object.values(queryBuilder).forEach(mock => {
        if (typeof mock === 'function' && mock.mockClear) {
          mock.mockClear();
        }
      });
      Object.values(authMock).forEach(mock => {
        if (typeof mock === 'function' && mock.mockClear) {
          mock.mockClear();
        }
      });
      Object.values(storageMock).forEach(mock => {
        if (typeof mock === 'function' && mock.mockClear) {
          mock.mockClear();
        }
      });
      queryBuilder.then.mockImplementation(callback => Promise.resolve().then(() => callback({ data: [], error: null })));
    }
  };
};

// Exportera en färdig instans för enkel åtkomst
export const mockSupabaseClient = createSupabaseMock(); 