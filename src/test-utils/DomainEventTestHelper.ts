/**
 * DomainEventTestHelper
 * 
 * Hjälpklass för att testa domänevent i DDD-arkitekturen.
 */
import { DomainEvent } from '@/shared/core/DomainEvent';
import { AggregateRoot } from '@/shared/core/AggregateRoot';
import { EventBus } from '@/shared/core/EventBus';

export class DomainEventTestHelper {
  /**
   * Kontrollerar om ett aggregat har publicerat en viss typ av event
   * 
   * @param aggregate Aggregat att kontrollera
   * @param eventType Typ av event att söka efter (klassnamn)
   * @returns true om eventet har publicerats, annars false
   */
  static hasPublishedEvent<T extends DomainEvent>(
    aggregate: AggregateRoot<any>,
    eventType: new (...args: any[]) => T
  ): boolean {
    return this.getPublishedEvents(aggregate, eventType).length > 0;
  }

  /**
   * Hämtar alla event av en viss typ som publicerats av ett aggregat
   * 
   * @param aggregate Aggregat att hämta event från
   * @param eventType Typ av event att filtrera på
   * @returns Array med matchande event
   */
  static getPublishedEvents<T extends DomainEvent>(
    aggregate: AggregateRoot<any> | any,
    eventType: new (...args: any[]) => T
  ): T[] {
    // Hantera fall där aggregate inte är ett riktigt AggregateRoot
    // Detta behövs för testers i application-lagret där mockade objekt används
    let events: DomainEvent[] = [];
    
    try {
      if (aggregate && typeof aggregate.getDomainEvents === 'function') {
        events = aggregate.getDomainEvents();
      } else if (aggregate && Array.isArray(aggregate.events)) {
        events = aggregate.events;
      } else if (aggregate && aggregate._events && Array.isArray(aggregate._events)) {
        events = aggregate._events;
      } else {
        // Fallback för helt mockade objekt i applikationstester
        return [];
      }
    } catch (error) {
      console.warn('Kunde inte hämta domänevents:', error);
      return [];
    }
    
    return events.filter(event => event instanceof eventType) as T[];
  }

  /**
   * Hämtar det senaste eventet av en viss typ som publicerats av ett aggregat
   * 
   * @param aggregate Aggregat att hämta event från
   * @param eventType Typ av event att söka efter
   * @returns Det senaste eventet eller undefined om inget hittas
   */
  static getLastPublishedEvent<T extends DomainEvent>(
    aggregate: AggregateRoot<any>,
    eventType: new (...args: any[]) => T
  ): T | undefined {
    const events = this.getPublishedEvents(aggregate, eventType);
    return events.length > 0 ? events[events.length - 1] : undefined;
  }

  /**
   * Kontrollerar om ett aggregat har publicerat exakt en instans av en viss typ av event
   * 
   * @param aggregate Aggregat att kontrollera
   * @param eventType Typ av event att söka efter
   * @returns true om exakt ett event har publicerats, annars false
   */
  static hasPublishedExactlyOneEvent<T extends DomainEvent>(
    aggregate: AggregateRoot<any>,
    eventType: new (...args: any[]) => T
  ): boolean {
    return this.getPublishedEvents(aggregate, eventType).length === 1;
  }

  /**
   * Rensa alla domänevent från ett aggregat
   * 
   * @param aggregate Aggregat att rensa event från
   */
  static clearEvents(aggregate: AggregateRoot<any> | any): void {
    if (!aggregate) return;
    
    try {
      if (typeof aggregate.clearEvents === 'function') {
        aggregate.clearEvents();
      } else if (Array.isArray(aggregate.events)) {
        aggregate.events = [];
      } else if (aggregate._events && Array.isArray(aggregate._events)) {
        aggregate._events = [];
      }
    } catch (error) {
      console.warn('Kunde inte rensa domänevent:', error);
    }
  }

  /**
   * Skapar en riktig EventBus för tester
   * 
   * @returns En instans av EventBus
   */
  static createRealEventBus(): EventBus {
    return new EventBus();
  }

  /**
   * Skapar en mockad EventBus för tester
   * 
   * @returns En mockad EventBus med spårbara funktioner
   */
  static createMockEventBus(): EventBus {
    return {
      publish: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn().mockImplementation(() => ({ unsubscribe: jest.fn() })),
      unsubscribe: jest.fn(),
      clear: jest.fn(),
      getSubscribers: jest.fn().mockReturnValue([]),
      hasSubscribers: jest.fn().mockReturnValue(false),
      clearListeners: jest.fn()
    } as unknown as EventBus;
  }
} 