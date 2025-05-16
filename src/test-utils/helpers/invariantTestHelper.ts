import { AggregateRoot } from '../../domain/core/AggregateRoot';

/**
 * InvariantTestHelper är en testhjälpare för att testa invarianter i aggregatrötter.
 * Den hjälper till att kontrollera att aggregat upprätthåller sina invarianter korrekt.
 */
export class InvariantTestHelper {
  /**
   * Kontrollerar en invariant genom att utföra en operation på ett aggregat
   * 
   * @param aggregate - Aggregatroten som ska testas
   * @param operation - Namnet på metoden som ska anropas
   * @param args - Argumenten till metoden
   * @returns Resultatet från operationen
   */
  static checkInvariant<T extends AggregateRoot<any>>(
    aggregate: T,
    operation: keyof T,
    args: any[]
  ): any {
    // Säkerställ att operation är en funktion
    if (typeof aggregate[operation] !== 'function') {
      throw new Error(`Operation '${String(operation)}' is not a function on the aggregate`);
    }

    // Anropa operationen och returnera resultatet
    return (aggregate[operation] as Function).apply(aggregate, args);
  }

  /**
   * Förväntar sig att en invariant ska brytas när en operation utförs
   * 
   * @param aggregate - Aggregatroten som ska testas
   * @param operation - Namnet på metoden som ska anropas
   * @param args - Argumenten till metoden
   * @param errorMessage - Det förväntade felmeddelandet (helt eller delvis)
   */
  static expectInvariantViolation<T extends AggregateRoot<any>>(
    aggregate: T,
    operation: keyof T,
    args: any[],
    errorMessage?: string
  ): void {
    try {
      this.checkInvariant(aggregate, operation, args);
      throw new Error(`Expected invariant violation when calling ${String(operation)}, but no error was thrown`);
    } catch (error) {
      // Om vi har ett förväntat felmeddelande, kontrollera det
      if (errorMessage && error instanceof Error) {
        if (!error.message.includes(errorMessage)) {
          throw new Error(
            `Expected error message to include "${errorMessage}" but got "${error.message}"`
          );
        }
      }
      
      // Om inget felmeddelande angetts, verifiera bara att något fel kastades
    }
  }

  /**
   * Förväntar sig att inga invarianter bryts när en operation utförs
   * 
   * @param aggregate - Aggregatroten som ska testas
   * @param operation - Namnet på metoden som ska anropas
   * @param args - Argumenten till metoden
   * @returns Resultatet från operationen
   */
  static expectNoInvariantViolation<T extends AggregateRoot<any>>(
    aggregate: T,
    operation: keyof T,
    args: any[]
  ): any {
    try {
      return this.checkInvariant(aggregate, operation, args);
    } catch (error) {
      throw new Error(
        `Expected no invariant violation when calling ${String(operation)}, but got error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Testar att en invariant valideras korrekt i validateInvariants-metoden
   * 
   * @param aggregate - Aggregatroten som ska testas
   * @param propertyToModify - Egenskapen som ska modifieras för att bryta invarianten
   * @param invalidValue - Det ogiltiga värdet
   * @param errorMessage - Det förväntade felmeddelandet (helt eller delvis)
   */
  static testInvariantValidation<T extends AggregateRoot<any>>(
    aggregate: T,
    propertyToModify: string,
    invalidValue: any,
    errorMessage: string
  ): void {
    // Spara originalvärdet
    const originalValue = (aggregate as any)[propertyToModify];
    
    // Sätt ett ogiltigt värde direkt (bryter inkapsling för testning)
    (aggregate as any)[propertyToModify] = invalidValue;
    
    try {
      // Anropa validateInvariants direkt
      (aggregate as any).validateInvariants();
      
      // Om vi kommer hit har inget fel kastats, vilket är fel
      throw new Error(`Expected invariant violation for ${propertyToModify}, but no error was thrown`);
    } catch (error) {
      // Återställ originalvärdet
      (aggregate as any)[propertyToModify] = originalValue;
      
      // Verifiera felmeddelandet
      if (error instanceof Error && !error.message.includes(errorMessage)) {
        throw new Error(
          `Expected error message to include "${errorMessage}" but got "${error.message}"`
        );
      }
    }
  }
} 