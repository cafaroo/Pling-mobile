// Mock för @tanstack/react-query
const actualModule = jest.requireActual('@tanstack/react-query');

// MockQueryClient för domäntester
class MockQueryClient {
  constructor() {
    this.defaultOptions = {};
    this.queryCache = {
      find: jest.fn(),
      findAll: jest.fn(),
      add: jest.fn(),
      remove: jest.fn(),
      notify: jest.fn(),
      getAll: jest.fn().mockReturnValue([]),
    };
    this.queryDefaults = new Map();
  }

  setQueryData = jest.fn((queryKey, updater) => {
    const data = typeof updater === 'function' ? updater() : updater;
    return data;
  });

  getQueryData = jest.fn().mockImplementation((queryKey) => null);
  
  invalidateQueries = jest.fn().mockImplementation(() => Promise.resolve());
  
  fetchQuery = jest.fn().mockImplementation(() => Promise.resolve(null));
  
  prefetchQuery = jest.fn().mockImplementation(() => Promise.resolve());

  resetQueries = jest.fn().mockImplementation(() => Promise.resolve());

  setDefaultOptions = jest.fn();

  getDefaultOptions = jest.fn().mockReturnValue({
    queries: {
      retry: false,
    },
  });

  setQueryDefaults = jest.fn();

  getQueryDefaults = jest.fn().mockReturnValue({});

  getQueriesData = jest.fn().mockReturnValue([]);

  setQueriesData = jest.fn();

  cancelQueries = jest.fn().mockReturnValue(Promise.resolve());

  // För att flagga att detta är en mockning
  isMockQueryClient = true;
}

// Mock QueryClientProvider
const MockQueryClientProvider = ({ children }) => children;

// Mock useQuery
const useQuery = jest.fn().mockImplementation(({ queryKey, queryFn, enabled = true, initialData }) => {
  if (queryFn && enabled !== false) {
    try {
      return {
        data: initialData ?? undefined,
        isLoading: false,
        isFetching: false,
        error: null,
        isError: false,
        isSuccess: true,
        status: 'success',
        refetch: jest.fn().mockResolvedValue({ data: initialData })
      };
    } catch (error) {
      return {
        data: undefined,
        isLoading: false,
        isFetching: false,
        error,
        isError: true,
        isSuccess: false,
        status: 'error',
        refetch: jest.fn().mockRejectedValue(error)
      };
    }
  }

  return {
    data: initialData ?? undefined,
    isLoading: !initialData,
    isFetching: !initialData,
    error: null,
    isError: false,
    isSuccess: !!initialData,
    status: initialData ? 'success' : 'loading',
    refetch: jest.fn().mockResolvedValue({ data: initialData })
  };
});

// Mock useMutation
const useMutation = jest.fn().mockImplementation(({ mutationFn, onSuccess, onError }) => {
  return {
    mutate: jest.fn().mockImplementation(async (variables) => {
      if (mutationFn) {
        try {
          const result = await Promise.resolve(mutationFn(variables));
          if (onSuccess) onSuccess(result, variables);
          return result;
        } catch (error) {
          if (onError) onError(error, variables);
          throw error;
        }
      }
      return variables;
    }),
    mutateAsync: jest.fn().mockImplementation(async (variables) => {
      if (mutationFn) {
        try {
          const result = await Promise.resolve(mutationFn(variables));
          if (onSuccess) onSuccess(result, variables);
          return result;
        } catch (error) {
          if (onError) onError(error, variables);
          throw error;
        }
      }
      return variables;
    }),
    isLoading: false,
    isError: false,
    error: null,
    isSuccess: false,
    data: null,
    reset: jest.fn(),
  };
});

// Mock useQueryClient
const useQueryClient = jest.fn().mockImplementation(() => {
  return new MockQueryClient();
});

module.exports = {
  ...actualModule,
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient: MockQueryClient,
  QueryClientProvider: MockQueryClientProvider,
}; 