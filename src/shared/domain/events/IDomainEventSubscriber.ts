/**
 * IDomainEventSubscriber
 * 
 * Gränssnitt för prenumeranter av domänevents.
 * Implementationer av detta gränssnitt kan registrera sig hos IDomainEventPublisher
 * för att notifieras när relevanta events inträffar.
 */
export interface IDomainEventSubscriber<T> {
  /**
   * Hanterar ett mottaget domänevent
   * @param event Event att hantera
   */
  handleEvent(event: T): Promise<void>;
} 