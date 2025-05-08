import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { TeamStatistics } from '@/domain/team/value-objects/TeamStatistics';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { TeamActivityRepository } from '@/domain/team/repositories/TeamActivityRepository';

export interface GetTeamStatisticsDeps {
  teamRepo: TeamRepository;
  teamActivityRepo: TeamActivityRepository;
}

export type GetTeamStatisticsError = 
  | 'TEAM_NOT_FOUND'
  | 'FAILED_TO_FETCH_ACTIVITIES'
  | 'FAILED_TO_CALCULATE_STATISTICS';

/**
 * Användarfall för att hämta statistik för ett team
 */
export const getTeamStatistics = (deps: GetTeamStatisticsDeps) => {
  return async (teamId: string): Promise<Result<TeamStatistics, GetTeamStatisticsError>> => {
    const teamUniqueId = new UniqueId(teamId);
    
    // Hämta team-information
    const teamResult = await deps.teamRepo.findById(teamUniqueId);
    if (!teamResult) {
      return err('TEAM_NOT_FOUND');
    }
    
    // Hämta aktiva medlemmar (antal medlemmar som har gjort minst en aktivitet)
    const members = teamResult.members;
    const membersCount = members.length;
    
    // Hämta alla aktiviteter för teamet
    const activitiesResult = await deps.teamActivityRepo.findByTeam(teamUniqueId);
    if (activitiesResult.isErr()) {
      return err('FAILED_TO_FETCH_ACTIVITIES');
    }
    
    const activities = activitiesResult.value;
    
    // Beräkna aktiva medlemmar (de som har minst en aktivitet)
    const activeUserIds = new Set<string>();
    activities.forEach(activity => {
      activeUserIds.add(activity.performedBy.toString());
    });
    
    const activeMembersCount = activeUserIds.size;
    
    // Beräkna statistik från aktiviteter
    const statisticsResult = TeamStatistics.calculateFromActivities(
      teamUniqueId,
      activities,
      membersCount,
      activeMembersCount,
      teamResult.createdAt
    );
    
    if (statisticsResult.isErr()) {
      return err('FAILED_TO_CALCULATE_STATISTICS');
    }
    
    return ok(statisticsResult.value);
  };
}; 