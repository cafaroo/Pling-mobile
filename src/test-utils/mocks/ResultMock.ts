/**
 * Standardiserad mock för Result-klassen
 * 
 * Används för att mocka Result-klassen i tester.
 * 
 * Exempel:
 * ```
 * import { mockResult } from '@/test-utils/mocks/ResultMock';
 * 
 * jest.mock('@/shared/core/Result', () => ({
 *   Result: mockResult
 * }));
 * ```
 */

export const mockResult = {
  ok: jest.fn().mockImplementation(value => ({
    isSuccess: true,
    _value: value,
    getValue: () => value,
    isErr: () => false,
    isOk: () => true,
    error: null
  })),
  
  err: jest.fn().mockImplementation(error => ({
    isSuccess: false,
    _error: error,
    getValue: () => { throw new Error(typeof error === 'string' ? error : 'Error'); },
    isErr: () => true,
    isOk: () => false,
    error
  }))
};

// Hjälpfunktion för att skapa Result.ok
export const createOkResult = <T>(value: T) => {
  return {
    isSuccess: true,
    _value: value,
    getValue: () => value,
    isErr: () => false,
    isOk: () => true,
    error: null
  };
};

// Hjälpfunktion för att skapa Result.err
export const createErrResult = <E>(error: E) => {
  return {
    isSuccess: false,
    _error: error,
    getValue: () => { throw new Error(typeof error === 'string' ? error : 'Error'); },
    isErr: () => true,
    isOk: () => false,
    error
  };
};

// Hjälpfunktion för att återställa mockResult
export const resetMockResult = () => {
  mockResult.ok.mockClear();
  mockResult.err.mockClear();
}; 