import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';
import { SubscriptionUsage } from '../entities/SubscriptionTypes';

export interface SubscriptionUsageUpdatedEventProps {
  subscriptionId: string | UniqueId;
  organizationId: string | UniqueId;
  usage: SubscriptionUsage;
  updatedAt?: Date;
}

/**
 * SubscriptionUsageUpdatedEvent
 * 
 * Domänhändelse som publiceras när användningsinformation för en prenumeration har uppdaterats.
 * Innehåller information om den nya användningen.
 */
export class SubscriptionUsageUpdatedEvent extends DomainEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly subscriptionId: UniqueId;
  public readonly organizationId: UniqueId;
  public readonly usage: SubscriptionUsage;
  public readonly updatedAt: Date;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly eventType: string = 'SubscriptionUsageUpdatedEvent';

  /**
   * Skapar en ny SubscriptionUsageUpdatedEvent
   * 
   * @param props - Parameterobjekt med event-properties
   */
  constructor(props: SubscriptionUsageUpdatedEventProps) {
    // Konvertera till UniqueId om det behövs
    const subscriptionId = UniqueId.from(props.subscriptionId);
    const organizationId = UniqueId.from(props.organizationId);
    const updatedAt = props.updatedAt || new Date();
    
    // Skapa event med payload
    super({
      name: 'SubscriptionUsageUpdatedEvent',
      payload: {
        subscriptionId: subscriptionId.toString(),
        organizationId: organizationId.toString(),
        usage: props.usage,
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
    this.usage = props.usage;
    this.updatedAt = updatedAt;
  }
} 