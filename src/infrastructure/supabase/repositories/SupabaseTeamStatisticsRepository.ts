import { SupabaseClient } from '@supabase/supabase-js';
import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/domain/core/UniqueId';
import { TeamStatistics, StatisticsPeriod, ActivityTrend } from '@/domain/team/value-objects/TeamStatistics';
import { TeamStatisticsRepository } from '@/domain/team/repositories/TeamStatisticsRepository';
import { TeamGoal } from '@/domain/team/entities/TeamGoal';
import { TeamActivity } from '@/domain/team/entities/TeamActivity';

interface DailyStatDTO {
  date: string;
  activity_count: number;
  active_members: number;
  activity_breakdown: Record<string, number>;
}

export class SupabaseTeamStatisticsRepository implements TeamStatisticsRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getStatistics(
    teamId: UniqueId,
    period: StatisticsPeriod
  ): Promise<Result<TeamStatistics, string>> {
    try {
      // Beräkna start- och slutdatum baserat på period
      const { startDate, endDate } = this.getDateRangeForPeriod(period);
      
      // Hämta statistik från materialized view via RPC-funktionen
      const { data: dailyStats, error } = await this.supabase.rpc(
        'get_team_statistics',
        {
          p_team_id: teamId.toString(),
          p_start_date: startDate.toISOString(),
          p_end_date: endDate.toISOString()
        }
      );

      if (error) throw error;

      // Om det inte finns några data, hämta mål för att fortsätta beräkningen
      if (!dailyStats || dailyStats.length === 0) {
        // Hämta grundläggande teamdata för att skapa en tom statistikinstans
        const { data: teamData, error: teamError } = await this.supabase
          .from('teams')
          .select('id, created_at')
          .eq('id', teamId.toString())
          .single();

        if (teamError) throw teamError;

        return ok(new TeamStatistics({
          teamId,
          period,
          activityCount: 0,
          completedGoals: 0,
          activeGoals: 0,
          memberParticipation: 0,
          averageGoalProgress: 0,
          goalsByStatus: {},
          activityTrend: [],
          lastUpdated: new Date()
        }));
      }

      // Beräkna statistik från dagliga data
      return this.calculateStatisticsFromDailyStats(teamId, period, dailyStats);
    } catch (error) {
      return err(`Kunde inte hämta teamstatistik: ${error.message}`);
    }
  }

  async getStatisticsForTeams(
    teamIds: UniqueId[],
    period: StatisticsPeriod
  ): Promise<Result<TeamStatistics[], string>> {
    try {
      if (teamIds.length === 0) {
        return ok([]);
      }

      const { startDate, endDate } = this.getDateRangeForPeriod(period);
      
      // Använd den optimerade RPC-funktionen för flera team
      const { data: dailyStatsByTeam, error } = await this.supabase.rpc(
        'get_teams_activity_trend',
        {
          p_team_ids: teamIds.map(id => id.toString()),
          p_start_date: startDate.toISOString(),
          p_end_date: endDate.toISOString()
        }
      );

      if (error) throw error;

      // Gruppera statistiken per team
      const statsByTeamId: Record<string, DailyStatDTO[]> = {};
      
      dailyStatsByTeam.forEach(stat => {
        const teamIdStr = stat.team_id;
        if (!statsByTeamId[teamIdStr]) {
          statsByTeamId[teamIdStr] = [];
        }
        statsByTeamId[teamIdStr].push({
          date: stat.date,
          activity_count: stat.activity_count,
          active_members: stat.active_members,
          activity_breakdown: stat.activity_breakdown
        });
      });
      
      // Beräkna statistik för varje team
      const teamStats: TeamStatistics[] = [];
      
      for (const teamIdStr in statsByTeamId) {
        const teamId = new UniqueId(teamIdStr);
        const result = await this.calculateStatisticsFromDailyStats(
          teamId, 
          period, 
          statsByTeamId[teamIdStr]
        );
        
        if (result.isOk()) {
          teamStats.push(result.value);
        }
      }
      
      // Skapa tom statistik för team utan aktiviteter
      const teamsWithStats = new Set(Object.keys(statsByTeamId));
      
      for (const teamId of teamIds) {
        const teamIdStr = teamId.toString();
        if (!teamsWithStats.has(teamIdStr)) {
          teamStats.push(new TeamStatistics({
            teamId,
            period,
            activityCount: 0,
            completedGoals: 0,
            activeGoals: 0,
            memberParticipation: 0,
            averageGoalProgress: 0,
            goalsByStatus: {},
            activityTrend: [],
            lastUpdated: new Date()
          }));
        }
      }
      
      return ok(teamStats);
    } catch (error) {
      return err(`Kunde inte hämta statistik för alla team: ${error.message}`);
    }
  }

  async saveStatistics(
    statistics: TeamStatistics
  ): Promise<Result<void, string>> {
    try {
      const { error } = await this.supabase
        .from('team_statistics')
        .upsert({
          team_id: statistics.teamId.toString(),
          period: statistics.period,
          activity_count: statistics.activityCount,
          completed_goals: statistics.completedGoals,
          active_goals: statistics.activeGoals,
          member_participation: statistics.memberParticipation,
          average_goal_progress: statistics.averageGoalProgress,
          goals_by_status: statistics.goalsByStatus,
          activity_trend: statistics.activityTrend,
          last_updated: statistics.lastUpdated.toISOString()
        });

      if (error) throw error;
      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte spara teamstatistik: ${error.message}`);
    }
  }

  async deleteStatistics(
    teamId: UniqueId,
    period: StatisticsPeriod
  ): Promise<Result<void, string>> {
    try {
      const { error } = await this.supabase
        .from('team_statistics')
        .delete()
        .eq('team_id', teamId.toString())
        .eq('period', period);

      if (error) throw error;
      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte radera teamstatistik: ${error.message}`);
    }
  }

  async getStatisticsTrend(
    teamId: UniqueId,
    period: StatisticsPeriod,
    startDate: Date,
    endDate: Date
  ): Promise<Result<TeamStatistics[], string>> {
    try {
      // Använd den optimerade RPC-funktionen för att hämta trenddata
      const { data, error } = await this.supabase.rpc(
        'get_team_statistics',
        {
          p_team_id: teamId.toString(),
          p_start_date: startDate.toISOString(),
          p_end_date: endDate.toISOString()
        }
      );

      if (error) throw error;

      if (!data || data.length === 0) {
        return ok([]);
      }

      // Gruppera statistik per period (dag/vecka/månad) beroende på önskad granularitet
      const statsByPeriod = this.groupStatsByPeriod(data, period);
      
      // Konvertera varje period till TeamStatistics-objekt
      const trendStats: TeamStatistics[] = [];
      
      for (const periodKey in statsByPeriod) {
        const periodStats = statsByPeriod[periodKey];
        const periodStartDate = new Date(periodKey);
        
        // Beräkna statistik för perioden
        const result = await this.calculateStatisticsFromDailyStats(
          teamId,
          period,
          periodStats,
          periodStartDate
        );
        
        if (result.isOk()) {
          trendStats.push(result.value);
        }
      }
      
      // Sortera efter datum
      trendStats.sort((a, b) => 
        a.lastUpdated.getTime() - b.lastUpdated.getTime()
      );
      
      return ok(trendStats);
    } catch (error) {
      return err(`Kunde inte hämta statistiktrend: ${error.message}`);
    }
  }

  private getDateRangeForPeriod(period: StatisticsPeriod): { startDate: Date, endDate: Date } {
    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
      case StatisticsPeriod.DAILY:
        startDate.setDate(startDate.getDate() - 1);
        break;
      case StatisticsPeriod.WEEKLY:
        startDate.setDate(startDate.getDate() - 7);
        break;
      case StatisticsPeriod.MONTHLY:
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case StatisticsPeriod.YEARLY:
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    return { startDate, endDate };
  }

  private groupStatsByPeriod(dailyStats: DailyStatDTO[], period: StatisticsPeriod): Record<string, DailyStatDTO[]> {
    const statsByPeriod: Record<string, DailyStatDTO[]> = {};
    
    dailyStats.forEach(stat => {
      const date = new Date(stat.date);
      let periodKey: string;
      
      switch (period) {
        case StatisticsPeriod.DAILY:
          // Använd datum som nyckel
          periodKey = date.toISOString().split('T')[0];
          break;
        case StatisticsPeriod.WEEKLY:
          // Använd första dagen i veckan som nyckel
          const dayOfWeek = date.getDay();
          const firstDayOfWeek = new Date(date);
          firstDayOfWeek.setDate(date.getDate() - dayOfWeek);
          periodKey = firstDayOfWeek.toISOString().split('T')[0];
          break;
        case StatisticsPeriod.MONTHLY:
          // Använd första dagen i månaden som nyckel
          periodKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-01`;
          break;
        case StatisticsPeriod.YEARLY:
          // Använd första dagen i året som nyckel
          periodKey = `${date.getFullYear()}-01-01`;
          break;
      }
      
      if (!statsByPeriod[periodKey]) {
        statsByPeriod[periodKey] = [];
      }
      
      statsByPeriod[periodKey].push(stat);
    });
    
    return statsByPeriod;
  }

  private async calculateStatisticsFromDailyStats(
    teamId: UniqueId,
    period: StatisticsPeriod,
    dailyStats: DailyStatDTO[],
    referenceDate: Date = new Date()
  ): Promise<Result<TeamStatistics, string>> {
    try {
      if (dailyStats.length === 0) {
        return ok(new TeamStatistics({
          teamId,
          period,
          activityCount: 0,
          completedGoals: 0,
          activeGoals: 0,
          memberParticipation: 0,
          averageGoalProgress: 0,
          goalsByStatus: {},
          activityTrend: [],
          lastUpdated: referenceDate
        }));
      }

      // Hämta målstatistik för teamet
      const { data: goalStats, error: goalError } = await this.supabase.rpc(
        'get_team_goal_stats',
        { p_team_id: teamId.toString() }
      );

      if (goalError) throw goalError;

      // Beräkna aktivitetsantal
      const activityCount = dailyStats.reduce((sum, day) => sum + day.activity_count, 0);
      
      // Beräkna antal aktiva medlemmar (approximation - kan behöva förbättras om vi vill ha exakt unika medlemmar)
      const maxActiveMembers = Math.max(...dailyStats.map(day => day.active_members));
      
      // Beräkna aktivitetsfördelning
      const activityBreakdown = dailyStats.reduce((breakdown, day) => {
        Object.entries(day.activity_breakdown).forEach(([type, count]) => {
          breakdown[type] = (breakdown[type] || 0) + count;
        });
        return breakdown;
      }, {} as Record<string, number>);

      // Beräkna aktivitetstrend
      const activityTrend: ActivityTrend[] = dailyStats
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(day => ({
          date: new Date(day.date),
          count: day.activity_count
        }));

      // Skapa team statistics objekt
      return ok(new TeamStatistics({
        teamId,
        period,
        activityCount,
        completedGoals: goalStats?.completed_goals || 0,
        activeGoals: goalStats?.active_goals || 0,
        memberParticipation: maxActiveMembers,
        averageGoalProgress: goalStats?.average_completion || 0,
        goalsByStatus: {
          active: goalStats?.active_goals || 0,
          completed: goalStats?.completed_goals || 0
          // Lägg till fler statusar om det behövs
        },
        activityTrend,
        lastUpdated: referenceDate
      }));
    } catch (error) {
      return err(`Kunde inte beräkna statistik från dagliga data: ${error.message}`);
    }
  }
} 