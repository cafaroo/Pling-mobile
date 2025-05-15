import { UniqueId } from '../../core/UniqueId';

/**
 * IDomainEvent
 * 
 * Interface för alla domänevents enligt DDD-principer.
 * Domänevents representerar fakta om vad som hänt i domänen.
 */
export interface IDomainEvent {
  /**
   * Unikt ID för eventet
   */
  eventId: UniqueId;
  
  /**
   * Tidpunkten då eventet inträffade
   */
  occurredAt: Date;
  
  /**
   * Typ av event, används för att identifiera eventet
   */
  eventType: string;
  
  /**
   * Aggregat-ID som eventet relaterar till
   */
  aggregateId?: string;
} 