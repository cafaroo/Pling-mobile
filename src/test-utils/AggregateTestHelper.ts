import { AggregateRoot } from '@/shared/domain/AggregateRoot';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';
import { mockDomainEvents } from './mocks/mockDomainEvents';
import { Result } from '@/shared/core/Result';
import { EventNameHelper } from './EventNameHelper';

/**
 * AggregateTestHelper
 * 
 * Hjälpklass för att testa aggregat, deras events och invarianter
 */
export class AggregateTestHelper<T extends AggregateRoot<any>> {
  private aggregate: T;
  
  constructor(aggregate: T) {
    this.aggregate = aggregate;
    // Rensa event vid skapande
    this.clearEvents();
  }
  
  /**
   * Rensa alla tidigare events
   */
  public clearEvents(): void {
    // Rensa events i mockDomainEvents
    mockDomainEvents.clearEvents();
    
    // Rensa även events i aggregatet om metoden finns
    if (this.aggregate) {
      if (typeof this.aggregate.clearEvents === 'function') {
        this.aggregate.clearEvents();
      } else if (typeof (this.aggregate as any).getDomainEvents === 'function' && 
                 Array.isArray((this.aggregate as any).getDomainEvents())) {
        // Försök hantera implementation från shared/domain/AggregateRoot med getDomainEvents
        try {
          (this.aggregate as any)._domainEvents = [];
        } catch (e) {
          console.warn('Kunde inte rensa domänhändelser från aggregatet direkt');
        }
      }
    }
  }
  
  /**
   * Hämta alla registrerade events
   */
  public getEvents(): IDomainEvent[] {
    // Försök hämta events från domain-implementationen först
    if (typeof (this.aggregate as any).getDomainEvents === 'function') {
      const events = (this.aggregate as any).getDomainEvents();
      // Gör events kompatibla med olika naming-konventioner
      return events.map(event => EventNameHelper.makeEventNameCompatible(event));
    }
    
    // Fallback till domainEvents getter från core-implementationen
    if (this.aggregate && (this.aggregate as any).domainEvents) {
      const events = (this.aggregate as any).domainEvents;
      // Gör events kompatibla med olika naming-konventioner
      return events.map(event => EventNameHelper.makeEventNameCompatible(event));
    }
    
    // Slutlig fallback till mockDomainEvents
    return mockDomainEvents.getEvents();
  }
  
  /**
   * Hämta events av en specifik typ
   */
  public getEventsByType<E extends IDomainEvent>(
    eventType: new (...args: any[]) => E
  ): E[] {
    const events = this.getEvents();
    return events.filter(event => event instanceof eventType) as E[];
  }
  
  /**
   * Hämta events med ett specifikt namn
   */
  public getEventsByName(eventName: string): IDomainEvent[] {
    const events = this.getEvents();
    return events.filter(event => EventNameHelper.eventNameMatches(event, eventName));
  }
  
  /**
   * Verifiera att ett event har publicerats
   */
  public expectEvent<E extends IDomainEvent>(
    eventType: new (...args: any[]) => E,
    attributeValidations?: Record<string, any>
  ): this {
    const events = this.getEventsByType(eventType);
    expect(events.length).toBeGreaterThan(0, `Förväntade minst ett event av typen ${eventType.name}`);
    
    if (attributeValidations && events.length > 0) {
      const event = events[events.length - 1];
      
      for (const [attr, expectedValue] of Object.entries(attributeValidations)) {
        if (typeof expectedValue === 'function') {
          expect(expectedValue((event as any)[attr])).toBe(true, 
            `Förväntade att attributet ${attr} skulle uppfylla valideringsfunktionen`);
        } else {
          expect((event as any)[attr]).toEqual(expectedValue, 
            `Förväntade att attributet ${attr} skulle vara ${expectedValue} men var ${(event as any)[attr]}`);
        }
      }
    }
    
    return this;
  }
  
  /**
   * Verifiera att ett event med specifikt namn har publicerats
   */
  public expectEventWithName(
    eventName: string,
    attributeValidations?: Record<string, any>
  ): this {
    const events = this.getEventsByName(eventName);
    expect(events.length).toBeGreaterThan(0, `Förväntade minst ett event med namn ${eventName}`);
    
    if (attributeValidations && events.length > 0) {
      const event = events[events.length - 1];
      
      for (const [attr, expectedValue] of Object.entries(attributeValidations)) {
        if (typeof expectedValue === 'function') {
          expect(expectedValue((event as any)[attr])).toBe(true, 
            `Förväntade att attributet ${attr} skulle uppfylla valideringsfunktionen`);
        } else {
          expect((event as any)[attr]).toEqual(expectedValue, 
            `Förväntade att attributet ${attr} skulle vara ${expectedValue} men var ${(event as any)[attr]}`);
        }
      }
    }
    
    return this;
  }
  
  /**
   * Verifiera att inget event av en viss typ har publicerats
   */
  public expectNoEvent<E extends IDomainEvent>(
    eventType: new (...args: any[]) => E
  ): this {
    const events = this.getEventsByType(eventType);
    expect(events.length).toBe(0, `Förväntade inga events av typen ${eventType.name} men hittade ${events.length}`);
    return this;
  }
  
  /**
   * Verifiera att inget event med specifikt namn har publicerats
   */
  public expectNoEventWithName(eventName: string): this {
    const events = this.getEventsByName(eventName);
    expect(events.length).toBe(0, `Förväntade inga events med namn ${eventName} men hittade ${events.length}`);
    return this;
  }
  
  /**
   * Verifiera en specifik sekvens av event
   */
  public expectEventSequence(
    eventTypes: (new (...args: any[]) => IDomainEvent)[]
  ): this {
    const events = this.getEvents();
    expect(events.length).toBe(eventTypes.length, 
      `Förväntade ${eventTypes.length} events men hittade ${events.length}`);
    
    for (let i = 0; i < eventTypes.length; i++) {
      expect(events[i]).toBeInstanceOf(eventTypes[i], 
        `Event på position ${i} förväntades vara ${eventTypes[i].name} men var ${events[i].constructor.name}`);
    }
    
    return this;
  }
  
  /**
   * Verifiera en specifik sekvens av eventnamn
   */
  public expectEventNameSequence(eventNames: string[]): this {
    const events = this.getEvents();
    expect(events.length).toBe(eventNames.length, 
      `Förväntade ${eventNames.length} events men hittade ${events.length}`);
    
    for (let i = 0; i < eventNames.length; i++) {
      const eventName = EventNameHelper.getEventName(events[i]);
      expect(eventName).toBe(eventNames[i], 
        `Event på position ${i} förväntades ha namn ${eventNames[i]} men hade ${eventName}`);
    }
    
    return this;
  }
  
  /**
   * Verifiera att exakt ett event av en viss typ har publicerats
   */
  public expectExactlyOneEvent<E extends IDomainEvent>(
    eventType: new (...args: any[]) => E,
    attributeValidations?: Record<string, any>
  ): this {
    const events = this.getEventsByType(eventType);
    expect(events.length).toBe(1, 
      `Förväntade exakt ett event av typen ${eventType.name} men hittade ${events.length}`);
    
    if (attributeValidations && events.length === 1) {
      const event = events[0];
      
      for (const [attr, expectedValue] of Object.entries(attributeValidations)) {
        if (typeof expectedValue === 'function') {
          expect(expectedValue((event as any)[attr])).toBe(true);
        } else {
          expect((event as any)[attr]).toEqual(expectedValue);
        }
      }
    }
    
    return this;
  }
  
  /**
   * Verifiera att exakt ett event med specifikt namn har publicerats
   */
  public expectExactlyOneEventWithName(
    eventName: string,
    attributeValidations?: Record<string, any>
  ): this {
    const events = this.getEventsByName(eventName);
    expect(events.length).toBe(1, 
      `Förväntade exakt ett event med namn ${eventName} men hittade ${events.length}`);
    
    if (attributeValidations && events.length === 1) {
      const event = events[0];
      
      for (const [attr, expectedValue] of Object.entries(attributeValidations)) {
        if (typeof expectedValue === 'function') {
          expect(expectedValue((event as any)[attr])).toBe(true);
        } else {
          expect((event as any)[attr]).toEqual(expectedValue);
        }
      }
    }
    
    return this;
  }
  
  /**
   * Kör en operation på aggregatet och kontrollera att förväntade events publiceras
   */
  public executeAndExpectEvents(
    operation: (aggregate: T) => void,
    expectedEventTypes: (new (...args: any[]) => IDomainEvent)[],
    validate?: (events: IDomainEvent[]) => void
  ): this {
    // Rensa tidigare events
    this.clearEvents();
    
    // Utför operationen
    operation(this.aggregate);
    
    // Hämta publicerade events
    const events = this.getEvents();
    
    // Validera antal
    expect(events.length).toBe(expectedEventTypes.length);
    
    // Validera event-typer
    for (let i = 0; i < expectedEventTypes.length; i++) {
      expect(events[i]).toBeInstanceOf(expectedEventTypes[i]);
    }
    
    // Anropa valideringsfunktion om den finns
    if (validate) {
      validate(events);
    }
    
    return this;
  }
  
  /**
   * Kör en operation på aggregatet och kontrollera att förväntade eventnamn publiceras
   */
  public executeAndExpectEventNames(
    operation: (aggregate: T) => void,
    expectedEventNames: string[],
    validate?: (events: IDomainEvent[]) => void
  ): this {
    // Rensa tidigare events
    this.clearEvents();
    
    // Utför operationen
    operation(this.aggregate);
    
    // Hämta publicerade events
    const events = this.getEvents();
    
    // Validera antal
    expect(events.length).toBe(expectedEventNames.length);
    
    // Validera event-namn
    for (let i = 0; i < expectedEventNames.length; i++) {
      const eventName = EventNameHelper.getEventName(events[i]);
      expect(eventName).toBe(expectedEventNames[i]);
    }
    
    // Anropa valideringsfunktion om den finns
    if (validate) {
      validate(events);
    }
    
    return this;
  }
  
  /**
   * Testa att en metod kör invariant-validering
   */
  public testMethodInvariantValidation<K extends keyof T['props']>(
    method: keyof T,
    args: any[],
    propertyKey: K,
    invalidValue: any,
    expectedErrorPattern: string
  ): this {
    // Spara originalvärdet
    const originalValue = this.aggregate.props[propertyKey];
    
    // Sätt ogiltigt värde som bryter invarianten
    (this.aggregate as any).props[propertyKey] = invalidValue;
    
    // Anropa metoden
    const result = (this.aggregate[method] as Function)(...args);
    
    // Verifiera att anropet misslyckas pga bruten invariant
    expect(result.isErr()).toBe(true);
    expect(result.error).toContain(expectedErrorPattern);
    
    // Återställ originalvärdet
    (this.aggregate as any).props[propertyKey] = originalValue;
    
    return this;
  }
  
  /**
   * Testa invarianten direkt
   */
  public testInvariant<K extends keyof T['props']>(
    propertyKey: K, 
    invalidValue: any, 
    expectedErrorPattern: string
  ): this {
    // Spara originalvärdet
    const originalValue = this.aggregate.props[propertyKey];
    
    // Sätt ogiltigt värde
    (this.aggregate as any).props[propertyKey] = invalidValue;
    
    // Anropa validateInvariants via reflection
    // @ts-ignore - Åtkomst till privat metod för testning
    const result: Result<void, string> = this.aggregate.validateInvariants();
    
    // Verifiera att invarianten bryts med förväntat felmeddelande
    expect(result.isErr()).toBe(true);
    expect(result.error).toContain(expectedErrorPattern);
    
    // Återställ originalvärdet
    (this.aggregate as any).props[propertyKey] = originalValue;
    
    return this;
  }
}

/**
 * Skapar en AggregateTestHelper för ett aggregat
 * 
 * @param aggregate Aggregatet att testa
 * @returns En AggregateTestHelper-instans
 */
export function createAggregateTestHelper<T extends AggregateRoot<any>>(
  aggregate: T
): AggregateTestHelper<T> {
  return new AggregateTestHelper<T>(aggregate);
} 