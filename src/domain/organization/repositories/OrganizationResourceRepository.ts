import { UniqueId } from '@/shared/core/UniqueId';
import { Result } from '@/shared/core/Result';
import { OrganizationResource } from '../entities/OrganizationResource';
import { ResourceType } from '../value-objects/ResourceType';

export interface OrganizationResourceRepository {
  /**
   * Hitta en resurs baserat på ID
   */
  findById(id: UniqueId): Promise<Result<OrganizationResource, string>>;
  
  /**
   * Hitta alla resurser som tillhör en organisation
   */
  findByOrganizationId(organizationId: UniqueId): Promise<Result<OrganizationResource[], string>>;
  
  /**
   * Hitta alla resurser som ägs av en användare
   */
  findByOwnerId(ownerId: UniqueId): Promise<Result<OrganizationResource[], string>>;
  
  /**
   * Hitta alla resurser som en användare har tillgång till i en organisation
   */
  findAccessibleByUserId(organizationId: UniqueId, userId: UniqueId): Promise<Result<OrganizationResource[], string>>;
  
  /**
   * Hitta resurser av en viss typ i en organisation
   */
  findByType(organizationId: UniqueId, type: ResourceType): Promise<Result<OrganizationResource[], string>>;
  
  /**
   * Spara en resurs (skapa eller uppdatera)
   */
  save(resource: OrganizationResource): Promise<Result<void, string>>;
  
  /**
   * Ta bort en resurs
   */
  delete(id: UniqueId): Promise<Result<void, string>>;
  
  /**
   * Kontrollera om en resurs finns
   */
  exists(id: UniqueId): Promise<boolean>;
} 