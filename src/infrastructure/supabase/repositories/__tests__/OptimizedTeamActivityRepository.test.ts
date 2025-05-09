import { SupabaseClient } from '@supabase/supabase-js';
import { EventBus } from '@/shared/core/EventBus';
import { UniqueId } from '@/shared/core/UniqueId';
import { OptimizedTeamActivityRepository } from '../OptimizedTeamActivityRepository';
import { StatisticsPeriod } from '@/domain/team/value-objects/TeamStatistics';
import { Result, ok, err } from '@/shared/core/Result';

// Definiera OperationType för testerna
const OperationType = {
  DATABASE_READ: 'DATABASE_READ',
  DATABASE_WRITE: 'DATABASE_WRITE',
  CACHE_READ: 'CACHE_READ',
  CACHE_WRITE: 'CACHE_WRITE',
  API_CALL: 'API_CALL',
  COMPUTATION: 'COMPUTATION'
} as const;

describe('OptimizedTeamActivityRepository', () => {
  let repository: OptimizedTeamActivityRepository;
  let mockSupabase: jest.Mocked<SupabaseClient>;
  let mockEventBus: jest.Mocked<EventBus>;
  
  const teamId = new UniqueId('test-team-id');
  const mockStats = {
    teamId,
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
    
    // Setup mocks
    mockSupabase = {
      rpc: jest.fn(),
    } as unknown as jest.Mocked<SupabaseClient>;
    
    mockEventBus = {
      publish: jest.fn(),
      subscribe: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;
    
    // Create repository instance
    repository = new OptimizedTeamActivityRepository(mockSupabase, mockEventBus);
  });

  describe('getStatistics', () => {
    it('ska returnera cachad data om tillgänglig', async () => {
      // Arrange
      const cachedResult = ok(mockStats);
      global.__mocks__.mockCacheService.get.mockResolvedValue(cachedResult);

      // Act
      const result = await repository.getStatistics(teamId);

      // Assert
      expect(result).toBe(cachedResult);
      expect(global.__mocks__.mockCacheService.get).toHaveBeenCalledWith(
        expect.stringContaining('team_activity_stats_test-team-id')
      );
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });

    it('ska hämta från databasen om cache missar', async () => {
      // Arrange
      global.__mocks__.mockCacheService.get.mockResolvedValue(null);
      mockSupabase.rpc.mockResolvedValue({ 
        data: [{
          activity_count: 10,
          completed_goals: 5,
          active_goals: 3,
          member_participation: 8,
          average_goal_progress: 75,
          goals_by_status: {},
          activity_trend: []
        }], 
        error: null 
      });

      // Act
      const result = await repository.getStatistics(teamId);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(expect.objectContaining({
          teamId,
          period: StatisticsPeriod.WEEKLY,
          activityCount: 10,
          completedGoals: 5,
          activeGoals: 3,
          memberParticipation: 8,
          averageGoalProgress: 75
        }));
      }
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'get_team_statistics',
        expect.any(Object)
      );
      expect(global.__mocks__.mockCacheService.set).toHaveBeenCalled();
      expect(global.__mocks__.mockPerformance.measure).toHaveBeenCalledWith(
        OperationType.DATABASE_READ,
        'getTeamStatistics',
        expect.any(Function)
      );
    });

    it('ska hantera databasfel korrekt', async () => {
      // Arrange
      global.__mocks__.mockCacheService.get.mockResolvedValue(null);
      mockSupabase.rpc.mockResolvedValue({ 
        data: null, 
        error: { message: 'Databasfel' } 
      });

      // Act
      const result = await repository.getStatistics(teamId);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain('Kunde inte hämta teamstatistik');
      }
      expect(global.__mocks__.mockCacheService.set).not.toHaveBeenCalled();
      expect(global.__mocks__.mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Fel vid hämtning av teamstatistik')
      );
    });
  });

  describe('invalidateTeamCache', () => {
    it('ska invalidera cache för alla perioder', async () => {
      // Act
      await repository.invalidateTeamCache(teamId.toString());

      // Assert
      expect(global.__mocks__.mockCacheService.remove).toHaveBeenCalledTimes(4);
      
      // Verify that cache was invalidated for all periods
      Object.values(StatisticsPeriod).forEach(period => {
        expect(global.__mocks__.mockCacheService.remove).toHaveBeenCalledWith(
          expect.stringContaining(`team_activity_stats_${teamId}_${period}`)
        );
      });
      
      expect(global.__mocks__.mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining(`Invaliderar cache för team: ${teamId}`)
      );
    });
  });
}); 