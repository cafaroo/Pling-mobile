import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';
import { OrganizationRole } from '../value-objects/OrganizationRole';

export interface OrganizationMemberInvitedEventProps {
  organizationId: string | UniqueId;
  userId: string | UniqueId;
  email: string;
  invitedBy: string | UniqueId;
  role?: OrganizationRole | string;
  invitedAt?: Date;
  expiresAt?: Date;
}

/**
 * OrganizationMemberInvitedEvent
 * 
 * Domänhändelse som publiceras när en medlem har bjudits in till en organisation.
 * Innehåller information om organisationen, användaren som bjudits in och användaren som skickade inbjudan.
 */
export class OrganizationMemberInvitedEvent extends DomainEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly organizationId: UniqueId;
  public readonly userId: UniqueId;
  public readonly email: string;
  public readonly invitedBy: UniqueId;
  public readonly role?: string;
  public readonly invitedAt: Date;
  public readonly expiresAt?: Date;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly eventType: string = 'OrganizationMemberInvitedEvent';

  /**
   * Skapar en ny OrganizationMemberInvitedEvent
   * 
   * @param props - Parameterobjekt med event-properties
   */
  constructor(props: OrganizationMemberInvitedEventProps) {
    // Konvertera till UniqueId om det behövs
    const organizationId = UniqueId.from(props.organizationId);
    const userId = UniqueId.from(props.userId);
    const invitedBy = UniqueId.from(props.invitedBy);
    const invitedAt = props.invitedAt || new Date();
    
    // Skapa payload för eventet
    const payload: Record<string, any> = {
      organizationId: organizationId.toString(),
      userId: userId.toString(),
      email: props.email,
      invitedBy: invitedBy.toString(),
      invitedAt: invitedAt.toISOString()
    };
    
    // Lägg till roll om det finns
    if (props.role) {
      payload.role = typeof props.role === 'string' 
        ? props.role 
        : props.role.toString();
    }
    
    // Lägg till utgångsdatum om det finns
    if (props.expiresAt) {
      payload.expiresAt = props.expiresAt.toISOString();
    }
    
    // Skapa event med payload
    super({
      name: 'OrganizationMemberInvitedEvent',
      payload
    });
    
    // Egenskaper för IDomainEvent
    this.eventId = new UniqueId();
    this.occurredAt = new Date();
    this.aggregateId = organizationId.toString();
    
    // Spara egenskaperna direkt på event-objektet för enklare åtkomst
    this.organizationId = organizationId;
    this.userId = userId;
    this.email = props.email;
    this.invitedBy = invitedBy;
    this.invitedAt = invitedAt;
    this.expiresAt = props.expiresAt;
    
    if (props.role) {
      this.role = typeof props.role === 'string' 
        ? props.role 
        : props.role.toString();
    }
  }
} 