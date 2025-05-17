/**
 * EventDataAdapter - Hjälpfunktioner för att extrahera data från event-objekt
 * 
 * Dessa hjälpfunktioner möjliggör flexibel åtkomst till event-data oavsett om 
 * datan finns direkt på event-objektet eller i dess payload-objekt.
 */

/**
 * Extraherar värde från ett event-objekt, oavsett om det finns direkt på event-objektet eller i payload
 * @param event Event-objektet att extrahera data från
 * @param fieldName Fältnamnet att hämta
 * @param defaultValue Standardvärde att returnera om fältet inte finns
 * @returns Värdet från event-objektet eller defaultValue om det inte finns
 */
export function getEventData<T, K extends string>(
  event: any,
  fieldName: K,
  defaultValue?: T
): T {
  // Försök hämta värdet i följande ordning:
  // 1. Direkt från event.payload.fieldName
  // 2. Direkt från event.fieldName
  // 3. Returnera defaultValue om inget av ovanstående fanns

  // Om event är null eller undefined, returnera defaultValue
  if (!event) return defaultValue as T;

  // Kontrollera om event.payload.fieldName finns
  if (event.payload && fieldName in event.payload) {
    return event.payload[fieldName] as T;
  }

  // Kontrollera om event.fieldName finns
  if (fieldName in event) {
    return event[fieldName] as T;
  }

  // Om vi inte hittade fältet, returnera defaultValue
  return defaultValue as T;
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