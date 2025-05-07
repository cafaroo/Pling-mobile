/**
 * Jest setup för applikationslagertester
 * 
 * Detta är en specialiserad setup-fil för applikationslagertester som mockar
 * Supabase-klienten och infrastrukturlager på ett sätt som är anpassat för
 * testning av hooks och användarfall i applikationslagret.
 */

// Importera nödvändiga beroenden
import '@testing-library/jest-native/extend-expect';
import 'jest-expect-message';

// Konfigurera testmiljövariabler
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
process.env.NODE_ENV = 'test';

// Öka timeout för långsammare tester
jest.setTimeout(10000);

// Vi undviker att mocka Result direkt i setup-filen på grund av problem med modulupplösning
// Istället skapar vi globala mockar som testerna kan använda

// Global mock för Supabase (mockas i varje testfil istället)
global.__mockSupabase = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    }),
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({
    data: {
      id: 'test-user-id',
      email: 'test@example.com',
      profile: { firstName: 'Test', lastName: 'User' },
      settings: { theme: 'dark', language: 'sv' }
    },
    error: null
  }),
};

// Global mock för UniqueId
global.__mockUniqueId = (id) => ({
  toString: () => id || 'mocked-unique-id',
  equals: (other) => id === other?.toString(),
});

// Global mock för EventBus
global.__mockEventBus = {
  publish: jest.fn().mockResolvedValue(undefined),
  subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
};

// Global mock för UserRepository
global.__mockUserRepository = {
  findById: jest.fn().mockResolvedValue({
    id: 'test-user-id',
    email: 'test@example.com',
    profile: {
      firstName: 'Test',
      lastName: 'User',
      displayName: 'TestUser',
      bio: 'Test bio',
    },
    settings: {
      theme: 'dark',
      language: 'sv',
    },
  }),
  findByEmail: jest.fn().mockResolvedValue(null),
  save: jest.fn().mockResolvedValue(true),
  delete: jest.fn().mockResolvedValue(true),
};

// Global mock för Result
global.__mockResult = {
  ok: (value) => ({
    isOk: () => true,
    isErr: () => false,
    value,
    error: null,
    unwrap: () => value,
  }),
  err: (error) => ({
    isOk: () => false,
    isErr: () => true,
    value: null,
    error,
    unwrap: () => { throw new Error(error) },
  }),
};

// Rensa mockar efter varje test
afterEach(() => {
  jest.clearAllMocks();
});

// Global error handling
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection in App Layer Test:', error);
}); 