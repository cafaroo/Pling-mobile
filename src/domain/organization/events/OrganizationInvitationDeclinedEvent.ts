import { BaseOrganizationEvent } from './BaseOrganizationEvent';
import { Organization } from '../entities/Organization';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * OrganizationInvitationDeclinedEvent
 * 
 * Domänhändelse som publiceras när en inbjudan till en organisation har avböjts.
 * Innehåller information om organisationen, inbjudan och användaren.
 */
export class OrganizationInvitationDeclinedEvent extends BaseOrganizationEvent {
  /**
   * Skapar en ny OrganizationInvitationDeclinedEvent
   * 
   * @param organization - Organization-objekt eller ID för organisationen
   * @param invitationId - ID för inbjudan som avböjts
   * @param userId - ID för användaren som avböjt inbjudan
   */
  constructor(
    organization: Organization | UniqueId,
    invitationId: UniqueId,
    userId: UniqueId
  ) {
    super('OrganizationInvitationDeclinedEvent', organization, {
      invitationId: invitationId.toString(),
      userId: userId.toString()
    });
  }
} 