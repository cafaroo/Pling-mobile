import { useQueryClient } from '@tanstack/react-query';
import { createTeamCache } from '@/infrastructure/cache/TeamCache';
import { useCallback, useMemo } from 'react';

/**
 * Hook för att hantera team-cachning
 */
export const useTeamCache = () => {
  const queryClient = useQueryClient();
  
  // Skapa en instans av TeamCache
  const teamCache = useMemo(() => createTeamCache(queryClient), [queryClient]);
  
  // Wrapper-funktioner för att göra det enklare att använda cache-funktionerna
  const invalidateTeam = useCallback((teamId: string) => {
    return teamCache.invalidateTeam(teamId);
  }, [teamCache]);
  
  const invalidateTeamData = useCallback((
    teamId: string,
    type: 'goals' | 'activities' | 'statistics'
  ) => {
    return teamCache.invalidateTeamData(teamId, type);
  }, [teamCache]);
  
  const updateGoalOptimistically = useCallback((
    teamId: string,
    updatedGoal: Parameters<typeof teamCache.updateGoalOptimistically>[1]
  ) => {
    return teamCache.updateGoalOptimistically(teamId, updatedGoal);
  }, [teamCache]);
  
  const updateActivityOptimistically = useCallback((
    teamId: string,
    newActivity: Parameters<typeof teamCache.updateActivityOptimistically>[1]
  ) => {
    return teamCache.updateActivityOptimistically(teamId, newActivity);
  }, [teamCache]);
  
  const updateStatisticsOptimistically = useCallback((
    teamId: string,
    updatedStats: Parameters<typeof teamCache.updateStatisticsOptimistically>[1]
  ) => {
    return teamCache.updateStatisticsOptimistically(teamId, updatedStats);
  }, [teamCache]);
  
  const setupActiveGoalsCache = useCallback((teamId: string) => {
    return teamCache.setupActiveGoalsCache(teamId);
  }, [teamCache]);
  
  const rollbackOptimisticUpdate = useCallback((
    teamId: string,
    type: Parameters<typeof teamCache.rollbackOptimisticUpdate>[1]
  ) => {
    return teamCache.rollbackOptimisticUpdate(teamId, type);
  }, [teamCache]);
  
  return {
    invalidateTeam,
    invalidateTeamData,
    updateGoalOptimistically,
    updateActivityOptimistically,
    updateStatisticsOptimistically,
    setupActiveGoalsCache,
    rollbackOptimisticUpdate,
  };
}; 