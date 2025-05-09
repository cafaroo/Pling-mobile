export type Result<T, E = string> = Ok<T, E> | Err<T, E>;

export class Ok<T, E> implements IResult<T, E> {
  readonly value: T;
  readonly error: null = null;

  constructor(value: T) {
    this.value = value;
  }

  isOk(): this is Ok<T, E> {
    return true;
  }

  isErr(): this is Err<T, E> {
    return false;
  }

  /** @deprecated Använd .value istället för bättre kodstandard */
  getValue(): T {
    return this.value;
  }

  /** @deprecated Använd .error istället för bättre kodstandard */
  getError(): E {
    throw new Error('Cannot get error from OK result');
  }

  /** @deprecated Kontrollera result.isOk() och använd result.value istället */
  unwrap(): T {
    return this.value;
  }

  /** @deprecated Använd result.isOk() ? result.value : defaultValue istället */
  unwrapOr(defaultValue: T): T {
    return this.value;
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    return ok(fn(this.value));
  }

  mapErr<U>(fn: (err: E) => U): Result<T, U> {
    return ok(this.value);
  }

  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }

  orElse<U>(fn: (err: E) => Result<T, U>): Result<T, U> {
    return ok(this.value);
  }
}

export class Err<T, E> implements IResult<T, E> {
  readonly error: E;
  readonly value: null = null;

  constructor(error: E) {
    this.error = error;
  }

  isOk(): this is Ok<T, E> {
    return false;
  }

  isErr(): this is Err<T, E> {
    return true;
  }

  /** @deprecated Använd .value istället för bättre kodstandard */
  getValue(): T {
    throw new Error('Cannot get value from Error result');
  }

  /** @deprecated Använd .error istället för bättre kodstandard */
  getError(): E {
    return this.error;
  }

  /** @deprecated Kontrollera result.isOk() och använd result.value istället */
  unwrap(): T {
    throw new Error('Cannot unwrap Error result');
  }

  /** @deprecated Använd result.isOk() ? result.value : defaultValue istället */
  unwrapOr(defaultValue: T): T {
    return defaultValue;
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    return err(this.error);
  }

  mapErr<U>(fn: (err: E) => U): Result<T, U> {
    return err(fn(this.error));
  }

  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return err(this.error);
  }

  orElse<U>(fn: (err: E) => Result<T, U>): Result<T, U> {
    return fn(this.error);
  }
}

export const ok = <T, E = string>(value: T): Result<T, E> => new Ok(value);
export const err = <T, E = string>(error: E): Result<T, E> => new Err(error);

interface IResult<T, E> {
  isOk(): boolean;
  isErr(): boolean;
  
  // Moderna metoder - rekommenderas
  readonly value: T | null;
  readonly error: E | null;
  
  // Äldre metoder - undvik dessa
  /** @deprecated Använd .value istället för bättre kodstandard */
  getValue(): T;
  /** @deprecated Använd .error istället för bättre kodstandard */
  getError(): E;
  /** @deprecated Kontrollera result.isOk() och använd result.value istället */
  unwrap(): T;
  /** @deprecated Använd result.isOk() ? result.value : defaultValue istället */
  unwrapOr(defaultValue: T): T;
  
  // Transformation
  map<U>(fn: (val: T) => U): IResult<U, E>;
  mapErr<U>(fn: (err: E) => U): IResult<T, U>;
  andThen<U>(fn: (val: T) => IResult<U, E>): IResult<U, E>;
  orElse<U>(fn: (err: E) => IResult<T, U>): IResult<T, U>;
} 