/**
 * Jest setup för UI-tester
 * 
 * Specialiserad setup-fil för UI-tester som mockar
 * React Native-komponenter och andra UI-beroenden.
 */

// Importera nödvändiga beroenden
const React = require('react');
require('@testing-library/jest-native/extend-expect');
require('jest-expect-message');
require('@babel/plugin-transform-modules-commonjs');

// Konfigurera testmiljövariabler
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
process.env.NODE_ENV = 'test';

// Öka timeout för långsammare tester
jest.setTimeout(15000);

// Mocka react-native-toast-message
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
  hide: jest.fn(),
}));

// Mocka React Native Animated
jest.mock('react-native', () => {
  const RN = jest.requireActual('__mocks__/react-native.js');
  
  // Utöka med ytterligare komponent-mockar vid behov
  return {
    ...RN,
    // Lägg till fler specialiserade mockningar här
    AppState: {
      ...RN.AppState,
      addEventListener: jest.fn((event, callback) => {
        return { remove: jest.fn() };
      }),
    },
  };
});

// Mocka AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => 
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Helper för att skapa mockade komponenter
global.createMockComponent = (name) => {
  const Component = ({ children, ...props }) => {
    return React.createElement(name, props, children);
  };
  Component.displayName = name;
  return Component;
};

// Helper för att rendera komponenter med providers
global.renderWithProviders = (ui, options = {}) => {
  const { render } = require('@testing-library/react-native');
  const AllTheProviders = ({ children }) => {
    return children;
    // Returnera den faktiska provider-strukturen när vi behöver
    // React.createElement(ProviderA, {}, 
    //   React.createElement(ProviderB, {}, children)
    // );
  };
  
  return render(ui, { wrapper: AllTheProviders, ...options });
};

// Global mock för Supabase
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
  console.error('Unhandled Promise Rejection in UI Test:', error);
}); 