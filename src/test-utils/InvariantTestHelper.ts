import { AggregateRoot } from '@/shared/domain/AggregateRoot';
import { Result } from '@/shared/core/Result';

/**
 * InvariantTestHelper
 * 
 * Hjälpklass för att testa invarianter i DDD-aggregat.
 */
export class InvariantTestHelper {
  /**
   * Testar en specifik invariant genom att modifiera en egenskap i ett aggregat
   * 
   * @param aggregate - Aggregatrot att testa
   * @param propertyKey - Namnet på egenskapen att modifiera
   * @param invalidValue - Ogiltigt värde att sätta
   * @param expectedErrorPattern - Förväntat mönster i felmeddelandet
   * @returns Aggregatet efter att ha återställt det giltiga värdet
   */
  static testInvariantViolation<T extends AggregateRoot<any>, K extends keyof T['props']>(
    aggregate: T,
    propertyKey: K,
    invalidValue: any,
    expectedErrorPattern: string
  ): T {
    // Spara originalvärdet
    const originalValue = aggregate.props[propertyKey];
    
    // Sätt ogiltigt värde
    (aggregate as any).props[propertyKey] = invalidValue;
    
    // Anropa validateInvariants via reflection
    // @ts-ignore - Åtkomst till privat metod för testning
    const result: Result<void, string> = aggregate.validateInvariants();
    
    // Verifiera att invarianten bryts med förväntat felmeddelande
    expect(result.isErr()).toBe(true);
    expect(result.error).toContain(expectedErrorPattern);
    
    // Återställ originalvärdet
    (aggregate as any).props[propertyKey] = originalValue;
    
    // Verifiera att invarianten nu är uppfylld igen
    // @ts-ignore - Åtkomst till privat metod för testning
    const restoredResult = aggregate.validateInvariants();
    expect(restoredResult.isOk()).toBe(true);
    
    return aggregate;
  }
  
  /**
   * Testar flera invarianter i ett aggregat
   * 
   * @param aggregate - Aggregatrot att testa
   * @param invariantTests - Array med testbeskrivningar för invarianter
   */
  static testMultipleInvariants<T extends AggregateRoot<any>>(
    aggregate: T,
    invariantTests: Array<{
      propertyKey: keyof T['props'];
      invalidValue: any;
      expectedErrorPattern: string;
      description: string;
    }>
  ): void {
    // För varje invariant
    invariantTests.forEach(test => {
      // Beskrivning för testet
      describe(`Invariant: ${test.description}`, () => {
        it(`ska avvisa ogiltig ${String(test.propertyKey)}`, () => {
          this.testInvariantViolation(
            aggregate,
            test.propertyKey,
            test.invalidValue,
            test.expectedErrorPattern
          );
        });
      });
    });
  }
  
  /**
   * Testar att en invariant valideras i en specifik metod
   * 
   * @param aggregate - Aggregatrot att testa
   * @param method - Metodnamn att anropa
   * @param args - Argument att skicka till metoden
   * @param propertyKey - Namnet på egenskapen som ska modifieras för att bryta invarianten
   * @param invalidValue - Ogiltigt värde att sätta
   * @param expectedErrorPattern - Förväntat mönster i felmeddelandet när metoden anropas
   */
  static testMethodInvariantValidation<T extends AggregateRoot<any>, K extends keyof T['props']>(
    aggregate: T,
    method: keyof T,
    args: any[],
    propertyKey: K,
    invalidValue: any,
    expectedErrorPattern: string
  ): void {
    // Spara originalvärdet
    const originalValue = aggregate.props[propertyKey];
    
    // Sätt ogiltigt värde som bryter invarianten
    (aggregate as any).props[propertyKey] = invalidValue;
    
    // Anropa metoden
    const result = (aggregate[method] as Function)(...args);
    
    // Verifiera att anropet misslyckas pga bruten invariant
    expect(result.isErr()).toBe(true);
    expect(result.error).toContain(expectedErrorPattern);
    
    // Återställ originalvärdet
    (aggregate as any).props[propertyKey] = originalValue;
  }
} 