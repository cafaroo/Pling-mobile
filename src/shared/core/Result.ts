export class Result<T, E = string> {
  private constructor(
    private readonly value: T | null,
    private readonly error: E | null
  ) {}

  static ok<T>(value: T): Result<T> {
    return new Result(value, null);
  }

  static err<E>(error: E): Result<never, E> {
    return new Result(null, error);
  }

  isOk(): this is Result<T, never> {
    return this.error === null;
  }

  isErr(): this is Result<never, E> {
    return this.error !== null;
  }

  getValue(): T {
    if (this.isOk()) {
      return this.value!;
    }
    throw new Error('Cannot get value from error result');
  }

  getError(): E {
    if (this.isErr()) {
      return this.error!;
    }
    throw new Error('Cannot get error from ok result');
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.isOk()) {
      return Result.ok(fn(this.value!));
    }
    return Result.err(this.error!);
  }

  mapError<F>(fn: (error: E) => F): Result<T, F> {
    if (this.isErr()) {
      return Result.err(fn(this.error!));
    }
    return Result.ok(this.value!);
  }

  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this.isOk()) {
      return fn(this.value!);
    }
    return Result.err(this.error!);
  }

  orElse<F>(fn: (error: E) => Result<T, F>): Result<T, F> {
    if (this.isErr()) {
      return fn(this.error!);
    }
    return Result.ok(this.value!);
  }
}

export const ok = Result.ok;
export const err = Result.err; 