import { BaseOrganizationEvent } from './BaseOrganizationEvent';
import { Organization } from '../entities/Organization';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * OrganizationCreatedEvent
 * 
 * Domänhändelse som publiceras när en ny organisation har skapats.
 * Innehåller information om den nya organisationen och dess ägare.
 */
export class OrganizationCreatedEvent extends BaseOrganizationEvent {
  /**
   * Skapar en ny OrganizationCreatedEvent
   * 
   * @param organization - Organization-objekt eller ID för den nya organisationen
   * @param ownerId - ID för användaren som äger organisationen
   * @param name - Organisationens namn (om bara ID skickades in)
   */
  constructor(
    organization: Organization | UniqueId,
    ownerId: UniqueId,
    name?: string
  ) {
    const additionalData: Record<string, any> = {
      ownerId: ownerId.toString(),
    };
    
    // Om name angetts explicit (och organization är ett ID), lägg till det i eventdata
    if (name) {
      additionalData.name = name;
    }
    
    super('OrganizationCreatedEvent', organization, additionalData);
  }
} 