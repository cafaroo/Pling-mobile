import { 
  HookErrorCode, 
  categorizeError, 
  getErrorMessage, 
  EnhancedHookError, 
  ErrorContext, 
  createEnhancedHookError
} from './HookErrorTypes';
import { Result } from '@/shared/core/Result';
import { useCallback, useState, useRef } from 'react';

/**
 * Statustillstånd för hook-operationer
 */
export type OperationStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Standardstruktur för fel i hook-returvärden
 * @deprecated Använd EnhancedHookError istället
 */
export interface HookError {
  code: HookErrorCode;
  message: string;
  originalError?: unknown;
  retryable: boolean;
}

/**
 * Information om laddningsframsteg
 */
export interface ProgressInfo {
  /** Procentandel färdig (0-100) */
  percent?: number;
  /** Aktuellt steg om laddningen är uppdelad i steg */
  currentStep?: number;
  /** Totalt antal steg */
  totalSteps?: number;
  /** Beskrivande text om vad som pågår */
  message?: string;
  /** Om laddningen är obestämd (ingen specifik procent) */
  indeterminate?: boolean;
}

/**
 * Gemensam funktionalitet för en standardiserad hook-operation
 */
export interface StandardizedHookOperation<TParams, TResult> {
  execute: (params: TParams) => Promise<Result<TResult>>;
  status: OperationStatus;
  error: EnhancedHookError | null;
  data: TResult | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  reset: () => void;
  /** Information om laddningsframsteg */
  progress: ProgressInfo | null;
}

/**
 * Hjälpfunktion för att skapa ett HookError-objekt från ett fångat fel
 * @param error Det fångade felet
 * @param statusCode HTTP-statuskod om tillgänglig
 * @param customMessage Anpassat felmeddelande
 * @returns Ett standardiserat HookError-objekt
 * @deprecated Använd createEnhancedHookError istället
 */
export function createHookError(
  error: unknown,
  statusCode?: number,
  customMessage?: string
): HookError {
  const errorCode = categorizeError(error, statusCode);
  return {
    code: errorCode,
    message: getErrorMessage(errorCode, customMessage),
    originalError: error,
    retryable: DEFAULT_ERROR_CONFIG[errorCode]?.retryable || false,
  };
}

/**
 * Konfiguration för standardiserade hook-operationer
 */
export interface StandardizedOperationConfig {
  /** Innehåller sammanhang för operationen */
  context?: ErrorContext;
  /** Aktivera optimistiska uppdateringar */
  optimistic?: boolean;
  /** Callback för att uppdatera laddningsframsteg */
  onProgress?: (progress: ProgressInfo) => void;
}

/**
 * Hook-fabrik som skapar en standardiserad hook-operation med konsekvent felhantering
 * @param operationFn Funktion som utför den faktiska operationen
 * @param config Konfiguration för operationen
 * @returns En standardiserad hook-operation med statushantering och felhantering
 */
export function useStandardizedOperation<TParams, TResult>(
  operationFn: (
    params: TParams, 
    updateProgress?: (progress: ProgressInfo) => void
  ) => Promise<Result<TResult>>,
  config: StandardizedOperationConfig = {}
): StandardizedHookOperation<TParams, TResult> {
  const [status, setStatus] = useState<OperationStatus>('idle');
  const [data, setData] = useState<TResult | null>(null);
  const [error, setError] = useState<EnhancedHookError | null>(null);
  const [progress, setProgress] = useState<ProgressInfo | null>(null);

  // För optimistiska uppdateringar, behåller vi den tidigare datareferensen
  const optimisticDataRef = useRef<TResult | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setData(null);
    setError(null);
    setProgress(null);
    optimisticDataRef.current = null;
  }, []);

  const updateProgress = useCallback((progressInfo: ProgressInfo) => {
    setProgress(progressInfo);
    if (config.onProgress) {
      config.onProgress(progressInfo);
    }
  }, [config]);

  const execute = useCallback(
    async (params: TParams): Promise<Result<TResult>> => {
      setStatus('loading');
      setError(null);
      setProgress({ percent: 0, indeterminate: true });

      // Implementera optimistisk uppdatering om aktiverad
      let originalData: TResult | null = null;
      if (config.optimistic && optimisticDataRef.current) {
        originalData = data;
        // Behåll den optimistiska datan medan vi utför den faktiska operationen
      }

      try {
        const result = await operationFn(params, updateProgress);

        if (result.isSuccess()) {
          const resultData = result.getValue();
          setData(resultData);
          optimisticDataRef.current = resultData;
          setStatus('success');
          setProgress({ percent: 100 });
          return result;
        } else {
          const failureError = result.getError();
          const enhancedError = createEnhancedHookError(
            failureError.originalError || failureError,
            {
              ...config.context,
              operation: operationFn.name,
              details: { params }
            },
            failureError.statusCode,
            failureError.message
          );
          
          setError(enhancedError);
          setStatus('error');
          setProgress(null);
          
          // Återställ data om optimistisk uppdatering misslyckades
          if (config.optimistic && originalData) {
            setData(originalData);
          }
          
          return result;
        }
      } catch (caughtError) {
        const enhancedError = createEnhancedHookError(
          caughtError,
          {
            ...config.context,
            operation: operationFn.name,
            details: { params }
          }
        );
        
        setError(enhancedError);
        setStatus('error');
        setProgress(null);
        
        // Återställ data om optimistisk uppdatering misslyckades
        if (config.optimistic && originalData) {
          setData(originalData);
        }
        
        return Result.fail(enhancedError);
      }
    },
    [operationFn, config, data, updateProgress]
  );

  return {
    execute,
    status,
    error,
    data,
    progress,
    isLoading: status === 'loading',
    isError: status === 'error',
    isSuccess: status === 'success',
    reset,
  };
}

// Export standardiserad återförsökslogik för hooks
export interface RetryOptions {
  /** Maximalt antal återförsök */
  maxRetries?: number;
  /** Initial fördröjning mellan återförsök i millisekunder */
  delayMs?: number;
  /** Faktor för exponentiell backoff */
  backoffFactor?: number;
  /** Maximal fördröjning mellan återförsök */
  maxDelayMs?: number;
  /** Callback som anropas innan varje återförsök */
  onRetry?: (attempt: number, delayMs: number) => void;
  /** Strategi för vilka typer av fel som ska återförsökas */
  retryStrategy?: (error: EnhancedHookError, attempt: number) => boolean;
}

/**
 * Utökad hook-operation med stöd för återförsök
 */
export interface StandardizedRetryableHookOperation<TParams, TResult> 
  extends StandardizedHookOperation<TParams, TResult> {
  /** Funktion för att manuellt initiera ett återförsök */
  retry: () => Promise<Result<TResult> | null>;
  /** Antal försök hittills */
  retryCount: number;
  /** Maximal tillåtet antal återförsök */
  maxRetries: number;
  /** Om automatiska återförsök är aktivt */
  autoRetry: boolean;
  /** Återstående tid till nästa återförsök (ms) */
  retryDelay?: number;
}

/**
 * Hook-fabrik för operationer som stöder automatisk återförsök
 * @param operationFn Funktion som utför den faktiska operationen
 * @param retryOptions Konfiguration för återförsök
 * @param operationConfig Konfiguration för operationen
 * @returns En standardiserad hook-operation med återförsöksfunktionalitet
 */
export function useStandardizedRetryableOperation<TParams, TResult>(
  operationFn: (
    params: TParams, 
    updateProgress?: (progress: ProgressInfo) => void
  ) => Promise<Result<TResult>>,
  retryOptions: RetryOptions = {},
  operationConfig: StandardizedOperationConfig = {}
): StandardizedRetryableHookOperation<TParams, TResult> {
  const {
    maxRetries = 3,
    delayMs = 1000,
    backoffFactor = 2,
    maxDelayMs = 30000,
    onRetry,
    retryStrategy,
  } = retryOptions;

  const standardOperation = useStandardizedOperation(operationFn, operationConfig);
  const [retryCount, setRetryCount] = useState(0);
  const [lastParams, setLastParams] = useState<TParams | null>(null);
  const [retryDelay, setRetryDelay] = useState<number | undefined>(undefined);
  const [autoRetry, setAutoRetry] = useState(false);
  
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Rensa timers vid unmount
  useCallback(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const calculateRetryDelay = useCallback((attempt: number) => {
    const delay = Math.min(
      delayMs * Math.pow(backoffFactor, attempt),
      maxDelayMs
    );
    return delay;
  }, [delayMs, backoffFactor, maxDelayMs]);

  const shouldRetry = useCallback((error: EnhancedHookError, attempt: number) => {
    if (retryStrategy) {
      return retryStrategy(error, attempt);
    }
    // Standardstrategi: återförsök om felet är markerat som retryable och vi inte har nått maximal gräns
    return error.retryable && attempt < maxRetries;
  }, [retryStrategy, maxRetries]);

  const executeWithRetry = useCallback(
    async (params: TParams): Promise<Result<TResult>> => {
      // Rensa eventuella pågående återförsök
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      setLastParams(params);
      setRetryCount(0);
      setRetryDelay(undefined);
      
      const result = await standardOperation.execute(params);
      
      // Om resultatet är en Error och vi ska auto-starta återförsök
      if (result.isFailure() && standardOperation.error?.retryable && autoRetry) {
        const delay = calculateRetryDelay(0);
        setRetryDelay(delay);
        
        retryTimeoutRef.current = setTimeout(() => {
          retry();
        }, delay);
      }
      
      return result;
    },
    [standardOperation, autoRetry, calculateRetryDelay]
  );

  const retry = useCallback(async (): Promise<Result<TResult> | null> => {
    if (!lastParams || !standardOperation.error || !shouldRetry(standardOperation.error, retryCount)) {
      return null;
    }

    // Rensa eventuella pågående återförsök
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    const nextRetryCount = retryCount + 1;
    const delay = calculateRetryDelay(retryCount);
    
    // Anropa onRetry callback om det finns
    if (onRetry) {
      onRetry(nextRetryCount, delay);
    }
    
    setRetryCount(nextRetryCount);
    
    // Uppdatera context med antalet försök för bättre felrapportering
    const contextWithAttempts = {
      ...operationConfig.context,
      attempts: nextRetryCount
    };
    
    // Utför operationen igen
    const result = await standardOperation.execute(lastParams);
    
    // Om vi fortfarande har ett fel och kan göra fler återförsök, schemalägg nästa
    if (result.isFailure() && standardOperation.error?.retryable && autoRetry && nextRetryCount < maxRetries) {
      const nextDelay = calculateRetryDelay(nextRetryCount);
      setRetryDelay(nextDelay);
      
      retryTimeoutRef.current = setTimeout(() => {
        retry();
      }, nextDelay);
    } else {
      setRetryDelay(undefined);
    }
    
    return result;
  }, [standardOperation, lastParams, retryCount, maxRetries, autoRetry, shouldRetry, calculateRetryDelay, onRetry, operationConfig.context]);

  const toggleAutoRetry = useCallback(() => {
    setAutoRetry(prev => !prev);
  }, []);

  return {
    ...standardOperation,
    execute: executeWithRetry,
    retry,
    retryCount,
    maxRetries,
    autoRetry,
    retryDelay,
    toggleAutoRetry: toggleAutoRetry
  };
}

// Importera för inline-referens i funktioner
import { DEFAULT_ERROR_CONFIG } from './HookErrorTypes'; 