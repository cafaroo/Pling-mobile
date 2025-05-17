import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';
import { EventNameHelper } from '../EventNameHelper';

/**
 * MockDomainEvents används för att simulera och spåra domänevents i tester.
 * Den ersätter den riktiga EventBus i testerna för att isolera testning.
 */
class MockDomainEvents {
  private static events: IDomainEvent[] = [];
  private static isCapturing: boolean = false;

  /**
   * Startar inspelning av events
   */
  static captureEvents(): void {
    MockDomainEvents.events = [];
    MockDomainEvents.isCapturing = true;
  }

  /**
   * Avslutar inspelning av events
   */
  static stopCapturing(): void {
    MockDomainEvents.isCapturing = false;
  }

  /**
   * Publicerar ett event till mock-eventrackaren
   */
  static publish(event: IDomainEvent): void {
    if (MockDomainEvents.isCapturing) {
      // Lägg till kompatibilitetsegenskaper för eventName/name/eventType
      const compatibleEvent = EventNameHelper.makeEventNameCompatible(event);
      MockDomainEvents.events.push(compatibleEvent);
    }
  }

  /**
   * Hämtar alla inspelade events
   */
  static getEvents(): IDomainEvent[] {
    return [...MockDomainEvents.events];
  }

  /**
   * Rensar alla inspelade events
   */
  static clearEvents(): void {
    MockDomainEvents.events = [];
  }

  /**
   * Kontrollerar om ett event av en viss typ har publicerats
   */
  static hasEvent<T extends IDomainEvent>(eventType: new (...args: any[]) => T): boolean {
    return MockDomainEvents.events.some(event => event instanceof eventType);
  }

  /**
   * Kontrollerar om ett event med ett specifikt namn har publicerats
   */
  static hasEventWithName(eventName: string): boolean {
    return MockDomainEvents.events.some(event => 
      EventNameHelper.eventNameMatches(event, eventName)
    );
  }

  /**
   * Söker efter ett event av en specifik typ
   */
  static findEvent<T extends IDomainEvent>(eventType: new (...args: any[]) => T): T | undefined {
    return MockDomainEvents.events.find(event => event instanceof eventType) as T | undefined;
  }

  /**
   * Söker efter ett event med ett specifikt namn
   */
  static findEventByName(eventName: string): IDomainEvent | undefined {
    return MockDomainEvents.events.find(event => 
      EventNameHelper.eventNameMatches(event, eventName)
    );
  }

  /**
   * Söker efter alla events av en specifik typ
   */
  static findEvents<T extends IDomainEvent>(eventType: new (...args: any[]) => T): T[] {
    return MockDomainEvents.events.filter(event => event instanceof eventType) as T[];
  }

  /**
   * Söker efter alla events med ett specifikt namn
   */
  static findEventsByName(eventName: string): IDomainEvent[] {
    return MockDomainEvents.events.filter(event => 
      EventNameHelper.eventNameMatches(event, eventName)
    );
  }

  /**
   * Hämtar events av en specifik typ
   */
  static getEventsByType<T extends IDomainEvent>(eventType: new (...args: any[]) => T): T[] {
    return MockDomainEvents.events.filter(event => event instanceof eventType) as T[];
  }

  /**
   * Hämtar events med ett specifikt namn
   */
  static getEventsByName(eventName: string): IDomainEvent[] {
    return MockDomainEvents.events.filter(event => 
      EventNameHelper.eventNameMatches(event, eventName)
    );
  }

  /**
   * Räknar antalet events av en specifik typ
   */
  static countEvents<T extends IDomainEvent>(eventType: new (...args: any[]) => T): number {
    return MockDomainEvents.findEvents(eventType).length;
  }

  /**
   * Räknar antalet events med ett specifikt namn
   */
  static countEventsByName(eventName: string): number {
    return MockDomainEvents.findEventsByName(eventName).length;
  }

  /**
   * Verifierar att event har publicerats i en specifik ordning
   */
  static verifyEventSequence(eventTypes: Array<new (...args: any[]) => IDomainEvent>): boolean {
    if (eventTypes.length > MockDomainEvents.events.length) {
      return false;
    }

    return eventTypes.every((EventType, index) => {
      return MockDomainEvents.events[index] instanceof EventType;
    });
  }

  /**
   * Verifierar att event har publicerats i en specifik ordning baserat på namn
   */
  static verifyEventNameSequence(eventNames: string[]): boolean {
    if (eventNames.length > MockDomainEvents.events.length) {
      return false;
    }

    return eventNames.every((name, index) => {
      return EventNameHelper.eventNameMatches(MockDomainEvents.events[index], name);
    });
  }
}

// Exportera klassen
export { MockDomainEvents };

// Exportera en instans för att stödja importering via 'mockDomainEvents'
export const mockDomainEvents = MockDomainEvents; 