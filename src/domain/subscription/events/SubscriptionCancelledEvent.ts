import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';

export interface SubscriptionCancelledEventProps {
  subscriptionId: string | UniqueId;
  organizationId: string | UniqueId;
  atPeriodEnd: boolean;
  reason?: string;
  cancelledAt?: Date;
}

/**
 * SubscriptionCancelledEvent
 * 
 * Domänhändelse som publiceras när en prenumeration har avbrutits.
 * Innehåller information om avbokningen, inklusive om den träder i kraft vid periodens slut.
 */
export class SubscriptionCancelledEvent extends DomainEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly subscriptionId: UniqueId;
  public readonly organizationId: UniqueId;
  public readonly atPeriodEnd: boolean;
  public readonly reason: string;
  public readonly cancelledAt: Date;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly eventType: string = 'SubscriptionCancelledEvent';

  /**
   * Skapar en ny SubscriptionCancelledEvent
   * 
   * @param props - Parameterobjekt med event-properties
   */
  constructor(props: SubscriptionCancelledEventProps) {
    // Konvertera till UniqueId om det behövs
    const subscriptionId = UniqueId.from(props.subscriptionId);
    const organizationId = UniqueId.from(props.organizationId);
    const cancelledAt = props.cancelledAt || new Date();
    const reason = props.reason || '';
    
    // Skapa event med payload
    super({
      name: 'SubscriptionCancelledEvent',
      payload: {
        subscriptionId: subscriptionId.toString(),
        organizationId: organizationId.toString(),
        atPeriodEnd: props.atPeriodEnd,
        reason: reason,
        cancelledAt: cancelledAt.toISOString()
      }
    });
    
    // Egenskaper för IDomainEvent
    this.eventId = new UniqueId();
    this.occurredAt = new Date();
    this.aggregateId = subscriptionId.toString();
    
    // Spara egenskaperna direkt på event-objektet för enklare åtkomst
    this.subscriptionId = subscriptionId;
    this.organizationId = organizationId;
    this.atPeriodEnd = props.atPeriodEnd;
    this.reason = reason;
    this.cancelledAt = cancelledAt;
  }
} 