/**
 * MockDomainEventPublisher
 * 
 * Mock implementation av IDomainEventPublisher för testning
 */

import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';
import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';
import { DomainEventPublisher } from '@/shared/domain/events/DomainEventPublisher';
import { DomainEvent } from '@/shared/domain/events/DomainEvent';

export class MockDomainEventPublisher implements DomainEventPublisher {
  private publishedEvents: DomainEvent[] = [];
  private handlers: Map<string, Function[]> = new Map();
  private isMarkingDispatchedEvents: boolean = false;
  
  /**
   * Publicerar en händelse
   */
  publish(event: DomainEvent): void {
    this.publishedEvents.push(event);
    
    // Anropa alla handlers för denna event-typ
    const eventType = event.constructor.name;
    const handlers = this.handlers.get(eventType) || [];
    
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error in event handler for ${eventType}:`, error);
      }
    });
  }
  
  /**
   * Registrera en händelsehanterare
   */
  subscribe(eventName: string, handler: Function): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    this.handlers.get(eventName)?.push(handler);
  }
  
  /**
   * Avregistrera en händelsehanterare
   */
  unsubscribe(eventName: string, handler: Function): void {
    if (!this.handlers.has(eventName)) {
      return;
    }
    
    const handlers = this.handlers.get(eventName) || [];
    const index = handlers.indexOf(handler);
    
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }
  
  /**
   * Lyssna på flera händelser samtidigt
   */
  registerMany(
    eventNames: string[], 
    handler: (event: IDomainEvent) => Promise<void>
  ): void {
    eventNames.forEach(eventName => this.subscribe(eventName, handler));
  }
  
  /**
   * Rensa alla registrerade handlers
   */
  clearHandlers(): void {
    this.handlers.clear();
  }
  
  /**
   * Hämta alla publicerade händelser
   */
  getPublishedEvents(): DomainEvent[] {
    return this.publishedEvents;
  }
  
  /**
   * Rensa alla publicerade händelser
   */
  clearEvents(): void {
    this.publishedEvents = [];
  }
  
  /**
   * Kontrollera om en viss typ av händelse har publicerats
   */
  hasPublished(eventName: string): boolean {
    return this.publishedEvents.some(
      event => (event.name === eventName) || (event.eventName === eventName)
    );
  }
  
  /**
   * Hämta alla händelser av en viss typ
   */
  getEventsByType(eventName: string): IDomainEvent[] {
    return this.publishedEvents.filter(
      event => (event.name === eventName) || (event.eventName === eventName)
    );
  }
  
  /**
   * Återställ publiseraren
   */
  reset(): void {
    this.clearEvents();
    this.clearHandlers();
  }

  /**
   * Kontrollerar om en specifik typ av händelse har publicerats
   * 
   * @param eventType Händelsetypen att kontrollera
   */
  hasPublishedEventOfType(eventType: string): boolean {
    return this.publishedEvents.some(e => e.constructor.name === eventType);
  }

  /**
   * Hämtar alla publicerade händelser av en specifik typ
   * 
   * @param eventType Händelsetypen att filtrera på
   */
  getPublishedEventsOfType(eventType: string): DomainEvent[] {
    return this.publishedEvents.filter(e => e.constructor.name === eventType);
  }

  /**
   * Kontrollerar om en specifik händelse har publicerats
   * 
   * @param event Händelsen att kontrollera
   */
  hasPublishedEvent(event: DomainEvent): boolean {
    return this.publishedEvents.includes(event);
  }

  setMarkingDispatchedEvents(value: boolean): void {
    this.isMarkingDispatchedEvents = value;
  }
}

/**
 * Skapa en ny instans av MockDomainEventPublisher
 */
export const createMockDomainEventPublisher = (): MockDomainEventPublisher => {
  return new MockDomainEventPublisher();
};

/**
 * Exportera en standardinstans för enkel användning
 */
export const mockDomainEventPublisher = createMockDomainEventPublisher(); 