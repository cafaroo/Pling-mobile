import { QueryClient } from '@tanstack/react-query';
import { TeamCache, TEAM_CACHE_KEYS } from '../TeamCache';
import { TeamGoal, GoalStatus } from '@/domain/team/entities/TeamGoal';
import { TeamActivity } from '@/domain/team/entities/TeamActivity';
import { TeamStatistics, StatisticsPeriod } from '@/domain/team/value-objects/TeamStatistics';
import { UniqueId } from '@/domain/core/UniqueId';
import { ActivityType } from '@/domain/team/value-objects/ActivityType';

// Mocka TeamGoal, TeamActivity och TeamStatistics
jest.mock('@/domain/team/entities/TeamGoal');
jest.mock('@/domain/team/entities/TeamActivity');
jest.mock('@/domain/team/value-objects/TeamStatistics');

describe('TeamCache', () => {
  let queryClient: QueryClient;
  let teamCache: TeamCache;
  const teamId = 'test-team-id';

  beforeEach(() => {
    queryClient = new QueryClient();
    teamCache = new TeamCache(queryClient);
    
    // Återställ alla mockar
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('invalidateTeam', () => {
    it('ska invalidera all team-relaterad cache', async () => {
      const spy = jest.spyOn(queryClient, 'invalidateQueries');
      await teamCache.invalidateTeam(teamId);
      expect(spy).toHaveBeenCalledWith(TEAM_CACHE_KEYS.team(teamId));
    });
  });

  describe('invalidateTeamData', () => {
    it('ska invalidera specifik team-data', async () => {
      const spy = jest.spyOn(queryClient, 'invalidateQueries');
      await teamCache.invalidateTeamData(teamId, 'goals');
      expect(spy).toHaveBeenCalledWith(TEAM_CACHE_KEYS.teamGoals(teamId));
    });
  });

  describe('updateGoalOptimistically', () => {
    it('ska uppdatera mål i cachen', () => {
      // Skapa en mockad Goal
      const goal = {
        id: new UniqueId(),
        teamId: new UniqueId(teamId),
        title: 'Test mål',
        description: 'Test beskrivning',
        startDate: new Date(),
        status: GoalStatus.IN_PROGRESS,
        progress: 0,
        createdBy: new UniqueId(),
        assignments: [],
        createdAt: new Date(),
        updatedAt: new Date()
      } as TeamGoal;
      
      // Mocka TeamGoal.create för att returnera ett objekt som efterliknar ett Result
      (TeamGoal.create as jest.Mock).mockReturnValue({
        value: goal,
        isOk: () => true
      });

      teamCache.updateGoalOptimistically(teamId, goal);
      const cachedGoals = queryClient.getQueryData(TEAM_CACHE_KEYS.teamGoals(teamId));
      expect(cachedGoals).toEqual([goal]);
    });
  });

  describe('updateActivityOptimistically', () => {
    it('ska lägga till ny aktivitet i cachen', () => {
      // Skapa en mockad aktivitet
      const activity = {
        id: new UniqueId(),
        teamId: new UniqueId(teamId),
        type: ActivityType.GOAL_CREATED,
        userId: new UniqueId(),
        timestamp: new Date(),
        metadata: {}
      } as TeamActivity;
      
      // Mocka TeamActivity.create för att returnera ett objekt som efterliknar ett Result
      (TeamActivity.create as jest.Mock).mockReturnValue({
        value: activity,
        isOk: () => true
      });

      teamCache.updateActivityOptimistically(teamId, activity);
      const cachedActivities = queryClient.getQueryData(TEAM_CACHE_KEYS.teamActivities(teamId));
      expect(cachedActivities).toEqual([activity]);
    });
  });

  describe('updateStatisticsOptimistically', () => {
    it('ska uppdatera statistik i cachen', () => {
      // Skapa en mockad TeamStatistics
      const stats = {
        teamId: new UniqueId(teamId),
        period: StatisticsPeriod.WEEKLY,
        activityCount: 1,
        completedGoals: 0,
        activeGoals: 1,
        memberParticipation: 1,
        averageGoalProgress: 0,
        goalsByStatus: {},
        activityTrend: [],
        lastUpdated: new Date()
      } as TeamStatistics;
      
      // Mocka TeamStatistics.create för att returnera ett objekt som efterliknar ett Result
      (TeamStatistics.create as jest.Mock).mockReturnValue({
        value: stats,
        isOk: () => true
      });

      teamCache.updateStatisticsOptimistically(teamId, stats);
      const cachedStats = queryClient.getQueryData(TEAM_CACHE_KEYS.teamStatistics(teamId));
      expect(cachedStats).toEqual(stats);
    });
  });

  describe('setupActiveGoalsCache', () => {
    it('ska returnera korrekt cachekonfiguration för aktiva mål', () => {
      const config = teamCache.setupActiveGoalsCache(teamId);
      expect(config).toEqual({
        staleTime: 30 * 1000,
        cacheTime: 5 * 60 * 1000,
        refetchInterval: 30 * 1000
      });
    });
  });

  describe('rollbackOptimisticUpdate', () => {
    it('ska återställa cache vid fel', async () => {
      const spy = jest.spyOn(queryClient, 'invalidateQueries');
      await teamCache.rollbackOptimisticUpdate(teamId, 'goals');
      expect(spy).toHaveBeenCalledWith(TEAM_CACHE_KEYS.teamGoals(teamId));
    });
  });
}); 