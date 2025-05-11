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

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
require('@testing-library/jest-native/extend-expect');

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Polyfill for timers
global.setImmediate = (callback, ...args) => global.setTimeout(callback, 0, ...args);
global.queueMicrotask = global.queueMicrotask || ((callback) => Promise.resolve().then(callback));

// Mock useWindowDimensions
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => {
  return {
    __esModule: true,
    default: () => ({
      width: 375,
      height: 667,
      scale: 1,
      fontScale: 1,
    }),
  };
});

// Mock NativeModules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// Mock useColorScheme
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => {
  return {
    __esModule: true,
    default: () => 'light',
  };
});

// Mock Platform.OS
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn(obj => obj.ios || obj.default),
}));

// Mute LogBox warnings
jest.mock('react-native/Libraries/LogBox/LogBox', () => ({
  ignoreLogs: jest.fn(),
  ignoreAllLogs: jest.fn(),
}));

// Mock expo-font
jest.mock('expo-font');

// Mock expo constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      supabaseUrl: 'https://example.supabase.co',
      supabaseKey: 'mock-key',
      auth0ClientId: 'mock-client-id',
      auth0Domain: 'mock-domain.eu.auth0.com',
    },
  },
  manifest: {
    extra: {
      supabaseUrl: 'https://example.supabase.co',
      supabaseKey: 'mock-key',
      auth0ClientId: 'mock-client-id',
      auth0Domain: 'mock-domain.eu.auth0.com',
    },
  },
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue('mock-token'),
  setItemAsync: jest.fn().mockResolvedValue(true),
  deleteItemAsync: jest.fn().mockResolvedValue(true),
}));

// Mock expo-clipboard
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true),
  getStringAsync: jest.fn().mockResolvedValue('mocked-clipboard-content'),
}));

// Direkt mocka moduler utan custom implementering
jest.mock('expo-image-picker');
jest.mock('expo-linear-gradient');
jest.mock('react-native-paper');
jest.mock('react-native-safe-area-context');
jest.mock('react-native-gesture-handler');
jest.mock('lucide-react-native');
jest.mock('@expo/vector-icons');
jest.mock('react-hook-form');
jest.mock('expo-router');
jest.mock('zod');
jest.mock('react-native-calendars');

// Mock async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn().mockResolvedValue(null),
  getItem: jest.fn().mockResolvedValue('{}'),
  removeItem: jest.fn().mockResolvedValue(null),
  getAllKeys: jest.fn().mockResolvedValue([]),
  multiGet: jest.fn().mockResolvedValue([]),
  clear: jest.fn().mockResolvedValue(null),
}));

// Konfiguration för debugging
global.JEST_TEST_RUNNING = true;
global.__DEV__ = true;

// Jest timers för asynkrona operationer
jest.setTimeout(30000);

// Rensa mockar mellan tester
beforeEach(() => {
  jest.clearAllMocks();
});

// Lägg till för att hantera CORS-problem i tester
global.fetch = jest.fn().mockImplementation((url, options) => {
  return Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
    status: 200,
    ok: true,
    headers: {
      get: () => 'application/json',
    },
  });
}); 