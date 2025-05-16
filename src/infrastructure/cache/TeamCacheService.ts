import { QueryClient } from '@tanstack/react-query';
import { TeamGoal } from '@/domain/team/entities/TeamGoal';
import { TeamActivity } from '@/domain/team/entities/TeamActivity';
import { TeamStatistics } from '@/domain/team/value-objects/TeamStatistics';
import { ICacheService } from './ICacheService';
import { CacheFactory } from './CacheFactory';
import { ILogger } from '../logger/ILogger';
import { LoggerFactory } from '../logger/LoggerFactory';

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
 * Typ för supporterade typer av team-data
 */
export type TeamDataType = 'goals' | 'activities' | 'statistics';

/**
 * Specialiserad cache-tjänst för team-relaterad data
 * Kombinerar ICacheService med React Query för optimal hantering av team-data
 */
export class TeamCacheService {
  /**
   * Underliggande React Query-klient
   */
  private queryClient: QueryClient;
  
  /**
   * Cachingstjänst för allmän teamdata
   */
  private cacheService: ICacheService;
  
  /**
   * Logger för cache-relaterade händelser
   */
  private logger: ILogger;

  /**
   * Skapar en ny TeamCacheService
   * 
   * @param queryClient React Query-klient
   * @param cacheService Valfri anpassad cache-tjänst, om ingen anges används en standardkonfigurerad tjänst
   * @param logger Valfri anpassad logger
   */
  constructor(
    queryClient: QueryClient, 
    cacheService?: ICacheService,
    logger?: ILogger
  ) {
    this.queryClient = queryClient;
    this.cacheService = cacheService || CacheFactory.createCache('team', {
      ttl: TEAM_CACHE_CONFIG.staleTime,
      debug: false
    });
    this.logger = logger || LoggerFactory.createLogger();
  }

  /**
   * Invaliderar all team-relaterad cache för ett team
   * 
   * @param teamId ID för teamet att invalidera
   * @returns Promise som löses när invalideringen är klar
   */
  async invalidateTeam(teamId: string): Promise<void> {
    try {
      await this.queryClient.invalidateQueries({
        queryKey: TEAM_CACHE_KEYS.team(teamId)
      });
      this.logger.debug(`Invaliderad cache för team: ${teamId}`);
    } catch (error) {
      this.logger.error(`Kunde inte invalidera team-cache för ${teamId}`, { error });
    }
  }

  /**
   * Invaliderar specifik team-data
   * 
   * @param teamId ID för teamet
   * @param type Typ av data att invalidera (goals, activities, statistics)
   * @returns Promise som löses när invalideringen är klar
   */
  async invalidateTeamData(teamId: string, type: TeamDataType): Promise<void> {
    try {
      const keyFunction = TEAM_CACHE_KEYS[`team${type.charAt(0).toUpperCase() + type.slice(1)}`] as (id: string) => readonly [string, string, string];
      await this.queryClient.invalidateQueries({
        queryKey: keyFunction(teamId)
      });
      this.logger.debug(`Invaliderad cache för team ${teamId}, datatyp: ${type}`);
    } catch (error) {
      this.logger.error(`Kunde inte invalidera ${type}-cache för team ${teamId}`, { error });
    }
  }

  /**
   * Uppdaterar team-mål optimistiskt i React Query-cachen
   * 
   * @param teamId ID för teamet
   * @param updatedGoal Uppdaterat mål
   */
  updateGoalOptimistically(teamId: string, updatedGoal: TeamGoal): void {
    try {
      this.queryClient.setQueryData(
        TEAM_CACHE_KEYS.teamGoals(teamId),
        (oldGoals: TeamGoal[] | undefined) => {
          if (!oldGoals) return [updatedGoal];
          return oldGoals.map(goal => 
            goal.id.equals(updatedGoal.id) ? updatedGoal : goal
          );
        }
      );
      this.logger.debug(`Optimistiskt uppdaterat mål i cache för team ${teamId}`);
    } catch (error) {
      this.logger.error(`Misslyckades med optimistisk uppdatering av mål för team ${teamId}`, { error });
      this.rollbackOptimisticUpdate(teamId, 'goals');
    }
  }

  /**
   * Uppdaterar team-aktiviteter optimistiskt i React Query-cachen
   * 
   * @param teamId ID för teamet
   * @param newActivity Ny aktivitet
   */
  updateActivityOptimistically(teamId: string, newActivity: TeamActivity): void {
    try {
      this.queryClient.setQueryData(
        TEAM_CACHE_KEYS.teamActivities(teamId),
        (oldActivities: TeamActivity[] | undefined) => {
          if (!oldActivities) return [newActivity];
          return [newActivity, ...oldActivities];
        }
      );
      this.logger.debug(`Optimistiskt lagt till aktivitet i cache för team ${teamId}`);
    } catch (error) {
      this.logger.error(`Misslyckades med optimistisk uppdatering av aktivitet för team ${teamId}`, { error });
      this.rollbackOptimisticUpdate(teamId, 'activities');
    }
  }

  /**
   * Uppdaterar team-statistik optimistiskt i React Query-cachen
   * 
   * @param teamId ID för teamet
   * @param updatedStats Uppdaterad statistik
   */
  updateStatisticsOptimistically(teamId: string, updatedStats: TeamStatistics): void {
    try {
      this.queryClient.setQueryData(
        TEAM_CACHE_KEYS.teamStatistics(teamId),
        () => updatedStats
      );
      this.logger.debug(`Optimistiskt uppdaterat statistik i cache för team ${teamId}`);
    } catch (error) {
      this.logger.error(`Misslyckades med optimistisk uppdatering av statistik för team ${teamId}`, { error });
      this.rollbackOptimisticUpdate(teamId, 'statistics');
    }
  }

  /**
   * Hämtar konfiguration för React Query för aktiva mål
   * 
   * @param teamId ID för teamet
   * @returns Konfiguration för React Query
   */
  getActiveGoalsQueryConfig(teamId: string) {
    return {
      staleTime: TEAM_CACHE_CONFIG.activeGoals.staleTime,
      cacheTime: TEAM_CACHE_CONFIG.activeGoals.cacheTime,
      refetchInterval: TEAM_CACHE_CONFIG.activeGoals.refetchInterval,
    };
  }

  /**
   * Hämtar konfiguration för React Query för aktiviteter
   * 
   * @param teamId ID för teamet
   * @returns Konfiguration för React Query
   */
  getActivitiesQueryConfig(teamId: string) {
    return {
      staleTime: TEAM_CACHE_CONFIG.activities.staleTime,
      cacheTime: TEAM_CACHE_CONFIG.activities.cacheTime,
    };
  }

  /**
   * Hämtar konfiguration för React Query för statistik
   * 
   * @param teamId ID för teamet
   * @returns Konfiguration för React Query
   */
  getStatisticsQueryConfig(teamId: string) {
    return {
      staleTime: TEAM_CACHE_CONFIG.statistics.staleTime,
      cacheTime: TEAM_CACHE_CONFIG.statistics.cacheTime,
    };
  }

  /**
   * Återställer cache vid fel
   * 
   * @param teamId ID för teamet
   * @param type Typ av data att återställa
   */
  rollbackOptimisticUpdate(teamId: string, type: TeamDataType): void {
    this.invalidateTeamData(teamId, type);
  }
  
  /**
   * Sparar data i den underliggande cache-tjänsten
   * 
   * @param key Nyckel för cachen
   * @param value Värde att spara
   */
  async setInCache<T>(key: string, value: T): Promise<void> {
    await this.cacheService.set(key, value);
  }
  
  /**
   * Hämtar data från den underliggande cache-tjänsten
   * 
   * @param key Nyckel för cachen
   * @returns Cachade värdet eller null
   */
  async getFromCache<T>(key: string): Promise<T | null> {
    return this.cacheService.get<T>(key);
  }
}

/**
 * Skapar en ny instans av TeamCacheService
 * 
 * @param queryClient React Query-klient
 * @param cacheService Valfri anpassad cache-tjänst
 * @param logger Valfri anpassad logger
 * @returns En ny instans av TeamCacheService
 */
export const createTeamCacheService = (
  queryClient: QueryClient, 
  cacheService?: ICacheService,
  logger?: ILogger
): TeamCacheService => {
  return new TeamCacheService(queryClient, cacheService, logger);
}; 