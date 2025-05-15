import { Result } from '@/shared/core/Result';
import { Team } from '../entities/Team';
import { UniqueId } from '@/shared/core/UniqueId';
import { TeamMember } from '../value-objects/TeamMember';
import { TeamInvitation } from '../value-objects/TeamInvitation';
import { TeamRole } from '../value-objects/TeamRole';

/**
 * TeamRepository Interface
 * 
 * Abstrakt repository för hantering av team enligt DDD-principer.
 * Implementeras av konkreta klasser i infrastrukturlagret.
 */
export interface TeamRepository {
  /**
   * Hämta team med specifikt ID
   * @param id Unikt team-ID
   * @returns Result med Team eller felmeddelande
   */
  findById(id: UniqueId): Promise<Result<Team | null, string>>;

  /**
   * Hämta alla team för en användare
   * @param userId Användarens ID
   * @returns Result med lista av team eller felmeddelande
   */
  findByUserId(userId: UniqueId): Promise<Result<Team[], string>>;

  /**
   * Hämta alla team som ägs av en användare
   * @param ownerId Ägarens ID
   * @returns Result med lista av team eller felmeddelande
   */
  findByOwnerId(ownerId: UniqueId): Promise<Result<Team[], string>>;

  /**
   * Spara ett team (skapa eller uppdatera)
   * @param team Team-aggregatet att spara
   * @returns Result med void eller felmeddelande
   */
  save(team: Team): Promise<Result<void, string>>;

  /**
   * Ta bort ett team
   * @param id Unikt team-ID
   * @returns Result med void eller felmeddelande
   */
  delete(id: UniqueId): Promise<Result<void, string>>;

  /**
   * Hämta teammedlemmar
   * @param teamId Unikt team-ID
   * @returns Result med lista av TeamMember eller felmeddelande
   */
  getMembers(teamId: UniqueId): Promise<Result<TeamMember[], string>>;

  /**
   * Lägg till medlem i team
   * @param teamId Unikt team-ID
   * @param member TeamMember värde-objekt
   * @returns Result med void eller felmeddelande
   */
  addMember(teamId: UniqueId, member: TeamMember): Promise<Result<void, string>>;

  /**
   * Ta bort medlem från team
   * @param teamId Unikt team-ID
   * @param userId Unikt användar-ID
   * @returns Result med void eller felmeddelande
   */
  removeMember(teamId: UniqueId, userId: UniqueId): Promise<Result<void, string>>;

  /**
   * Uppdatera medlemsuppgifter (som roll)
   * @param teamId Unikt team-ID
   * @param member TeamMember med uppdaterad information
   * @returns Result med void eller felmeddelande
   */
  updateMember(teamId: UniqueId, member: TeamMember): Promise<Result<void, string>>;

  /**
   * Uppdatera medlemsroll
   * @param teamId Unikt team-ID
   * @param userId Unikt användar-ID
   * @param role Ny roll
   * @returns Result med void eller felmeddelande
   */
  updateMemberRole(teamId: UniqueId, userId: UniqueId, role: TeamRole): Promise<Result<void, string>>;

  /**
   * Hämta aktiva inbjudningar för ett team
   * @param teamId Unikt team-ID
   * @returns Result med lista av TeamInvitation eller felmeddelande
   */
  getInvitations(teamId: UniqueId): Promise<Result<TeamInvitation[], string>>;

  /**
   * Skapa inbjudan till team
   * @param invitation TeamInvitation värde-objekt
   * @returns Result med void eller felmeddelande
   */
  createInvitation(invitation: TeamInvitation): Promise<Result<void, string>>;

  /**
   * Uppdatera inbjudans status
   * @param invitation TeamInvitation med uppdaterad information
   * @returns Result med void eller felmeddelande
   */
  updateInvitation(invitation: TeamInvitation): Promise<Result<void, string>>;

  /**
   * Ta bort inbjudan
   * @param id Unikt inbjudnings-ID
   * @returns Result med void eller felmeddelande
   */
  deleteInvitation(id: UniqueId): Promise<Result<void, string>>;

  /**
   * Hämta team som matchar sökterm
   * @param query Sökfråga
   * @param limit Maxantal resultat
   * @returns Result med lista av Team eller felmeddelande
   */
  search(query: string, limit?: number): Promise<Result<Team[], string>>;

  /**
   * Kontrollera om användare är medlem i team
   * @param teamId Unikt team-ID
   * @param userId Unikt användar-ID
   * @returns Result med boolean eller felmeddelande
   */
  isMember(teamId: UniqueId, userId: UniqueId): Promise<Result<boolean, string>>;
} 