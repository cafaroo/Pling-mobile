import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Result, ok, err } from '@/shared/core/Result';

/**
 * Skapa en mock queryFn som returnerar data
 */
export function createMockQueryFn<TData>(data: TData, options: { delay?: number } = {}) {
  return jest.fn().mockImplementation(() => {
    return new Promise<TData>((resolve) => {
      setTimeout(() => {
        resolve(data);
      }, options.delay || 0);
    });
  });
}

/**
 * Skapa en mock queryFn som returnerar ett Result.ok
 */
export function createMockResultQueryFn<TData>(data: TData, options: { delay?: number } = {}) {
  return jest.fn().mockImplementation(() => {
    return new Promise<Result<TData, any>>((resolve) => {
      setTimeout(() => {
        resolve(ok(data));
      }, options.delay || 0);
    });
  });
}

/**
 * Skapa en mock queryFn som returnerar ett Result.err
 */
export function createMockResultErrorQueryFn<TError>(error: TError, options: { delay?: number } = {}) {
  return jest.fn().mockImplementation(() => {
    return new Promise<Result<any, TError>>((resolve) => {
      setTimeout(() => {
        resolve(err(error));
      }, options.delay || 0);
    });
  });
}

/**
 * Skapa en mock queryFn som kastar ett fel
 */
export function createMockErrorQueryFn(error: any, options: { delay?: number } = {}) {
  return jest.fn().mockImplementation(() => {
    return new Promise<any>((_, reject) => {
      setTimeout(() => {
        reject(error);
      }, options.delay || 0);
    });
  });
}

/**
 * Skapa en mock mutationFn som returnerar data
 */
export function createMockMutationFn<TData, TVariables>(
  resultFn: (variables: TVariables) => TData,
  options: { delay?: number } = {}
) {
  return jest.fn().mockImplementation((variables: TVariables) => {
    return new Promise<TData>((resolve) => {
      setTimeout(() => {
        resolve(resultFn(variables));
      }, options.delay || 0);
    });
  });
}

/**
 * Skapa en mock mutationFn som returnerar ett Result.ok
 */
export function createMockResultMutationFn<TData, TVariables, TError>(
  resultFn: (variables: TVariables) => Result<TData, TError>
) {
  return jest.fn().mockImplementation((variables: TVariables) => {
    return Promise.resolve(resultFn(variables));
  });
}

/**
 * Skapa en enkel mock för en query-hook
 */
export function createMockQueryHook<TData>(data: TData, isLoading = false, error: any = null) {
  return () => ({
    data,
    isLoading,
    isError: !!error,
    error,
    refetch: jest.fn().mockResolvedValue({ data }),
    isRefetching: false,
    status: isLoading ? 'loading' : error ? 'error' : 'success'
  });
}

/**
 * Skapa en enkel mock för en mutation-hook
 */
export function createMockMutationHook<TData, TVariables>(
  resultFn: (variables: TVariables) => TData = () => ({ } as TData)
) {
  return () => ({
    mutate: jest.fn().mockImplementation((variables: TVariables) => resultFn(variables)),
    mutateAsync: jest.fn().mockImplementation((variables: TVariables) => Promise.resolve(resultFn(variables))),
    isLoading: false,
    isError: false,
    isSuccess: true,
    error: null,
    data: null,
    reset: jest.fn()
  });
}

/**
 * Skapa en mock-implementation av en standardiserad hook som useOrganizationWithStandardHook
 */
export function createMockStandardizedHook<
  TQueryMap extends Record<string, any>,
  TMutationMap extends Record<string, any>
>(
  queryMap: TQueryMap,
  mutationMap: TMutationMap
) {
  return () => ({
    ...Object.entries(queryMap).reduce((acc, [key, value]) => {
      const hookName = key.startsWith('use') ? key : `use${key.charAt(0).toUpperCase()}${key.slice(1)}`;
      acc[hookName] = value;
      return acc;
    }, {} as Record<string, any>),
    
    ...Object.entries(mutationMap).reduce((acc, [key, value]) => {
      const hookName = key.startsWith('use') ? key : `use${key.charAt(0).toUpperCase()}${key.slice(1)}`;
      acc[hookName] = value;
      return acc;
    }, {} as Record<string, any>)
  });
}

/**
 * Skapa en mock QueryClient för tester
 */
export function createMockQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0
      },
      mutations: {
        retry: false
      }
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}
    }
  });
}

/**
 * Hjälpfunktion för att förvärma query cache med data
 */
export function prewarmQueryCache<TData>(
  queryClient: QueryClient,
  queryKey: any[],
  data: TData
) {
  queryClient.setQueryData(queryKey, data);
}

/**
 * Provider som mockar React Query-miljön
 */
export const MockQueryProvider: React.FC<{
  children: React.ReactNode;
  client?: QueryClient;
}> = ({ children, client }) => {
  const queryClient = client || createMockQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}; 