import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';

export interface OrganizationInvitationAcceptedEventProps {
  organizationId: string | UniqueId;
  invitationId: string | UniqueId;
  userId: string | UniqueId;
  acceptedAt?: Date;
}

/**
 * OrganizationInvitationAcceptedEvent
 * 
 * Domänhändelse som publiceras när en inbjudan till en organisation har accepterats.
 * Innehåller information om organisationen, inbjudan och användaren.
 */
export class OrganizationInvitationAcceptedEvent extends DomainEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly organizationId: UniqueId;
  public readonly invitationId: UniqueId;
  public readonly userId: UniqueId;
  public readonly acceptedAt: Date;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly eventType: string = 'OrganizationInvitationAcceptedEvent';

  /**
   * Skapar en ny OrganizationInvitationAcceptedEvent
   * 
   * @param props - Parameterobjekt med event-properties
   */
  constructor(props: OrganizationInvitationAcceptedEventProps) {
    // Konvertera till UniqueId om det behövs
    const organizationId = UniqueId.from(props.organizationId);
    const invitationId = UniqueId.from(props.invitationId);
    const userId = UniqueId.from(props.userId);
    const acceptedAt = props.acceptedAt || new Date();
    
    // Skapa event med payload
    super({
      name: 'OrganizationInvitationAcceptedEvent',
      payload: {
        organizationId: organizationId.toString(),
        invitationId: invitationId.toString(),
        userId: userId.toString(),
        acceptedAt: acceptedAt.toISOString()
      }
    });
    
    // Egenskaper för IDomainEvent
    this.eventId = new UniqueId();
    this.occurredAt = new Date();
    this.aggregateId = organizationId.toString();
    
    // Spara egenskaperna direkt på event-objektet för enklare åtkomst
    this.organizationId = organizationId;
    this.invitationId = invitationId;
    this.userId = userId;
    this.acceptedAt = acceptedAt;
  }
} 