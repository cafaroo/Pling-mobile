import { Result } from '@/shared/core/Result';

/**
 * Standard feltyp för hooks
 * Innehåller information om felet, samt kontextspecifika data
 */
export interface HookError<T = unknown> {
  /** Felmeddelande för användaren */
  message: string;
  /** Tekniskt felmeddelande för utvecklare */
  technical?: string;
  /** Felkod för enklare kategorisering */
  code?: string;
  /** Specifik data relaterad till felet */
  data?: T;
  /** Ursprungligt fel om tillgängligt */
  originalError?: Error | unknown;
}

/**
 * Standard resultattyp för hooks
 * Innehåller data, metadata och eventuell felhantering
 */
export interface HookResult<T, M = unknown> {
  /** Data som returneras från operation */
  data: T | null;
  /** Indikerar om operation pågår */
  isLoading: boolean;
  /** Feldata om något gick fel */
  error: HookError | null;
  /** Metadata relaterad till resultatet */
  meta?: M;
  /** Indikerar om data redan finns i cache */
  isCached?: boolean;
}

/**
 * Skapar ett tomt hook-resultat
 */
export function createEmptyHookResult<T, M = unknown>(): HookResult<T, M> {
  return {
    data: null,
    isLoading: false,
    error: null
  };
}

/**
 * Omvandlar ett Result-objekt till ett HookResult
 */
export function resultToHookResult<T, E = string, M = unknown>(
  result: Result<T, E>,
  metadata?: M
): HookResult<T, M> {
  if (result.isSuccess) {
    return {
      data: result.getValue(),
      isLoading: false,
      error: null,
      meta: metadata
    };
  } else {
    const errorMsg = result.error as unknown as string;
    return {
      data: null,
      isLoading: false,
      error: {
        message: typeof errorMsg === 'string' ? errorMsg : 'Ett fel uppstod',
        technical: typeof errorMsg !== 'string' ? JSON.stringify(errorMsg) : undefined,
        originalError: result.error
      },
      meta: metadata
    };
  }
}

/**
 * Error hanterare som standardiserar felmeddelanden från olika källor
 */
export function createHookError(error: unknown, defaultMessage = 'Ett fel uppstod'): HookError {
  if (error instanceof Error) {
    return {
      message: error.message || defaultMessage,
      technical: error.stack,
      originalError: error
    };
  }
  
  if (typeof error === 'string') {
    return {
      message: error,
      technical: error
    };
  }
  
  return {
    message: defaultMessage,
    technical: JSON.stringify(error),
    originalError: error
  };
}

/**
 * Bashanterare för att hantera promises i hooks
 * Används för att standardisera laddning- och felhantering
 */
export async function executeHookOperation<T, M = unknown>(
  operation: () => Promise<T>,
  metadata?: M
): Promise<HookResult<T, M>> {
  try {
    const data = await operation();
    
    return {
      data,
      isLoading: false,
      error: null,
      meta: metadata
    };
  } catch (error) {
    return {
      data: null,
      isLoading: false,
      error: createHookError(error),
      meta: metadata
    };
  }
}

/**
 * Hjälpfunktion för att extrahera data från ett Result-objekt och kasta fel om det misslyckas
 * Används främst i react-query funktioner för att standardisera felhantering
 */
export function unwrapResult<T, E = string>(result: Result<T, E>): T {
  if (result.isSuccess) {
    return result.getValue();
  }
  
  const error = result.error as unknown;
  let errorMessage = 'Ett fel uppstod';
  
  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = String((error as { message: unknown }).message);
  }
  
  throw new Error(errorMessage);
} 