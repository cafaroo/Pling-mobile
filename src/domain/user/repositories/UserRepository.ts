import { Result } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { User } from '../entities/User';
import { Email } from '../value-objects/Email';

/**
 * UserRepository Interface
 * 
 * Abstrakt repository för hantering av användare enligt DDD-principer.
 * Implementeras av konkreta klasser i infrastrukturlagret.
 */
export interface UserRepository {
  /**
   * Hämta användare med specifikt ID
   * @param id Unikt användar-ID
   * @returns Result med User eller null om användaren inte finns, eller felmeddelande
   */
  findById(id: UniqueId): Promise<Result<User | null, string>>;
  
  /**
   * Hämta användare med specifik e-postadress
   * @param email E-postadress
   * @returns Result med User eller null om användaren inte finns, eller felmeddelande
   */
  findByEmail(email: Email): Promise<Result<User | null, string>>;
  
  /**
   * Spara en användare (skapa eller uppdatera)
   * @param user User-entiteten att spara
   * @returns Result med void eller felmeddelande
   */
  save(user: User): Promise<Result<void, string>>;
  
  /**
   * Ta bort en användare
   * @param id Unikt användar-ID
   * @returns Result med void eller felmeddelande
   */
  delete(id: UniqueId): Promise<Result<void, string>>;
  
  /**
   * Hämta alla användare i ett team
   * @param teamId Unikt team-ID
   * @returns Result med lista av User eller felmeddelande
   */
  findByTeamId(teamId: UniqueId): Promise<Result<User[], string>>;
  
  /**
   * Sök användare baserat på sökkriterier
   * @param query Sökfråga
   * @param limit Maxantal resultat
   * @returns Result med lista av User eller felmeddelande
   */
  search(query: string, limit?: number): Promise<Result<User[], string>>;
  
  /**
   * Kontrollera om användare med angiven e-post existerar
   * @param email E-postadress att kontrollera
   * @returns Result med boolean eller felmeddelande
   */
  exists(email: Email): Promise<Result<boolean, string>>;
  
  /**
   * Uppdatera användares status
   * @param id Unikt användar-ID
   * @param status Ny status för användaren
   * @returns Result med void eller felmeddelande
   */
  updateStatus(id: UniqueId, status: 'pending' | 'active' | 'inactive' | 'blocked'): Promise<Result<void, string>>;
} 