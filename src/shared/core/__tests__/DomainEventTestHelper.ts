import { DomainEvent } from '../DomainEvent';
import { AggregateRoot } from '../AggregateRoot';

/**
 * Hjälpklass för att testa domänhändelser
 * Användning:
 * 
 * const eventHelper = new DomainEventTestHelper(minAggregat);
 * eventHelper.expectEvent('MinHändelse', {
 *   id: 'förväntad-id',
 *   värde: 'förväntat-värde'
 * });
 */
export class DomainEventTestHelper<T extends AggregateRoot<any>> {
  constructor(private readonly aggregate: T) {}
  
  /**
   * Hämtar alla händelser av en viss typ
   */
  getEvents(eventName: string): DomainEvent[] {
    return this.aggregate.domainEvents.filter(event => event.name === eventName);
  }
  
  /**
   * Hämtar den senaste händelsen av en viss typ
   */
  getLatestEvent(eventName: string): DomainEvent | undefined {
    const events = this.getEvents(eventName);
    return events.length > 0 ? events[events.length - 1] : undefined;
  }
  
  /**
   * Kontrollerar om en händelse av en viss typ har inträffat
   */
  hasEvent(eventName: string): boolean {
    return this.aggregate.domainEvents.some(event => event.name === eventName);
  }
  
  /**
   * Kontrollerar antalet händelser av en viss typ
   */
  eventCount(eventName: string): number {
    return this.getEvents(eventName).length;
  }
  
  /**
   * Kontrollerar att en händelse finns med förväntad data
   */
  expectEvent(eventName: string, expectedPayload: Record<string, any>): void {
    const event = this.getLatestEvent(eventName);
    expect(event).toBeDefined();
    
    if (!event) {
      throw new Error(`Förväntad händelse ${eventName} hittades inte`);
    }
    
    // Kontrollera varje förväntat fält
    Object.entries(expectedPayload).forEach(([key, value]) => {
      expect(event.payload[key]).toEqual(value);
    });
  }
  
  /**
   * Kontrollerar att händelserna inträffade i rätt ordning
   */
  expectEventSequence(eventNames: string[]): void {
    const events = this.aggregate.domainEvents;
    
    // Kontrollera att vi har rätt antal händelser
    expect(events.length).toBeGreaterThanOrEqual(eventNames.length);
    
    // Kontrollera ordningen (bara de senaste händelserna)
    const offset = events.length - eventNames.length;
    for (let i = 0; i < eventNames.length; i++) {
      expect(events[i + offset].name).toBe(eventNames[i]);
    }
  }
  
  /**
   * Kontrollerar att inga händelser av en viss typ har inträffat
   */
  expectNoEvent(eventName: string): void {
    expect(this.hasEvent(eventName)).toBe(false);
  }
  
  /**
   * Kontrollerar att ett specifikt antal händelser av en viss typ har inträffat
   */
  expectEventCount(eventName: string, count: number): void {
    expect(this.eventCount(eventName)).toBe(count);
  }
  
  /**
   * Rensar händelselistan för att förbereda för nästa test
   */
  clearEvents(): void {
    this.aggregate.clearEvents();
  }
}

/**
 * Skapar en hjälpare för testning av domänhändelser
 */
export function createDomainEventTestHelper<T extends AggregateRoot<any>>(
  aggregate: T
): DomainEventTestHelper<T> {
  return new DomainEventTestHelper(aggregate);
} 