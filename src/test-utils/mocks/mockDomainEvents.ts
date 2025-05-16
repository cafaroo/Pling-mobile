import { IDomainEvent } from '../../domain/core/IDomainEvent';

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
      MockDomainEvents.events.push(event);
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
   * Söker efter ett event av en specifik typ
   */
  static findEvent<T extends IDomainEvent>(eventType: new (...args: any[]) => T): T | undefined {
    return MockDomainEvents.events.find(event => event instanceof eventType) as T | undefined;
  }

  /**
   * Söker efter alla events av en specifik typ
   */
  static findEvents<T extends IDomainEvent>(eventType: new (...args: any[]) => T): T[] {
    return MockDomainEvents.events.filter(event => event instanceof eventType) as T[];
  }

  /**
   * Räknar antalet events av en specifik typ
   */
  static countEvents<T extends IDomainEvent>(eventType: new (...args: any[]) => T): number {
    return MockDomainEvents.findEvents(eventType).length;
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
}

export { MockDomainEvents }; 