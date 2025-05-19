import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';
import { SubscriptionStatus } from '../entities/SubscriptionTypes';

export interface SubscriptionStatusChangedEventProps {
  subscriptionId: string | UniqueId;
  organizationId: string | UniqueId;
  oldStatus: SubscriptionStatus;
  newStatus: SubscriptionStatus;
  changedAt?: Date;
}

/**
 * SubscriptionStatusChangedEvent
 * 
 * Domänhändelse som publiceras när status för en prenumeration har ändrats.
 * Innehåller information om den gamla och nya statusen.
 */
export class SubscriptionStatusChangedEvent extends DomainEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly subscriptionId: UniqueId;
  public readonly organizationId: UniqueId;
  public readonly oldStatus: SubscriptionStatus;
  public readonly newStatus: SubscriptionStatus;
  public readonly changedAt: Date;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly eventType: string = 'SubscriptionStatusChangedEvent';

  /**
   * Skapar en ny SubscriptionStatusChangedEvent
   * 
   * @param props - Parameterobjekt med event-properties
   */
  constructor(props: SubscriptionStatusChangedEventProps) {
    // Konvertera till UniqueId om det behövs
    const subscriptionId = UniqueId.from(props.subscriptionId);
    const organizationId = UniqueId.from(props.organizationId);
    const changedAt = props.changedAt || new Date();
    
    // Skapa event med payload
    super({
      name: 'SubscriptionStatusChangedEvent',
      payload: {
        subscriptionId: subscriptionId.toString(),
        organizationId: organizationId.toString(),
        oldStatus: props.oldStatus,
        newStatus: props.newStatus,
        changedAt: changedAt.toISOString()
      }
    });
    
    // Egenskaper för IDomainEvent
    this.eventId = new UniqueId();
    this.occurredAt = new Date();
    this.aggregateId = subscriptionId.toString();
    
    // Spara egenskaperna direkt på event-objektet för enklare åtkomst
    this.subscriptionId = subscriptionId;
    this.organizationId = organizationId;
    this.oldStatus = props.oldStatus;
    this.newStatus = props.newStatus;
    this.changedAt = changedAt;
  }
} 