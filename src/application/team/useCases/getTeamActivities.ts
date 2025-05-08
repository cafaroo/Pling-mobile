import { UniqueId } from '@/shared/core/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';
import { UseCase } from '@/shared/core/UseCase';
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

// Resultat av aktivitetssökning med sidnumrering
export interface TeamActivitiesResult {
  activities: TeamActivityDTO[];
  total: number;
  hasMore: boolean;
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

/**
 * Användarfall för att hämta teamaktiviteter
 */
export class GetTeamActivitiesUseCase implements UseCase<GetTeamActivitiesDTO, Result<TeamActivitiesResult, string>> {
  constructor(
    private readonly activityRepository: TeamActivityRepository,
    private readonly teamRepository: TeamRepository
  ) {}
  
  /**
   * Hämta aktiviteter för ett team med filtrering och sidbrytning
   */
  async execute(dto: GetTeamActivitiesDTO): Promise<Result<TeamActivitiesResult, string>> {
    try {
      // Validera att teamet existerar och att användaren har rätt att se aktiviteter
      const teamId = new UniqueId(dto.teamId);
      const teamResult = await this.teamRepository.findById(teamId);
      
      if (teamResult.isErr()) {
        return err(`Kunde inte hämta aktiviteter: ${teamResult.error}`);
      }
      
      const team = teamResult.getValue();
      
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
        this.activityRepository.search(filterOptions),
        this.activityRepository.count({
          ...filterOptions,
          limit: undefined,
          offset: undefined
        })
      ]);
      
      if (activitiesResult.isErr()) {
        return err(`Kunde inte hämta aktiviteter: ${activitiesResult.error}`);
      }
      
      if (countResult.isErr()) {
        return err(`Kunde inte räkna aktiviteter: ${countResult.error}`);
      }
      
      const activities = activitiesResult.getValue();
      const total = countResult.getValue();
      
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
      return err(`Ett oväntat fel uppstod: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Hämta de senaste aktiviteterna för ett team
   */
  async getLatestActivities(
    teamId: string, 
    limit: number = 10
  ): Promise<Result<TeamActivityDTO[], string>> {
    try {
      const teamIdObj = new UniqueId(teamId);
      const result = await this.activityRepository.getLatestForTeam(teamIdObj, limit);
      
      if (result.isErr()) {
        return err(`Kunde inte hämta senaste aktiviteter: ${result.error}`);
      }
      
      const activities = result.getValue();
      
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
      
      return ok(activityDTOs);
    } catch (error) {
      return err(`Ett oväntat fel uppstod: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Hämta aktivitetsstatistik för ett team
   */
  async getActivityStats(teamId: string): Promise<Result<Record<ActivityType, number>, string>> {
    try {
      const teamIdObj = new UniqueId(teamId);
      const result = await this.activityRepository.getGroupedByType(teamIdObj);
      
      if (result.isErr()) {
        return err(`Kunde inte hämta aktivitetsstatistik: ${result.error}`);
      }
      
      return ok(result.getValue());
    } catch (error) {
      return err(`Ett oväntat fel uppstod: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 