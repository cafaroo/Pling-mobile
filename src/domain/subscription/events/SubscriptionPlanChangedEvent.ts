import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';

export interface SubscriptionPlanChangedEventProps {
  subscriptionId: string | UniqueId;
  organizationId: string | UniqueId;
  oldPlanId: string | UniqueId;
  newPlanId: string | UniqueId;
  changedAt?: Date;
}

/**
 * SubscriptionPlanChangedEvent
 * 
 * Domänhändelse som publiceras när prenumerationsplanen för en organisation har ändrats.
 * Innehåller information om den gamla och nya planen.
 */
export class SubscriptionPlanChangedEvent extends DomainEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly subscriptionId: UniqueId;
  public readonly organizationId: UniqueId;
  public readonly oldPlanId: UniqueId;
  public readonly newPlanId: UniqueId;
  public readonly changedAt: Date;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly eventType: string = 'SubscriptionPlanChangedEvent';

  /**
   * Skapar en ny SubscriptionPlanChangedEvent
   * 
   * @param props - Parameterobjekt med event-properties
   */
  constructor(props: SubscriptionPlanChangedEventProps) {
    // Konvertera till UniqueId om det behövs
    const subscriptionId = UniqueId.from(props.subscriptionId);
    const organizationId = UniqueId.from(props.organizationId);
    const oldPlanId = UniqueId.from(props.oldPlanId);
    const newPlanId = UniqueId.from(props.newPlanId);
    const changedAt = props.changedAt || new Date();
    
    // Skapa event med payload
    super({
      name: 'SubscriptionPlanChangedEvent',
      payload: {
        subscriptionId: subscriptionId.toString(),
        organizationId: organizationId.toString(),
        oldPlanId: oldPlanId.toString(),
        newPlanId: newPlanId.toString(),
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
    this.oldPlanId = oldPlanId;
    this.newPlanId = newPlanId;
    this.changedAt = changedAt;
  }
} 