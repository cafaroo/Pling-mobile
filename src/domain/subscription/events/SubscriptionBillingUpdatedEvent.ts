import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';
import { BillingAddress } from '../entities/SubscriptionTypes';

export interface BillingInfo {
  email: string;
  name: string;
  address: BillingAddress;
  vatNumber?: string;
}

export interface SubscriptionBillingUpdatedEventProps {
  subscriptionId: string | UniqueId;
  organizationId: string | UniqueId;
  billing: BillingInfo;
  updatedAt?: Date;
}

/**
 * SubscriptionBillingUpdatedEvent
 * 
 * Domänhändelse som publiceras när faktureringsinformationen för en prenumeration har uppdaterats.
 * Innehåller information om den nya faktureringsinformationen.
 */
export class SubscriptionBillingUpdatedEvent extends DomainEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly subscriptionId: UniqueId;
  public readonly organizationId: UniqueId;
  public readonly billing: BillingInfo;
  public readonly updatedAt: Date;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly eventType: string = 'SubscriptionBillingUpdatedEvent';

  /**
   * Skapar en ny SubscriptionBillingUpdatedEvent
   * 
   * @param props - Parameterobjekt med event-properties
   */
  constructor(props: SubscriptionBillingUpdatedEventProps) {
    // Konvertera till UniqueId om det behövs
    const subscriptionId = UniqueId.from(props.subscriptionId);
    const organizationId = UniqueId.from(props.organizationId);
    const updatedAt = props.updatedAt || new Date();
    
    // Skapa event med payload
    super({
      name: 'SubscriptionBillingUpdatedEvent',
      payload: {
        subscriptionId: subscriptionId.toString(),
        organizationId: organizationId.toString(),
        billing: props.billing,
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
    this.billing = props.billing;
    this.updatedAt = updatedAt;
  }
} 