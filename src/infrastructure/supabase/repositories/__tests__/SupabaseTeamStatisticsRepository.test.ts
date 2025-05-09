import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseTeamStatisticsRepository } from '../SupabaseTeamStatisticsRepository';
import { TeamStatistics, StatisticsPeriod } from '@/domain/team/value-objects/TeamStatistics';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';
import { TeamGoal } from '@/domain/team/entities/TeamGoal';
import { TeamActivity } from '@/domain/team/entities/TeamActivity';

// Mock TeamGoal och TeamActivity för att undvika problem med create-metoden
jest.mock('@/domain/team/entities/TeamGoal', () => ({
  TeamGoal: {
    create: jest.fn().mockReturnValue({
      isOk: () => true,
      value: { status: 'in_progress', progress: 50 }
    })
  }
}));

jest.mock('@/domain/team/entities/TeamActivity', () => ({
  TeamActivity: {
    create: jest.fn().mockReturnValue({
      isOk: () => true,
      value: { type: 'goal_created' }
    })
  }
}));

// Mock Supabase klient med jest.fn() för alla nested metoder
const mockUpsert = jest.fn().mockReturnValue({ error: null });
const mockSelect = jest.fn();
const mockFrom = jest.fn();

const mockSupabaseClient = {
  from: mockFrom
} as unknown as SupabaseClient;

describe('SupabaseTeamStatisticsRepository', () => {
  let repository: SupabaseTeamStatisticsRepository;
  const teamId = new UniqueId();
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  beforeEach(() => {
    // Reset alla mocks
    jest.clearAllMocks();
    
    // Sätt upp en default mock för mockFrom
    mockFrom.mockReturnValue({
      select: mockSelect,
      upsert: mockUpsert,
      delete: jest.fn().mockReturnValue({ error: null })
    });
    
    repository = new SupabaseTeamStatisticsRepository(mockSupabaseClient);
    
    // Mocka TeamStatistics.calculateFromGoals för att returnera ett giltigt Result.ok
    jest.spyOn(TeamStatistics, 'calculateFromGoals').mockImplementation((teamId, goals, activities, period) => {
      return ok(new TeamStatistics({
        teamId,
        period: period || StatisticsPeriod.WEEKLY,
        activityCount: activities.length,
        completedGoals: 1,
        activeGoals: 1,
        memberParticipation: 1,
        averageGoalProgress: 50,
        goalsByStatus: {},
        activityTrend: [],
        lastUpdated: new Date()
      }));
    });
  });

  describe('getStatistics', () => {
    it('ska hämta statistik för ett team', async () => {
      // Mock-data
      const mockGoals = [{ id: 'goal1' }];
      const mockActivities = [{ id: 'activity1' }];
      
      // Skapa en enkel implementation för select med returvärden för goals och activities
      mockSelect.mockReturnValueOnce({
        eq: jest.fn().mockReturnValue({
          data: mockGoals,
          error: null
        })
      }).mockReturnValueOnce({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            data: mockActivities,
            error: null
          })
        })
      });

      const result = await repository.getStatistics(teamId, StatisticsPeriod.WEEKLY);
      
      // Kontrollera Result-objektet direkt
      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        // Kontrollera egenskaper på värdet
        const stats = result.value;
        expect(stats.teamId.equals(teamId)).toBe(true);
        expect(stats.period).toBe(StatisticsPeriod.WEEKLY);
        expect(stats.activityCount).toBe(1);
      }
    });

    it('ska hantera databasfel korrekt', async () => {
      // Mock databasfel
      mockSelect.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          error: new Error('Databasfel')
        })
      });

      const result = await repository.getStatistics(teamId, StatisticsPeriod.WEEKLY);
      
      // Kontrollera Result-objektet direkt
      expect(result.isErr()).toBe(true);
      
      if (result.isErr()) {
        expect(result.error).toContain('Kunde inte hämta teamstatistik');
      }
    });
  });

  describe('getStatisticsForTeams', () => {
    it('ska hämta statistik för flera team', async () => {
      const teamIds = [new UniqueId(), new UniqueId()];
      
      // Mock getStatistics för varje team
      jest.spyOn(repository, 'getStatistics').mockImplementation(
        (teamId) => Promise.resolve(
          ok(new TeamStatistics({
            teamId,
            period: StatisticsPeriod.WEEKLY,
            activityCount: 5,
            completedGoals: 2,
            activeGoals: 3,
            memberParticipation: 4,
            averageGoalProgress: 75,
            goalsByStatus: {},
            activityTrend: [],
            lastUpdated: new Date()
          }))
        )
      );

      const result = await repository.getStatisticsForTeams(teamIds, StatisticsPeriod.WEEKLY);
      
      // Kontrollera Result-objektet direkt
      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        // Kontrollera egenskaper på värdet
        const stats = result.value;
        expect(stats).toHaveLength(teamIds.length);
        stats.forEach((stat, index) => {
          expect(stat.teamId.equals(teamIds[index])).toBe(true);
        });
      }
    });
  });

  describe('saveStatistics', () => {
    it('ska spara statistik för ett team', async () => {
      const stats = new TeamStatistics({
        teamId,
        period: StatisticsPeriod.WEEKLY,
        activityCount: 5,
        completedGoals: 2,
        activeGoals: 3,
        memberParticipation: 4,
        averageGoalProgress: 75,
        goalsByStatus: {},
        activityTrend: [],
        lastUpdated: new Date()
      });

      const result = await repository.saveStatistics(stats);
      
      // Kontrollera Result-objektet och att upsert anropades
      expect(result.isOk()).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('team_statistics');
      expect(mockUpsert).toHaveBeenCalled();
      
      // Kontrollera att rätt data skickades till upsert
      const upsertData = mockUpsert.mock.calls[0][0];
      expect(upsertData.team_id).toBe(teamId.toString());
      expect(upsertData.period).toBe(StatisticsPeriod.WEEKLY);
    });
  });

  describe('getStatisticsTrend', () => {
    it('ska hämta statistiktrend för ett team', async () => {
      const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const endDate = now;

      const mockTrendData = [
        {
          team_id: teamId.toString(),
          period: StatisticsPeriod.WEEKLY,
          activity_count: 5,
          completed_goals: 2,
          active_goals: 3,
          member_participation: 4,
          average_goal_progress: 75,
          goals_by_status: {},
          activity_trend: [],
          last_updated: now.toISOString()
        }
      ];

      // Mock för select med trenddata
      mockSelect.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  data: mockTrendData,
                  error: null
                })
              })
            })
          })
        })
      });

      const result = await repository.getStatisticsTrend(
        teamId,
        StatisticsPeriod.WEEKLY,
        startDate,
        endDate
      );
      
      // Kontrollera Result-objektet direkt
      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        // Kontrollera egenskaper på värdet
        const trends = result.value;
        expect(trends).toHaveLength(1);
        expect(trends[0].teamId.equals(teamId)).toBe(true);
        expect(trends[0].period).toBe(StatisticsPeriod.WEEKLY);
      }
    });
  });
}); 