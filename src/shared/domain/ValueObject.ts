import { Result, ok, err } from '@/shared/core/Result';

/**
 * Abstrakt basklass för alla värde-objekt
 * 
 * Värde-objekt är oföränderliga (immutable) och definieras av sina attribut.
 * De har inga identitet och ses som lika om deras attribut är lika.
 */
export abstract class ValueObject<T> {
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
   * Validerar ett värde-objekts egenskaper
   * Detta är en hjälpmetod som kan användas i create-metoder
   * @param props Egenskaperna att validera
   * @returns Ett Result som innehåller antingen felet eller void
   */
  protected static validate<P>(props: P, validations: Array<[boolean, string]>): Result<void, string> {
    for (const [isValid, errorMessage] of validations) {
      if (!isValid) {
        return err(errorMessage);
      }
    }
    return ok(undefined);
  }
} 