/**
 * Testhjälpare för felhantering och error reporting i tester
 * 
 * Detta är utilities för att göra tester mer robusta och ge bättre
 * felmeddelanden när test-assertions misslyckas.
 */

import { Result } from '@types/shared';

/**
 * En wrapper för att testa asynkrona funktioner som kan kasta fel
 * och ge mer detaljerade felmeddelanden vid misslyckade assertions.
 */
export async function testAsyncError<T>(
  testFn: () => Promise<T>,
  errorMessageOrMatcher: string | RegExp | Error,
  context?: string
): Promise<void> {
  try {
    await testFn();
    
    // Om vi kommer hit, kastades inget fel - vilket är fel
    throw new Error(
      `Förväntade ett fel men inget kastades${context ? ` i ${context}` : ''}`
    );
  } catch (error: any) {
    if (errorMessageOrMatcher instanceof RegExp) {
      expect(error.message).toMatch(
        errorMessageOrMatcher,
        `Fel med felaktigt meddelande fångat${context ? ` i ${context}` : ''}`
      );
    } else if (typeof errorMessageOrMatcher === 'string') {
      expect(error.message).toContain(
        errorMessageOrMatcher,
        `Fel med felaktigt meddelande fångat${context ? ` i ${context}` : ''}`
      );
    } else if (errorMessageOrMatcher instanceof Error) {
      expect(error.constructor).toBe(
        errorMessageOrMatcher.constructor,
        `Fel med felaktig typ fångat${context ? ` i ${context}` : ''}`
      );
      expect(error.message).toContain(
        errorMessageOrMatcher.message,
        `Fel med felaktigt meddelande fångat${context ? ` i ${context}` : ''}`
      );
    } else {
      // Om inget matchningsmönster angavs, verifiera bara att ett fel kastades
      expect(error).toBeTruthy();
    }
  }
}

/**
 * En hjälpare för att testa Result-objekt med bättre felmeddelanden
 */
export function expectResultOk<T, E>(
  result: Result<T, E>,
  context?: string
): T {
  expect(
    result.isOk(),
    `Förväntade ett ok-resultat men fick fel: ${result.error}${context ? ` i ${context}` : ''}`
  ).toBe(true);
  
  return result.value;
}

/**
 * En hjälpare för att testa Result-objekt med bättre felmeddelanden
 */
export function expectResultErr<T, E>(
  result: Result<T, E>,
  expectedError?: E,
  context?: string
): E {
  expect(
    result.isErr(),
    `Förväntade ett err-resultat men fick ok: ${result.value}${context ? ` i ${context}` : ''}`
  ).toBe(true);
  
  const error = result.error;
  
  if (expectedError !== undefined) {
    expect(
      error,
      `Fel med felaktigt värde fångat: ${error}${context ? ` i ${context}` : ''}`
    ).toEqual(expectedError);
  }
  
  return error;
}

/**
 * Testar tidsrelaterade aspekter med bättre felmeddelanden
 */
export async function expectTimeConstraint(
  fn: () => Promise<any>,
  options: {
    minTime?: number;
    maxTime?: number;
    context?: string;
  } = {}
): Promise<void> {
  const { minTime, maxTime, context } = options;
  
  const startTime = Date.now();
  await fn();
  const elapsedTime = Date.now() - startTime;
  
  if (minTime !== undefined) {
    expect(
      elapsedTime,
      `Funktionen tog ${elapsedTime}ms, vilket är mindre än de förväntade ${minTime}ms${context ? ` i ${context}` : ''}`
    ).toBeGreaterThanOrEqual(minTime);
  }
  
  if (maxTime !== undefined) {
    expect(
      elapsedTime,
      `Funktionen tog ${elapsedTime}ms, vilket är mer än de tillåtna ${maxTime}ms${context ? ` i ${context}` : ''}`
    ).toBeLessThanOrEqual(maxTime);
  }
}

/**
 * Testar element i en array med bättre felmeddelanden
 */
export function expectArrayContains<T>(
  array: T[],
  matcher: Partial<T> | ((item: T) => boolean),
  context?: string
): void {
  const matcherFn = typeof matcher === 'function'
    ? matcher
    : (item: T) => {
        const matcherObj = matcher as Partial<T>;
        return Object.entries(matcherObj).every(([key, value]) => {
          return (item as any)[key] === value;
        });
      };
  
  const matchingItems = array.filter(matcherFn);
  
  expect(
    matchingItems.length,
    `Ingen matchande element hittades i arrayen${context ? ` i ${context}` : ''}`
  ).toBeGreaterThan(0);
}

/**
 * Testar fält i ett objekt med bättre felmeddelanden
 */
export function expectObjectFields<T extends object>(
  obj: T,
  expectedFields: (keyof T)[],
  context?: string
): void {
  for (const field of expectedFields) {
    expect(
      obj,
      `Objektet saknar fältet '${String(field)}'${context ? ` i ${context}` : ''}`
    ).toHaveProperty(field as string);
  }
}

/**
 * Hjälpare för att testa reaktioner på domänhändelser
 */
export function expectEventPublished(
  events: any[],
  eventType: any,
  matcher?: Partial<any> | ((event: any) => boolean),
  context?: string
): void {
  const matchingEvents = events.filter(event => event instanceof eventType);
  
  expect(
    matchingEvents.length,
    `Ingen händelse av typen ${eventType.name} hittades${context ? ` i ${context}` : ''}`
  ).toBeGreaterThan(0);
  
  if (matcher) {
    const matcherFn = typeof matcher === 'function'
      ? matcher
      : (event: any) => {
          const matcherObj = matcher as Partial<any>;
          return Object.entries(matcherObj).every(([key, value]) => {
            return event[key] === value;
          });
        };
    
    const fullyMatchingEvents = matchingEvents.filter(matcherFn);
    
    expect(
      fullyMatchingEvents.length,
      `Ingen händelse av typen ${eventType.name} med förväntade egenskaper hittades${context ? ` i ${context}` : ''}`
    ).toBeGreaterThan(0);
  }
}

/**
 * Mockar console.error för att validera felmeddelanden i tester
 * Returnerar en funktion som kan användas för att validera att console.error
 * har anropats med förväntade argument.
 */
export function mockErrorHandler(): jest.Mock {
  const originalConsoleError = console.error;
  const mockFn = jest.fn();
  
  console.error = mockFn;
  
  // Återställ console.error efter testet
  afterEach(() => {
    console.error = originalConsoleError;
  });
  
  return mockFn;
} 