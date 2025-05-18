import { IDomainEvent } from '@/shared/domain/IDomainEvent';
import { AggregateRoot } from '@/shared/domain/AggregateRoot';
import { mockDomainEvents } from './mocks';
import { EventNameHelper } from './EventNameHelper';

/**
 * Hjälpfunktion för att validera att specifika events publiceras
 * 
 * @param aggregateFunction - Funktion som utför operationen på aggregatet
 * @param expectedEventTypes - Lista med event-klasser att förvänta
 * @param validate - Valideringsfunktion för event-innehåll
 */
export function validateEvents<T extends AggregateRoot<any>>(
  aggregateFunction: () => void,
  expectedEventTypes: (new (...args: any[]) => IDomainEvent)[],
  validate?: (events: IDomainEvent[]) => void
): void {
  // Rensa tidigare events
  mockDomainEvents.clearEvents();
  
  // Utför operationen
  aggregateFunction();
  
  // Hämta publicerade events
  const events = mockDomainEvents.getEvents();
  
  // Validera antal
  expect(events.length).toBe(expectedEventTypes.length);
  
  // Validera event-typer med mer flexibel matchning
  for (let i = 0; i < expectedEventTypes.length; i++) {
    const expectedEventName = expectedEventTypes[i].name.replace('Event', '');
    const actualEventType = EventNameHelper.getEventName(events[i]);
    
    // Kontrollera om event-typen matchar förväntat namn 
    // (t.ex. UserCreatedEvent eller MockUserCreatedEvent båda matchar "UserCreated")
    const eventTypeMatches = actualEventType.includes(expectedEventName);
    
    expect(eventTypeMatches).toBe(true);
  }
  
  // Anropa valideringsfunktion om den finns
  if (validate) {
    validate(events);
  }
}

/**
 * Hjälpfunktion för att validera att inga events publiceras
 * 
 * @param aggregateFunction - Funktion som utför operationen på aggregatet
 */
export function validateNoEvents(
  aggregateFunction: () => void
): void {
  // Rensa tidigare events
  mockDomainEvents.clearEvents();
  
  // Utför operationen
  aggregateFunction();
  
  // Kontrollera att inga events publicerades
  const events = mockDomainEvents.getEvents();
  expect(events.length).toBe(0);
}

/**
 * Hjälpfunktion för att validera ett specifikt event-attribut
 * 
 * @param events - Lista med domänevents
 * @param index - Index i event-listan att validera
 * @param eventType - Förväntad event-klass
 * @param attributeValidations - Objekt med attribut att validera och deras förväntade värden
 */
export function validateEventAttributes<T extends IDomainEvent>(
  events: IDomainEvent[],
  index: number,
  eventType: new (...args: any[]) => T,
  attributeValidations: Record<string, any>
): void {
  // Kontrollera att event-typen matchar förväntat namn istället för att använda instanceof
  const expectedEventName = eventType.name.replace('Event', '');
  const actualEventType = EventNameHelper.getEventName(events[index]);
  const eventTypeMatches = actualEventType.includes(expectedEventName);
  
  expect(eventTypeMatches).toBe(true);
  
  const event = events[index] as T;
  
  for (const [attr, expectedValue] of Object.entries(attributeValidations)) {
    // Försök att hitta attributet i både event-objektet och event.data
    let actualValue = (event as any)[attr];
    
    // Om attributet inte finns direkt på event-objektet, försök hitta det i data-objektet
    if (actualValue === undefined && (event as any).data) {
      actualValue = (event as any).data[attr];
    }
    
    if (typeof expectedValue === 'function') {
      expect(expectedValue(actualValue)).toBe(true);
    } else {
      expect(actualValue).toEqual(expectedValue);
    }
  }
}

/**
 * Hjälpfunktion för att validera aggregatinvarianter
 * 
 * @param factory - Funktion som skapar aggregatet med ogiltiga parametrar
 * @param errorPattern - Mönster som förväntas i felmeddelandet
 */
export function validateInvariant<T extends AggregateRoot<any>>(
  factory: () => any,
  errorPattern: string
): void {
  const result = factory();
  expect(result.isErr()).toBe(true);
  expect(result.error).toContain(errorPattern);
}

/**
 * Mock för händelselyssnare att användas i tester
 */
export function createEventListenerMock() {
  return {
    handleEvent: jest.fn()
  };
} 