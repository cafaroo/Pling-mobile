import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';

export interface OrganizationMemberLeftEventProps {
  organizationId: string | UniqueId;
  userId: string | UniqueId;
  removedAt?: Date;
}

/**
 * OrganizationMemberLeftEvent
 * 
 * Domänhändelse som publiceras när en medlem lämnar en organisation.
 */
export class OrganizationMemberLeftEvent extends DomainEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly organizationId: UniqueId;
  public readonly userId: UniqueId;
  public readonly removedAt: Date;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly eventType: string = 'OrganizationMemberLeftEvent';

  /**
   * Skapar en ny OrganizationMemberLeftEvent
   * 
   * @param props - Parameterobjekt med event-properties
   */
  constructor(props: OrganizationMemberLeftEventProps) {
    // Konvertera till UniqueId om det behövs
    const organizationId = UniqueId.from(props.organizationId);
    const userId = UniqueId.from(props.userId);
    const removedAt = props.removedAt || new Date();
    
    // Skapa event med payload
    super({
      name: 'OrganizationMemberLeftEvent',
      payload: {
        organizationId: organizationId.toString(),
        userId: userId.toString(),
        removedAt: removedAt.toISOString()
      }
    });
    
    // Egenskaper för IDomainEvent
    this.eventId = new UniqueId();
    this.occurredAt = new Date();
    this.aggregateId = organizationId.toString();
    
    // Spara properties direkt på event-objektet för enklare åtkomst
    this.organizationId = organizationId;
    this.userId = userId;
    this.removedAt = removedAt;
  }
} 