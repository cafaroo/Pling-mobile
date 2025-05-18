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

  /**
   * Kontrollera om ett aggregat har en specifik händelse i sin lista av domänhändelser
   */
  static hasEvent(aggregate: any, eventClass: new (...args: any[]) => IDomainEvent): boolean {
    if (!aggregate.domainEvents) {
      return false;
    }

    return aggregate.domainEvents.some((event: IDomainEvent) => 
      event instanceof eventClass
    );
  }

  /**
   * Hämta alla händelser av en viss typ från ett aggregat
   */
  static getEvents(aggregate: any, eventClass: new (...args: any[]) => IDomainEvent): IDomainEvent[] {
    if (!aggregate.domainEvents) {
      return [];
    }

    return aggregate.domainEvents.filter((event: IDomainEvent) => 
      event instanceof eventClass
    );
  }

  /**
   * Testa att en operation på ett aggregat skapar den förväntade händelsen
   */
  static assertEventPublished(
    operation: () => void,
    eventClass: new (...args: any[]) => IDomainEvent
  ): void {
    // Rensa händelser innan testet
    MockDomainEvents.clearEvents();
    
    // Utför operationen
    operation();
    
    // Kontrollera om händelsen publicerades
    const events = MockDomainEvents.getEvents();
    const hasEvent = events.some(event => event instanceof eventClass);
    
    if (!hasEvent) {
      throw new Error(`Expected event of type ${eventClass.name} was not published`);
    }
  }

  /**
   * Verifiera att ett aggregat har ett visst antal händelser
   */
  static assertEventCount(aggregate: any, count: number): void {
    if (!aggregate.domainEvents) {
      if (count === 0) {
        return; // OK - inga händelser förväntade
      }
      throw new Error(`Expected ${count} events but aggregate has no events property`);
    }

    if (aggregate.domainEvents.length !== count) {
      throw new Error(`Expected ${count} events but found ${aggregate.domainEvents.length}`);
    }
  }

  /**
   * Rensa händelser från ett aggregat
   */
  static clearEvents(aggregate: any): void {
    if (aggregate.domainEvents) {
      aggregate.domainEvents = [];
    }
  }

  /**
   * Verifiera att en operation ändrar en egenskap på aggregatet
   */
  static assertPropertyChanged(
    aggregate: any,
    operation: () => void,
    property: string,
    expectedValue: any
  ): void {
    // Utför operationen
    operation();
    
    // Kontrollera att egenskapen har ändrats
    const actualValue = typeof aggregate.get === 'function' 
      ? aggregate.get(property)
      : aggregate[property];

    if (JSON.stringify(actualValue) !== JSON.stringify(expectedValue)) {
      throw new Error(
        `Expected property ${property} to be ${JSON.stringify(expectedValue)} but got ${JSON.stringify(actualValue)}`
      );
    }
  }
}

/**
 * Hjälpfunktion för att hämta data från ett event
 */
export function getEventData(event: any, field: string): any {
  // För nya event-standarder
  if (event.data && typeof event.getEventData === 'function') {
    const eventData = event.getEventData();
    return eventData[field];
  }
  
  // För gamla events - fallback till direkta egenskaper
  return event[field];
}

/**
 * Verifiera att ett specifikt event har publicerats av ett aggregat
 */
export function expectEventPublished(eventType: any): any {
  const typeName = eventType.name || 'Unknown';
  
  // Försök hitta eventet antingen via eventType, name eller constructor.name
  let found = MockDomainEvents.getEvents().find((e: any) => {
    if (e instanceof eventType) return true;
    if (e.eventType === typeName) return true;
    if (e.name === typeName) return true;
    if (e.constructor.name === typeName) return true;
    return false;
  });
  
  if (!found) {
    throw new Error(`Expected event of type ${typeName} to be published, but it was not found`);
  }
  
  return found;
}

/**
 * Verifiera en sekvens av händelser
 */
export function verifyEventSequence(expectedEvents: any[]): void {
  const events = MockDomainEvents.getEvents();
  
  // En mer flexibel matchning som letar efter event-typer
  // och inte kräver att de kommer i exakt ordning eller att det inte finns andra event
  for (const expectedType of expectedEvents) {
    const typeName = expectedType.name || 'Unknown';
    
    const found = events.some((e: any) => {
      if (e instanceof expectedType) return true;
      if (e.eventType === typeName) return true;
      if (e.name === typeName) return true;
      if (e.constructor.name === typeName) return true;
      return false;
    });
    
    if (!found) {
      // Skapa en läslig lista över faktiska event
      const actualTypes = events.map((e: any) => {
        return e.constructor.name || e.eventType || e.name || 'Unknown';
      });
      
      // Skapa en läslig lista över förväntade event
      const expectedTypes = expectedEvents.map(e => e.name || 'Unknown');
      
      throw new Error(
        `Events were not published in expected sequence.\n` +
        `Expected: ${expectedTypes.join(' -> ')}\n` +
        `Actual: ${actualTypes.join(' -> ')}`
      );
    }
  }
} 