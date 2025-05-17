/**
 * Test-hjälpare för Result API-kompatibilitet 
 * 
 * Denna fil innehåller hjälpfunktioner för att hantera övergången från gamla
 * Result-API:et (isSuccess/isFailure/getValue) till det nya (isOk/isErr/value).
 */

import { Result } from '@/shared/core/Result';

/**
 * Konverterar ett Result-objekt från nya API:et (isOk/isErr/value) 
 * till gamla API:et (isSuccess/isFailure/getValue).
 * 
 * Notera: Result-klassen har redan stöd för både nya och gamla API:et, 
 * så denna är mest för dokumentation.
 * 
 * @param result Ett Result objekt som använder nya API:et
 * @returns Result-objektet som kan användas med både nya och gamla API:et
 */
export function convertToOldResultAPI<T, E>(result: Result<T, E>): Result<T, E> {
  // Result har redan inbyggd bakåtkompatibilitet, så vi returnerar bara objektet
  return result;
}

/**
 * Wrappra en mock-funktion för att säkerställa att den använder Result-objektet korrekt.
 * Detta behövs inte längre eftersom Result redan har stöd för båda API:erna.
 * 
 * @param mockFn Mock-funktion som returnerar ett Result
 * @returns Samma mock-funktion
 */
export function wrapMockWithOldResultAPI<T, E>(
  mockFn: jest.Mock<Promise<Result<T, E>> | Result<T, E>>
): jest.Mock {
  return mockFn; // Ingen wrapping behövs längre
}

// Helper för att skapa Result-objekt för tester
export const OldResult = {
  ok: <T>(value: T) => Result.ok(value),
  err: <E>(error: E) => Result.err(error)
}; 