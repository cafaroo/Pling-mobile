import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';

export interface TeamRemovedFromOrganizationEventProps {
  organizationId: string | UniqueId;
  teamId: string | UniqueId;
  removedAt?: Date;
}

/**
 * TeamRemovedFromOrganizationEvent
 * 
 * Domänhändelse som publiceras när ett team har tagits bort från en organisation.
 * Innehåller information om organisationen och teamet.
 */
export class TeamRemovedFromOrganizationEvent extends DomainEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly teamId: UniqueId;
  public readonly organizationId: UniqueId;
  public readonly removedAt: Date;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly eventType: string = 'TeamRemovedFromOrganizationEvent';

  /**
   * Skapar en ny TeamRemovedFromOrganizationEvent
   * 
   * @param props - Parameterobjekt med event-properties
   */
  constructor(props: TeamRemovedFromOrganizationEventProps) {
    // Konvertera till UniqueId om det behövs
    const organizationId = UniqueId.from(props.organizationId);
    const teamId = UniqueId.from(props.teamId);
    const removedAt = props.removedAt || new Date();
    
    // Skapa event med payload
    super({
      name: 'TeamRemovedFromOrganizationEvent',
      payload: {
        organizationId: organizationId.toString(),
        teamId: teamId.toString(),
        removedAt: removedAt.toISOString()
      }
    });
    
    // Egenskaper för IDomainEvent
    this.eventId = new UniqueId();
    this.occurredAt = new Date();
    this.aggregateId = organizationId.toString();
    
    // Spara egenskaperna direkt på event-objektet för enklare åtkomst
    this.organizationId = organizationId;
    this.teamId = teamId;
    this.removedAt = removedAt;
  }
} 