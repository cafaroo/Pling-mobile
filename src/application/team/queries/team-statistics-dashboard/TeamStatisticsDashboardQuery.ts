import { Result, ok, err } from '@/shared/core/Result';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { TeamActivityRepository } from '@/domain/team/repositories/TeamActivityRepository';
import { TeamStatisticsRepository } from '@/domain/team/repositories/TeamStatisticsRepository';
import { UniqueId } from '@/shared/core/UniqueId';
import { StatisticsPeriod, TeamStatistics } from '@/domain/team/value-objects/TeamStatistics';
import { TeamDTOMapper } from '../../dto/TeamDTOMapper';

export interface TeamStatisticsDashboardParams {
  teamId: string;
  period?: StatisticsPeriod;
  includeTrends?: boolean;
  includeMemberStats?: boolean;
  includeTeamDetails?: boolean;
  includeActivities?: boolean;
  limit?: number; // för aktiviteter
}

export interface TeamMemberStats {
  userId: string;
  name: string;
  activitiesCount: number;
  lastActive?: string;
  contributionPercentage: number;
}

export interface TeamActivity {
  id: string;
  type: string;
  performedBy: string;
  performedByName: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface StatisticsItem {
  timestamp: string;
  value: number;
}

export interface StatisticsTrends {
  activityTrend: StatisticsItem[];
  memberActivityTrend: StatisticsItem[];
  completionRateTrend: StatisticsItem[];
}

export interface TeamStatisticsDashboardResult {
  teamId: string;
  teamName: string;
  teamDetails?: {
    description?: string;
    memberCount: number;
    ownerId: string;
    createdAt: string;
    isPrivate: boolean;
  };
  currentStats: {
    totalActivities: number;
    activeMembers: number;
    totalMembers: number;
    activitiesLast7Days: number;
    activitiesLast30Days: number;
    completionRate: number;
    avgActivitiesPerMember: number;
  };
  topMembers?: TeamMemberStats[];
  recentActivities?: TeamActivity[];
  trends?: StatisticsTrends;
}

/**
 * TeamStatisticsDashboardQuery
 * 
 * En specialiserad query för att hämta kombinerade statistikuppgifter 
 * för ett team till en dashboard-vy.
 */
export class TeamStatisticsDashboardQuery {
  constructor(
    private teamRepository: TeamRepository,
    private teamActivityRepository: TeamActivityRepository,
    private teamStatisticsRepository: TeamStatisticsRepository
  ) {}

  /**
   * Utför hämtning av kombinerade statistikuppgifter för en dashboard
   */
  async execute(params: TeamStatisticsDashboardParams): Promise<Result<TeamStatisticsDashboardResult, string>> {
    try {
      if (!params.teamId) {
        return err('teamId är obligatoriskt');
      }

      const teamId = new UniqueId(params.teamId);
      const period = params.period || StatisticsPeriod.WEEKLY;
      const limit = params.limit || 10;
      
      // Hämta grundläggande team-information
      const teamResult = await this.teamRepository.findById(teamId);
      
      if (teamResult.isErr()) {
        return err(`Kunde inte hämta team: ${teamResult.error}`);
      }
      
      const team = teamResult.value;
      
      if (!team) {
        return err(`Teamet hittades inte`);
      }
      
      // Hämta statistik för teamet
      const statsResult = await this.teamStatisticsRepository.getStatistics(teamId, period);
      
      if (statsResult.isErr()) {
        return err(`Kunde inte hämta statistik: ${statsResult.error}`);
      }
      
      const stats = statsResult.value;
      
      // Förbered grundläggande resultat
      const result: TeamStatisticsDashboardResult = {
        teamId: teamId.toString(),
        teamName: team.name,
        currentStats: {
          totalActivities: stats.totalActivities,
          activeMembers: stats.activeMembers,
          totalMembers: team.members.length,
          activitiesLast7Days: stats.activitiesLast7Days,
          activitiesLast30Days: stats.activitiesLast30Days,
          completionRate: stats.completionRate,
          avgActivitiesPerMember: stats.avgActivitiesPerMember
        }
      };
      
      // Lägg till teamdetaljer om det efterfrågas
      if (params.includeTeamDetails) {
        result.teamDetails = {
          description: team.description,
          memberCount: team.members.length,
          ownerId: team.ownerId.toString(),
          createdAt: team.createdAt.toISOString(),
          isPrivate: team.settings.isPrivate
        };
      }
      
      // Hämta medlemsstatistik om det efterfrågas
      if (params.includeMemberStats) {
        const memberStatsResult = await this.getMemberStats(teamId);
        
        if (memberStatsResult.isErr()) {
          return err(`Kunde inte hämta medlemsstatistik: ${memberStatsResult.error}`);
        }
        
        result.topMembers = memberStatsResult.value;
      }
      
      // Hämta aktiviteter om det efterfrågas
      if (params.includeActivities) {
        const activitiesResult = await this.getTeamActivities(teamId, limit);
        
        if (activitiesResult.isErr()) {
          return err(`Kunde inte hämta aktiviteter: ${activitiesResult.error}`);
        }
        
        result.recentActivities = activitiesResult.value;
      }
      
      // Hämta trender om det efterfrågas
      if (params.includeTrends) {
        const trendsResult = await this.getStatisticsTrends(teamId, period);
        
        if (trendsResult.isErr()) {
          return err(`Kunde inte hämta trender: ${trendsResult.error}`);
        }
        
        result.trends = trendsResult.value;
      }
      
      return ok(result);
    } catch (error) {
      return err(`Ett fel inträffade vid hämtning av team-statistik: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Hjälpmetod för att hämta medlemsstatistik
   */
  private async getMemberStats(teamId: UniqueId): Promise<Result<TeamMemberStats[], string>> {
    try {
      // Hämta aktiviteter för teamet
      const activitiesResult = await this.teamActivityRepository.findByTeam(teamId);
      
      if (activitiesResult.isErr()) {
        return err(`Kunde inte hämta aktiviteter: ${activitiesResult.error}`);
      }
      
      const activities = activitiesResult.value;
      
      // Hämta teamet för att få medlemsinformation
      const teamResult = await this.teamRepository.findById(teamId);
      
      if (teamResult.isErr()) {
        return err(`Kunde inte hämta team: ${teamResult.error}`);
      }
      
      const team = teamResult.value;
      
      if (!team) {
        return err('Teamet hittades inte');
      }
      
      // Beräkna statistik per användare
      const memberStatsMap = new Map<string, {
        count: number;
        lastActive?: Date;
        name: string;
      }>();
      
      // Ange grundläggande information för alla medlemmar
      team.members.forEach(member => {
        memberStatsMap.set(member.userId.toString(), {
          count: 0,
          name: `Medlem ${member.userId.toString().substring(0, 6)}...`, // Placeholder-namn
          lastActive: undefined
        });
      });
      
      // Beräkna aktivitetsstatistik från teamaktiviteter
      activities.forEach(activity => {
        const userId = activity.performedBy.toString();
        const stats = memberStatsMap.get(userId) || {
          count: 0,
          name: `Medlem ${userId.substring(0, 6)}...`,
          lastActive: undefined
        };
        
        stats.count += 1;
        
        if (!stats.lastActive || activity.timestamp > stats.lastActive) {
          stats.lastActive = activity.timestamp;
        }
        
        memberStatsMap.set(userId, stats);
      });
      
      // Beräkna totala antalet aktiviteter
      const totalActivities = activities.length;
      
      // Konvertera till lista och sortera efter aktivitetsantal
      const memberStats: TeamMemberStats[] = Array.from(memberStatsMap.entries())
        .map(([userId, stats]) => ({
          userId,
          name: stats.name,
          activitiesCount: stats.count,
          lastActive: stats.lastActive?.toISOString(),
          contributionPercentage: totalActivities > 0 ? (stats.count / totalActivities) * 100 : 0
        }))
        .sort((a, b) => b.activitiesCount - a.activitiesCount);
      
      return ok(memberStats);
    } catch (error) {
      return err(`Ett fel inträffade vid hämtning av medlemsstatistik: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Hjälpmetod för att hämta teamaktiviteter
   */
  private async getTeamActivities(teamId: UniqueId, limit: number): Promise<Result<TeamActivity[], string>> {
    try {
      // Hämta aktiviteter för teamet
      const activitiesResult = await this.teamActivityRepository.findByTeam(teamId, { limit });
      
      if (activitiesResult.isErr()) {
        return err(`Kunde inte hämta aktiviteter: ${activitiesResult.error}`);
      }
      
      const activities = activitiesResult.value;
      
      // Konvertera till DTO-format
      const activityDTOs: TeamActivity[] = activities.map(activity => ({
        id: activity.id.toString(),
        type: activity.type,
        performedBy: activity.performedBy.toString(),
        performedByName: activity.performerName || `Användare ${activity.performedBy.toString().substring(0, 6)}...`,
        description: activity.description,
        timestamp: activity.timestamp.toISOString(),
        metadata: activity.metadata
      }));
      
      return ok(activityDTOs);
    } catch (error) {
      return err(`Ett fel inträffade vid hämtning av teamaktiviteter: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Hjälpmetod för att hämta statistiktrender
   */
  private async getStatisticsTrends(teamId: UniqueId, period: StatisticsPeriod): Promise<Result<StatisticsTrends, string>> {
    try {
      // Beräkna start- och slutdatum för trendperioden
      const endDate = new Date();
      let startDate = new Date();
      
      // Beräkna startdatum baserat på period
      switch (period) {
        case StatisticsPeriod.DAILY:
          startDate.setDate(startDate.getDate() - 14); // 14 dagars trend
          break;
        case StatisticsPeriod.WEEKLY:
          startDate.setDate(startDate.getDate() - (7 * 10)); // 10 veckors trend
          break;
        case StatisticsPeriod.MONTHLY:
          startDate.setMonth(startDate.getMonth() - 12); // 12 månaders trend
          break;
        default:
          startDate.setDate(startDate.getDate() - 30); // Standardvärde: 30 dagar
      }
      
      // Hämta statistiktrender från repository
      const trendsResult = await this.teamStatisticsRepository.getStatisticsTrend(
        teamId,
        period,
        startDate,
        endDate
      );
      
      if (trendsResult.isErr()) {
        return err(`Kunde inte hämta statistiktrender: ${trendsResult.error}`);
      }
      
      const trendStats = trendsResult.value;
      
      // Konvertera till DTO-format
      const activityTrend: StatisticsItem[] = trendStats.map(stat => ({
        timestamp: stat.timestamp.toISOString(),
        value: stat.totalActivities
      }));
      
      const memberActivityTrend: StatisticsItem[] = trendStats.map(stat => ({
        timestamp: stat.timestamp.toISOString(),
        value: stat.activeMembers
      }));
      
      const completionRateTrend: StatisticsItem[] = trendStats.map(stat => ({
        timestamp: stat.timestamp.toISOString(),
        value: stat.completionRate
      }));
      
      return ok({
        activityTrend,
        memberActivityTrend,
        completionRateTrend
      });
    } catch (error) {
      return err(`Ett fel inträffade vid hämtning av statistiktrender: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 