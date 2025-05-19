import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';

export interface SubscriptionPaymentMethodUpdatedEventProps {
  subscriptionId: string | UniqueId;
  organizationId: string | UniqueId;
  paymentMethodId: string;
  updatedAt?: Date;
}

/**
 * SubscriptionPaymentMethodUpdatedEvent
 * 
 * Domänhändelse som publiceras när betalningsmetoden för en prenumeration har uppdaterats.
 * Innehåller information om den nya betalningsmetoden.
 */
export class SubscriptionPaymentMethodUpdatedEvent extends DomainEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly subscriptionId: UniqueId;
  public readonly organizationId: UniqueId;
  public readonly paymentMethodId: string;
  public readonly updatedAt: Date;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly eventType: string = 'SubscriptionPaymentMethodUpdatedEvent';

  /**
   * Skapar en ny SubscriptionPaymentMethodUpdatedEvent
   * 
   * @param props - Parameterobjekt med event-properties
   */
  constructor(props: SubscriptionPaymentMethodUpdatedEventProps) {
    // Konvertera till UniqueId om det behövs
    const subscriptionId = UniqueId.from(props.subscriptionId);
    const organizationId = UniqueId.from(props.organizationId);
    const updatedAt = props.updatedAt || new Date();
    
    // Skapa event med payload
    super({
      name: 'SubscriptionPaymentMethodUpdatedEvent',
      payload: {
        subscriptionId: subscriptionId.toString(),
        organizationId: organizationId.toString(),
        paymentMethodId: props.paymentMethodId,
        updatedAt: updatedAt.toISOString()
      }
    });
    
    // Egenskaper för IDomainEvent
    this.eventId = new UniqueId();
    this.occurredAt = new Date();
    this.aggregateId = subscriptionId.toString();
    
    // Spara egenskaperna direkt på event-objektet för enklare åtkomst
    this.subscriptionId = subscriptionId;
    this.organizationId = organizationId;
    this.paymentMethodId = props.paymentMethodId;
    this.updatedAt = updatedAt;
  }
} 