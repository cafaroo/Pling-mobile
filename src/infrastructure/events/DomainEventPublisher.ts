import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';
import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';
import { IDomainEventSubscriber } from '@/shared/domain/events/IDomainEventSubscriber';
import { Logger } from '@/infrastructure/logger/Logger';

/**
 * DomainEventPublisher
 * 
 * Implementerar IDomainEventPublisher för att publicera domänevents till registrerade prenumeranter.
 * Använder en enkel händelsedrivna arkitektur (pub-sub) för att hantera domänevents.
 */
export class DomainEventPublisher implements IDomainEventPublisher {
  private subscribers: Map<string, IDomainEventSubscriber<IDomainEvent>[]> = new Map();
  
  constructor(private logger: Logger) {}
  
  /**
   * Registrerar en prenumerant för en specifik eventtyp
   * @param eventType Typ av event att prenumerera på
   * @param subscriber Prenumerant som ska notifieras
   */
  public register(eventType: string, subscriber: IDomainEventSubscriber<IDomainEvent>): void {
    const currentSubscribers = this.subscribers.get(eventType) || [];
    this.subscribers.set(eventType, [...currentSubscribers, subscriber]);
    
    this.logger.debug(`DomainEventPublisher: Registrerad prenumerant för ${eventType}`);
  }
  
  /**
   * Avregistrerar en prenumerant för en specifik eventtyp
   * @param eventType Typ av event att avregistrera från
   * @param subscriber Prenumerant som ska avregistreras
   */
  public unregister(eventType: string, subscriber: IDomainEventSubscriber<IDomainEvent>): void {
    const currentSubscribers = this.subscribers.get(eventType) || [];
    this.subscribers.set(
      eventType, 
      currentSubscribers.filter(s => s !== subscriber)
    );
    
    this.logger.debug(`DomainEventPublisher: Avregistrerad prenumerant för ${eventType}`);
  }
  
  /**
   * Publicerar ett domänevent till alla registrerade prenumeranter
   * @param event Event att publicera
   */
  public async publish(event: IDomainEvent): Promise<void> {
    const eventType = event.eventType;
    const eventSubscribers = this.subscribers.get(eventType) || [];
    
    this.logger.debug(`DomainEventPublisher: Publicerar event ${eventType} till ${eventSubscribers.length} prenumeranter`);
    
    const publishPromises = eventSubscribers.map(subscriber => {
      try {
        return subscriber.handleEvent(event);
      } catch (error) {
        this.logger.error(`Fel vid hantering av event ${eventType}:`, error);
        return Promise.resolve();
      }
    });
    
    await Promise.all(publishPromises);
  }
  
  /**
   * Publicerar flera domänevents till alla registrerade prenumeranter
   * @param events Lista med events att publicera
   */
  public async publishAll(events: IDomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
} 