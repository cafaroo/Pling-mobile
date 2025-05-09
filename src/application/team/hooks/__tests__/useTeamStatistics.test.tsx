/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react-hooks';
import { useTeamStatistics } from '../useTeamStatistics';
import { InfrastructureFactory } from '@/infrastructure/InfrastructureFactory';
import { TeamStatistics, StatisticsPeriod } from '@/domain/team/value-objects/TeamStatistics';
import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/domain/core/UniqueId';
import { createWrapper, WAIT_FOR_OPTIONS } from './test-utils';

// Mock dependencies
jest.mock('@/infrastructure/InfrastructureFactory');

describe('useTeamStatistics', () => {
  let mockRepository: any;
  
  const teamId = 'test-team-id';
  const mockStats: TeamStatistics = {
    teamId: new UniqueId(teamId),
    period: StatisticsPeriod.WEEKLY,
    activityCount: 10,
    completedGoals: 5,
    activeGoals: 3,
    memberParticipation: 8,
    averageGoalProgress: 75,
    goalsByStatus: {},
    activityTrend: [],
    lastUpdated: new Date()
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock repository
    mockRepository = {
      getStatistics: jest.fn(),
      invalidateTeamCache: jest.fn()
    };
    
    // Mock InfrastructureFactory
    (InfrastructureFactory.getInstance as jest.Mock).mockImplementation(() => ({
      getTeamActivityRepository: () => mockRepository
    }));
  });

  it('ska hämta och cacha teamstatistik', async () => {
    // Arrange
    mockRepository.getStatistics.mockResolvedValue(ok(mockStats));

    // Act
    const { result, waitFor } = renderHook(
      () => useTeamStatistics(teamId),
      { wrapper: createWrapper() }
    );

    // Assert
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => result.current.statistics !== undefined, WAIT_FOR_OPTIONS);
    
    expect(result.current.statistics).toEqual(mockStats);
    expect(mockRepository.getStatistics).toHaveBeenCalledWith(
      expect.any(UniqueId),
      StatisticsPeriod.WEEKLY
    );
  });

  it('ska hantera fel vid datahämtning', async () => {
    // Arrange
    const errorMessage = 'Kunde inte hämta statistik';
    mockRepository.getStatistics.mockResolvedValue(err(errorMessage));

    // Act
    const { result, waitFor } = renderHook(
      () => useTeamStatistics(teamId),
      { wrapper: createWrapper() }
    );

    // Assert
    await waitFor(() => result.current.error instanceof Error, WAIT_FOR_OPTIONS);
    
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe(errorMessage);
    expect(result.current.statistics).toBeUndefined();
  });

  it('ska uppdatera cache optimistiskt', async () => {
    // Arrange
    mockRepository.getStatistics.mockResolvedValue(ok(mockStats));
    
    const { result, waitFor } = renderHook(
      () => useTeamStatistics(teamId),
      { wrapper: createWrapper() }
    );
    
    await waitFor(() => result.current.statistics !== undefined, WAIT_FOR_OPTIONS);

    // Act
    const updatedStats = {
      ...mockStats,
      activityCount: 15
    };
    
    await act(async () => {
      result.current.updateStatisticsOptimistically(updatedStats);
      // Vänta på att React Query ska uppdatera cachen
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Assert
    await waitFor(() => {
      expect(result.current.statistics?.activityCount).toBe(15);
    }, WAIT_FOR_OPTIONS);
  });

  it('ska invalidera cache', async () => {
    // Arrange
    mockRepository.getStatistics.mockResolvedValue(ok(mockStats));
    
    const { result, waitFor } = renderHook(
      () => useTeamStatistics(teamId),
      { wrapper: createWrapper() }
    );
    
    await waitFor(() => result.current.statistics !== undefined, WAIT_FOR_OPTIONS);

    // Act
    await act(async () => {
      await result.current.invalidateStatistics();
    });

    // Assert
    expect(mockRepository.invalidateTeamCache).toHaveBeenCalledWith(teamId);
  });

  it('ska uppdatera data när period ändras', async () => {
    // Arrange
    mockRepository.getStatistics.mockResolvedValue(ok(mockStats));
    
    const { result, waitFor, rerender } = renderHook(
      ({ period }) => useTeamStatistics(teamId, period),
      {
        wrapper: createWrapper(),
        initialProps: { period: StatisticsPeriod.WEEKLY }
      }
    );
    
    await waitFor(() => result.current.statistics !== undefined, WAIT_FOR_OPTIONS);

    // Act
    rerender({ period: StatisticsPeriod.MONTHLY });

    // Assert
    expect(mockRepository.getStatistics).toHaveBeenCalledWith(
      expect.any(UniqueId),
      StatisticsPeriod.MONTHLY
    );
  });
}); 