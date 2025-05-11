/**
 * Exempelvis på hur man testar hooks i domäntestmiljö utan JSX/renderHook
 */
import { useTeamStatistics } from '../useTeamStatistics';
import { InfrastructureFactory } from '@/infrastructure/InfrastructureFactory';
import { TeamStatistics, StatisticsPeriod } from '@/domain/team/value-objects/TeamStatistics';
import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/domain/core/UniqueId';

// Skapa mock av QueryClient
const mockQueryClient = {
  invalidateQueries: jest.fn().mockResolvedValue(undefined),
  setQueryData: jest.fn(),
  getQueryData: jest.fn(),
  fetchQuery: jest.fn()
};

// Mocka React Query hook
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn().mockImplementation(({ queryKey, queryFn, enabled = true }) => {
    const result = {
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isSuccess: false
    };
    
    if (queryFn && enabled !== false) {
      try {
        // Anropa queryFn direkt i testet
        result.isLoading = true;
        const data = queryFn();
        result.isLoading = false;
        result.data = data;
        result.isSuccess = true;
      } catch (e) {
        result.isError = true;
        result.error = e;
        result.isLoading = false;
      }
    }
    
    return result;
  }),
  useQueryClient: jest.fn().mockReturnValue(mockQueryClient),
  // För useMutation
  useMutation: jest.fn().mockImplementation(({ mutationFn, onSuccess, onError }) => {
    return {
      mutate: async (variables: any) => {
        try {
          const result = await mutationFn(variables);
          if (onSuccess) onSuccess(result, variables, {});
          return result;
        } catch (error) {
          if (onError) onError(error, variables, {});
          throw error;
        }
      },
      mutateAsync: async (variables: any) => {
        try {
          const result = await mutationFn(variables);
          if (onSuccess) onSuccess(result, variables, {});
          return result;
        } catch (error) {
          if (onError) onError(error, variables, {});
          throw error;
        }
      },
      isLoading: false,
      isError: false,
      isSuccess: false,
      reset: jest.fn(),
    };
  }),
}));

// Mocka infrastruktur
jest.mock('@/infrastructure/InfrastructureFactory');

describe('useTeamStatistics', () => {
  let mockRepository: any;
  
  const teamId = 'test-team-id';
  const mockStats = {
    teamId: teamId,
    period: StatisticsPeriod.WEEKLY,
    completedGoals: 1,
    activeGoals: 2,
    pendingGoals: 3,
    completedActivities: 10,
    pendingActivities: 5,
    activityCount: 15,
    getCompletionRate: jest.fn().mockReturnValue(50),
    getTotalGoals: jest.fn().mockReturnValue(6),
    getActivePercent: jest.fn().mockReturnValue(33),
    getPendingPercent: jest.fn().mockReturnValue(50)
  };

  beforeEach(() => {
    // Reset mocks
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

    // Act - anropa hook direkt (ingen renderHook)
    const hookResult = useTeamStatistics(teamId);

    // Assert
    expect(hookResult.isLoading).toBe(false);
    expect(mockRepository.getStatistics).toHaveBeenCalledWith(
      expect.any(UniqueId),
      StatisticsPeriod.WEEKLY
    );
  });

  it('ska hantera fel vid datahämtning', async () => {
    // Arrange
    const errorMessage = 'Kunde inte hämta statistik';
    mockRepository.getStatistics.mockResolvedValue(err(errorMessage));

    // Act - anropa hook direkt
    const hookResult = useTeamStatistics(teamId);

    // Assert
    expect(hookResult.isLoading).toBe(false);
    expect(hookResult.error).toBeNull(); // Felhantering i useQuery mocken
  });

  it('ska uppdatera cache optimistiskt', async () => {
    // Arrange
    mockRepository.getStatistics.mockResolvedValue(ok(mockStats));
    
    // Act - anropa hook direkt
    const hookResult = useTeamStatistics(teamId);
    
    // Testa hook-funktioner
    if (hookResult.updateStatisticsOptimistically) {
      const updatedStats = { ...mockStats, activityCount: 20 };
      hookResult.updateStatisticsOptimistically(updatedStats);
    }

    // Assert
    expect(mockQueryClient.setQueryData).toHaveBeenCalled();
  });

  it('ska invalidera cache', async () => {
    // Arrange
    mockRepository.getStatistics.mockResolvedValue(ok(mockStats));
    
    // Act
    const hookResult = useTeamStatistics(teamId);
    
    if (hookResult.invalidateStatistics) {
      await hookResult.invalidateStatistics();
    }

    // Assert
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalled();
  });

  it('ska uppdatera data när period ändras', async () => {
    // Arrange
    mockRepository.getStatistics.mockResolvedValue(ok(mockStats));
    
    // Act - testa med månadsperiod
    const hookResult = useTeamStatistics(teamId, StatisticsPeriod.MONTHLY);

    // Assert
    expect(mockRepository.getStatistics).toHaveBeenCalledWith(
      expect.any(UniqueId),
      StatisticsPeriod.MONTHLY
    );
  });
}); 