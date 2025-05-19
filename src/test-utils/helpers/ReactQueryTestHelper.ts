import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, RenderHookResult } from '@testing-library/react-hooks';
import React from 'react';
import { EnhancedHookError } from '@/application/shared/hooks/HookErrorTypes';

/**
 * Konfiguration för testning av React Query hooks
 */
export interface ReactQueryTestConfig {
  /** Initialt cachevärde för specifika queries */
  initialQueryData?: Record<string, any>;
  /** Om query response ska vara omedelbar eller fördröjd */
  delayResponse?: number;
  /** Om detaljerad loggning ska aktiveras i Query Client */
  enableLogging?: boolean;
  /** Antal gånger att försöka igen vid fel */
  retries?: number;
}

/**
 * Skapar en QueryClient för testning med anpassad konfiguration
 */
export function createTestQueryClient(config: ReactQueryTestConfig = {}) {
  const {
    delayResponse = 0,
    enableLogging = false,
    retries = false
  } = config;
  
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: retries,
        // Inaktivera cachning som standard i tester för att undvika läckage
        cacheTime: 0,
        // Inaktivera refetch on window focus i tester
        refetchOnWindowFocus: false,
        // Kör queries direkt om inte delayResponse är aktiverat
        staleTime: delayResponse > 0 ? Infinity : 0
      },
      mutations: {
        retry: retries
      }
    },
    logger: {
      log: enableLogging ? console.log : () => {},
      warn: enableLogging ? console.warn : () => {},
      error: enableLogging ? console.error : () => {}
    }
  });
}

/**
 * Wrapper för att rendera hooks med en QueryClientProvider
 * och optional förfylld cache-data
 */
export function renderHookWithQueryClient<TProps, TResult>(
  hookFn: (props: TProps) => TResult,
  config: ReactQueryTestConfig = {}
): RenderHookResult<TProps, TResult> {
  const queryClient = createTestQueryClient(config);
  
  // Förfyll cache om initial data specifierats
  if (config.initialQueryData) {
    Object.entries(config.initialQueryData).forEach(([queryKey, data]) => {
      // Måste vara en array för att vara en giltig queryKey
      const parsedKey = typeof queryKey === 'string' 
        ? queryKey.split(',') 
        : queryKey;
      
      queryClient.setQueryData(parsedKey, data);
    });
  }
  
  const wrapper = ({ children }: { children: React.ReactNode }) => 
    React.createElement(
      QueryClientProvider, 
      { client: queryClient }, 
      children
    );
  
  return renderHook(hookFn, { wrapper });
}

/**
 * Skapar en mock för en standardiserad query-hook
 */
export function createMockStandardQuery<TData>(
  mockData: TData | null = null,
  isLoading = false,
  error: EnhancedHookError | null = null
) {
  return jest.fn().mockImplementation(() => ({
    data: mockData,
    isLoading,
    isError: Boolean(error),
    error,
    refetch: jest.fn().mockResolvedValue({ data: mockData }),
    status: error ? 'error' : isLoading ? 'loading' : mockData ? 'success' : 'idle'
  }));
}

/**
 * Skapar en mock för en standardiserad mutation-hook
 */
export function createMockStandardMutation<TData, TVariables>(
  mockResult: TData | null = null,
  isLoading = false,
  error: EnhancedHookError | null = null
) {
  return jest.fn().mockImplementation(() => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn().mockImplementation(async (variables: TVariables) => {
      if (error) throw error;
      return mockResult;
    }),
    data: mockResult,
    isLoading,
    isError: Boolean(error),
    error,
    status: error ? 'error' : isLoading ? 'loading' : mockResult ? 'success' : 'idle',
    reset: jest.fn()
  }));
}

/**
 * Validerar att rätt query nyckel används för en given operation
 */
export function validateQueryKey(
  queryClient: QueryClient,
  expectedQueryKey: string | string[],
  shouldExist = true
) {
  const queryKey = Array.isArray(expectedQueryKey) 
    ? expectedQueryKey 
    : [expectedQueryKey];
  
  const queryCache = queryClient.getQueryCache();
  const queries = queryCache.findAll({ queryKey });
  
  if (shouldExist) {
    expect(queries.length).toBeGreaterThan(0, 
      `Förväntade query ${queryKey.join(', ')} hittades inte i cache`);
  } else {
    expect(queries.length).toBe(0, 
      `Query ${queryKey.join(', ')} borde inte finnas i cache`);
  }
}

/**
 * Simulerar och validerar en optimistisk uppdatering
 */
export async function validateOptimisticUpdate<TVariables>(
  mutate: (variables: TVariables) => Promise<any>,
  variables: TVariables,
  queryClient: QueryClient,
  queryKey: string | string[],
  validateChangeFn: (data: any) => boolean
) {
  // Hämta data före mutation
  const queryKeyArray = Array.isArray(queryKey) ? queryKey : [queryKey];
  const preMutationData = queryClient.getQueryData(queryKeyArray);
  
  // Starta mutation
  const mutationPromise = mutate(variables);
  
  // Validera optimistisk uppdatering innan mutation resolvas
  const updatedData = queryClient.getQueryData(queryKeyArray);
  expect(validateChangeFn(updatedData)).toBe(true, 
    'Optimistisk uppdatering tillämpades inte korrekt');
  
  // Vänta på att mutation slutförs
  await mutationPromise;
  
  // Säkerställ att data inte återställts till original (dvs mutation lyckades)
  const finalData = queryClient.getQueryData(queryKeyArray);
  expect(finalData).not.toEqual(preMutationData, 
    'Data borde inte återställas efter lyckad mutation');
} 