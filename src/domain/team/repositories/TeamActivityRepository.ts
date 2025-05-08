import { UniqueId } from '@/shared/core/UniqueId';
import { Result } from '@/shared/core/Result';
import { TeamActivity } from '../entities/TeamActivity';
import { ActivityType } from '../value-objects/ActivityType';

/**
 * Filter-alternativ för att söka efter aktiviteter
 */
export interface ActivityFilterOptions {
  teamId?: UniqueId;
  performedBy?: UniqueId;
  targetId?: UniqueId;
  activityTypes?: ActivityType[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Repository-interface för TeamActivity
 */
export interface TeamActivityRepository {
  /**
   * Spara en ny aktivitet
   */
  save(activity: TeamActivity): Promise<Result<void, string>>;
  
  /**
   * Hitta en aktivitet med ID
   */
  findById(id: UniqueId): Promise<Result<TeamActivity, string>>;
  
  /**
   * Hitta aktiviteter för ett specifikt team
   */
  findByTeamId(
    teamId: UniqueId, 
    options?: Omit<ActivityFilterOptions, 'teamId'>
  ): Promise<Result<TeamActivity[], string>>;
  
  /**
   * Hitta aktiviteter utförda av en specifik användare
   */
  findByPerformedBy(
    userId: UniqueId, 
    options?: Omit<ActivityFilterOptions, 'performedBy'>
  ): Promise<Result<TeamActivity[], string>>;
  
  /**
   * Hitta aktiviteter som har en specifik användare som mål
   */
  findByTargetId(
    targetId: UniqueId, 
    options?: Omit<ActivityFilterOptions, 'targetId'>
  ): Promise<Result<TeamActivity[], string>>;
  
  /**
   * Söka aktiviteter med filter
   */
  search(options: ActivityFilterOptions): Promise<Result<TeamActivity[], string>>;
  
  /**
   * Hämta de senaste aktiviteterna i ett team
   */
  getLatestForTeam(
    teamId: UniqueId, 
    limit: number
  ): Promise<Result<TeamActivity[], string>>;
  
  /**
   * Ta bort en aktivitet
   */
  delete(id: UniqueId): Promise<Result<void, string>>;
  
  /**
   * Räkna aktiviteter som matchar filter
   */
  count(options: ActivityFilterOptions): Promise<Result<number, string>>;
  
  /**
   * Hämta aktiviteter grupperade efter typ
   */
  getGroupedByType(
    teamId: UniqueId, 
    options?: Omit<ActivityFilterOptions, 'teamId'>
  ): Promise<Result<Record<ActivityType, number>, string>>;
} 