import { BaseOrganizationEvent } from './BaseOrganizationEvent';
import { Organization } from '../entities/Organization';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * OrganizationUpdatedEvent
 * 
 * Domänhändelse som publiceras när en organisation har uppdaterats.
 * Innehåller information om den uppdaterade organisationen.
 */
export class OrganizationUpdatedEvent extends BaseOrganizationEvent {
  /**
   * Skapar en ny OrganizationUpdatedEvent
   * 
   * @param organization - Organization-objekt eller ID för organisationen
   * @param name - Organisationens uppdaterade namn
   */
  constructor(
    organization: Organization | UniqueId,
    name: string
  ) {
    super('OrganizationUpdatedEvent', organization, {
      name
    });
  }
} 