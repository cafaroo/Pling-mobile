import { BaseOrganizationEvent } from './BaseOrganizationEvent';
import { Organization } from '../entities/Organization';
import { UniqueId } from '@/shared/core/UniqueId';
import { OrganizationRole } from '../value-objects/OrganizationRole';

/**
 * OrganizationMemberRoleChangedEvent
 * 
 * Domänhändelse som publiceras när en medlems roll i en organisation har ändrats.
 * Innehåller information om organisationen, medlemmen, och rollförändringen.
 */
export class OrganizationMemberRoleChangedEvent extends BaseOrganizationEvent {
  /**
   * Skapar en ny OrganizationMemberRoleChangedEvent
   * 
   * @param organization - Organization-objekt eller ID för organisationen
   * @param userId - ID för användaren vars roll ändrats
   * @param oldRole - Användarens tidigare roll
   * @param newRole - Användarens nya roll
   */
  constructor(
    organization: Organization | UniqueId,
    userId: UniqueId,
    oldRole: OrganizationRole,
    newRole: OrganizationRole
  ) {
    super('OrganizationMemberRoleChangedEvent', organization, {
      userId: userId.toString(),
      oldRole,
      newRole
    });
  }
} 