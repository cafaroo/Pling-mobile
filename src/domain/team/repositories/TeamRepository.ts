import { Result } from '@/shared/core/Result';
import { Team } from '../entities/Team';
import { UniqueId } from '@/shared/core/UniqueId';
import { TeamMember } from '../value-objects/TeamMember';
import { TeamInvitation } from '../value-objects/TeamInvitation';

export interface TeamRepository {
  /**
   * Hämta team med specifikt ID
   */
  findById(id: UniqueId): Promise<Result<Team, string>>;

  /**
   * Hämta alla team för en användare
   */
  findByUserId(userId: UniqueId): Promise<Result<Team[], string>>;

  /**
   * Spara ett team (skapa eller uppdatera)
   */
  save(team: Team): Promise<Result<void, string>>;

  /**
   * Ta bort ett team
   */
  delete(id: UniqueId): Promise<Result<void, string>>;

  /**
   * Hämta teammedlemmar
   */
  getMembers(teamId: UniqueId): Promise<Result<TeamMember[], string>>;

  /**
   * Lägg till medlem i team
   */
  addMember(teamId: UniqueId, member: TeamMember): Promise<Result<void, string>>;

  /**
   * Ta bort medlem från team
   */
  removeMember(teamId: UniqueId, userId: UniqueId): Promise<Result<void, string>>;

  /**
   * Uppdatera medlemsuppgifter (som roll)
   */
  updateMember(teamId: UniqueId, member: TeamMember): Promise<Result<void, string>>;

  /**
   * Hämta aktiva inbjudningar för ett team
   */
  getInvitations(teamId: UniqueId): Promise<Result<TeamInvitation[], string>>;

  /**
   * Skapa inbjudan till team
   */
  createInvitation(invitation: TeamInvitation): Promise<Result<void, string>>;

  /**
   * Uppdatera inbjudans status
   */
  updateInvitation(invitation: TeamInvitation): Promise<Result<void, string>>;

  /**
   * Ta bort inbjudan
   */
  deleteInvitation(id: UniqueId): Promise<Result<void, string>>;

  /**
   * Hämta team som matchar sökterm
   */
  search(query: string, limit?: number): Promise<Result<Team[], string>>;

  /**
   * Kontrollera om användare är medlem i team
   */
  isMember(teamId: UniqueId, userId: UniqueId): Promise<Result<boolean, string>>;
} 