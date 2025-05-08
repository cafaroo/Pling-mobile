export class Result<T, E = string> {
  private constructor(
    private readonly _value?: T,
    private readonly _error?: E
  ) {}

  static ok<T, E = string>(value: T): Result<T, E> {
    return new Result<T, E>(value);
  }

  static err<T, E = string>(error: E): Result<T, E> {
    return new Result<T, E>(undefined, error);
  }

  isSuccess(): boolean {
    return this._error === undefined;
  }

  isFailure(): boolean {
    return !this.isSuccess();
  }

  unwrap(): T {
    if (this.isFailure()) {
      throw new Error(`Kan inte unwrap ett Result med fel: ${this._error}`);
    }
    return this._value!;
  }

  unwrapOr(defaultValue: T): T {
    return this.isSuccess() ? this._value! : defaultValue;
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    return this.isSuccess()
      ? Result.ok(fn(this._value!))
      : Result.err(this._error!);
  }

  mapError<F>(fn: (error: E) => F): Result<T, F> {
    return this.isSuccess()
      ? Result.ok(this._value!)
      : Result.err(fn(this._error!));
  }

  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return this.isSuccess()
      ? fn(this._value!)
      : Result.err(this._error!);
  }

  get value(): T | undefined {
    return this._value;
  }

  get error(): E | undefined {
    return this._error;
  }
} 