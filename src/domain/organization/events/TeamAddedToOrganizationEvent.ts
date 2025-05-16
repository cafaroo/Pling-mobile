import { BaseOrganizationEvent } from './BaseOrganizationEvent';
import { Organization } from '../entities/Organization';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * TeamAddedToOrganizationEvent
 * 
 * Domänhändelse som publiceras när ett team har lagts till i en organisation.
 * Innehåller information om organisationen och teamet.
 */
export class TeamAddedToOrganizationEvent extends BaseOrganizationEvent {
  /**
   * Skapar en ny TeamAddedToOrganizationEvent
   * 
   * @param organization - Organization-objekt eller ID för organisationen
   * @param teamId - ID för teamet som lagts till
   */
  constructor(
    organization: Organization | UniqueId,
    teamId: UniqueId
  ) {
    super('TeamAddedToOrganizationEvent', organization, {
      teamId: teamId.toString()
    });
  }
} 