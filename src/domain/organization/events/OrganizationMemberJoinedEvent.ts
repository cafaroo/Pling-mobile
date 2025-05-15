import { BaseOrganizationEvent } from './BaseOrganizationEvent';
import { Organization } from '../entities/Organization';
import { UniqueId } from '@/shared/core/UniqueId';
import { OrganizationRole } from '../value-objects/OrganizationRole';

/**
 * OrganizationMemberJoinedEvent
 * 
 * Domänhändelse som publiceras när en användare blir medlem i en organisation.
 * Innehåller information om organisationen, användaren och användarens roll.
 */
export class OrganizationMemberJoinedEvent extends BaseOrganizationEvent {
  /**
   * Skapar en ny OrganizationMemberJoinedEvent
   * 
   * @param organization - Organization-objekt eller ID för organisationen
   * @param userId - ID för användaren som anslutit till organisationen
   * @param role - Användarens roll i organisationen
   */
  constructor(
    organization: Organization | UniqueId,
    userId: UniqueId,
    role: OrganizationRole
  ) {
    super('OrganizationMemberJoinedEvent', organization, {
      userId: userId.toString(),
      role: role
    });
  }
} 