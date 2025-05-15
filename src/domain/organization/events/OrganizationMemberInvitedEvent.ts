import { BaseOrganizationEvent } from './BaseOrganizationEvent';
import { Organization } from '../entities/Organization';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * OrganizationMemberInvitedEvent
 * 
 * Domänhändelse som publiceras när en medlem har bjudits in till en organisation.
 * Innehåller information om organisationen, användaren som bjudits in och användaren som skickade inbjudan.
 */
export class OrganizationMemberInvitedEvent extends BaseOrganizationEvent {
  /**
   * Skapar en ny OrganizationMemberInvitedEvent
   * 
   * @param organization - Organization-objekt eller ID för organisationen
   * @param userId - ID för användaren som bjudits in
   * @param invitedBy - ID för användaren som skickade inbjudan
   */
  constructor(
    organization: Organization | UniqueId,
    userId: UniqueId,
    invitedBy: UniqueId
  ) {
    super('OrganizationMemberInvitedEvent', organization, {
      userId: userId.toString(),
      invitedBy: invitedBy.toString()
    });
  }
} 