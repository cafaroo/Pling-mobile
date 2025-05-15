import { HookErrorCode, categorizeError, getErrorMessage } from './HookErrorTypes';
import { Result } from '@/shared/core/Result';
import { useCallback, useState } from 'react';

/**
 * Statustillstånd för hook-operationer
 */
export type OperationStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Standardstruktur för fel i hook-returvärden
 */
export interface HookError {
  code: HookErrorCode;
  message: string;
  originalError?: unknown;
  retryable: boolean;
}

/**
 * Gemensam funktionalitet för en standardiserad hook-operation
 */
export interface StandardizedHookOperation<TParams, TResult> {
  execute: (params: TParams) => Promise<Result<TResult>>;
  status: OperationStatus;
  error: HookError | null;
  data: TResult | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  reset: () => void;
}

/**
 * Hjälpfunktion för att skapa ett HookError-objekt från ett fångat fel
 * @param error Det fångade felet
 * @param statusCode HTTP-statuskod om tillgänglig
 * @param customMessage Anpassat felmeddelande
 * @returns Ett standardiserat HookError-objekt
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
 * Hook-fabrik som skapar en standardiserad hook-operation med konsekvent felhantering
 * @param operationFn Funktion som utför den faktiska operationen
 * @returns En standardiserad hook-operation med statushantering och felhantering
 */
export function useStandardizedOperation<TParams, TResult>(
  operationFn: (params: TParams) => Promise<Result<TResult>>
): StandardizedHookOperation<TParams, TResult> {
  const [status, setStatus] = useState<OperationStatus>('idle');
  const [data, setData] = useState<TResult | null>(null);
  const [error, setError] = useState<HookError | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setData(null);
    setError(null);
  }, []);

  const execute = useCallback(
    async (params: TParams): Promise<Result<TResult>> => {
      setStatus('loading');
      setError(null);

      try {
        const result = await operationFn(params);

        if (result.isSuccess()) {
          setData(result.getValue());
          setStatus('success');
          return result;
        } else {
          const failureError = result.getError();
          const hookError = createHookError(
            failureError.originalError || failureError,
            failureError.statusCode,
            failureError.message
          );
          
          setError(hookError);
          setStatus('error');
          return result;
        }
      } catch (caughtError) {
        const hookError = createHookError(caughtError);
        setError(hookError);
        setStatus('error');
        
        return Result.fail(hookError);
      }
    },
    [operationFn]
  );

  return {
    execute,
    status,
    error,
    data,
    isLoading: status === 'loading',
    isError: status === 'error',
    isSuccess: status === 'success',
    reset,
  };
}

// Export standardiserad återförsökslogik för hooks
export interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  backoffFactor?: number;
}

/**
 * Hook-fabrik för operationer som stöder automatisk återförsök
 * @param operationFn Funktion som utför den faktiska operationen
 * @param options Konfiguration för återförsök
 * @returns En standardiserad hook-operation med återförsöksfunktionalitet
 */
export function useStandardizedRetryableOperation<TParams, TResult>(
  operationFn: (params: TParams) => Promise<Result<TResult>>,
  options: RetryOptions = {}
): StandardizedHookOperation<TParams, TResult> & { 
  retry: () => Promise<Result<TResult> | null>
} {
  const {
    maxRetries = 3,
    delayMs = 1000,
    backoffFactor = 2,
  } = options;

  const standardOperation = useStandardizedOperation(operationFn);
  const [retryCount, setRetryCount] = useState(0);
  const [lastParams, setLastParams] = useState<TParams | null>(null);

  const executeWithRetry = useCallback(
    async (params: TParams): Promise<Result<TResult>> => {
      setLastParams(params);
      setRetryCount(0);
      return standardOperation.execute(params);
    },
    [standardOperation]
  );

  const retry = useCallback(async (): Promise<Result<TResult> | null> => {
    if (!lastParams || !standardOperation.error?.retryable || retryCount >= maxRetries) {
      return null;
    }

    // Exponentiell backoff för väntetid mellan återförsök
    const delay = delayMs * Math.pow(backoffFactor, retryCount);
    await new Promise(resolve => setTimeout(resolve, delay));

    setRetryCount(prevCount => prevCount + 1);
    return standardOperation.execute(lastParams);
  }, [standardOperation, lastParams, retryCount, maxRetries, delayMs, backoffFactor]);

  return {
    ...standardOperation,
    execute: executeWithRetry,
    retry,
  };
}

// Importera för inline-referens i funktioner
import { DEFAULT_ERROR_CONFIG } from './HookErrorTypes'; 