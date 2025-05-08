export type Result<T, E = string> = Ok<T, E> | Err<T, E>;

export class Ok<T, E> {
  readonly value: T;

  constructor(value: T) {
    this.value = value;
  }

  isOk(): this is Ok<T, E> {
    return true;
  }

  isErr(): this is Err<T, E> {
    return false;
  }

  unwrapOr(defaultValue: T): T {
    return this.value;
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    return ok(fn(this.value));
  }

  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }
}

export class Err<T, E> {
  readonly error: E;

  constructor(error: E) {
    this.error = error;
  }

  isOk(): this is Ok<T, E> {
    return false;
  }

  isErr(): this is Err<T, E> {
    return true;
  }

  unwrapOr(defaultValue: T): T {
    return defaultValue;
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    return err(this.error);
  }

  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return err(this.error);
  }
}

export const ok = <T, E = string>(value: T): Result<T, E> => new Ok(value);
export const err = <T, E = string>(error: E): Result<T, E> => new Err(error); 