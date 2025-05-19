import { Result, ok, err } from '@/shared/core/Result';
// Ta bort explicit require-import eftersom vi nu använder named imports
// const { ok, err } = require('@/shared/core/Result');

interface ValueObjectProps {
  [index: string]: any;
}

/**
 * Abstrakt basklass för alla värde-objekt
 * 
 * Värde-objekt är oföränderliga (immutable) och definieras av sina attribut.
 * De har inga identitet och ses som lika om deras attribut är lika.
 */
export abstract class ValueObject<T extends ValueObjectProps> {
  protected readonly props: T;

  constructor(props: T) {
    this.props = Object.freeze(props);
  }

  /**
   * Jämför detta värde-objekt med ett annat
   * @param vo Värde-objektet att jämföra med
   * @returns true om värde-objekten har identiska egenskaper
   */
  public equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    if (vo.props === undefined) {
      return false;
    }
    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }
  
  /**
   * Skapar en kopia av detta värde-objekt
   * Använd för att skapa nya instanser med uppdaterade egenskaper
   * @param props Partiella egenskaper att uppdatera
   * @returns En ny instans av värde-objektet med uppdaterade egenskaper
   */
  protected copyWith(props: Partial<T>): T {
    return Object.freeze({ ...this.props, ...props });
  }
  
  /**
   * Returnerar en raw representation av värde-objektets egenskaper
   * Användbart för serialisering och kommunikation med andra lager
   */
  public toValue(): T {
    return { ...this.props };
  }
  
  /**
   * Definierar ok-funktion för Result
   */
  protected static ok<T, E>(value: T): Result<T, E> {
    return ok<T, E>(value);
  }
  
  /**
   * Definierar err-funktion för Result
   */
  protected static err<T, E>(error: E): Result<T, E> {
    return err<T, E>(error);
  }
  
  /**
   * Validerar egenskaper för värde-objekt baserat på en lista av valideringsregler
   * @param props Egenskaper att validera
   * @param validations Lista av [villkor, felmeddelande]-tupler
   * @returns Result med props vid framgång, eller felmeddelande
   */
  protected static validate<P>(
    props: P,
    validations: Array<[boolean, string]>
  ): Result<P, string> {
    for (const [isValid, errorMessage] of validations) {
      if (!isValid) {
        return this.err(errorMessage);
      }
    }
    return this.ok(props);
  }
} 