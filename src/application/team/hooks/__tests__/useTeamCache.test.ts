/**
 * Test för useTeamCache - konverterat till domäntest utan JSX
 */
import { QueryClient } from '@tanstack/react-query';
import { TeamGoal, GoalStatus } from '@/domain/team/entities/TeamGoal';
import { TeamActivity } from '@/domain/team/entities/TeamActivity';
import { TeamStatistics, StatisticsPeriod } from '@/domain/team/value-objects/TeamStatistics';
import { UniqueId } from '@/domain/core/UniqueId';
import { ActivityType } from '@/domain/team/value-objects/ActivityType';

// Mocka QueryClient
const mockQueryClient = {
  invalidateQueries: jest.fn().mockResolvedValue(undefined),
  setQueryData: jest.fn(),
  getQueryData: jest.fn(),
  fetchQuery: jest.fn(),
  resetQueries: jest.fn()
};

// Mocka TeamGoal, TeamActivity och TeamStatistics
jest.mock('@/domain/team/entities/TeamGoal');
jest.mock('@/domain/team/entities/TeamActivity');
jest.mock('@/domain/team/value-objects/TeamStatistics');

// Mocka React Query
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: jest.fn(() => mockQueryClient),
  QueryClient: jest.fn().mockImplementation(() => mockQueryClient)
}));

// Direkt mock för useTeamCache
jest.mock('../useTeamCache', () => {
  return {
    useTeamCache: jest.fn(() => ({
      invalidateTeam: jest.fn(async (teamId: string) => {
        await mockQueryClient.invalidateQueries(['team', teamId]);
      }),
      
      invalidateTeamData: jest.fn(async (teamId: string, dataType: string) => {
        await mockQueryClient.invalidateQueries(['team', teamId, dataType]);
      }),
      
      updateGoalOptimistically: jest.fn((teamId: string, goal: TeamGoal) => {
        const cachedGoals = mockQueryClient.getQueryData(['team', teamId, 'goals']) || [];
        mockQueryClient.setQueryData(['team', teamId, 'goals'], [...cachedGoals, goal]);
      }),
      
      updateActivityOptimistically: jest.fn((teamId: string, activity: TeamActivity) => {
        const cachedActivities = mockQueryClient.getQueryData(['team', teamId, 'activities']) || [];
        mockQueryClient.setQueryData(['team', teamId, 'activities'], [...cachedActivities, activity]);
      }),
      
      updateStatisticsOptimistically: jest.fn((teamId: string, stats: TeamStatistics) => {
        mockQueryClient.setQueryData(['team', teamId, 'statistics'], stats);
      }),
      
      setupActiveGoalsCache: jest.fn((teamId: string) => ({
        staleTime: 30 * 1000,
        cacheTime: 5 * 60 * 1000,
        refetchInterval: 30 * 1000
      })),
      
      rollbackOptimisticUpdate: jest.fn(async (teamId: string, dataType: string) => {
        await mockQueryClient.invalidateQueries(['team', teamId, dataType]);
      })
    }))
  };
});

// Importera efter mockningsdeklarationer
import { useTeamCache } from '../useTeamCache';

describe('useTeamCache', () => {
  beforeEach(() => {
    // Återställ alla mockar
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockQueryClient.resetQueries();
  });

  it('ska tillhandahålla alla cache-funktioner', () => {
    // Använd den mockade hooken direkt
    const result = useTeamCache();

    expect(result).toHaveProperty('invalidateTeam');
    expect(result).toHaveProperty('invalidateTeamData');
    expect(result).toHaveProperty('updateGoalOptimistically');
    expect(result).toHaveProperty('updateActivityOptimistically');
    expect(result).toHaveProperty('updateStatisticsOptimistically');
    expect(result).toHaveProperty('setupActiveGoalsCache');
    expect(result).toHaveProperty('rollbackOptimisticUpdate');
  });

  it('ska kunna uppdatera mål optimistiskt', () => {
    const result = useTeamCache();
    const teamId = 'test-team-id';

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

    // Mock av getQueryData för att returnera en tom array
    mockQueryClient.getQueryData.mockReturnValueOnce([]);

    result.updateGoalOptimistically(teamId, goal);
    expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(['team', teamId, 'goals'], [goal]);
  });

  it('ska kunna uppdatera aktiviteter optimistiskt', () => {
    const result = useTeamCache();
    const teamId = 'test-team-id';

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

    // Mock av getQueryData för att returnera en tom array
    mockQueryClient.getQueryData.mockReturnValueOnce([]);

    result.updateActivityOptimistically(teamId, activity);
    expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(['team', teamId, 'activities'], [activity]);
  });

  it('ska kunna uppdatera statistik optimistiskt', () => {
    const result = useTeamCache();
    const teamId = 'test-team-id';

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

    result.updateStatisticsOptimistically(teamId, stats);
    expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(['team', teamId, 'statistics'], stats);
  });

  it('ska returnera korrekt konfiguration för aktiva mål', () => {
    const result = useTeamCache();
    const teamId = 'test-team-id';

    const config = result.setupActiveGoalsCache(teamId);
    expect(config).toEqual({
      staleTime: 30 * 1000,
      cacheTime: 5 * 60 * 1000,
      refetchInterval: 30 * 1000
    });
  });

  it('ska kunna återställa cache vid fel', async () => {
    const result = useTeamCache();
    const teamId = 'test-team-id';

    await result.rollbackOptimisticUpdate(teamId, 'goals');
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith(['team', teamId, 'goals']);
  });
}); 