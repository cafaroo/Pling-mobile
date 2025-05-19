import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';

export interface TeamAddedToOrganizationEventProps {
  organizationId: string | UniqueId;
  teamId: string | UniqueId;
  addedAt?: Date;
}

/**
 * TeamAddedToOrganizationEvent
 * 
 * Domänhändelse som publiceras när ett team har lagts till i en organisation.
 * Innehåller information om organisationen och teamet.
 */
export class TeamAddedToOrganizationEvent extends DomainEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly teamId: UniqueId;
  public readonly organizationId: UniqueId;
  public readonly addedAt: Date;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly eventType: string = 'TeamAddedToOrganizationEvent';

  /**
   * Skapar en ny TeamAddedToOrganizationEvent
   * 
   * @param props - Parameterobjekt med event-properties
   */
  constructor(props: TeamAddedToOrganizationEventProps) {
    // Konvertera till UniqueId om det behövs
    const organizationId = UniqueId.from(props.organizationId);
    const teamId = UniqueId.from(props.teamId);
    const addedAt = props.addedAt || new Date();
    
    // Skapa event med payload
    super({
      name: 'TeamAddedToOrganizationEvent',
      payload: {
        organizationId: organizationId.toString(),
        teamId: teamId.toString(),
        addedAt: addedAt.toISOString()
      }
    });
    
    // Egenskaper för IDomainEvent
    this.eventId = new UniqueId();
    this.occurredAt = new Date();
    this.aggregateId = organizationId.toString();
    
    // Spara egenskaperna direkt på event-objektet för enklare åtkomst
    this.organizationId = organizationId;
    this.teamId = teamId;
    this.addedAt = addedAt;
  }
} 