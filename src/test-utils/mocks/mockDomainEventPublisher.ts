/**
 * MockDomainEventPublisher
 * 
 * Mock implementation av IDomainEventPublisher för testning
 */

import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';
import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';

export class MockDomainEventPublisher implements IDomainEventPublisher {
  private publishedEvents: IDomainEvent[] = [];
  private handlers: Record<string, Array<(event: IDomainEvent) => Promise<void>>> = {};
  
  /**
   * Publicerar en händelse
   */
  async publish(event: IDomainEvent): Promise<void> {
    this.publishedEvents.push(event);
    
    const eventName = event.name || event.eventName || '';
    
    // Anropa registrerade handlers
    if (this.handlers[eventName]) {
      await Promise.all(
        this.handlers[eventName].map(handler => 
          handler(event).catch(err => console.error('Error in event handler', err))
        )
      );
    }
  }
  
  /**
   * Registrera en händelsehanterare
   */
  register(eventName: string, handler: (event: IDomainEvent) => Promise<void>): void {
    if (!this.handlers[eventName]) {
      this.handlers[eventName] = [];
    }
    
    this.handlers[eventName].push(handler);
  }
  
  /**
   * Avregistrera en händelsehanterare
   */
  unregister(eventName: string, handler: (event: IDomainEvent) => Promise<void>): void {
    if (!this.handlers[eventName]) {
      return;
    }
    
    this.handlers[eventName] = this.handlers[eventName].filter(h => h !== handler);
  }
  
  /**
   * Lyssna på flera händelser samtidigt
   */
  registerMany(
    eventNames: string[], 
    handler: (event: IDomainEvent) => Promise<void>
  ): void {
    eventNames.forEach(eventName => this.register(eventName, handler));
  }
  
  /**
   * Rensa alla registrerade handlers
   */
  clearHandlers(): void {
    this.handlers = {};
  }
  
  /**
   * Hämta alla publicerade händelser
   */
  getPublishedEvents(): IDomainEvent[] {
    return [...this.publishedEvents];
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