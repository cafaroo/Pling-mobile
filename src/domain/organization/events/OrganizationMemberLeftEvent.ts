import { BaseOrganizationEvent } from './BaseOrganizationEvent';
import { Organization } from '../entities/Organization';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * OrganizationMemberLeftEvent
 * 
 * Domänhändelse som publiceras när en medlem har lämnat en organisation.
 * Innehåller information om organisationen och användaren.
 */
export class OrganizationMemberLeftEvent extends BaseOrganizationEvent {
  /**
   * Skapar en ny OrganizationMemberLeftEvent
   * 
   * @param organization - Organization-objekt eller ID för organisationen
   * @param userId - ID för användaren som lämnat organisationen
   */
  constructor(
    organization: Organization | UniqueId,
    userId: UniqueId
  ) {
    super('OrganizationMemberLeftEvent', organization, {
      userId: userId.toString()
    });
  }
} 