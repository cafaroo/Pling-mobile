import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';

/**
 * Mock för domänevents för testning av aggregat och event-publicering
 */
class MockDomainEvents {
  private events: IDomainEvent[] = [];
  
  /**
   * Registrerar ett event för testning
   * 
   * @param event - Domäneventet som ska registreras
   */
  public registerEvent(event: IDomainEvent): void {
    this.events.push(event);
  }
  
  /**
   * Hämtar alla registrerade events
   * 
   * @returns Array med alla registrerade events
   */
  public getEvents(): IDomainEvent[] {
    return [...this.events];
  }
  
  /**
   * Rensar alla registrerade events
   */
  public clearEvents(): void {
    this.events = [];
  }
  
  /**
   * Hämtar alla events av en specifik typ
   * 
   * @param eventType - Klass för event-typen som ska filtreras
   * @returns Array med matchande events
   */
  public getEventsByType<T extends IDomainEvent>(
    eventType: new (...args: any[]) => T
  ): T[] {
    return this.events.filter(event => event instanceof eventType) as T[];
  }
  
  /**
   * Kontrollerar om ett specifikt event har publicerats
   * 
   * @param eventType - Klass för event-typen som ska sökas
   * @returns true om minst ett sådant event har publicerats
   */
  public hasEventOfType<T extends IDomainEvent>(
    eventType: new (...args: any[]) => T
  ): boolean {
    return this.getEventsByType(eventType).length > 0;
  }
}

/**
 * Exportera en singleton-instans
 */
export const mockDomainEvents = new MockDomainEvents(); 