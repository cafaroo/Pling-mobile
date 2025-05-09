import { SupabaseClient } from '@supabase/supabase-js';
import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/domain/core/UniqueId';
import { TeamStatistics, StatisticsPeriod } from '@/domain/team/value-objects/TeamStatistics';
import { TeamStatisticsRepository } from '@/domain/team/repositories/TeamStatisticsRepository';
import { TeamGoal } from '@/domain/team/entities/TeamGoal';
import { TeamActivity } from '@/domain/team/entities/TeamActivity';

export class SupabaseTeamStatisticsRepository implements TeamStatisticsRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getStatistics(
    teamId: UniqueId,
    period: StatisticsPeriod
  ): Promise<Result<TeamStatistics, string>> {
    try {
      // Hämta alla mål för teamet
      const { data: goals, error: goalsError } = await this.supabase
        .from('team_goals')
        .select('*')
        .eq('team_id', teamId.toString());

      if (goalsError) throw goalsError;

      // Hämta alla aktiviteter för teamet
      const { data: activities, error: activitiesError } = await this.supabase
        .from('team_activities')
        .select('*')
        .eq('team_id', teamId.toString())
        .gte('created_at', this.getStartDateForPeriod(period).toISOString());

      if (activitiesError) throw activitiesError;

      // Konvertera data till domänmodeller
      const teamGoalsResults = goals.map(goal => TeamGoal.create({
        id: new UniqueId(goal.id),
        teamId: new UniqueId(goal.team_id),
        title: goal.title,
        description: goal.description,
        startDate: new Date(goal.start_date),
        dueDate: goal.due_date ? new Date(goal.due_date) : undefined,
        status: goal.status,
        progress: goal.progress,
        createdBy: new UniqueId(goal.created_by),
        createdAt: new Date(goal.created_at),
        updatedAt: new Date(goal.updated_at)
      }));
      
      const teamGoals = teamGoalsResults
        .filter(result => result.isOk())
        .map(result => result.value);

      const teamActivitiesResults = activities.map(activity => TeamActivity.create({
        id: new UniqueId(activity.id),
        teamId: new UniqueId(activity.team_id),
        type: activity.type,
        userId: new UniqueId(activity.user_id),
        timestamp: new Date(activity.created_at),
        metadata: activity.metadata
      }));
      
      const teamActivities = teamActivitiesResults
        .filter(result => result.isOk())
        .map(result => result.value);

      // Beräkna statistik
      return TeamStatistics.calculateFromGoals(
        teamId,
        teamGoals,
        teamActivities,
        period
      );
    } catch (error) {
      return err(`Kunde inte hämta teamstatistik: ${error.message}`);
    }
  }

  async getStatisticsForTeams(
    teamIds: UniqueId[],
    period: StatisticsPeriod
  ): Promise<Result<TeamStatistics[], string>> {
    try {
      const results = await Promise.all(
        teamIds.map(teamId => this.getStatistics(teamId, period))
      );

      const errors = results.filter(result => result.isErr());
      if (errors.length > 0) {
        return err(
          `Kunde inte hämta statistik för alla team: ${errors
            .map(e => e.error)
            .join(', ')}`
        );
      }

      const validStats = results
        .filter(result => result.isOk())
        .map(result => result.value);
        
      return ok(validStats);
    } catch (error) {
      return err(`Kunde inte hämta teamstatistik: ${error.message}`);
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
      const { data, error } = await this.supabase
        .from('team_statistics')
        .select('*')
        .eq('team_id', teamId.toString())
        .eq('period', period)
        .gte('last_updated', startDate.toISOString())
        .lte('last_updated', endDate.toISOString())
        .order('last_updated', { ascending: true });

      if (error) throw error;

      const stats = data.map(stats => 
        new TeamStatistics({
          teamId: new UniqueId(stats.team_id),
          period: stats.period,
          activityCount: stats.activity_count,
          completedGoals: stats.completed_goals,
          activeGoals: stats.active_goals,
          memberParticipation: stats.member_participation,
          averageGoalProgress: stats.average_goal_progress,
          goalsByStatus: stats.goals_by_status,
          activityTrend: stats.activity_trend,
          lastUpdated: new Date(stats.last_updated)
        })
      );
        
      return ok(stats);
    } catch (error) {
      return err(`Kunde inte hämta statistiktrend: ${error.message}`);
    }
  }

  private getStartDateForPeriod(period: StatisticsPeriod): Date {
    const now = new Date();
    switch (period) {
      case StatisticsPeriod.DAILY:
        now.setDate(now.getDate() - 1);
        break;
      case StatisticsPeriod.WEEKLY:
        now.setDate(now.getDate() - 7);
        break;
      case StatisticsPeriod.MONTHLY:
        now.setMonth(now.getMonth() - 1);
        break;
      case StatisticsPeriod.YEARLY:
        now.setFullYear(now.getFullYear() - 1);
        break;
    }
    return now;
  }
} 