import { QueryClient } from '@tanstack/react-query';
import { TeamGoal } from '@/domain/team/entities/TeamGoal';
import { TeamActivity } from '@/domain/team/entities/TeamActivity';
import { TeamStatistics } from '@/domain/team/value-objects/TeamStatistics';

/**
 * Cachenycklar för team-relaterad data
 */
export const TEAM_CACHE_KEYS = {
  team: (teamId: string) => ['team', teamId],
  teamGoals: (teamId: string) => ['team', teamId, 'goals'],
  teamActivities: (teamId: string) => ['team', teamId, 'activities'],
  teamStatistics: (teamId: string) => ['team', teamId, 'statistics'],
  allTeams: ['teams'],
} as const;

/**
 * Standardkonfiguration för team-cache
 */
export const TEAM_CACHE_CONFIG = {
  // Standardvärden för caching
  staleTime: 5 * 60 * 1000, // 5 minuter
  cacheTime: 30 * 60 * 1000, // 30 minuter
  
  // Specialkonfiguration för aktiva mål
  activeGoals: {
    staleTime: 30 * 1000, // 30 sekunder
    cacheTime: 5 * 60 * 1000, // 5 minuter
    refetchInterval: 30 * 1000, // Uppdatera var 30:e sekund
  },
  
  // Konfiguration för aktiviteter
  activities: {
    staleTime: 60 * 1000, // 1 minut
    cacheTime: 15 * 60 * 1000, // 15 minuter
  },
  
  // Konfiguration för statistik
  statistics: {
    staleTime: 5 * 60 * 1000, // 5 minuter
    cacheTime: 30 * 60 * 1000, // 30 minuter
  }
} as const;

/**
 * Hjälpklass för att hantera team-relaterad cachning
 */
export class TeamCache {
  constructor(private queryClient: QueryClient) {}

  /**
   * Invaliderar all team-relaterad cache
   */
  invalidateTeam(teamId: string) {
    return this.queryClient.invalidateQueries(TEAM_CACHE_KEYS.team(teamId));
  }

  /**
   * Invaliderar specifik team-data
   */
  invalidateTeamData(teamId: string, type: 'goals' | 'activities' | 'statistics') {
    const key = TEAM_CACHE_KEYS[`team${type.charAt(0).toUpperCase() + type.slice(1)}`](teamId);
    return this.queryClient.invalidateQueries(key);
  }

  /**
   * Uppdaterar team-mål optimistiskt
   */
  updateGoalOptimistically(teamId: string, updatedGoal: TeamGoal) {
    this.queryClient.setQueryData(
      TEAM_CACHE_KEYS.teamGoals(teamId),
      (oldGoals: TeamGoal[] | undefined) => {
        if (!oldGoals) return [updatedGoal];
        return oldGoals.map(goal => 
          goal.id.equals(updatedGoal.id) ? updatedGoal : goal
        );
      }
    );
  }

  /**
   * Uppdaterar team-aktiviteter optimistiskt
   */
  updateActivityOptimistically(teamId: string, newActivity: TeamActivity) {
    this.queryClient.setQueryData(
      TEAM_CACHE_KEYS.teamActivities(teamId),
      (oldActivities: TeamActivity[] | undefined) => {
        if (!oldActivities) return [newActivity];
        return [newActivity, ...oldActivities];
      }
    );
  }

  /**
   * Uppdaterar team-statistik optimistiskt
   */
  updateStatisticsOptimistically(teamId: string, updatedStats: TeamStatistics) {
    this.queryClient.setQueryData(
      TEAM_CACHE_KEYS.teamStatistics(teamId),
      () => updatedStats
    );
  }

  /**
   * Hanterar cachning av aktiva mål
   */
  setupActiveGoalsCache(teamId: string) {
    return {
      staleTime: TEAM_CACHE_CONFIG.activeGoals.staleTime,
      cacheTime: TEAM_CACHE_CONFIG.activeGoals.cacheTime,
      refetchInterval: TEAM_CACHE_CONFIG.activeGoals.refetchInterval,
    };
  }

  /**
   * Återställer cache vid fel
   */
  rollbackOptimisticUpdate(teamId: string, type: 'goals' | 'activities' | 'statistics') {
    this.invalidateTeamData(teamId, type);
  }
}

/**
 * Skapar en ny instans av TeamCache
 */
export const createTeamCache = (queryClient: QueryClient) => {
  return new TeamCache(queryClient);
}; 