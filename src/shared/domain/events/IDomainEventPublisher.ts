import { IDomainEvent } from './IDomainEvent';

/**
 * IDomainEventPublisher
 * 
 * Gränssnitt för publicering av domänevents.
 * Implementationer av detta gränssnitt ansvarar för att 
 * vidarebefordra domänevents till alla registrerade lyssnare.
 */
export interface IDomainEventPublisher {
  /**
   * Publicerar ett domänevent
   * @param event Händelsen som ska publiceras
   */
  publish(event: IDomainEvent): Promise<void>;
  
  /**
   * Publicerar flera domänevents
   * @param events Lista med händelser som ska publiceras
   */
  publishAll(events: IDomainEvent[]): Promise<void>;
} 