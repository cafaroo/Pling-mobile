/**
 * Mockar för Result-klassen
 */
import { Result } from '@/shared/core/Result';

/**
 * Skapar en mockad Result-instans med förinställt OK-tillstånd
 * @param value Värdet som ska användas i OK-resultat
 */
export function mockOk<T, E = string>(value: T): Result<T, E> {
  return {
    isOk: () => true,
    isErr: () => false,
    value,
    error: null as unknown as E,
    // Bakåtkompatibilitet
    getValue: () => value,
    getError: () => { throw new Error('Cannot get error from OK result'); },
    unwrap: () => value,
    unwrapOr: (defaultValue: T) => value
  };
}

/**
 * Skapar en mockad Result-instans med förinställt Error-tillstånd
 * @param error Felet som ska användas i Error-resultat
 */
export function mockErr<T, E = string>(error: E): Result<T, E> {
  return {
    isOk: () => false,
    isErr: () => true,
    value: null as unknown as T,
    error,
    // Bakåtkompatibilitet
    getValue: () => { throw new Error(typeof error === 'string' ? error as unknown as string : 'Error'); },
    getError: () => error,
    unwrap: () => { throw new Error(typeof error === 'string' ? error as unknown as string : 'Error'); },
    unwrapOr: (defaultValue: T) => defaultValue
  };
}

/**
 * Generell mockning av Result för testning
 * @param isOk Om resultatet ska vara OK eller Error
 * @param valueOrError Värdet eller felet att inkludera
 */
export function mockResult<T, E = string>(isOk: boolean, valueOrError: isOk extends true ? T : E): Result<T, E> {
  return isOk ? mockOk(valueOrError as T) : mockErr(valueOrError as E);
}

// Separata funktioner för mockResult.ok och mockResult.err
mockResult.ok = mockOk;
mockResult.err = mockErr; 