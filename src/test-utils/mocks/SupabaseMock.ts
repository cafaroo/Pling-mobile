/**
 * Standardiserad mock för Supabase
 * 
 * Används för att mocka Supabase-klienten i tester.
 * 
 * Exempel:
 * ```
 * import { mockSupabase } from '@/test-utils/mocks/SupabaseMock';
 * 
 * jest.mock('@/infrastructure/supabase', () => ({
 *   supabase: mockSupabase
 * }));
 * ```
 */

export const mockSupabaseAuth = {
  getUser: jest.fn().mockResolvedValue({
    data: { user: { id: 'test-user-id', email: 'test@example.com' } },
    error: null
  }),
  signOut: jest.fn().mockResolvedValue({ error: null }),
  signIn: jest.fn().mockResolvedValue({
    data: { user: { id: 'test-user-id', email: 'test@example.com' }, session: {} },
    error: null
  }),
  signUp: jest.fn().mockResolvedValue({
    data: { user: { id: 'test-user-id', email: 'test@example.com' }, session: {} },
    error: null
  }),
  onAuthStateChange: jest.fn().mockImplementation((callback) => {
    return { unsubscribe: jest.fn() };
  })
};

export const mockSupabaseStorage = {
  from: jest.fn().mockReturnThis(),
  upload: jest.fn().mockResolvedValue({ data: { path: 'test/path.jpg' }, error: null }),
  getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/test/path.jpg' } }),
  remove: jest.fn().mockResolvedValue({ data: {}, error: null })
};

// Återanvändbara frågebyggare för Supabase
const createQueryBuilder = () => {
  const builder = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: {}, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: {}, error: null }),
    then: jest.fn().mockImplementation(callback => Promise.resolve(callback({ data: {}, error: null }))),
    values: jest.fn().mockReturnThis()
  };
  return builder;
};

export const mockSupabase = {
  auth: mockSupabaseAuth,
  storage: mockSupabaseStorage,
  from: jest.fn().mockImplementation(tableName => createQueryBuilder()),
  rpc: jest.fn().mockImplementation((procName, params) => ({
    ...createQueryBuilder(),
    // Specifik implementation för rpc
    execute: jest.fn().mockResolvedValue({ data: {}, error: null })
  }))
};

// Konfigurerar mockdata för en användare
export const mockUserData = (overrides = {}) => {
  const testUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    profile: {
      firstName: 'Test',
      lastName: 'User',
      displayName: 'TestUser',
      bio: 'Bio för testanvändare',
      location: 'Stockholm',
      contact: {
        email: 'test@example.com',
        phone: '+46701234567',
        alternativeEmail: null
      }
    },
    settings: {
      theme: 'dark',
      language: 'sv',
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      privacy: {
        profileVisibility: 'public',
        allowSearchByEmail: true
      }
    },
    ...overrides
  };
  
  return testUser;
};

// Återställer alla mockar
export const resetMockSupabase = () => {
  Object.values(mockSupabaseAuth).forEach(
    mock => mock.mockClear?.()
  );
  
  Object.values(mockSupabaseStorage).forEach(
    mock => mock.mockClear?.()
  );
  
  mockSupabase.from.mockClear();
  mockSupabase.rpc.mockClear();
}; 