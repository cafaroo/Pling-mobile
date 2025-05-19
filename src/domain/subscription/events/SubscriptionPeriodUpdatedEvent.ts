import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';

export interface SubscriptionPeriodUpdatedEventProps {
  subscriptionId: string | UniqueId;
  organizationId: string | UniqueId;
  startDate: Date;
  endDate: Date;
  updatedAt?: Date;
}

/**
 * SubscriptionPeriodUpdatedEvent
 * 
 * Domänhändelse som publiceras när perioden för en prenumeration har uppdaterats.
 * Innehåller information om de nya start- och slutdatumen.
 */
export class SubscriptionPeriodUpdatedEvent extends DomainEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly subscriptionId: UniqueId;
  public readonly organizationId: UniqueId;
  public readonly startDate: Date;
  public readonly endDate: Date;
  public readonly updatedAt: Date;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly eventType: string = 'SubscriptionPeriodUpdatedEvent';

  /**
   * Skapar en ny SubscriptionPeriodUpdatedEvent
   * 
   * @param props - Parameterobjekt med event-properties
   */
  constructor(props: SubscriptionPeriodUpdatedEventProps) {
    // Konvertera till UniqueId om det behövs
    const subscriptionId = UniqueId.from(props.subscriptionId);
    const organizationId = UniqueId.from(props.organizationId);
    const updatedAt = props.updatedAt || new Date();
    
    // Validera att slutdatum är senare än startdatum
    if (props.startDate >= props.endDate) {
      throw new Error('Slutdatum måste vara senare än startdatum');
    }
    
    // Skapa event med payload
    super({
      name: 'SubscriptionPeriodUpdatedEvent',
      payload: {
        subscriptionId: subscriptionId.toString(),
        organizationId: organizationId.toString(),
        startDate: props.startDate.toISOString(),
        endDate: props.endDate.toISOString(),
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
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.updatedAt = updatedAt;
  }
} 