import { BaseOrganizationEvent } from './BaseOrganizationEvent';
import { Organization } from '../entities/Organization';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * OrganizationInvitationAcceptedEvent
 * 
 * Domänhändelse som publiceras när en inbjudan till en organisation har accepterats.
 * Innehåller information om organisationen, inbjudan och användaren.
 */
export class OrganizationInvitationAcceptedEvent extends BaseOrganizationEvent {
  /**
   * Skapar en ny OrganizationInvitationAcceptedEvent
   * 
   * @param organization - Organization-objekt eller ID för organisationen
   * @param invitationId - ID för inbjudan som accepterats
   * @param userId - ID för användaren som accepterat inbjudan
   */
  constructor(
    organization: Organization | UniqueId,
    invitationId: UniqueId,
    userId: UniqueId
  ) {
    super('OrganizationInvitationAcceptedEvent', organization, {
      invitationId: invitationId.toString(),
      userId: userId.toString()
    });
  }
} 