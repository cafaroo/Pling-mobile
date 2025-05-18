import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * TeamRemovedFromOrganizationEvent
 * 
 * Domänhändelse som publiceras när ett team har tagits bort från en organisation.
 * Innehåller information om organisationen och teamet.
 */
export class TeamRemovedFromOrganizationEvent extends DomainEvent {
  public readonly teamId: UniqueId;
  public readonly organizationId: UniqueId;

  /**
   * Skapar en ny TeamRemovedFromOrganizationEvent
   * 
   * @param organizationId - ID för organisationen
   * @param teamId - ID för teamet som tagits bort
   */
  constructor(organizationId: UniqueId, teamId: UniqueId) {
    super({
      name: 'TeamRemovedFromOrganizationEvent',
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