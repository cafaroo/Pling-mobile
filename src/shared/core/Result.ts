export class Result<T, E = Error> {
  public readonly isSuccess: boolean;
  private readonly _value: T;
  private readonly _error: E;

  private constructor(isSuccess: boolean, value?: T, error?: E) {
    this.isSuccess = isSuccess;
    this._value = value as T;
    this._error = error as E;
  }

  public isOk(): boolean {
    return this.isSuccess;
  }

  public isErr(): boolean {
    return !this.isSuccess;
  }

  public getValue(): T {
    if (!this.isSuccess) {
      throw new Error('Kan inte hämta värdet från ett Result som är Err');
    }
    return this._value;
  }

  public getError(): E {
    if (this.isSuccess) {
      throw new Error('Kan inte hämta felet från ett Result som är Ok');
    }
    return this._error;
  }

  public static ok<U>(value: U): Result<U> {
    return new Result<U>(true, value);
  }

  public static err<U, F>(error: F): Result<U, F> {
    return new Result<U, F>(false, undefined, error);
  }

  public map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.isSuccess) {
      return Result.ok(fn(this._value));
    }
    return Result.err(this._error);
  }

  public mapErr<F>(fn: (error: E) => F): Result<T, F> {
    if (!this.isSuccess) {
      return Result.err(fn(this._error));
    }
    return Result.ok(this._value);
  }

  public andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this.isSuccess) {
      return fn(this._value);
    }
    return Result.err(this._error);
  }

  public orElse<F>(fn: (error: E) => Result<T, F>): Result<T, F> {
    if (!this.isSuccess) {
      return fn(this._error);
    }
    return Result.ok(this._value);
  }

  public unwrapOr(defaultValue: T): T {
    return this.isSuccess ? this._value : defaultValue;
  }

  public unwrap(): T {
    if (!this.isSuccess) {
      throw new Error(`Försökte unwrap på ett Err-resultat: ${this._error}`);
    }
    return this._value;
  }
} 