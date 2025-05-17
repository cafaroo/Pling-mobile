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

  /**
   * Kontrollerar att ett fält inte är tomt
   * 
   * @param value Värdet som ska kontrolleras
   * @param fieldName Namnet på fältet för felmeddelandet
   * @throws Error om värdet är tomt
   */
  static assertNotEmpty(value: any, fieldName: string): void {
    if (value === null || value === undefined || value === '') {
      throw new Error(`${fieldName} får inte vara tomt`);
    }
  }

  /**
   * Kontrollerar att ett värde inte överskrider en maximal längd
   * 
   * @param value Värdet som ska kontrolleras
   * @param maxLength Maximal tillåten längd
   * @param fieldName Namnet på fältet för felmeddelandet
   * @throws Error om värdet överskrider maxlängden
   */
  static assertMaxLength(value: string, maxLength: number, fieldName: string): void {
    if (value && value.length > maxLength) {
      throw new Error(`${fieldName} får inte vara längre än ${maxLength} tecken`);
    }
  }

  /**
   * Kontrollerar att ett värde uppnår en minimilängd
   * 
   * @param value Värdet som ska kontrolleras
   * @param minLength Minimal tillåten längd
   * @param fieldName Namnet på fältet för felmeddelandet
   * @throws Error om värdet understiger minlängden
   */
  static assertMinLength(value: string, minLength: number, fieldName: string): void {
    if (value && value.length < minLength) {
      throw new Error(`${fieldName} måste vara minst ${minLength} tecken`);
    }
  }

  /**
   * Kontrollerar att ett värde är ett giltigt format (t.ex. email, URL)
   * 
   * @param value Värdet som ska kontrolleras
   * @param pattern Regex-mönster att validera mot
   * @param fieldName Namnet på fältet för felmeddelandet
   * @throws Error om värdet inte matchar mönstret
   */
  static assertPattern(value: string, pattern: RegExp, fieldName: string): void {
    if (value && !pattern.test(value)) {
      throw new Error(`${fieldName} har ett ogiltigt format`);
    }
  }

  /**
   * Kontrollerar att ett numeriskt värde ligger inom ett giltigt intervall
   * 
   * @param value Värdet som ska kontrolleras
   * @param min Minsta tillåtna värde
   * @param max Största tillåtna värde
   * @param fieldName Namnet på fältet för felmeddelandet
   * @throws Error om värdet ligger utanför intervallet
   */
  static assertRange(value: number, min: number, max: number, fieldName: string): void {
    if (value < min || value > max) {
      throw new Error(`${fieldName} måste vara mellan ${min} och ${max}`);
    }
  }

  /**
   * Kontrollerar att ett värde är en giltig epost-adress
   * 
   * @param value Epost-adressen att validera
   * @param fieldName Namnet på fältet för felmeddelandet
   * @throws Error om värdet inte är en giltig epost-adress
   */
  static assertValidEmail(value: string, fieldName: string = 'Email'): void {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.assertPattern(value, emailPattern, fieldName);
  }

  /**
   * Kontrollerar att ett värde är en giltig URL
   * 
   * @param value URL:en att validera
   * @param fieldName Namnet på fältet för felmeddelandet
   * @throws Error om värdet inte är en giltig URL
   */
  static assertValidUrl(value: string, fieldName: string = 'URL'): void {
    try {
      new URL(value);
    } catch {
      throw new Error(`${fieldName} är inte en giltig URL`);
    }
  }

  /**
   * Kontrollerar att ett värde är ett av de tillåtna alternativen
   * 
   * @param value Värdet att validera
   * @param allowedValues Array med tillåtna värden
   * @param fieldName Namnet på fältet för felmeddelandet
   * @throws Error om värdet inte är ett av de tillåtna alternativen
   */
  static assertOneOf<T>(value: T, allowedValues: T[], fieldName: string): void {
    if (!allowedValues.includes(value)) {
      throw new Error(`${fieldName} måste vara ett av följande värden: ${allowedValues.join(', ')}`);
    }
  }
} 