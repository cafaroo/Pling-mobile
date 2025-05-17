/**
 * Mock implementering av DomainEvents för testning
 */

import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';

// Typinterfaced för ett domänevent
export interface DomainEvent {
  eventName?: string;
  name?: string;
  dateTimeOccurred?: Date;
  [key: string]: any;
}

// Typinterface för en eventlyssnare
type EventHandler = (event: DomainEvent) => void;

class MockDomainEvents {
  private events: DomainEvent[] = [];
  private handlers: Record<string, EventHandler[]> = {};
  private markedAggregates: any[] = [];

  constructor() {
    this.clearEvents();
    this.clearHandlers();
  }

  /**
   * Markera ett aggregat för publicering av händelser
   */
  markAggregateForDispatch(aggregate: any): void {
    const aggregateFound = !!this.findMarkedAggregateByID(aggregate.id);

    if (!aggregateFound) {
      this.markedAggregates.push(aggregate);
    }
  }

  /**
   * Hämta ett markerat aggregat baserat på ID
   */
  private findMarkedAggregateByID(id: string): any {
    return this.markedAggregates.find(aggregate => aggregate.id.toString() === id);
  }

  /**
   * Registrera en lyssnare för en händelsetyp
   */
  register(callback: EventHandler, eventName: string): void {
    if (!this.handlers[eventName]) {
      this.handlers[eventName] = [];
    }
    this.handlers[eventName].push(callback);
  }

  /**
   * Avregistrera en lyssnare
   */
  unregisterHandler(callback: EventHandler, eventName: string): void {
    if (!this.handlers[eventName]) {
      return;
    }
    this.handlers[eventName] = this.handlers[eventName].filter(handler => handler !== callback);
  }

  /**
   * Avregistrera alla lyssnare för en händelsetyp
   */
  unregisterAllHandlersForEvent(eventName: string): void {
    delete this.handlers[eventName];
  }

  /**
   * Rensa alla lyssnare
   */
  clearHandlers(): void {
    this.handlers = {};
  }

  /**
   * Publicera en händelse
   */
  publish(event: DomainEvent): void {
    this.events.push(event);
    
    const eventName = event.eventName || event.name || '';
    
    if (this.handlers[eventName] && this.handlers[eventName].length > 0) {
      this.handlers[eventName].forEach(handler => {
        handler(event);
      });
    }
  }

  /**
   * Distribuera händelser från alla markerade aggregat
   */
  dispatchEventsForAggregate(id: string): void {
    const aggregate = this.findMarkedAggregateByID(id);

    if (aggregate) {
      const eventsTPublish = aggregate.domainEvents || [];
      eventsTPublish.forEach((event: DomainEvent) => this.publish(event));
      
      // Rensa händelser på aggregatet
      if (typeof aggregate.clearEvents === 'function') {
        aggregate.clearEvents();
      }
      
      // Ta bort från markerade aggregat
      this.removeAggregateFromMarkedDispatchList(aggregate);
    }
  }

  /**
   * Ta bort ett aggregat från listan över markerade
   */
  private removeAggregateFromMarkedDispatchList(aggregate: any): void {
    const index = this.markedAggregates.findIndex(a => a.id.toString() === aggregate.id.toString());
    if (index !== -1) {
      this.markedAggregates.splice(index, 1);
    }
  }

  /**
   * Rensa alla händelser
   */
  clearEvents(): void {
    this.events = [];
  }

  /**
   * Hämta alla publicerade händelser (för testverifiering)
   */
  getEvents(): DomainEvent[] {
    return [...this.events];
  }
}

// Exportera en singleton-instans
export const mockDomainEvents = new MockDomainEvents();

// Hjälpfunktioner för testning
export const verifyEventPublished = (eventName: string): boolean => {
  return mockDomainEvents.getEvents().some(event => 
    (event.eventName === eventName) || (event.name === eventName)
  );
};

export const verifyEventData = (eventName: string, data: any): boolean => {
  const event = mockDomainEvents.getEvents().find(event => 
    (event.eventName === eventName) || (event.name === eventName)
  );
  
  if (!event) return false;
  
  // Kontrollera om alla properties i data finns i eventet
  return Object.entries(data).every(([key, value]) => 
    event[key] !== undefined && JSON.stringify(event[key]) === JSON.stringify(value)
  );
};

// Default export för enkel import
export default mockDomainEvents; 