import { Result } from '@/shared/core/Result';
import { Team } from '@/domain/team/entities/Team';

/**
 * TeamService-gränssnitt för teamrelaterade operationer
 */
export interface TeamService {
  /**
   * Hämta ett team baserat på ID
   */
  getTeamById(teamId: string): Promise<Result<Team, Error>>;
  
  /**
   * Skapa ett nytt team
   */
  createTeam(data: {
    name: string;
    description?: string;
    ownerId: string;
    organizationId?: string;
  }): Promise<Result<Team, Error>>;
  
  /**
   * Uppdatera ett team
   */
  updateTeam(teamId: string, data: {
    name?: string;
    description?: string;
    isActive?: boolean;
  }): Promise<Result<Team, Error>>;
  
  /**
   * Lägg till en teammedlem
   */
  addMember(teamId: string, userId: string, roles?: string[]): Promise<Result<Team, Error>>;
  
  /**
   * Ta bort en teammedlem
   */
  removeMember(teamId: string, userId: string): Promise<Result<Team, Error>>;
  
  /**
   * Uppdatera roller för en teammedlem
   */
  updateMemberRoles(teamId: string, userId: string, roles: string[]): Promise<Result<Team, Error>>;
} 