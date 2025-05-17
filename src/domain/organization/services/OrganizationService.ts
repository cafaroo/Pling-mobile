import { Result } from '@/shared/core/Result';
import { Organization } from '@/domain/organization/entities/Organization';

/**
 * OrganizationService-gränssnitt för organisationsrelaterade operationer
 */
export interface OrganizationService {
  /**
   * Hämta en organisation baserat på ID
   */
  getOrganizationById(id: string): Promise<Result<Organization, Error>>;
  
  /**
   * Skapa en ny organisation
   */
  createOrganization(data: {
    name: string;
    ownerId: string;
    description?: string;
    website?: string;
  }): Promise<Result<Organization, Error>>;
  
  /**
   * Uppdatera en organisation
   */
  updateOrganization(id: string, data: {
    name?: string;
    description?: string;
    website?: string;
    isActive?: boolean;
  }): Promise<Result<Organization, Error>>;
  
  /**
   * Lägg till en organisationsmedlem
   */
  addMember(organizationId: string, userId: string, roles?: string[]): Promise<Result<Organization, Error>>;
  
  /**
   * Ta bort en organisationsmedlem
   */
  removeMember(organizationId: string, userId: string): Promise<Result<Organization, Error>>;
  
  /**
   * Uppdatera roller för en organisationsmedlem
   */
  updateMemberRoles(organizationId: string, userId: string, roles: string[]): Promise<Result<Organization, Error>>;
} 