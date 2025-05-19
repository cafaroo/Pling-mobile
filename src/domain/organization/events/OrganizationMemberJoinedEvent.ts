import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { OrganizationRole } from '../value-objects/OrganizationRole';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';

export interface OrganizationMemberJoinedEventProps {
  organizationId: string | UniqueId;
  userId: string | UniqueId;
  role: OrganizationRole | string;
  joinedAt?: Date;
}

/**
 * OrganizationMemberJoinedEvent
 * 
 * Domänhändelse som publiceras när en medlem går med i en organisation.
 */
export class OrganizationMemberJoinedEvent extends DomainEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly organizationId: UniqueId;
  public readonly userId: UniqueId;
  public readonly role: string;
  public readonly joinedAt: Date;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly eventType: string = 'OrganizationMemberJoinedEvent';

  /**
   * Skapar en ny OrganizationMemberJoinedEvent
   * 
   * @param props - Parameterobjekt med event-properties
   */
  constructor(props: OrganizationMemberJoinedEventProps) {
    // Konvertera till UniqueId om det behövs
    const organizationId = UniqueId.from(props.organizationId);
    const userId = UniqueId.from(props.userId);
    
    // Konvertera role till string om det är ett OrganizationRole-objekt
    const role = typeof props.role === 'string' 
      ? props.role 
      : props.role.toString();
    
    // Skapa event med payload
    super({
      name: 'OrganizationMemberJoinedEvent',
      payload: {
        organizationId: organizationId.toString(),
        userId: userId.toString(),
        role,
        joinedAt: (props.joinedAt || new Date()).toISOString()
      }
    });
    
    // Egenskaper för IDomainEvent
    this.eventId = new UniqueId();
    this.occurredAt = new Date();
    this.aggregateId = organizationId.toString();
    
    // Spara properties direkt på event-objektet för enklare åtkomst
    this.organizationId = organizationId;
    this.userId = userId;
    this.role = role;
    this.joinedAt = props.joinedAt || new Date();
  }
} 