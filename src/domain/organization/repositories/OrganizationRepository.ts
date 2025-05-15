import { Result } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { Organization } from '../entities/Organization';
import { OrganizationInvitation } from '../value-objects/OrganizationInvitation';

/**
 * OrganizationRepository Interface
 * 
 * Abstrakt repository för hantering av organisationer enligt DDD-principer.
 * Implementeras av konkreta klasser i infrastrukturlagret.
 */
export interface OrganizationRepository {
  /**
   * Hämta organisation med specifikt ID
   * @param id Unikt organisations-ID
   * @returns Result med Organization eller null om organisationen inte finns, eller felmeddelande
   */
  findById(id: UniqueId): Promise<Result<Organization | null, string>>;
  
  /**
   * Hämta organisation baserat på namn
   * @param name Organisationsnamn
   * @returns Result med Organization eller null om organisationen inte finns, eller felmeddelande
   */
  findByName(name: string): Promise<Result<Organization | null, string>>;
  
  /**
   * Spara en organisation (skapa eller uppdatera)
   * @param organization Organization-entiteten att spara
   * @returns Result med void eller felmeddelande
   */
  save(organization: Organization): Promise<Result<void, string>>;
  
  /**
   * Ta bort en organisation
   * @param id Unikt organisations-ID
   * @returns Result med void eller felmeddelande
   */
  delete(id: UniqueId): Promise<Result<void, string>>;
  
  /**
   * Hämta alla organisationer som en användare är medlem i
   * @param userId Unikt användar-ID
   * @returns Result med lista av Organization eller felmeddelande
   */
  findByUserId(userId: UniqueId): Promise<Result<Organization[], string>>;
  
  /**
   * Kontrollera om en organisation med angivet namn existerar
   * @param name Organisationsnamn att kontrollera
   * @returns Result med boolean eller felmeddelande
   */
  exists(name: string): Promise<Result<boolean, string>>;
  
  /**
   * Hämta alla team som tillhör en organisation
   * @param organizationId Unikt organisations-ID
   * @returns Result med lista av team-IDs eller felmeddelande
   */
  getTeams(organizationId: UniqueId): Promise<Result<UniqueId[], string>>;
  
  /**
   * Lägg till ett team till en organisation
   * @param organizationId Unikt organisations-ID
   * @param teamId Unikt team-ID
   * @returns Result med void eller felmeddelande
   */
  addTeam(organizationId: UniqueId, teamId: UniqueId): Promise<Result<void, string>>;
  
  /**
   * Ta bort ett team från en organisation
   * @param organizationId Unikt organisations-ID
   * @param teamId Unikt team-ID
   * @returns Result med void eller felmeddelande
   */
  removeTeam(organizationId: UniqueId, teamId: UniqueId): Promise<Result<void, string>>;
} 