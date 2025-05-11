/**
 * Gemensamma testverktyg för både domäntester och UI-tester
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Skapar en mockad React-komponent
 * @param name - Komponentens namn
 * @returns En mockad React-komponent
 */
export const createMockComponent = (name: string) => {
  const Component = ({ children, ...props }: any) => {
    return React.createElement(name, props, children);
  };
  Component.displayName = name;
  return Component;
};

/**
 * Renderar en komponent med alla nödvändiga providers
 * @param ui - Komponenten som ska renderas
 * @param options - Ytterligare renderingsalternativ
 * @returns Resultatet från @testing-library/react-native render
 */
export const renderWithProviders = (ui: React.ReactElement, options = {}) => {
  // Här kan vi lägga till alla providers som behövs för testerna
  // Till exempel: ThemeProvider, QueryProvider, AuthProvider, etc.
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(React.Fragment, null, children);
  };
  
  return render(ui, { wrapper: AllTheProviders, ...options });
};

/**
 * Skapa en testspecifik QueryClient
 */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: Infinity,
        staleTime: Infinity,
        gcTime: Infinity,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      // Tysta error för att inte översvämma testutdata
      error: () => {},
    },
  });

/**
 * Skapar en wrapper för renderHook med QueryClientProvider
 */
export const createWrapper = () => {
  const testQueryClient = createTestQueryClient();
  
  // Returnera en React komponent som wrappas som QueryClientProvider
  return ({ children }: { children: React.ReactNode }) => 
    React.createElement(
      QueryClientProvider,
      { client: testQueryClient },
      children
    );
};

/**
 * Ökade timeout-värden för waitFor i tester med asynkrona operationer
 */
export const WAIT_FOR_OPTIONS = {
  timeout: 10000,
  interval: 100,
};

/**
 * Mockar för Result-objektet från domain/core
 */
export const mockResultOk = <T,>(value: T) => ({
  isOk: () => true,
  isErr: () => false,
  value,
  error: null,
  unwrap: () => value,
});

export const mockResultErr = <E,>(error: E) => ({
  isOk: () => false,
  isErr: () => true,
  value: null,
  error,
  unwrap: () => { throw new Error(String(error)); },
});

/**
 * Skapar en funktion som väntar en specifik tid
 */
export const createDelay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mockad version av hook-testning utan att behöva renderHook (för domäntester)
 */
export const mockHookResult = <T,>(initialValue: T) => {
  let result = initialValue;
  
  return {
    getValue: () => result,
    setValue: (newValue: T) => {
      result = newValue;
    },
    current: result,
  };
};

/**
 * Hjälpfunktion för att mocka en React Native-komponent
 * på ett sätt som är kompatibelt med ESM-testning
 * @param componentName - Komponentens namn
 * @returns En funktion som skapar en mockad implementation
 */
export const mockRNComponent = (componentName: string) => () => ({
  __esModule: true,
  default: createMockComponent(componentName),
});

/**
 * Hjälpfunktion för att vänta på att asynkrona operationer ska slutföras
 * @param ms - Millisekunder att vänta
 */
export const waitForAsync = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Hjälperfunktion för att rendera UI med specifik skärmstorlek
 * @param ui - Komponenten som ska renderas
 * @param width - Skärmbredd
 * @param height - Skärmhöjd
 * @param options - Andra renderingsalternativ
 */
export const renderWithScreenSize = (
  ui: React.ReactElement,
  width = 375,
  height = 812,
  options = {}
) => {
  // Mocka Dimensions.get('window') före rendering
  const mockDimensions = {
    get: jest.fn().mockReturnValue({
      width: width,
      height: height,
      scale: 2,
      fontScale: 1,
    }),
  };
  
  jest.mock('react-native/Libraries/Utilities/Dimensions', () => mockDimensions);
  
  return renderWithProviders(ui, options);
};

/**
 * Hjälperfunktion för att mocka och testa navigation
 * @param mockNavigate - Optional mockad navigate-funktion
 * @returns Mockade navigation-props
 */
export const mockNavigation = (mockNavigate = jest.fn()) => ({
  navigate: mockNavigate,
  goBack: jest.fn(),
  setOptions: jest.fn(),
  dispatch: jest.fn(),
  addListener: jest.fn().mockReturnValue(() => {}),
  removeListener: jest.fn(),
  reset: jest.fn(),
  isFocused: jest.fn().mockReturnValue(true),
  canGoBack: jest.fn().mockReturnValue(true),
}); 