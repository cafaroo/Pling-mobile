import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { TeamStatistics } from '@/domain/team/value-objects/TeamStatistics';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { TeamActivityRepository } from '@/domain/team/repositories/TeamActivityRepository';

export interface GetTeamStatisticsDTO {
  teamId: string;
}

export interface GetTeamStatisticsResponse {
  statistics: TeamStatistics;
}

type GetTeamStatisticsError = { 
  message: string; 
  code: 'NOT_FOUND' | 'DATA_ACCESS_ERROR' | 'CALCULATION_ERROR' | 'UNEXPECTED_ERROR' 
};

/**
 * Användarfall för att hämta statistik för ett team
 * 
 * Refaktorerad till att använda klass-baserad design 
 * med standardiserade DTOs, responses och feltyper.
 */
export class GetTeamStatisticsUseCase {
  constructor(
    private teamRepository: TeamRepository,
    private teamActivityRepository: TeamActivityRepository
  ) {}

  async execute(dto: GetTeamStatisticsDTO): Promise<Result<GetTeamStatisticsResponse, GetTeamStatisticsError>> {
    try {
      // Validera indata
      if (!dto.teamId) {
        return err({
          message: 'Team-ID är obligatoriskt',
          code: 'VALIDATION_ERROR'
        });
      }

      const teamId = new UniqueId(dto.teamId);
      
      // Hämta team-information
      const teamResult = await this.teamRepository.findById(teamId);
      
      if (teamResult.isErr()) {
        return err({
          message: `Kunde inte hämta team: ${teamResult.error}`,
          code: 'DATA_ACCESS_ERROR'
        });
      }
      
      const team = teamResult.value;
      
      if (!team) {
        return err({
          message: 'Team hittades inte',
          code: 'NOT_FOUND'
        });
      }
      
      // Hämta aktiva medlemmar (antal medlemmar som har gjort minst en aktivitet)
      const members = team.members;
      const membersCount = members.length;
      
      // Hämta alla aktiviteter för teamet
      const activitiesResult = await this.teamActivityRepository.findByTeam(teamId);
      
      if (activitiesResult.isErr()) {
        return err({
          message: `Kunde inte hämta teamaktiviteter: ${activitiesResult.error}`,
          code: 'DATA_ACCESS_ERROR'
        });
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
        teamId,
        activities,
        membersCount,
        activeMembersCount,
        team.createdAt
      );
      
      if (statisticsResult.isErr()) {
        return err({
          message: `Kunde inte beräkna statistik: ${statisticsResult.error}`,
          code: 'CALCULATION_ERROR'
        });
      }
      
      return ok({
        statistics: statisticsResult.value
      });
    } catch (error) {
      return err({
        message: `Ett oväntat fel inträffade: ${error instanceof Error ? error.message : String(error)}`,
        code: 'UNEXPECTED_ERROR'
      });
    }
  }
} 