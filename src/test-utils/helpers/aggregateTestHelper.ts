import { AggregateRoot } from '../../domain/core/AggregateRoot';
import { IDomainEvent } from '../../domain/core/IDomainEvent';
import { MockDomainEvents } from '../mocks/mockDomainEvents';

/**
 * AggregateTestHelper är en testhjälpare för att testa events från aggregat.
 * Den hjälper till att kontrollera att events publiceras korrekt från aggregat.
 */
export class AggregateTestHelper {
  /**
   * Förbereder miljön för aggregattestning
   */
  static setupTest(): void {
    MockDomainEvents.clearEvents();
    MockDomainEvents.captureEvents();
  }

  /**
   * Städar upp efter testet
   */
  static teardownTest(): void {
    MockDomainEvents.stopCapturing();
    MockDomainEvents.clearEvents();
  }

  /**
   * Förväntar sig att ett visst event har publicerats från aggregatet
   * 
   * @param aggregate - Aggregatet som ska ha publicerat eventet
   * @param eventType - Typen av event som förväntas
   * @returns Det publicerade eventet om det hittades
   */
  static expectEventPublished<T extends IDomainEvent>(
    aggregate: AggregateRoot<any>,
    eventType: new (...args: any[]) => T
  ): T {
    // Hämta och publicera alla väntande events från aggregatet
    this.publishPendingEvents(aggregate);
    
    if (!MockDomainEvents.hasEvent(eventType)) {
      throw new Error(`Expected event of type ${eventType.name} to be published, but it was not found`);
    }
    
    const event = MockDomainEvents.findEvent(eventType);
    if (!event) {
      throw new Error(`Event of type ${eventType.name} was found, but could not be retrieved`);
    }
    
    return event;
  }

  /**
   * Förväntar sig att ett visst event INTE har publicerats från aggregatet
   * 
   * @param aggregate - Aggregatet som inte ska ha publicerat eventet
   * @param eventType - Typen av event som inte förväntas
   */
  static expectNoEventPublished<T extends IDomainEvent>(
    aggregate: AggregateRoot<any>,
    eventType: new (...args: any[]) => T
  ): void {
    // Hämta och publicera alla väntande events från aggregatet
    this.publishPendingEvents(aggregate);
    
    if (MockDomainEvents.hasEvent(eventType)) {
      throw new Error(`Expected no event of type ${eventType.name} to be published, but it was found`);
    }
  }

  /**
   * Förväntar sig att ett event med specifikt innehåll har publicerats
   * 
   * @param aggregate - Aggregatet som ska ha publicerat eventet
   * @param eventType - Typen av event som förväntas
   * @param expectedData - De förväntade dataelementen i eventet
   * @returns Det publicerade eventet om det hittades och matchar datan
   */
  static expectEventWithData<T extends IDomainEvent>(
    aggregate: AggregateRoot<any>,
    eventType: new (...args: any[]) => T,
    expectedData: Partial<T>
  ): T {
    const event = this.expectEventPublished(aggregate, eventType);
    
    // Kontrollera att alla förväntade dataelement finns i eventet
    for (const [key, value] of Object.entries(expectedData)) {
      const eventValue = (event as any)[key];
      
      if (eventValue === undefined) {
        throw new Error(`Expected event to have property ${key}, but it was undefined`);
      }
      
      if (JSON.stringify(eventValue) !== JSON.stringify(value)) {
        throw new Error(
          `Expected event property ${key} to be ${JSON.stringify(value)}, but got ${JSON.stringify(eventValue)}`
        );
      }
    }
    
    return event;
  }

  /**
   * Verifierar att events har publicerats i en specifik sekvens
   * 
   * @param aggregate - Aggregatet som ska ha publicerat eventen
   * @param expectedEvents - Array med eventtyper i förväntad ordning
   */
  static verifyEventSequence(
    aggregate: AggregateRoot<any>,
    expectedEvents: Array<new (...args: any[]) => IDomainEvent>
  ): void {
    // Hämta och publicera alla väntande events från aggregatet
    this.publishPendingEvents(aggregate);
    
    if (!MockDomainEvents.verifyEventSequence(expectedEvents)) {
      const actualTypes = MockDomainEvents.getEvents().map(e => e.constructor.name);
      const expectedTypes = expectedEvents.map(e => e.name);
      
      throw new Error(
        `Events were not published in expected sequence.\n` +
        `Expected: ${expectedTypes.join(' -> ')}\n` +
        `Actual: ${actualTypes.join(' -> ')}`
      );
    }
  }

  /**
   * Räknar antalet events av en viss typ som har publicerats
   * 
   * @param aggregate - Aggregatet som ska ha publicerat eventen
   * @param eventType - Typen av event att räkna
   * @returns Antalet publicerade events av denna typ
   */
  static countEvents<T extends IDomainEvent>(
    aggregate: AggregateRoot<any>,
    eventType: new (...args: any[]) => T
  ): number {
    // Hämta och publicera alla väntande events från aggregatet
    this.publishPendingEvents(aggregate);
    
    return MockDomainEvents.countEvents(eventType);
  }

  /**
   * Hjälpmetod för att publicera väntande events från ett aggregat
   * 
   * @param aggregate - Aggregatet med väntande events
   */
  private static publishPendingEvents(aggregate: AggregateRoot<any>): void {
    // Hämta alla väntande events från aggregatet
    const events = aggregate.getDomainEvents();
    
    // Publicera dem via mocken
    events.forEach(event => MockDomainEvents.publish(event));
    
    // Rensa events från aggregatet
    aggregate.clearEvents();
  }
} 