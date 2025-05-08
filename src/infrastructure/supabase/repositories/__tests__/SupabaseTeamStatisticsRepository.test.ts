import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseTeamStatisticsRepository } from '../SupabaseTeamStatisticsRepository';
import { TeamStatistics, StatisticsPeriod } from '@/domain/team/value-objects/TeamStatistics';
import { UniqueId } from '@/domain/core/UniqueId';

// Mock Supabase klient
const mockSupabaseClient = {
  from: jest.fn(),
} as unknown as SupabaseClient;

describe('SupabaseTeamStatisticsRepository', () => {
  let repository: SupabaseTeamStatisticsRepository;
  const teamId = new UniqueId();
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  beforeEach(() => {
    repository = new SupabaseTeamStatisticsRepository(mockSupabaseClient);
    jest.clearAllMocks();
  });

  describe('getStatistics', () => {
    it('ska hämta statistik för ett team', async () => {
      const mockGoals = [
        {
          id: new UniqueId().toString(),
          team_id: teamId.toString(),
          title: 'Test Goal',
          description: 'Test Description',
          start_date: yesterday.toISOString(),
          status: 'in_progress',
          progress: 50,
          created_by: new UniqueId().toString(),
          created_at: yesterday.toISOString(),
          updated_at: now.toISOString()
        }
      ];

      const mockActivities = [
        {
          id: new UniqueId().toString(),
          team_id: teamId.toString(),
          type: 'goal_created',
          user_id: new UniqueId().toString(),
          created_at: now.toISOString(),
          metadata: {}
        }
      ];

      // Mock Supabase svar
      (mockSupabaseClient.from as jest.Mock)
        .mockImplementation((table: string) => ({
          select: () => ({
            eq: () => ({
              gte: () => ({
                data: table === 'team_goals' ? mockGoals : mockActivities,
                error: null
              }),
              data: table === 'team_goals' ? mockGoals : mockActivities,
              error: null
            })
          })
        }));

      const result = await repository.getStatistics(teamId, StatisticsPeriod.WEEKLY);
      expect(result.isSuccess()).toBe(true);

      const stats = result.unwrap();
      expect(stats.teamId.equals(teamId)).toBe(true);
      expect(stats.period).toBe(StatisticsPeriod.WEEKLY);
      expect(stats.activeGoals).toBe(1);
      expect(stats.activityCount).toBe(1);
    });

    it('ska hantera databasfel korrekt', async () => {
      // Mock databasfel
      (mockSupabaseClient.from as jest.Mock)
        .mockImplementation(() => ({
          select: () => ({
            eq: () => ({
              error: new Error('Databasfel')
            })
          })
        }));

      const result = await repository.getStatistics(teamId, StatisticsPeriod.WEEKLY);
      expect(result.isFailure()).toBe(true);
      expect(result.error).toContain('Kunde inte hämta teamstatistik');
    });
  });

  describe('getStatisticsForTeams', () => {
    it('ska hämta statistik för flera team', async () => {
      const teamIds = [new UniqueId(), new UniqueId()];
      const mockResults = teamIds.map(id => 
        TeamStatistics.calculateFromGoals(id, [], [], StatisticsPeriod.WEEKLY).unwrap()
      );

      // Mock getStatistics för varje team
      jest.spyOn(repository, 'getStatistics').mockImplementation(
        (teamId) => Promise.resolve(
          TeamStatistics.calculateFromGoals(
            teamId,
            [],
            [],
            StatisticsPeriod.WEEKLY
          )
        )
      );

      const result = await repository.getStatisticsForTeams(teamIds, StatisticsPeriod.WEEKLY);
      expect(result.isSuccess()).toBe(true);

      const stats = result.unwrap();
      expect(stats).toHaveLength(teamIds.length);
      stats.forEach((stat, index) => {
        expect(stat.teamId.equals(teamIds[index])).toBe(true);
      });
    });
  });

  describe('saveStatistics', () => {
    it('ska spara statistik för ett team', async () => {
      const stats = TeamStatistics.calculateFromGoals(
        teamId,
        [],
        [],
        StatisticsPeriod.WEEKLY
      ).unwrap();

      // Mock Supabase upsert
      (mockSupabaseClient.from as jest.Mock)
        .mockImplementation(() => ({
          upsert: () => ({
            error: null
          })
        }));

      const result = await repository.saveStatistics(stats);
      expect(result.isSuccess()).toBe(true);

      // Verifiera att upsert anropades med rätt data
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('team_statistics');
      expect(mockSupabaseClient.from().upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          team_id: teamId.toString(),
          period: StatisticsPeriod.WEEKLY
        })
      );
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

      // Mock Supabase svar
      (mockSupabaseClient.from as jest.Mock)
        .mockImplementation(() => ({
          select: () => ({
            eq: () => ({
              eq: () => ({
                gte: () => ({
                  lte: () => ({
                    order: () => ({
                      data: mockTrendData,
                      error: null
                    })
                  })
                })
              })
            })
          })
        }));

      const result = await repository.getStatisticsTrend(
        teamId,
        StatisticsPeriod.WEEKLY,
        startDate,
        endDate
      );
      expect(result.isSuccess()).toBe(true);

      const trends = result.unwrap();
      expect(trends).toHaveLength(1);
      expect(trends[0].teamId.equals(teamId)).toBe(true);
      expect(trends[0].period).toBe(StatisticsPeriod.WEEKLY);
    });
  });
}); 