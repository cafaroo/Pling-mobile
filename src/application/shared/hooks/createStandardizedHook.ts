import { useQuery, useMutation, useQueryClient, QueryKey, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { EnhancedHookError, createEnhancedHookError, ErrorContext } from './HookErrorTypes';
import { ProgressInfo } from './useStandardizedHook';

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
  /** Felkontext för detaljerad felrapportering */
  errorContext?: ErrorContext | ((...params: TParams) => ErrorContext);
  /** Callback för laddningsframsteg */
  onProgress?: (progress: ProgressInfo) => void;
}

/**
 * Konfiguration för en standardiserad mutation hook
 */
export interface StandardMutationConfig<TData, TVariables> {
  /** Funktion som utför mutation */
  mutationFn: (variables: TVariables, updateProgress?: (progress: ProgressInfo) => void) => Promise<TData>;
  /** Funktion som anropas vid framgång */
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  /** Funktion som anropas vid fel */
  onError?: (error: EnhancedHookError, variables: TVariables) => void | Promise<void>;
  /** Nyckel för att invalidera query efter framgångsrik mutation */
  invalidateQueryKey?: QueryKey | ((variables: TVariables) => QueryKey | QueryKey[]);
  /** Erbjuder optimistisk uppdatering */
  optimisticUpdate?: {
    /** Nyckel för queryn som ska uppdateras optimistiskt */
    queryKey: QueryKey;
    /** Funktion som uppdaterar cache med optimistiska data */
    updateFn: (oldData: any, variables: TVariables) => any;
    /** Funktion som återställer cache om mutationen misslyckas */
    rollbackFn?: (oldData: any, variables: TVariables) => any;
  };
  /** Felkontext för detaljerad felrapportering */
  errorContext?: ErrorContext | ((variables: TVariables) => ErrorContext);
  /** Callback för laddningsframsteg */
  onProgress?: (progress: ProgressInfo) => void;
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
): (...params: TParams) => UseQueryResult<TData, EnhancedHookError> {
  return (...params: TParams) => {
    const queryKey = config.buildQueryKey 
      ? config.buildQueryKey(params) 
      : [config.queryKeyPrefix, ...params];
    
    const enabled = typeof config.enabled === 'function' 
      ? config.enabled(...params) 
      : config.enabled ?? true;
      
    // Skapa felkontexten om den finns
    const errorContext = typeof config.errorContext === 'function'
      ? config.errorContext(...params)
      : config.errorContext;
      
    return useQuery<TData, EnhancedHookError>({
      queryKey,
      queryFn: async () => {
        try {
          // Rapportera initialt laddningsframsteg
          config.onProgress?.({ percent: 0, indeterminate: true });
          
          const result = await config.queryFn(...params);
          
          // Rapportera slutfört laddningsframsteg
          config.onProgress?.({ percent: 100 });
          
          return result;
        } catch (error) {
          // Konvertera fel till rätt format med sammanhang
          const enhancedError = createEnhancedHookError(
            error,
            errorContext
              ? { 
                  ...errorContext,
                  operation: `query:${String(queryKey[0])}`,
                  details: { params }
                }
              : undefined
          );
          
          throw enhancedError;
        }
      },
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
): () => UseMutationResult<TData, EnhancedHookError, TVariables, unknown> {
  return () => {
    const queryClient = useQueryClient();
    
    return useMutation<TData, EnhancedHookError, TVariables, unknown>({
      mutationFn: async (variables) => {
        // Implementera optimistisk uppdatering om konfigurerad
        let previousData: any = undefined;
        
        if (config.optimisticUpdate) {
          // Spara nuvarande data för eventuell rollback
          previousData = queryClient.getQueryData(config.optimisticUpdate.queryKey);
          
          // Uppdatera cache optimistiskt
          if (previousData) {
            queryClient.setQueryData(
              config.optimisticUpdate.queryKey,
              config.optimisticUpdate.updateFn(previousData, variables)
            );
          }
        }
        
        try {
          // Initiera progressrapportering
          config.onProgress?.({ percent: 0, indeterminate: true });
          
          // Definiera progress callback
          const updateProgress = (progress: ProgressInfo) => {
            config.onProgress?.(progress);
          };
          
          // Utför mutation med progressuppdatering
          const result = await config.mutationFn(variables, updateProgress);
          
          // Rapportera slutfört
          config.onProgress?.({ percent: 100 });
          
          return result;
        } catch (error) {
          // Återställ optimistisk uppdatering vid fel
          if (config.optimisticUpdate && previousData) {
            if (config.optimisticUpdate.rollbackFn) {
              queryClient.setQueryData(
                config.optimisticUpdate.queryKey,
                config.optimisticUpdate.rollbackFn(previousData, variables)
              );
            } else {
              // Återställ till tidigare data
              queryClient.setQueryData(
                config.optimisticUpdate.queryKey,
                previousData
              );
            }
          }
          
          // Skapa felkontexten om den finns
          const errorContext = typeof config.errorContext === 'function'
            ? config.errorContext(variables)
            : config.errorContext;
          
          // Konvertera fel till rätt format med sammanhang
          const enhancedError = createEnhancedHookError(
            error,
            errorContext
              ? { 
                  ...errorContext,
                  operation: `mutation:${config.mutationFn.name || 'anonymous'}`,
                  details: { variables }
                }
              : undefined
          );
          
          throw enhancedError;
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

/**
 * Hjälpfunktion för att extrahera data från ett Result-objekt och kasta fel om det misslyckas
 * Används främst i react-query funktioner för att standardisera felhantering
 */
export function unwrapResult<T, E = unknown>(result: any): T {
  // Om result är ett Result-objekt med isSuccess
  if (result && typeof result.isSuccess === 'function') {
    if (result.isSuccess()) {
      return result.getValue();
    }
    
    // Hämta feldetaljer
    const error = result.getError();
    throw error;
  }
  
  // Om det inte är ett Result-objekt, returnera det direkt
  return result as T;
} 