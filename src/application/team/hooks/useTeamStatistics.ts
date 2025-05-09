import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UniqueId } from '@/domain/core/UniqueId';
import { TeamStatistics, StatisticsPeriod } from '@/domain/team/value-objects/TeamStatistics';
import { InfrastructureFactory } from '@/infrastructure/InfrastructureFactory';
import { TEAM_CACHE_CONFIG } from '@/infrastructure/cache/TeamCache';
import { supabase } from '@/infrastructure/supabase/supabaseClient';
import { getEventBus } from '@/infrastructure/events/eventBus';

const TEAM_STATISTICS_CACHE_KEY = 'team_statistics';

export const useTeamStatistics = (
  teamId: string,
  period: StatisticsPeriod = StatisticsPeriod.WEEKLY
) => {
  const queryClient = useQueryClient();
  const infrastructureFactory = InfrastructureFactory.getInstance();
  const repository = infrastructureFactory.getTeamActivityRepository();

  const queryKey = [TEAM_STATISTICS_CACHE_KEY, teamId, period];

  const { data: statistics, error, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const result = await repository.getStatistics(
        new UniqueId(teamId),
        period
      );

      if (result.isErr()) {
        throw new Error(result.error);
      }

      return result.value;
    },
    ...TEAM_CACHE_CONFIG,
    retry: false,
    staleTime: Infinity // Förhindra automatisk omhämtning under test
  });

  const updateStatisticsOptimistically = (newStats: TeamStatistics) => {
    // Uppdatera React Query cache direkt
    queryClient.setQueryData<TeamStatistics>(queryKey, (oldData) => ({
      ...oldData,
      ...newStats,
      teamId: new UniqueId(teamId),
      period,
      lastUpdated: new Date()
    }));
  };

  const invalidateStatistics = async () => {
    await repository.invalidateTeamCache(teamId);
    await queryClient.invalidateQueries({
      queryKey: [TEAM_STATISTICS_CACHE_KEY, teamId]
    });
  };

  return {
    statistics,
    error: error as Error | null,
    isLoading,
    updateStatisticsOptimistically,
    invalidateStatistics
  };
};

export const teamStatisticsKeys = {
  all: ['team-statistics'] as const,
  lists: () => [...teamStatisticsKeys.all, 'list'] as const,
  list: (period: StatisticsPeriod) => [...teamStatisticsKeys.lists(), period] as const,
  details: () => [...teamStatisticsKeys.all, 'detail'] as const,
  detail: (teamId: string, period: StatisticsPeriod) => 
    [...teamStatisticsKeys.details(), teamId, period] as const,
  trends: () => [...teamStatisticsKeys.all, 'trends'] as const,
  trend: (teamId: string, period: StatisticsPeriod) =>
    [...teamStatisticsKeys.trends(), teamId, period] as const,
};

export interface UseTeamStatisticsOptions {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
}

const DEFAULT_OPTIONS: UseTeamStatisticsOptions = {
  enabled: true,
  staleTime: 5 * 60 * 1000, // 5 minuter
  cacheTime: 30 * 60 * 1000, // 30 minuter
};

export function useTeamStatisticsForTeams(
  teamIds: UniqueId[],
  period: StatisticsPeriod = StatisticsPeriod.WEEKLY,
  options: UseTeamStatisticsOptions = {}
) {
  const repository = useSupabaseTeamStatisticsRepository();
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  return useQuery({
    queryKey: teamStatisticsKeys.list(period),
    queryFn: () => repository.getStatisticsForTeams(teamIds, period),
    select: (result) => result.isErr() ? [] : result.value,
    staleTime: mergedOptions.staleTime,
    gcTime: mergedOptions.cacheTime,
    enabled: mergedOptions.enabled && teamIds.length > 0,
  });
}

export function useTeamStatisticsTrend(
  teamId: UniqueId,
  period: StatisticsPeriod = StatisticsPeriod.WEEKLY,
  startDate: Date,
  endDate: Date,
  options: UseTeamStatisticsOptions = {}
) {
  const repository = useSupabaseTeamStatisticsRepository();
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  return useQuery({
    queryKey: teamStatisticsKeys.trend(teamId.toString(), period),
    queryFn: () => repository.getStatisticsTrend(teamId, period, startDate, endDate),
    select: (result) => result.isErr() ? [] : result.value,
    staleTime: mergedOptions.staleTime,
    gcTime: mergedOptions.cacheTime,
  });
} 