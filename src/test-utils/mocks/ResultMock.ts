/**
 * ResultMock
 * 
 * Mock-hjälpare för att skapa Result-objekt i tester
 */

import { Result, ok, err } from '@/shared/core/Result';

/**
 * Skapar ett mock ok-resultat
 */
export function mockOk<T, E = Error>(value: T): Result<T, E> {
  return ok(value);
}

/**
 * Skapar ett mock err-resultat
 */
export function mockErr<T, E = Error>(error: E): Result<T, E> {
  return err(error);
}

/**
 * Alias för mockOk för bakåtkompatibilitet
 */
export const mockResultOk = mockOk;

/**
 * Alias för mockErr för bakåtkompatibilitet
 */
export const mockResultErr = mockErr;

/**
 * Skapar ett Result-objekt baserat på om första parametern är sant
 */
export function mockResult<T, E = Error>(condition: boolean, value: T, error: E): Result<T, E> {
  return condition ? ok(value) : err(error);
}

/**
 * Statiska hjälpare för bakåtkompatibilitet
 */
export const mockResult_static = {
  ok: mockOk,
  err: mockErr,
  fail: mockErr
};

// Exportera för användning i gamla tester
export { mockResult_static as mockResult }; 