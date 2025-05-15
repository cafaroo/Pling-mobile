/**
 * Test-hjälpare för Result API-kompatibilitet 
 * 
 * Denna fil innehåller hjälpfunktioner för att hantera övergången från gamla
 * Result-API:et (isSuccess/isFailure/getValue) till det nya (isOk/isErr/value).
 */

import { Result } from '@/shared/core/Result';

/**
 * Ger tillgång till både det nya (isOk/isErr/value) och gamla 
 * (isSuccess/isFailure/getValue) Result-API:et.
 * 
 * Använd denna för att göra dina tester bakåtkompatibla med båda API:er.
 * 
 * @param result Result-instans att göra kompatibel
 * @returns Ett utökat Result-objekt med både gamla och nya API:et tillgängligt
 */
export function makeResultCompatible<T, E>(result: Result<T, E>): Result<T, E> & {
  isSuccess: boolean;
  isFailure: boolean;
  getValue: () => T;
} {
  // @ts-expect-error Vi lägger till properties dynamiskt
  result.isSuccess = result.isOk();
  // @ts-expect-error Vi lägger till properties dynamiskt
  result.isFailure = result.isErr();
  // @ts-expect-error Vi lägger till properties dynamiskt
  result.getValue = () => result.value;
  
  return result as Result<T, E> & {
    isSuccess: boolean;
    isFailure: boolean;
    getValue: () => T;
  };
}

/**
 * Konverterar ett Result-objekt från nya API:et (isOk/isErr/value) 
 * till gamla API:et (isSuccess/isFailure/getValue).
 * 
 * @param result Ett Result objekt som använder nya API:et
 * @returns Ett objekt som efterliknar det gamla Result-API:et
 */
export function convertToOldResultAPI<T, E>(result: Result<T, E>): {
  isSuccess: boolean;
  isFailure: boolean;
  getValue: () => T;
  getErrorValue: () => E;
} {
  return {
    isSuccess: result.isOk(),
    isFailure: result.isErr(),
    getValue: () => result.value,
    getErrorValue: () => result.error
  };
}

/**
 * Wrappra en mock-funktion för att returnera Result med gamla API:et
 * när testerna fortfarande använder gamla API:et men produktion använder det nya.
 * 
 * @param mockFn Mock-funktion som returnerar ett Result
 * @returns En ny mock-funktion som returnerar ett bakåtkompatibelt Result
 */
export function wrapMockWithOldResultAPI<T, E>(
  mockFn: jest.Mock<Promise<Result<T, E>> | Result<T, E>>
): jest.Mock {
  return mockFn.mockImplementation(async (...args) => {
    const result = await mockFn.getMockImplementation()?.(...args);
    return makeResultCompatible(result);
  });
}

// Helper för att skapa gamla Result.ok-funktioner för tester
export const OldResult = {
  ok: <T>(value: T) => makeResultCompatible(Result.ok(value)),
  err: <E>(error: E) => makeResultCompatible(Result.err(error))
}; 