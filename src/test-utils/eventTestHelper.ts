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
  
  // Logginfo för debugging - hantera undefined-värden
  try {
    console.log('Expected events:', 
      expectedEventTypes ? expectedEventTypes.map(e => e?.name || 'UnknownEvent') : 'undefined');
    console.log('Actual events:', 
      events ? events.map(e => EventNameHelper.getEventName(e) || 'UnknownEvent') : 'no events');
  } catch (error) {
    console.error('Fel vid loggning av events:', error);
  }
  
  // Säkerhetscheck för undefined-värden
  if (!expectedEventTypes || !Array.isArray(expectedEventTypes)) {
    console.error('expectedEventTypes är inte en array:', expectedEventTypes);
    expect(events.length).toBe(0, 'Inga förväntade events specificerade, men events publicerades');
    return;
  }
  
  // För varje förväntat event, hitta matchande event i den publicerade listan
  const matchedEvents = [];
  
  for (let i = 0; i < expectedEventTypes.length; i++) {
    if (!expectedEventTypes[i]) continue; // Hoppa över undefined event-typer
    
    // Sätt namnet på ett robust sätt
    const expectedEventType = expectedEventTypes[i];
    let expectedEventName = 'UnknownEvent';
    
    try {
      if (typeof expectedEventType === 'function') {
        expectedEventName = expectedEventType.name || 'UnknownEvent';
      } else if (typeof expectedEventType === 'string') {
        expectedEventName = expectedEventType;
      } else if (expectedEventType && typeof expectedEventType === 'object') {
        expectedEventName = expectedEventType.name || 'UnknownEvent';
      }
    } catch (error) {
      console.error('Fel vid hämtning av eventnamn:', error);
    }
    
    expectedEventName = expectedEventName.replace('Event', '');
    
    // Sök efter matchande event bland de publicerade
    const matchingEvent = events.find(event => {
      if (!event) return false;
      
      try {
        const actualEventType = EventNameHelper.getEventName(event);
        return actualEventType.includes(expectedEventName) || 
               // Hantera mockade versioner också (t.ex. MockUserStatusChangedEvent)
               actualEventType.includes(`Mock${expectedEventName}`);
      } catch (error) {
        console.error('Fel vid matchning av event:', error);
        return false;
      }
    });
    
    if (matchingEvent) {
      matchedEvents.push(matchingEvent);
    }
  }
  
  // För testfallet ska vi fortsätta rapportera misslyckanden, men
  // vi gör det med en mer informativ felmeddelandeteknik
  if (matchedEvents.length !== expectedEventTypes.length) {
    try {
      const found = events.map(e => EventNameHelper.getEventName(e) || 'UnknownEvent').join(', ');
      const expected = expectedEventTypes
        .map(e => {
          try {
            return (e?.name || 'UnknownEvent');
          } catch (error) {
            return 'ErrorEvent';
          }
        })
        .join(', ');
      
      // Detta fel kommer att fångas av Jest och rapporteras som ett testfel
      expect(matchedEvents.length).toBe(
        expectedEventTypes.length,
        `Förväntade ${expectedEventTypes.length} events men matchade ${matchedEvents.length}. ` +
        `Förväntade: [${expected}]. Hittade: [${found}]`
      );
    } catch (error) {
      console.error('Fel vid jämförelse av events:', error);
      // Fallback felmeddelande
      expect(matchedEvents.length).toBe(
        expectedEventTypes.length,
        `Fel antal matchade events. Förväntade: ${expectedEventTypes.length}, Hittade: ${matchedEvents.length}`
      );
    }
  }
  
  // Anropa valideringsfunktion med de matchade eventen om den finns
  if (validate && matchedEvents.length > 0) {
    validate(matchedEvents);
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
  eventType: new (...args: any[]) => T | string | any,
  attributeValidations: Record<string, any>
): void {
  // Säkerhetskontroller för alla parametrar
  if (!events) {
    console.warn('events är null/undefined');
    expect(events).toBeDefined('events är null/undefined');
    return;
  }
  
  if (!Array.isArray(events)) {
    console.warn('events är inte en array');
    expect(Array.isArray(events)).toBe(true, 'events är inte en array');
    return;
  }
  
  // Om inga events finns eller index är utanför gränsen
  if (events.length <= index) {
    console.warn(`Kunde inte validera attribut: Inget event på index ${index}`);
    // Rapportera testfel med meningsfull information
    expect(events.length).toBeGreaterThan(index, 
      `Kunde inte validera attribut: Inget event på index ${index}`);
    return;
  }
  
  // Hantera eventType-värdet robust
  let expectedEventName = "UnknownEvent";
  try {
    if (typeof eventType === 'function') {
      expectedEventName = eventType.name || "UnknownEvent";
    } else if (typeof eventType === 'string') {
      expectedEventName = eventType;
    } else if (eventType && typeof eventType === 'object') {
      expectedEventName = eventType.name || "UnknownEvent";
    }
  } catch (error) {
    console.error('Fel vid hämtning av eventType.name:', error);
  }
  
  expectedEventName = expectedEventName.replace('Event', '');
  
  // Hämta event-typ från eventet
  let actualEventType = "UnknownEvent";
  try {
    actualEventType = EventNameHelper.getEventName(events[index]);
  } catch (error) {
    console.error('Fel vid hämtning av eventnamn:', error);
  }
  
  // Tillåt både exakt matchning och matchning med "Mock"-prefix
  const eventTypeMatches = 
    actualEventType.includes(expectedEventName) ||
    actualEventType.includes(`Mock${expectedEventName}`) ||
    expectedEventName.includes(actualEventType.replace('Mock', ''));
  
  // Om event-typerna inte matchar, logga och rapportera fel
  if (!eventTypeMatches) {
    console.warn(`Event-typ matchar inte: ${actualEventType} vs förväntat ${expectedEventName}`);
    expect(eventTypeMatches).toBe(true,
      `Event-typ matchar inte: ${actualEventType} vs förväntat ${expectedEventName}`);
    return;
  }
  
  const event = events[index] as T;
  
  if (!attributeValidations) {
    // Om inga attribut ska valideras, returnera framgång
    return;
  }
  
  // Validera attributen med robust felhantering
  for (const [attr, expectedValue] of Object.entries(attributeValidations)) {
    try {
      // Försök att hitta attributet i både event-objektet och event.data
      let actualValue = (event as any)[attr];
      
      // Om attributet inte finns direkt på event-objektet, försök hitta det i data-objektet
      if (actualValue === undefined && (event as any).data) {
        actualValue = (event as any).data[attr];
      }
      
      // Om fortfarande undefined, försök i payload som används av vissa mockade events
      if (actualValue === undefined && (event as any).payload) {
        actualValue = (event as any).payload[attr];
      }
      
      // Om fortfarande undefined, leta i getEventData() om det finns
      if (actualValue === undefined && typeof (event as any).getEventData === 'function') {
        try {
          const eventData = (event as any).getEventData();
          if (eventData && typeof eventData === 'object') {
            actualValue = eventData[attr];
          }
        } catch (error) {
          console.error('Fel vid anrop av getEventData:', error);
        }
      }
      
      if (typeof expectedValue === 'function') {
        expect(expectedValue(actualValue)).toBe(true, 
          `Attributet '${attr}' validerades inte av den angivna funktionen`);
      } else {
        expect(actualValue).toEqual(expectedValue,
          `Attributet '${attr}' hade värdet ${JSON.stringify(actualValue)} men förväntat värde var ${JSON.stringify(expectedValue)}`);
      }
    } catch (error) {
      console.error(`Fel vid validering av attribut ${attr}:`, error);
      // Rapportera felet för Jest
      expect(true).toBe(false, `Fel vid validering av attribut ${attr}: ${error}`);
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