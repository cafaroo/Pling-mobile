import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';

export interface OrganizationInvitationDeclinedEventProps {
  organizationId: string | UniqueId;
  invitationId: string | UniqueId;
  userId: string | UniqueId;
  declinedAt?: Date;
}

/**
 * OrganizationInvitationDeclinedEvent
 * 
 * Domänhändelse som publiceras när en inbjudan till en organisation har avböjts.
 * Innehåller information om organisationen, inbjudan och användaren.
 */
export class OrganizationInvitationDeclinedEvent extends DomainEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly organizationId: UniqueId;
  public readonly invitationId: UniqueId;
  public readonly userId: UniqueId;
  public readonly declinedAt: Date;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly eventType: string = 'OrganizationInvitationDeclinedEvent';

  /**
   * Skapar en ny OrganizationInvitationDeclinedEvent
   * 
   * @param props - Parameterobjekt med event-properties
   */
  constructor(props: OrganizationInvitationDeclinedEventProps) {
    // Konvertera till UniqueId om det behövs
    const organizationId = UniqueId.from(props.organizationId);
    const invitationId = UniqueId.from(props.invitationId);
    const userId = UniqueId.from(props.userId);
    const declinedAt = props.declinedAt || new Date();
    
    // Skapa event med payload
    super({
      name: 'OrganizationInvitationDeclinedEvent',
      payload: {
        organizationId: organizationId.toString(),
        invitationId: invitationId.toString(),
        userId: userId.toString(),
        declinedAt: declinedAt.toISOString()
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
    this.declinedAt = declinedAt;
  }
} 