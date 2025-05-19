import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';
import { SubscriptionStatus } from '../entities/SubscriptionTypes';

export interface SubscriptionCreatedEventProps {
  subscriptionId: string | UniqueId;
  organizationId: string | UniqueId;
  planId: string | UniqueId;
  status: SubscriptionStatus;
  startDate?: Date;
  endDate?: Date;
  createdAt?: Date;
}

/**
 * SubscriptionCreatedEvent
 * 
 * Domänhändelse som publiceras när en ny prenumeration har skapats.
 * Innehåller grundläggande information om den nya prenumerationen.
 */
export class SubscriptionCreatedEvent extends DomainEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly subscriptionId: UniqueId;
  public readonly organizationId: UniqueId;
  public readonly planId: UniqueId;
  public readonly status: SubscriptionStatus;
  public readonly startDate: Date;
  public readonly endDate: Date;
  public readonly createdAt: Date;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly eventType: string = 'SubscriptionCreatedEvent';

  /**
   * Skapar en ny SubscriptionCreatedEvent
   * 
   * @param props - Parameterobjekt med event-properties
   */
  constructor(props: SubscriptionCreatedEventProps) {
    // Konvertera till UniqueId om det behövs
    const subscriptionId = UniqueId.from(props.subscriptionId);
    const organizationId = UniqueId.from(props.organizationId);
    const planId = UniqueId.from(props.planId);
    const createdAt = props.createdAt || new Date();
    const startDate = props.startDate || new Date();
    const endDate = props.endDate || new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // Standard 30 dagar
    
    // Skapa event med payload
    super({
      name: 'SubscriptionCreatedEvent',
      payload: {
        subscriptionId: subscriptionId.toString(),
        organizationId: organizationId.toString(),
        planId: planId.toString(),
        status: props.status,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        createdAt: createdAt.toISOString()
      }
    });
    
    // Egenskaper för IDomainEvent
    this.eventId = new UniqueId();
    this.occurredAt = new Date();
    this.aggregateId = subscriptionId.toString();
    
    // Spara egenskaperna direkt på event-objektet för enklare åtkomst
    this.subscriptionId = subscriptionId;
    this.organizationId = organizationId;
    this.planId = planId;
    this.status = props.status;
    this.startDate = startDate;
    this.endDate = endDate;
    this.createdAt = createdAt;
  }
} 