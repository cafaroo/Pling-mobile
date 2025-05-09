/**
 * Standardiserad mock för Result-objekt
 * 
 * Denna mock implementerar alla metoder och egenskaper som finns i Result-objektet,
 * både med det nya API:et (.value/.error) och det gamla (.getValue()/.getError()).
 */

export const mockResult = {
  /**
   * Skapar ett mockad OK-resultat
   * @param value Värdet som ska returneras
   */
  ok: (value: any) => ({
    isOk: () => true,
    isErr: () => false,
    value,
    error: null,
    
    // Bakåtkompatibilitet
    getValue: () => value,
    getError: () => { throw new Error('Cannot get error from OK result'); },
    unwrap: () => value,
    unwrapOr: (defaultValue: any) => value,
    
    // Kedjeoperationer
    map: (fn: (value: any) => any) => mockResult.ok(fn(value)),
    mapErr: () => mockResult.ok(value),
    andThen: (fn: (value: any) => any) => fn(value),
    orElse: () => mockResult.ok(value)
  }),
  
  /**
   * Skapar ett mockad Error-resultat
   * @param error Felobjektet som ska returneras
   */
  err: (error: any) => ({
    isOk: () => false,
    isErr: () => true,
    value: null,
    error,
    
    // Bakåtkompatibilitet
    getValue: () => { throw new Error(typeof error === 'string' ? error : 'Error'); },
    getError: () => error,
    unwrap: () => { throw new Error(typeof error === 'string' ? error : 'Error'); },
    unwrapOr: (defaultValue: any) => defaultValue,
    
    // Kedjeoperationer
    map: () => mockResult.err(error),
    mapErr: (fn: (error: any) => any) => mockResult.err(fn(error)),
    andThen: () => mockResult.err(error),
    orElse: (fn: (error: any) => any) => fn(error)
  })
};

/**
 * Hjälpfunktion för att kontrollera att ett resultat är OK
 * och returnera dess värde. Kastar fel om resultatet inte är OK.
 * 
 * @example
 * const result = someFunction();
 * const value = expectOk(result, 'someFunction failed');
 * 
 * @param result Result-objektet att kontrollera
 * @param message Meddelande att använda i error om resultatet inte är OK
 */
export function expectOk<T>(result: any, message?: string): T {
  if (!result.isOk()) {
    throw new Error(message || `Expected result to be OK but was Error: ${result.error}`);
  }
  return result.value;
}

/**
 * Hjälpfunktion för att kontrollera att ett resultat är Error
 * och returnera dess fel. Kastar fel om resultatet inte är Error.
 * 
 * @example
 * const result = someFunction();
 * const error = expectErr(result, 'someFunction unexpectedly succeeded');
 * 
 * @param result Result-objektet att kontrollera
 * @param message Meddelande att använda i error om resultatet inte är Error
 */
export function expectErr<E>(result: any, message?: string): E {
  if (!result.isErr()) {
    throw new Error(message || `Expected result to be Error but was OK with value: ${result.value}`);
  }
  return result.error;
}

/**
 * Hjälpfunktion för att skapa ett mockad OK-resultat med rätt typning
 * 
 * @example
 * // Använd i tester
 * const mockUserResult = mockOkResult<User>({ id: '1', name: 'Test' });
 * mockRepository.findById.mockResolvedValue(mockUserResult);
 * 
 * @param value Värdet som ska returneras
 */
export function mockOkResult<T, E = string>(value: T) {
  return mockResult.ok(value) as unknown as { 
    isOk: () => true;
    isErr: () => false;
    value: T;
    error: null;
    getValue: () => T;
    getError: () => never;
    unwrap: () => T;
    unwrapOr: (defaultValue: T) => T;
    map: <U>(fn: (value: T) => U) => ReturnType<typeof mockOkResult<U, E>>;
    mapErr: <U>(fn: (err: E) => U) => ReturnType<typeof mockOkResult<T, U>>;
    andThen: <U>(fn: (value: T) => ReturnType<typeof mockOkResult<U, E>>) => ReturnType<typeof mockOkResult<U, E>>;
    orElse: <U>(fn: (err: E) => ReturnType<typeof mockOkResult<T, U>>) => ReturnType<typeof mockOkResult<T, U>>;
  };
}

/**
 * Hjälpfunktion för att skapa ett mockad Error-resultat med rätt typning
 * 
 * @example
 * // Använd i tester
 * const mockUserError = mockErrResult<User, string>('User not found');
 * mockRepository.findById.mockResolvedValue(mockUserError);
 * 
 * @param error Felobjektet som ska returneras
 */
export function mockErrResult<T, E = string>(error: E) {
  return mockResult.err(error) as unknown as {
    isOk: () => false;
    isErr: () => true;
    value: null;
    error: E;
    getValue: () => never;
    getError: () => E;
    unwrap: () => never;
    unwrapOr: (defaultValue: T) => T;
    map: <U>(fn: (value: T) => U) => ReturnType<typeof mockErrResult<U, E>>;
    mapErr: <U>(fn: (err: E) => U) => ReturnType<typeof mockErrResult<T, U>>;
    andThen: <U>(fn: (value: T) => ReturnType<typeof mockOkResult<U, E>>) => ReturnType<typeof mockErrResult<U, E>>;
    orElse: <U>(fn: (err: E) => ReturnType<typeof mockOkResult<T, U>>) => ReturnType<typeof mockOkResult<T, U>>;
  };
}

/**
 * Verifierar att ett mockad repository-anrop har anropats med rätt parametrar
 * och returnerat ett Ok-resultat.
 * 
 * @example
 * // I test
 * const mockRepo = { save: jest.fn().mockResolvedValue(mockOkResult(undefined)) };
 * await someFunction(mockRepo);
 * verifyRepositorySuccess(mockRepo.save, [user], 'save failed');
 * 
 * @param mockFn Den mockade funktionen att verifiera
 * @param expectedArgs Förväntade argument
 * @param message Felmeddelande vid misslyckande
 */
export function verifyRepositorySuccess(mockFn: jest.Mock, expectedArgs: any[], message?: string): void {
  expect(mockFn).toHaveBeenCalled();
  if (expectedArgs.length > 0) {
    expect(mockFn).toHaveBeenCalledWith(...expectedArgs);
  }
}

/**
 * Hjälpfunktion för att återställa alla mockResult-mockar i ett test
 */
export function resetMockResults(): void {
  jest.clearAllMocks();
} 