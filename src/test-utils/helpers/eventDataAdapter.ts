/**
 * EventDataAdapter - Hjälpfunktioner för att extrahera data från event-objekt
 * 
 * Dessa hjälpfunktioner möjliggör flexibel åtkomst till event-data oavsett om 
 * datan finns direkt på event-objektet eller i dess payload-objekt.
 */

/**
 * Hjälpfunktioner för att hantera eventobjekt i tester
 * 
 * Dessa funktioner används för att extrahera data från event på ett standardiserat
 * sätt, oavsett om eventet använder den nya eller gamla eventdatastrukturen.
 */

/**
 * Hämtar data från eventobjekt oberoende av struktur
 * 
 * Hanterar både nya events med data.fieldName och äldre med payload.fieldName
 * Stödjer även events med direkta egenskaper
 */
export function getEventData(event: any, fieldName: string): any {
  if (!event) {
    return undefined;
  }
  
  // Specialhantering för ID-objekt
  if (fieldName.includes('Id') && event[fieldName] && typeof event[fieldName] === 'object' && event[fieldName].id) {
    return event[fieldName].id;
  }
  
  // Kontrollera direkta egenskaper först
  if (event[fieldName] !== undefined) {
    return event[fieldName];
  }
  
  // Kontrollera data-objektet (nyare struktur)
  if (event.data && event.data[fieldName] !== undefined) {
    // Specialhantering för ID-objekt inom data
    if (fieldName.includes('Id') && typeof event.data[fieldName] === 'object' && event.data[fieldName].id) {
      return event.data[fieldName].id;
    }
    return event.data[fieldName];
  }
  
  // Kontrollera payload-objektet (äldre struktur)
  if (event.payload && event.payload[fieldName] !== undefined) {
    // Specialhantering för ID-objekt inom payload
    if (fieldName.includes('Id') && typeof event.payload[fieldName] === 'object' && event.payload[fieldName].id) {
      return event.payload[fieldName].id;
    }
    return event.payload[fieldName];
  }
  
  return undefined;
}

/**
 * Omvandlar ett eventobjekt till ett standardiserat format
 * 
 * Används för att konvertera eventobjekt till ett konsekvent format som kan användas i tester
 */
export function normalizeEvent(event: any): any {
  if (!event) {
    return null;
  }
  
  const normalized = {
    eventType: event.eventType || event.name || 'unknown',
    data: {},
    id: event.eventId || event.id || 'unknown-id',
    timestamp: event.occurredAt || event.timestamp || new Date()
  };
  
  // Kopiera data från antingen data eller payload
  if (event.data) {
    normalized.data = { ...event.data };
  } else if (event.payload) {
    normalized.data = { ...event.payload };
  }
  
  return normalized;
}

/**
 * Kontrollerar om ett event innehåller ett specifikt fält, oavsett om det finns direkt på event-objektet eller i payload
 * @param event Event-objektet att kontrollera
 * @param fieldName Fältnamnet att kontrollera
 * @returns true om fältet finns, annars false
 */
export function hasEventData(
  event: any,
  fieldName: string
): boolean {
  // Om event är null eller undefined, returnera false
  if (!event) return false;

  // Kontrollera om event.payload.fieldName finns
  if (event.payload && fieldName in event.payload) {
    return true;
  }

  // Kontrollera om event.fieldName finns
  if (fieldName in event) {
    return true;
  }

  return false;
}

/**
 * Extraherar hela payload-objektet från ett event, oavsett om payload finns som eget objekt eller om event själv är payload
 * @param event Event-objektet att extrahera payload från
 * @returns Payload-objektet från event-objektet
 */
export function getEventPayload<T = Record<string, any>>(
  event: any
): T {
  // Om event.payload finns, returnera det
  if (event.payload) {
    return event.payload as T;
  }

  // Annars, skapa ett payload-objekt från alla fält på event som inte är "eventType", "aggregateId", etc.
  const commonEventFields = [
    'eventType', 'eventName', 'dateTimeOccurred', 'occurredAt', 'aggregateId', 
    'id', 'timestamp', 'addDomainEvent', 'clearEvents', 'getDomainEvents'
  ];

  const payload: Record<string, any> = {};
  
  // Kopiera alla fält från event som inte är vanliga event-fält till payload
  Object.keys(event).forEach(key => {
    if (!commonEventFields.includes(key)) {
      payload[key] = event[key];
    }
  });

  return payload as T;
}

/**
 * Hjälpfunktion för att skapa event-matchers i tester
 * Returnerar en funktion som kan användas med expect(...).toEqual(...)
 * 
 * @example
 * expect(event).toEqual(eventWithData({
 *   userId: 'user-123',
 *   role: 'admin'
 * }));
 */
export function eventWithData(expectedData: Record<string, any>) {
  return expect.objectContaining({
    ...expectedData,
    payload: expect.objectContaining(expectedData)
  });
} 