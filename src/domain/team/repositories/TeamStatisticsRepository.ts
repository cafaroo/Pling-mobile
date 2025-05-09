import { Result } from '@/shared/core/Result';
import { UniqueId } from '@/domain/core/UniqueId';
import { TeamStatistics, StatisticsPeriod } from '../value-objects/TeamStatistics';

export interface TeamStatisticsRepository {
  /**
   * Hämtar statistik för ett specifikt team och period
   */
  getStatistics(
    teamId: UniqueId,
    period: StatisticsPeriod
  ): Promise<Result<TeamStatistics, string>>;

  /**
   * Hämtar statistik för flera team och period
   */
  getStatisticsForTeams(
    teamIds: UniqueId[],
    period: StatisticsPeriod
  ): Promise<Result<TeamStatistics[], string>>;

  /**
   * Uppdaterar eller skapar statistik för ett team
   */
  saveStatistics(
    statistics: TeamStatistics
  ): Promise<Result<void, string>>;

  /**
   * Raderar statistik för ett team och period
   */
  deleteStatistics(
    teamId: UniqueId,
    period: StatisticsPeriod
  ): Promise<Result<void, string>>;

  /**
   * Hämtar trenddata för ett team över tid
   */
  getStatisticsTrend(
    teamId: UniqueId,
    period: StatisticsPeriod,
    startDate: Date,
    endDate: Date
  ): Promise<Result<TeamStatistics[], string>>;
} 