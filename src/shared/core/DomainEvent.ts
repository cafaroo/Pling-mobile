import { UniqueId } from './UniqueId';

export interface DomainEventData {
  name: string;
  payload: Record<string, any>;
}

export abstract class DomainEvent {
  public readonly dateTimeOccurred: Date;
  public readonly eventId: UniqueId;
  public readonly name: string;
  public readonly payload: Record<string, any>;

  constructor(data: DomainEventData) {
    this.dateTimeOccurred = new Date();
    this.eventId = new UniqueId();
    this.name = data.name;
    this.payload = data.payload;
  }
  
  /**
   * Utlöser händelsen
   * 
   * I produktion anropar denna metod EventBus
   * I tester patchar DomainEventTestHelper denna metod för att fånga händelser
   */
  dispatch(): void {
    // I produktionskod kopplas detta till EventBus
    // I testmiljö kan denna metod ersättas för att fånga händelser
    // Se DomainEventTestHelper för implementation
  }
} 