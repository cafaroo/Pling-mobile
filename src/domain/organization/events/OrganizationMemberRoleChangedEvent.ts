import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { OrganizationRole } from '../value-objects/OrganizationRole';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';

export interface OrganizationMemberRoleChangedEventProps {
  organizationId: string | UniqueId;
  userId: string | UniqueId;
  oldRole: OrganizationRole | string;
  newRole: OrganizationRole | string;
  changedAt?: Date;
}

/**
 * OrganizationMemberRoleChangedEvent
 * 
 * Domänhändelse som publiceras när en medlems roll ändras i en organisation.
 */
export class OrganizationMemberRoleChangedEvent extends DomainEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly organizationId: UniqueId;
  public readonly userId: UniqueId;
  public readonly oldRole: string;
  public readonly newRole: string;
  public readonly changedAt: Date;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly eventType: string = 'OrganizationMemberRoleChangedEvent';

  /**
   * Skapar en ny OrganizationMemberRoleChangedEvent
   * 
   * @param props - Parameterobjekt med event-properties
   */
  constructor(props: OrganizationMemberRoleChangedEventProps) {
    // Konvertera till UniqueId om det behövs
    const organizationId = UniqueId.from(props.organizationId);
    const userId = UniqueId.from(props.userId);
    
    // Konvertera roller till string om det är OrganizationRole-objekt
    const oldRole = typeof props.oldRole === 'string' 
      ? props.oldRole 
      : props.oldRole.toString();
      
    const newRole = typeof props.newRole === 'string' 
      ? props.newRole 
      : props.newRole.toString();
      
    const changedAt = props.changedAt || new Date();
    
    // Skapa event med payload
    super({
      name: 'OrganizationMemberRoleChangedEvent',
      payload: {
        organizationId: organizationId.toString(),
        userId: userId.toString(),
        oldRole,
        newRole,
        changedAt: changedAt.toISOString()
      }
    });
    
    // Egenskaper för IDomainEvent
    this.eventId = new UniqueId();
    this.occurredAt = new Date();
    this.aggregateId = organizationId.toString();
    
    // Spara properties direkt på event-objektet för enklare åtkomst
    this.organizationId = organizationId;
    this.userId = userId;
    this.oldRole = oldRole;
    this.newRole = newRole;
    this.changedAt = changedAt;
  }
} 