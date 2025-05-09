import { renderHook } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTeamCache } from '../useTeamCache';
import { TeamGoal, GoalStatus } from '@/domain/team/entities/TeamGoal';
import { TeamActivity } from '@/domain/team/entities/TeamActivity';
import { TeamStatistics, StatisticsPeriod } from '@/domain/team/value-objects/TeamStatistics';
import { UniqueId } from '@/domain/core/UniqueId';
import { ActivityType } from '@/domain/team/value-objects/ActivityType';
import { FC, ReactNode } from 'react';

// Mocka TeamGoal, TeamActivity och TeamStatistics
jest.mock('@/domain/team/entities/TeamGoal');
jest.mock('@/domain/team/entities/TeamActivity');
jest.mock('@/domain/team/value-objects/TeamStatistics');

describe('useTeamCache', () => {
  let queryClient: QueryClient;

  const wrapper: FC<{ children: ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient();
    
    // Återställ alla mockar
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('ska tillhandahålla alla cache-funktioner', () => {
    const { result } = renderHook(() => useTeamCache(), { wrapper });

    expect(result.current).toHaveProperty('invalidateTeam');
    expect(result.current).toHaveProperty('invalidateTeamData');
    expect(result.current).toHaveProperty('updateGoalOptimistically');
    expect(result.current).toHaveProperty('updateActivityOptimistically');
    expect(result.current).toHaveProperty('updateStatisticsOptimistically');
    expect(result.current).toHaveProperty('setupActiveGoalsCache');
    expect(result.current).toHaveProperty('rollbackOptimisticUpdate');
  });

  it('ska kunna uppdatera mål optimistiskt', () => {
    const { result } = renderHook(() => useTeamCache(), { wrapper });
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

    result.current.updateGoalOptimistically(teamId, goal);
    const cachedGoals = queryClient.getQueryData(['team', teamId, 'goals']);
    expect(cachedGoals).toEqual([goal]);
  });

  it('ska kunna uppdatera aktiviteter optimistiskt', () => {
    const { result } = renderHook(() => useTeamCache(), { wrapper });
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

    result.current.updateActivityOptimistically(teamId, activity);
    const cachedActivities = queryClient.getQueryData(['team', teamId, 'activities']);
    expect(cachedActivities).toEqual([activity]);
  });

  it('ska kunna uppdatera statistik optimistiskt', () => {
    const { result } = renderHook(() => useTeamCache(), { wrapper });
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

    result.current.updateStatisticsOptimistically(teamId, stats);
    const cachedStats = queryClient.getQueryData(['team', teamId, 'statistics']);
    expect(cachedStats).toEqual(stats);
  });

  it('ska returnera korrekt konfiguration för aktiva mål', () => {
    const { result } = renderHook(() => useTeamCache(), { wrapper });
    const teamId = 'test-team-id';

    const config = result.current.setupActiveGoalsCache(teamId);
    expect(config).toEqual({
      staleTime: 30 * 1000,
      cacheTime: 5 * 60 * 1000,
      refetchInterval: 30 * 1000
    });
  });

  it('ska kunna återställa cache vid fel', async () => {
    const { result } = renderHook(() => useTeamCache(), { wrapper });
    const teamId = 'test-team-id';

    const spy = jest.spyOn(queryClient, 'invalidateQueries');
    await result.current.rollbackOptimisticUpdate(teamId, 'goals');
    expect(spy).toHaveBeenCalledWith(['team', teamId, 'goals']);
  });
}); 