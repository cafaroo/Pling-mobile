import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';

export interface OrganizationCreatedEventProps {
  organizationId: string | UniqueId;
  name: string;
  ownerId: string | UniqueId;
  createdAt?: Date;
}

/**
 * Domänhändelse som publiceras när en organisation skapas
 */
export class OrganizationCreatedEvent extends DomainEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly name: string;
  public readonly ownerId: UniqueId;
  public readonly organizationId: UniqueId;
  public readonly createdAt: Date;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly eventType: string = 'OrganizationCreatedEvent';

  /**
   * Skapar en ny OrganizationCreatedEvent
   * 
   * @param props - Parameterobjekt med event-properties
   */
  constructor(props: OrganizationCreatedEventProps) {
    // Konvertera till UniqueId om det behövs
    const organizationId = UniqueId.from(props.organizationId);
    const ownerId = UniqueId.from(props.ownerId);
    const createdAt = props.createdAt || new Date();
    
    // Skapa event med payload
    super({
      name: 'OrganizationCreatedEvent',
      payload: {
        organizationId: organizationId.toString(),
        name: props.name,
        ownerId: ownerId.toString(),
        createdAt: createdAt.toISOString()
      }
    });
    
    // Egenskaper för IDomainEvent
    this.eventId = new UniqueId();
    this.occurredAt = new Date();
    this.aggregateId = organizationId.toString();
    
    // Spara egenskaperna direkt på event-objektet för enklare åtkomst
    this.name = props.name;
    this.ownerId = ownerId;
    this.organizationId = organizationId;
    this.createdAt = createdAt;
  }
} 