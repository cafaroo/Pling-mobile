import { BaseOrganizationEvent } from './BaseOrganizationEvent';
import { Organization } from '../entities/Organization';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * TeamRemovedFromOrganizationEvent
 * 
 * Domänhändelse som publiceras när ett team har tagits bort från en organisation.
 * Innehåller information om organisationen och teamet.
 */
export class TeamRemovedFromOrganizationEvent extends BaseOrganizationEvent {
  /**
   * Skapar en ny TeamRemovedFromOrganizationEvent
   * 
   * @param organization - Organization-objekt eller ID för organisationen
   * @param teamId - ID för teamet som togs bort
   */
  constructor(
    organization: Organization | UniqueId,
    teamId: UniqueId
  ) {
    super('TeamRemovedFromOrganizationEvent', organization, {
      teamId: teamId.toString()
    });
  }
} 