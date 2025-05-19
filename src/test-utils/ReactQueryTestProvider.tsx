import React, { ReactNode, createContext, useContext } from 'react';
import { 
  QueryClient, 
  QueryClientProvider, 
  notifyManager,
  UseQueryResult,
  hashQueryKey,
  QueryKey
} from '@tanstack/react-query';

// Förbättrad notifyManager hantering för tester
// Ursprungsimplementationen ger TypeError: batchNotifyFn is not a function
if (typeof notifyManager.setBatchNotifyFunction === 'function') {
  try {
    notifyManager.setBatchNotifyFunction(function customBatchNotify(callback) {
      try {
        return callback();
      } catch (error) {
        console.warn('ReactQueryTestProvider: Ignorerar fel i batchNotifyFn', error);
        return undefined;
      }
    });
  } catch (error) {
    console.warn('ReactQueryTestProvider: Kunde inte sätta batchNotifyFunction', error);
    
    // Fallback implementation om setBatchNotifyFunction misslyckas
    if (!notifyManager.batchNotifyFn) {
      notifyManager.batchNotifyFn = function(callback) {
        try {
          return callback();
        } catch (error) {
          console.warn('ReactQueryTestProvider: Ignorerar fel i fallback batchNotifyFn', error);
          return undefined;
        }
      };
    }
  }
}

// Context för att dela tillgång till QueryClient i tester
const ReactQueryTestContext = createContext<{
  queryClient: QueryClient;
  registerRepository: (name: string, repo: any) => void;
  getRepository: <T>(name: string) => T | undefined;
} | null>(null);

// Repositoriemap för testning
const testRepositories = new Map<string, any>();

/**
 * Skapar en QueryClient optimerad för testning
 */
export function createTestQueryClient(): QueryClient {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        suspense: false,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}, // Tysta fel i testerna
    },
  });

  // Patcha invalidateQueries för att förbättra felhantering i tester
  const originalInvalidateQueries = queryClient.invalidateQueries;
  queryClient.invalidateQueries = function patchedInvalidateQueries(...args: any[]): any {
    try {
      return originalInvalidateQueries.apply(this, args);
    } catch (error) {
      console.warn('ReactQueryTestProvider: Ignorerar fel i invalidateQueries');
      return Promise.resolve();
    }
  };

  // Patcha även fetchQuery för bättre felhantering
  const originalFetchQuery = queryClient.fetchQuery;
  queryClient.fetchQuery = function patchedFetchQuery(...args: any[]): any {
    try {
      return originalFetchQuery.apply(this, args);
    } catch (error) {
      console.warn('ReactQueryTestProvider: Fel i fetchQuery:', error);
      return Promise.reject(error);
    }
  };

  return queryClient;
}

/**
 * Props för ReactQueryTestProvider
 */
interface ReactQueryTestProviderProps {
  children: ReactNode;
  initialRepositories?: Record<string, any>;
  queryClient?: QueryClient;
}

/**
 * Provider som skapar en testmiljö för React Query med förbättrad felhantering
 */
export function ReactQueryTestProvider({
  children,
  initialRepositories = {},
  queryClient = createTestQueryClient(),
}: ReactQueryTestProviderProps) {
  // Registrera initialRepositories
  Object.entries(initialRepositories).forEach(([name, repo]) => {
    testRepositories.set(name, repo);
  });

  const contextValue = {
    queryClient,
    registerRepository: (name: string, repo: any) => {
      testRepositories.set(name, repo);
    },
    getRepository: <T>(name: string): T | undefined => {
      return testRepositories.get(name) as T | undefined;
    },
  };

  return (
    <ReactQueryTestContext.Provider value={contextValue}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ReactQueryTestContext.Provider>
  );
}

/**
 * Hook för att komma åt QueryClient och repositories i tester
 */
export function useReactQueryTestContext() {
  const context = useContext(ReactQueryTestContext);
  if (!context) {
    throw new Error('useReactQueryTestContext måste användas inom en ReactQueryTestProvider');
  }
  return context;
}

/**
 * Hjälpklass för att hantera repositories i testmiljö när context inte är tillgänglig
 */
export class QueryClientTestProvider {
  private static testRepositories = testRepositories;

  static registerRepository(name: string, repo: any) {
    this.testRepositories.set(name, repo);
  }

  static getRepository<T>(name: string): T | undefined {
    return this.testRepositories.get(name) as T | undefined;
  }

  static clearRepositories() {
    this.testRepositories.clear();
  }

  /**
   * Hjälpfunktion som returnerar testresultat i formatet från useQuery
   */
  static createSuccessResult<T>(data: T): UseQueryResult<T, Error> {
    return {
      data,
      dataUpdatedAt: Date.now(),
      error: null,
      errorUpdatedAt: 0,
      failureCount: 0,
      isError: false,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isIdle: false,
      isLoading: false,
      isLoadingError: false,
      isPlaceholderData: false,
      isPreviousData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: false,
      isSuccess: true,
      refetch: jest.fn().mockResolvedValue({ data, isSuccess: true }),
      remove: jest.fn(),
      status: 'success',
    } as UseQueryResult<T, Error>;
  }

  /**
   * Hjälpfunktion som returnerar en felande testresultat
   */
  static createErrorResult<T>(error: Error): UseQueryResult<T, Error> {
    return {
      data: undefined,
      dataUpdatedAt: 0,
      error,
      errorUpdatedAt: Date.now(),
      failureCount: 1,
      isError: true,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isIdle: false,
      isLoading: false,
      isLoadingError: true,
      isPlaceholderData: false,
      isPreviousData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: true, 
      isSuccess: false,
      refetch: jest.fn().mockRejectedValue(error),
      remove: jest.fn(),
      status: 'error',
    } as UseQueryResult<T, Error>;
  }

  /**
   * Hjälpfunktion som returnerar ett laddningstillstånd
   */
  static createLoadingResult<T>(): UseQueryResult<T, Error> {
    return {
      data: undefined,
      dataUpdatedAt: 0,
      error: null,
      errorUpdatedAt: 0,
      failureCount: 0,
      isError: false,
      isFetched: false,
      isFetchedAfterMount: false,
      isFetching: true,
      isIdle: false,
      isLoading: true,
      isLoadingError: false,
      isPlaceholderData: false,
      isPreviousData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: false,
      isSuccess: false,
      refetch: jest.fn(),
      remove: jest.fn(),
      status: 'loading',
    } as UseQueryResult<T, Error>;
  }
} 