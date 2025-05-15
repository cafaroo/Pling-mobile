import { UniqueId } from '@/shared/core/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';
import { TeamActivity } from '@/domain/team/entities/TeamActivity';
import { ActivityType } from '@/domain/team/value-objects/ActivityType';
import { TeamActivityRepository, ActivityFilterOptions } from '@/domain/team/repositories/TeamActivityRepository';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';

// DTO för att hämta teamaktiviteter
export interface GetTeamActivitiesDTO {
  teamId: string;
  userId?: string;        // För att filtrera på utförare eller mål
  activityTypes?: ActivityType[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  userIsTarget?: boolean; // Om true, sök på userId som target istället för performer
}

// DTO för teamaktivitetsdata
export interface TeamActivityDTO {
  id: string;
  teamId: string;
  performedBy: string;
  activityType: ActivityType;
  targetId?: string;
  metadata: Record<string, any>;
  timestamp: Date;
  description: string; // Läsbar beskrivning av aktiviteten
}

// Resultat av aktivitetssökning med sidnumrering
export interface GetTeamActivitiesResponse {
  activities: TeamActivityDTO[];
  total: number;
  hasMore: boolean;
}

// Resultat av GetLatestActivities
export interface GetLatestActivitiesResponse {
  activities: TeamActivityDTO[];
}

// Resultat av GetActivityStats
export interface GetActivityStatsResponse {
  stats: Record<ActivityType, number>;
}

type GetTeamActivitiesError = { 
  message: string; 
  code: 'NOT_FOUND' | 'DATA_ACCESS_ERROR' | 'VALIDATION_ERROR' | 'UNEXPECTED_ERROR' 
};

/**
 * Användarfall för att hämta teamaktiviteter
 * 
 * Refaktorerad för att använda samma mönster som övriga use cases.
 */
export class GetTeamActivitiesUseCase {
  constructor(
    private readonly teamActivityRepository: TeamActivityRepository,
    private readonly teamRepository: TeamRepository
  ) {}
  
  /**
   * Hämta aktiviteter för ett team med filtrering och sidbrytning
   */
  async execute(dto: GetTeamActivitiesDTO): Promise<Result<GetTeamActivitiesResponse, GetTeamActivitiesError>> {
    try {
      // Validera indata
      if (!dto.teamId) {
        return err({
          message: 'Team-ID är obligatoriskt',
          code: 'VALIDATION_ERROR'
        });
      }

      // Validera att teamet existerar och att användaren har rätt att se aktiviteter
      const teamId = new UniqueId(dto.teamId);
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
      
      // Skapa filteroptioner
      const filterOptions: ActivityFilterOptions = {
        teamId,
        limit: dto.limit || 20,
        offset: dto.offset || 0,
        startDate: dto.startDate,
        endDate: dto.endDate,
        activityTypes: dto.activityTypes
      };
      
      // Filtrera på användare om det anges
      if (dto.userId) {
        const userId = new UniqueId(dto.userId);
        
        if (dto.userIsTarget) {
          filterOptions.targetId = userId;
        } else {
          filterOptions.performedBy = userId;
        }
      }
      
      // Hämta aktiviteter och räkna totala antalet
      const [activitiesResult, countResult] = await Promise.all([
        this.teamActivityRepository.search(filterOptions),
        this.teamActivityRepository.count({
          ...filterOptions,
          limit: undefined,
          offset: undefined
        })
      ]);
      
      if (activitiesResult.isErr()) {
        return err({
          message: `Kunde inte hämta aktiviteter: ${activitiesResult.error}`,
          code: 'DATA_ACCESS_ERROR'
        });
      }
      
      if (countResult.isErr()) {
        return err({
          message: `Kunde inte räkna aktiviteter: ${countResult.error}`,
          code: 'DATA_ACCESS_ERROR'
        });
      }
      
      const activities = activitiesResult.value;
      const total = countResult.value;
      
      // Konvertera till DTOs
      const activityDTOs: TeamActivityDTO[] = activities.map(activity => ({
        id: activity.id.toString(),
        teamId: activity.teamId.toString(),
        performedBy: activity.performedBy.toString(),
        activityType: activity.activityType,
        targetId: activity.targetId?.toString(),
        metadata: activity.metadata,
        timestamp: activity.timestamp,
        description: activity.getDescription()
      }));
      
      return ok({
        activities: activityDTOs,
        total,
        hasMore: (filterOptions.offset || 0) + activityDTOs.length < total
      });
    } catch (error) {
      return err({
        message: `Ett oväntat fel inträffade: ${error instanceof Error ? error.message : String(error)}`,
        code: 'UNEXPECTED_ERROR'
      });
    }
  }
  
  /**
   * Hämta de senaste aktiviteterna för ett team
   */
  async getLatestActivities(
    teamId: string, 
    limit: number = 10
  ): Promise<Result<GetLatestActivitiesResponse, GetTeamActivitiesError>> {
    try {
      if (!teamId) {
        return err({
          message: 'Team-ID är obligatoriskt',
          code: 'VALIDATION_ERROR'
        });
      }

      const teamIdObj = new UniqueId(teamId);
      const result = await this.teamActivityRepository.getLatestForTeam(teamIdObj, limit);
      
      if (result.isErr()) {
        return err({
          message: `Kunde inte hämta senaste aktiviteter: ${result.error}`,
          code: 'DATA_ACCESS_ERROR'
        });
      }
      
      const activities = result.value;
      
      // Konvertera till DTOs
      const activityDTOs: TeamActivityDTO[] = activities.map(activity => ({
        id: activity.id.toString(),
        teamId: activity.teamId.toString(),
        performedBy: activity.performedBy.toString(),
        activityType: activity.activityType,
        targetId: activity.targetId?.toString(),
        metadata: activity.metadata,
        timestamp: activity.timestamp,
        description: activity.getDescription()
      }));
      
      return ok({
        activities: activityDTOs
      });
    } catch (error) {
      return err({
        message: `Ett oväntat fel inträffade: ${error instanceof Error ? error.message : String(error)}`,
        code: 'UNEXPECTED_ERROR'
      });
    }
  }
  
  /**
   * Hämta aktivitetsstatistik för ett team
   */
  async getActivityStats(teamId: string): Promise<Result<GetActivityStatsResponse, GetTeamActivitiesError>> {
    try {
      if (!teamId) {
        return err({
          message: 'Team-ID är obligatoriskt',
          code: 'VALIDATION_ERROR'
        });
      }

      const teamIdObj = new UniqueId(teamId);
      const result = await this.teamActivityRepository.getGroupedByType(teamIdObj);
      
      if (result.isErr()) {
        return err({
          message: `Kunde inte hämta aktivitetsstatistik: ${result.error}`,
          code: 'DATA_ACCESS_ERROR'
        });
      }
      
      return ok({
        stats: result.value
      });
    } catch (error) {
      return err({
        message: `Ett oväntat fel inträffade: ${error instanceof Error ? error.message : String(error)}`,
        code: 'UNEXPECTED_ERROR'
      });
    }
  }
} 