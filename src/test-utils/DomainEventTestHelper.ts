import { DomainEvent } from '@/shared/core/DomainEvent';

// Statisk implementering för att lagra händelser i tester utan att kräva MockEventBus
class StaticEventStore {
  private static events: DomainEvent[] = [];
  
  static addEvent(event: DomainEvent): void {
    this.events.push(event);
  }
  
  static getEvents(): DomainEvent[] {
    return [...this.events];
  }
  
  static clearEvents(): void {
    this.events = [];
  }
}

// Patchar DomainEvent för att automatiskt registrera händelser
const originalDispatch = DomainEvent.prototype.dispatch;
DomainEvent.prototype.dispatch = function() {
  StaticEventStore.addEvent(this);
  return originalDispatch.call(this);
};

export class DomainEventTestHelper {
  /**
   * Hämtar alla utlösta domänhändelser
   */
  static getDispatchedEvents(): DomainEvent[] {
    return StaticEventStore.getEvents();
  }
  
  /**
   * Återställer listan med händelser
   */
  static clearEvents(): void {
    StaticEventStore.clearEvents();
  }
  
  /**
   * Kontrollerar om en specifik händelsetyp har utlösts
   */
  static expectEventDispatched<T extends DomainEvent>(
    eventType: new (...args: any[]) => T,
    expectedProps?: Partial<T>
  ): void {
    const events = this.getDispatchedEvents();
    const matchingEvents = events.filter(event => event instanceof eventType);
    
    expect(matchingEvents.length).toBeGreaterThan(0);
    
    if (expectedProps) {
      const matchingEvent = matchingEvents[0] as T;
      Object.entries(expectedProps).forEach(([key, value]) => {
        expect(matchingEvent[key as keyof T]).toEqual(value);
      });
    }
  }
  
  /**
   * Kontrollerar att en specifik händelsetyp INTE har utlösts
   */
  static expectEventNotDispatched<T extends DomainEvent>(
    eventType: new (...args: any[]) => T
  ): void {
    const events = this.getDispatchedEvents();
    const matchingEvents = events.filter(event => event instanceof eventType);
    expect(matchingEvents.length).toBe(0);
  }
  
  /**
   * Kontrollerar antalet händelser av en viss typ
   */
  static expectEventCount<T extends DomainEvent>(
    eventType: new (...args: any[]) => T,
    expectedCount: number
  ): void {
    const events = this.getDispatchedEvents();
    const matchingEvents = events.filter(event => event instanceof eventType);
    expect(matchingEvents.length).toBe(expectedCount);
  }
} 