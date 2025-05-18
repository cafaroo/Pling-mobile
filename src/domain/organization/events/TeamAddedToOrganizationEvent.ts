import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * TeamAddedToOrganizationEvent
 * 
 * Domänhändelse som publiceras när ett team har lagts till i en organisation.
 * Innehåller information om organisationen och teamet.
 */
export class TeamAddedToOrganizationEvent extends DomainEvent {
  public readonly teamId: UniqueId;
  public readonly organizationId: UniqueId;

  /**
   * Skapar en ny TeamAddedToOrganizationEvent
   * 
   * @param organizationId - ID för organisationen
   * @param teamId - ID för teamet som lagts till
   */
  constructor(organizationId: UniqueId, teamId: UniqueId) {
    super({
      name: 'TeamAddedToOrganizationEvent',
      payload: {
        organizationId: organizationId.toString(),
        teamId: teamId.toString()
      }
    });
    
    // Spara egenskaperna direkt på event-objektet för enklare åtkomst
    this.organizationId = organizationId;
    this.teamId = teamId;
  }
} 