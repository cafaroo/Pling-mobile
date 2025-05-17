import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';

/**
 * EventNameHelper
 * 
 * Hjälpklass för att hantera olika naming-konventioner i domänevents.
 * Projektet använder tre olika egenskaper för eventnamn:
 * - eventType (enligt IDomainEvent interface)
 * - eventName (används i flera tester)
 * - name (används i vissa implementationer)
 * 
 * Denna klass hjälper till att normalisera och extrahera eventnamn
 * oavsett vilken konvention som används.
 */
export class EventNameHelper {
  /**
   * Hämtar eventnamnet från ett event oavsett vilken namnkonvention som används
   * 
   * @param event Eventet att extrahera namnet från
   * @returns Eventnamnet
   */
  static getEventName(event: IDomainEvent | any): string {
    // Försök hitta eventnamnet i följande prioritetsordning:
    // 1. eventType (enligt IDomainEvent)
    // 2. eventName (vanlig i tester)
    // 3. name (används i vissa implementationer)
    // 4. Klassnamnet som fallback
    
    if (event.eventType) {
      return event.eventType;
    }
    
    if (event.eventName) {
      return event.eventName;
    }
    
    if (event.name) {
      return event.name;
    }
    
    // Fallback: Använd konstruktorns namn (klassnamnet)
    if (event.constructor && event.constructor.name) {
      return event.constructor.name;
    }
    
    // Om inget annat fungerar
    return 'UnknownEvent';
  }
  
  /**
   * Lägger till standardegenskaper till ett event för bakåtkompatibilitet
   * 
   * @param event Eventet att utöka
   * @returns Samma event med ytterligare kompatibilitetsegenskaper
   */
  static makeEventNameCompatible(event: IDomainEvent | any): IDomainEvent | any {
    const originalEvent = event;
    const eventName = this.getEventName(event);
    
    // Endast definiera egenskaperna om de inte redan finns
    if (!originalEvent.eventName && eventName) {
      Object.defineProperty(originalEvent, 'eventName', {
        get: function() { return eventName; },
        configurable: true,
        enumerable: true
      });
    }
    
    if (!originalEvent.name && eventName) {
      Object.defineProperty(originalEvent, 'name', {
        get: function() { return eventName; },
        configurable: true,
        enumerable: true
      });
    }
    
    if (!originalEvent.eventType && eventName) {
      Object.defineProperty(originalEvent, 'eventType', {
        get: function() { return eventName; },
        configurable: true,
        enumerable: true
      });
    }
    
    return originalEvent;
  }
  
  /**
   * Jämför två event för att se om de matchar baserat på deras eventnamn
   * 
   * @param event Eventet att kontrollera
   * @param eventName Eventnamnet att jämföra med
   * @returns Sant om eventi matchar det angivna namnet
   */
  static eventNameMatches(event: IDomainEvent | any, eventName: string): boolean {
    const actualEventName = this.getEventName(event);
    return actualEventName === eventName;
  }
} 