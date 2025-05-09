import { SupabaseClient } from '@supabase/supabase-js';
import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { TeamActivity } from '@/domain/team/entities/TeamActivity';
import { TeamActivityRepository } from '@/domain/team/repositories/TeamActivityRepository';
import { TeamStatistics, StatisticsPeriod } from '@/domain/team/value-objects/TeamStatistics';
import { CacheService } from '../../cache/CacheService';
import { LoggingService } from '../../logger/LoggingService';
import { PerformanceMonitor } from '../../monitoring/PerformanceMonitor';
import { EventBus } from '@/shared/core/EventBus';

// Importera OperationType direkt från mocken i testmiljö
const OperationType = {
  DATABASE_READ: 'DATABASE_READ',
  DATABASE_WRITE: 'DATABASE_WRITE',
  CACHE_READ: 'CACHE_READ',
  CACHE_WRITE: 'CACHE_WRITE',
  API_CALL: 'API_CALL',
  COMPUTATION: 'COMPUTATION'
} as const;

/**
 * Optimerad TeamActivityRepository med caching, loggning och prestandaövervakning
 */
export class OptimizedTeamActivityRepository implements TeamActivityRepository {
  private readonly cacheService: CacheService;
  private readonly logger: LoggingService;
  private readonly performance: PerformanceMonitor;
  private readonly cacheKeyPrefix = 'team_activity';
  
  constructor(
    private readonly supabaseClient: SupabaseClient,
    private readonly eventBus: EventBus
  ) {
    this.cacheService = new CacheService('team_activities', {
      ttl: 5 * 60 * 1000, // 5 minuter cachning
      version: '1.0',
      debug: false
    });
    
    this.logger = LoggingService.getInstance();
    this.performance = PerformanceMonitor.getInstance();
  }

  /**
   * Hämta statistik för ett team med caching
   */
  async getStatistics(
    teamId: UniqueId,
    period: StatisticsPeriod = StatisticsPeriod.WEEKLY
  ): Promise<Result<TeamStatistics, string>> {
    const cacheKey = `team_activity_stats_${teamId}_${period}`;
    
    // Försök hämta från cache först
    const cachedResult = await this.cacheService.get<TeamStatistics>(cacheKey);
    if (cachedResult) {
      this.logger.debug(`Cache hit för team statistik: ${teamId}`);
      return cachedResult;
    }
    
    return this.performance.measure(
      OperationType.DATABASE_READ,
      'getTeamStatistics',
      async () => {
        try {
          const { data, error } = await this.supabaseClient.rpc('get_team_statistics', {
            team_id: teamId.toString(),
            period_type: period.toLowerCase()
          });

          if (error) {
            this.logger.error(`Fel vid hämtning av teamstatistik: ${error.message}`);
            return err('Kunde inte hämta teamstatistik: ' + error.message);
          }

          const statistics = this.mapToTeamStatistics(data[0], teamId, period);
          await this.cacheService.set(cacheKey, statistics);
          
          return ok(statistics);
        } catch (error) {
          this.logger.error(`Oväntat fel vid hämtning av teamstatistik: ${error}`);
          return err('Ett oväntat fel uppstod vid hämtning av teamstatistik');
        }
      }
    );
  }

  /**
   * Invalidera cache för ett team
   */
  async invalidateTeamCache(teamId: string): Promise<void> {
    this.logger.debug(`Invaliderar cache för team: ${teamId}`);
    
    // Invalidera cache för alla perioder
    const periods = Object.values(StatisticsPeriod);
    for (const period of periods) {
      await this.cacheService.remove(`team_activity_stats_${teamId}_${period}`);
    }
  }

  private mapToTeamStatistics(data: any, teamId: UniqueId, period: StatisticsPeriod): TeamStatistics {
    return {
      teamId,
      period,
      activityCount: data.activity_count || 0,
      completedGoals: data.completed_goals || 0,
      activeGoals: data.active_goals || 0,
      memberParticipation: data.member_participation || 0,
      averageGoalProgress: data.average_goal_progress || 0,
      goalsByStatus: data.goals_by_status || {},
      activityTrend: data.activity_trend || [],
      lastUpdated: new Date()
    };
  }

  private getStartDateForPeriod(now: Date, period: StatisticsPeriod): Date {
    const startDate = new Date(now);
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
    return startDate;
  }
} 