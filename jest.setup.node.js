// Node-specifik setup (polyfills, env-variabler etc. vid behov) 

// Grundläggande konfigurering för domäntester
require('@babel/plugin-transform-modules-commonjs');

// Lägg till nodekonfiguration i början av filen
// Sätt NODE_ENV till test
process.env.NODE_ENV = 'test';

// Lägg till expect-meddelanden för bättre felmeddelanden
require('jest-expect-message');

// Mock för React
jest.mock('react', () => {
  const React = jest.requireActual('react');
  
  // Mock useContext för att undvika null-relaterade fel
  const useContext = jest.fn().mockImplementation((Context) => {
    // Returnera ett standard mock-objekt för QueryClientContext 
    if (Context?.displayName === 'QueryClientContext') {
      return require('./__mocks__/@tanstack/react-query').useQueryClient();
    }
    return {};
  });

  // Mock React.createElement
  const createElement = jest.fn().mockImplementation((type, props, ...children) => {
    if (typeof type === 'function') {
      try {
        return type({ ...props, children });
      } catch (e) {
        return { type, props, children };
      }
    }
    return { type, props, children };
  });

  return {
    ...React,
    useContext,
    createElement,
  };
});

// Globala mockhelpers
global.mockResultOk = (value) => ({
  isOk: () => true,
  isErr: () => false,
  value,
  error: null,
  unwrap: () => value,
});

global.mockResultErr = (error) => ({
  isOk: () => false,
  isErr: () => true,
  value: null,
  error,
  unwrap: () => { throw new Error(String(error)); },
});

// Hjälpare för att mocka React Query i domäntester
global.setupTestQueryClient = () => {
  const { QueryClient } = require('@tanstack/react-query');
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: Infinity,
      },
    },
  });
  return queryClient;
};

// Rensa mock-status mellan tester
beforeEach(() => {
  jest.clearAllMocks();
}); 

// Öka timeout för tester som använder React Query
jest.setTimeout(10000);

// Förhindra console.error från att störa testutskrifter
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filtrera bort React Query-relaterade fel i konsolen
  if (
    args[0] && 
    typeof args[0] === 'string' && 
    (args[0].includes('react-query') || 
     args[0].includes('useContext') || 
     args[0].includes('QueryClient') ||
     args[0].includes('batchNotifyFn'))
  ) {
    return;
  }
  originalConsoleError(...args);
}; 