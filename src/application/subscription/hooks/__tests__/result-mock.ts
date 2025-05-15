/**
 * Denna fil innehåller en mock för Result-klassen som kan användas i tester.
 */

export const Result = {
  ok: (value: any) => ({
    isSuccess: () => true,
    isFailure: () => false,
    getValue: () => value,
    getError: () => null,
    unwrapOr: (defaultValue: any) => value,
    isOk: () => true,
    isErr: () => false,
    value,
    error: null
  }),
  
  fail: (error: any) => ({
    isSuccess: () => false,
    isFailure: () => true,
    getValue: () => null,
    getError: () => error,
    unwrapOr: (defaultValue: any) => defaultValue,
    isOk: () => false,
    isErr: () => true,
    value: null,
    error
  }),
  
  combine: (results: any[]) => {
    const failure = results.find(r => r.isFailure());
    if (failure) {
      return Result.fail(failure.getError());
    }
    return Result.ok(results.map(r => r.getValue()));
  }
};

// Exportera även standardtyper som används med Result
export type ResultError = string | Error | object; 