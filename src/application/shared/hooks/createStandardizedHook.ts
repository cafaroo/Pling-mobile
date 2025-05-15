import { useQuery, useMutation, useQueryClient, QueryKey, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { HookError, unwrapResult } from './BaseHook';

/**
 * Konfiguration för en standardiserad query hook 
 */
export interface StandardQueryConfig<TData, TParams extends any[] = []> {
  /** Unik nyckel för queryn */
  queryKeyPrefix: string | string[];
  /** Funktion som bygger query key baserat på parametrar */
  buildQueryKey?: (params: TParams) => QueryKey;
  /** Funktion som hämtar data */
  queryFn: (...params: TParams) => Promise<TData>;
  /** Tid i millisekunder innan data anses inaktuell */
  staleTime?: number;
  /** Tid i millisekunder som data cachelagras */
  cacheTime?: number;
  /** Om query ska köras automatiskt */
  enabled?: boolean | ((...params: TParams) => boolean);
  /** Om query ska refetchas när fönstret får fokus */
  refetchOnWindowFocus?: boolean;
  /** Antal gånger att försöka igen vid fel */
  retry?: number | boolean;
  /** Om en tidigare cache ska returneras medan en ny förfrågan körs */
  keepPreviousData?: boolean;
}

/**
 * Konfiguration för en standardiserad mutation hook
 */
export interface StandardMutationConfig<TData, TVariables> {
  /** Funktion som utför mutation */
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** Funktion som anropas vid framgång */
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  /** Funktion som anropas vid fel */
  onError?: (error: HookError, variables: TVariables) => void | Promise<void>;
  /** Nyckel för att invalidera query efter framgångsrik mutation */
  invalidateQueryKey?: QueryKey | ((variables: TVariables) => QueryKey | QueryKey[]);
}

/**
 * Skapar en standardiserad query hook baserad på konfiguration
 * 
 * @example
 * const useUserProfile = createStandardizedQuery({
 *   queryKeyPrefix: 'userProfile',
 *   buildQueryKey: (userId) => ['userProfile', userId],
 *   queryFn: async (userId) => {
 *     const result = await userRepository.findById(new UniqueId(userId));
 *     return unwrapResult(result);
 *   }
 * });
 * 
 * // Använd i komponent
 * const { data, isLoading, error } = useUserProfile(userId);
 */
export function createStandardizedQuery<TData, TParams extends any[] = []>(
  config: StandardQueryConfig<TData, TParams>
): (...params: TParams) => UseQueryResult<TData, HookError> {
  return (...params: TParams) => {
    const queryKey = config.buildQueryKey 
      ? config.buildQueryKey(params) 
      : [config.queryKeyPrefix, ...params];
    
    const enabled = typeof config.enabled === 'function' 
      ? config.enabled(...params) 
      : config.enabled ?? true;
      
    return useQuery<TData, HookError>({
      queryKey,
      queryFn: () => config.queryFn(...params),
      staleTime: config.staleTime,
      cacheTime: config.cacheTime,
      enabled,
      refetchOnWindowFocus: config.refetchOnWindowFocus,
      retry: config.retry,
      keepPreviousData: config.keepPreviousData,
    });
  };
}

/**
 * Skapar en standardiserad mutation hook baserad på konfiguration
 * 
 * @example
 * const useCreateUser = createStandardizedMutation({
 *   mutationFn: async (userData) => {
 *     const result = await createUserUseCase.execute(userData);
 *     return unwrapResult(result);
 *   },
 *   invalidateQueryKey: ['users']
 * });
 * 
 * // Använd i komponent
 * const { mutate, isLoading, error } = useCreateUser();
 * mutate({ name: 'Test User', email: 'test@example.com' });
 */
export function createStandardizedMutation<TData, TVariables>(
  config: StandardMutationConfig<TData, TVariables>
): () => UseMutationResult<TData, HookError, TVariables, unknown> {
  return () => {
    const queryClient = useQueryClient();
    
    return useMutation<TData, HookError, TVariables, unknown>({
      mutationFn: async (variables) => {
        try {
          return await config.mutationFn(variables);
        } catch (error) {
          // Konvertera error till HookError format
          if (error instanceof Error) {
            throw {
              message: error.message,
              technical: error.stack,
              originalError: error
            } as HookError;
          }
          throw {
            message: 'Ett fel uppstod',
            technical: JSON.stringify(error),
            originalError: error
          } as HookError;
        }
      },
      onSuccess: (data, variables) => {
        // Anropa användardefinierad onSuccess
        if (config.onSuccess) {
          config.onSuccess(data, variables);
        }
        
        // Invalidera query om angiven
        if (config.invalidateQueryKey) {
          const keys = typeof config.invalidateQueryKey === 'function'
            ? config.invalidateQueryKey(variables)
            : config.invalidateQueryKey;
            
          const keyArray = Array.isArray(keys[0]) ? keys : [keys];
          keyArray.forEach(key => {
            queryClient.invalidateQueries({ queryKey: key });
          });
        }
      },
      onError: (error, variables) => {
        if (config.onError) {
          config.onError(error, variables);
        }
      }
    });
  };
} 