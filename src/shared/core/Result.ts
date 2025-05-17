/**
 * Result är en klass som används för att representera resultatet av en operation
 * som kan misslyckas. Den innehåller antingen ett värde (vid framgång) eller ett
 * felvärde (vid misslyckande).
 * 
 * Den är inspirerad av Result-mönstret från funktionella språk och används för att
 * undvika att kasta exceptions och istället hantera fel på ett typsäkert sätt.
 */

// Huvudklass för Result
export class Result<T, E = Error> {
  // Privata fält: _value innehåller värdet vid framgång, _error innehåller felet vid misslyckande
  private readonly _value: T;
  private readonly _error: E;
  private readonly _isOk: boolean;

  // Konstruktor (privat, använd de statiska fabriksmetoderna ok/err)
  private constructor(isOk: boolean, value?: T, error?: E) {
    this._isOk = isOk;
    this._value = value as T;
    this._error = error as E;

    // Frys objektet för att förhindra modifiering
    Object.freeze(this);
  }

  // Kontrollera om resultatet är ok (framgångsrikt)
  public isOk(): this is Result<T, E> & { value: T } {
    return this._isOk;
  }

  // Kontrollera om resultatet är ett fel
  public isErr(): this is Result<T, E> & { error: E } {
    return !this._isOk;
  }

  // För bakåtkompatibilitet med gamla tester
  public isSuccess(): boolean {
    return this._isOk;
  }

  // För bakåtkompatibilitet med gamla tester
  public isFailure(): boolean {
    return !this._isOk;
  }

  // Hämta värdet om resultatet är ok, annars null
  public get value(): T {
    return this._value;
  }

  // Hämta felet om resultatet är ett fel, annars null
  public get error(): E {
    return this._error;
  }

  // För bakåtkompatibilitet med gamla tester
  public getValue(): T {
    return this._value;
  }

  // För bakåtkompatibilitet med gamla tester
  public getErrorValue(): E {
    return this._error;
  }

  // Map-funktion för att transformera värdet i ett ok-resultat
  public map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.isOk()) {
      return ok(fn(this._value));
    } else {
      return err(this._error);
    }
  }

  // FlatMap/bind-funktion för att transformera ett ok-resultat till ett nytt Result
  public flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this.isOk()) {
      return fn(this._value);
    } else {
      return err(this._error);
    }
  }

  // Utför en callback-funktion på värdet och returnera samma Result
  public tap(fn: (value: T) => void): Result<T, E> {
    if (this.isOk()) {
      fn(this._value);
    }
    return this;
  }

  // Utför en callback-funktion på felet och returnera samma Result
  public tapError(fn: (error: E) => void): Result<T, E> {
    if (this.isErr()) {
      fn(this._error);
    }
    return this;
  }

  // Hantera både framgång och fel i en operation
  public match<U>({
    ok: okFn,
    err: errFn,
  }: {
    ok: (value: T) => U;
    err: (error: E) => U;
  }): U {
    if (this.isOk()) {
      return okFn(this._value);
    } else {
      return errFn(this._error);
    }
  }
  
  // Statiska kompatibilitetsmetoder för att stödja gamla tester
  static ok<T, E = Error>(value: T): Result<T, E> {
    return ok(value);
  }
  
  static err<T, E = Error>(error: E): Result<T, E> {
    return err(error);
  }
  
  static fail<T, E = Error>(error: E): Result<T, E> {
    return err(error);
  }
}

// Fabriksmetod för att skapa ett OK-resultat
export function ok<T, E = Error>(value: T): Result<T, E> {
  return new Result<T, E>(true, value, undefined);
}

// Fabriksmetod för att skapa ett ERR-resultat
export function err<T, E = Error>(error: E): Result<T, E> {
  return new Result<T, E>(false, undefined, error);
}

// Kompatibilitetsexport för att stödja gamla tester
export const fail = err;

// Exportera typer för enklare användning
export type Ok<T> = Result<T, never>;
export type Err<E> = Result<never, E>;

// Standardtyp för Result med Error som feltyp
export type ResultError<T> = Result<T, Error>;

export default Result; 