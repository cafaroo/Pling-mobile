import { TeamStatistics, StatisticsPeriod } from '../TeamStatistics';
import { TeamGoal, GoalStatus } from '../../entities/TeamGoal';
import { TeamActivity } from '../../entities/TeamActivity';
import { ActivityType } from '../ActivityType';
import { UniqueId } from '@/domain/core/UniqueId';

describe('TeamStatistics', () => {
  const teamId = new UniqueId();
  const userId = new UniqueId();
  const now = new Date('2024-01-01T12:00:00Z');
  
  // Hjälpfunktioner för att skapa testdata
  const createGoal = (props: Partial<Parameters<typeof TeamGoal.create>[0]>) => {
    return TeamGoal.create({
      id: new UniqueId(),
      teamId,
      title: 'Test mål',
      description: 'Testbeskrivning',
      startDate: new Date(now),
      status: GoalStatus.IN_PROGRESS,
      progress: 0,
      createdBy: userId,
      assignments: [],
      createdAt: new Date(now),
      updatedAt: new Date(now),
      ...props
    }).unwrap();
  };

  const createActivity = (props: Partial<Parameters<typeof TeamActivity.create>[0]>) => {
    return TeamActivity.create({
      id: new UniqueId(),
      teamId,
      type: ActivityType.GOAL_CREATED,
      userId,
      timestamp: new Date(now),
      metadata: {},
      ...props
    }).unwrap();
  };
  
  describe('create', () => {
    it('bör skapa ett giltigt TeamStatistics-objekt', () => {
      const result = TeamStatistics.create({
        teamId,
        period: StatisticsPeriod.WEEKLY,
        activityCount: 10,
        completedGoals: 2,
        activeGoals: 3,
        memberParticipation: 5,
        averageGoalProgress: 60,
        goalsByStatus: {},
        activityTrend: [],
        lastUpdated: new Date(now)
      });

      expect(result.isSuccess()).toBe(true);
      const stats = result.unwrap();
      expect(stats.teamId.equals(teamId)).toBe(true);
      expect(stats.period).toBe(StatisticsPeriod.WEEKLY);
      expect(stats.activityCount).toBe(10);
      expect(stats.completedGoals).toBe(2);
      expect(stats.activeGoals).toBe(3);
      expect(stats.memberParticipation).toBe(5);
      expect(stats.averageGoalProgress).toBe(60);
    });
    
    it('bör returnera fel för ogiltig data', () => {
      // Negativt aktivitetsantal
      const result1 = TeamStatistics.create({
        teamId,
        period: StatisticsPeriod.WEEKLY,
        activityCount: -1,
        completedGoals: 2,
        activeGoals: 3,
        memberParticipation: 5,
        averageGoalProgress: 60,
        goalsByStatus: {},
        activityTrend: [],
        lastUpdated: new Date(now)
      });

      expect(result1.isFailure()).toBe(true);

      // Negativt målframsteg
      const result2 = TeamStatistics.create({
        teamId,
        period: StatisticsPeriod.WEEKLY,
        activityCount: 10,
        completedGoals: 2,
        activeGoals: 3,
        memberParticipation: 5,
        averageGoalProgress: -10,
        goalsByStatus: {},
        activityTrend: [],
        lastUpdated: new Date(now)
      });

      expect(result2.isFailure()).toBe(true);
    });
  });
  
  describe('calculateFromActivities', () => {
    it('ska beräkna korrekt statistik från aktiviteter', () => {
      const activities = [
        createActivity({ timestamp: new Date(now) }),
        createActivity({ timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000) }) // 1 dag sedan
      ];

      const result = TeamStatistics.calculateFromGoals(
        teamId,
        [],
        activities,
        StatisticsPeriod.WEEKLY
      );

      expect(result.isSuccess()).toBe(true);
      const stats = result.unwrap();
      expect(stats.activityCount).toBe(2);
      expect(stats.activityTrend).toHaveLength(7);
    });
    
    it('bör beräkna korrekt statistik från aktiviteter', () => {
      // Skapa aktiviteter över 4 olika dagar
      const activities = [
        // Dag 1: 2 aktiviteter
        TeamActivity.create({
          id: new UniqueId(),
          teamId,
          type: ActivityType.MEMBER_JOINED,
          userId,
          timestamp: new Date(2023, 3, 1),
          metadata: {}
        }).unwrap(),
        TeamActivity.create({
          id: new UniqueId(),
          teamId,
          type: ActivityType.MEMBER_JOINED,
          userId,
          timestamp: new Date(2023, 3, 1),
          metadata: {}
        }).unwrap(),
        
        // Dag 2: 1 aktivitet
        TeamActivity.create({
          id: new UniqueId(),
          teamId,
          type: ActivityType.TEAM_UPDATED,
          userId,
          timestamp: new Date(2023, 3, 5),
          metadata: {}
        }).unwrap(),
        
        // Dag 3: 1 aktivitet
        TeamActivity.create({
          id: new UniqueId(),
          teamId,
          type: ActivityType.MESSAGE_SENT,
          userId,
          timestamp: new Date(2023, 3, 8),
          metadata: {}
        }).unwrap(),
        
        // Dag 4: 1 aktivitet (senaste)
        TeamActivity.create({
          id: new UniqueId(),
          teamId,
          type: ActivityType.TEAM_SETTINGS_UPDATED,
          userId,
          timestamp: new Date(2023, 3, 10),
          metadata: {}
        }).unwrap()
      ];
      
      const statsResult = TeamStatistics.calculateFromActivities(
        teamId,
        activities,
        3, // memberCount
        2, // activeMembers
        new Date(2023, 0, 1) // 1 januari 2023
      );
      
      expect(statsResult.isSuccess()).toBe(true);
      const stats = statsResult.unwrap();
      
      // Kontrollera grundläggande statistik
      expect(stats.teamId.equals(teamId)).toBe(true);
      expect(stats.activityCount).toBe(5);
      
      // Kontrollera aktivitetsfördelning
      expect(stats.goalsByStatus[GoalStatus.COMPLETED] || 0).toBe(0);
      expect(stats.goalsByStatus[GoalStatus.IN_PROGRESS] || 0).toBe(0);
      
      // Kontrollera beräkningar
      expect(stats.getActivityPerMember()).toBe(1.67); // 5 aktiviteter / 3 medlemmar
      expect(stats.getActivityPerDay()).toBe(5); // 5 aktiviteter totalt
    });
    
    it('bör hantera tom aktivitetslista', () => {
      const result = TeamStatistics.calculateFromGoals(
        teamId,
        [],
        [],
        StatisticsPeriod.WEEKLY
      );

      expect(result.isSuccess()).toBe(true);
      const stats = result.unwrap();
      expect(stats.activityCount).toBe(0);
      expect(stats.activityTrend).toHaveLength(7);
      expect(stats.activityTrend.every(t => t.count === 0)).toBe(true);
    });
  });
  
  describe('calculateFromGoals', () => {
    it('ska beräkna korrekt statistik från mål och aktiviteter', () => {
      const goals = [
        createGoal({ status: GoalStatus.COMPLETED, progress: 100 }),
        createGoal({ status: GoalStatus.IN_PROGRESS, progress: 50 }),
        createGoal({ status: GoalStatus.IN_PROGRESS, progress: 75 })
      ];

      const activities = [
        createActivity({ timestamp: new Date(now) }),
        createActivity({ timestamp: new Date(now) })
      ];

      const result = TeamStatistics.calculateFromGoals(teamId, goals, activities);

      expect(result.isSuccess()).toBe(true);
      const stats = result.unwrap();
      expect(stats.completedGoals).toBe(1);
      expect(stats.activeGoals).toBe(2);
      expect(stats.averageGoalProgress).toBe(62.5);
      expect(stats.activityCount).toBe(2);
    });

    it('ska hantera tomma mål och aktiviteter', () => {
      const result = TeamStatistics.calculateFromGoals(teamId, [], []);

      expect(result.isSuccess()).toBe(true);
      const stats = result.unwrap();
      expect(stats.completedGoals).toBe(0);
      expect(stats.activeGoals).toBe(0);
      expect(stats.averageGoalProgress).toBe(0);
      expect(stats.activityCount).toBe(0);
    });

    it('ska beräkna korrekt aktivitetstrend', () => {
      const testDate = new Date('2024-01-01T12:00:00Z');
      const activities = [
        createActivity({ timestamp: new Date(testDate) }),
        createActivity({ timestamp: new Date(testDate) }),
        createActivity({ timestamp: new Date(testDate.getTime() - 24 * 60 * 60 * 1000) }), // Igår
        createActivity({ timestamp: new Date(testDate.getTime() - 24 * 60 * 60 * 1000) }) // Igår
      ];

      const result = TeamStatistics.calculateFromGoals(
        teamId,
        [],
        activities,
        StatisticsPeriod.WEEKLY,
        testDate
      );

      expect(result.isSuccess()).toBe(true);
      const stats = result.unwrap();
      expect(stats.activityTrend).toHaveLength(7); // En veckas data
      
      // Sortera aktiviteterna efter datum för att hitta de senaste
      const sortedTrend = [...stats.activityTrend].sort(
        (a, b) => b.date.getTime() - a.date.getTime()
      );

      // De två senaste dagarna bör ha 2 aktiviteter var
      expect(sortedTrend[0].count).toBe(2); // Idag
      expect(sortedTrend[1].count).toBe(2); // Igår
      
      // Övriga dagar bör ha 0 aktiviteter
      expect(sortedTrend.slice(2).every(day => day.count === 0)).toBe(true);
    });

    it('ska hantera olika tidsperioder korrekt', () => {
      const activities = [
        createActivity({ timestamp: new Date(now) }),
        createActivity({ timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000) }) // Igår
      ];

      const expectedLengths = {
        [StatisticsPeriod.DAILY]: 24,
        [StatisticsPeriod.WEEKLY]: 7,
        [StatisticsPeriod.MONTHLY]: 30,
        [StatisticsPeriod.YEARLY]: 12
      };

      Object.entries(expectedLengths).forEach(([period, expectedLength]) => {
        const result = TeamStatistics.calculateFromGoals(
          teamId,
          [],
          activities,
          period as StatisticsPeriod
        );

        expect(result.isSuccess()).toBe(true);
        const stats = result.unwrap();
        expect(stats.period).toBe(period);
        expect(stats.activityTrend.length).toBe(expectedLength);
      });
    });
  });
  
  describe('getters and calculations', () => {
    it('bör hantera edge-case med 0 medlemmar', () => {
      const result = TeamStatistics.create({
        teamId,
        period: StatisticsPeriod.WEEKLY,
        activityCount: 0,
        completedGoals: 0,
        activeGoals: 0,
        memberParticipation: 0,
        averageGoalProgress: 0,
        goalsByStatus: {},
        activityTrend: [],
        lastUpdated: new Date(now)
      });
      
      expect(result.isSuccess()).toBe(true);
      const stats = result.unwrap();
      
      expect(stats.getActivityPerMember()).toBe(0);
      expect(stats.getActivityPerActiveMember()).toBe(0);
      expect(stats.getActiveMembersPercentage()).toBe(0);
    });
    
    it('bör hantera edge-case med 0 dagar', () => {
      const result = TeamStatistics.create({
        teamId,
        period: StatisticsPeriod.WEEKLY,
        activityCount: 1,
        completedGoals: 0,
        activeGoals: 0,
        memberParticipation: 1,
        averageGoalProgress: 0,
        goalsByStatus: {},
        activityTrend: [],
        lastUpdated: new Date(now)
      });
      
      expect(result.isSuccess()).toBe(true);
      const stats = result.unwrap();
      
      expect(stats.getActivityPerDay()).toBe(1);
    });
  });

  describe('equals', () => {
    it('ska jämföra två TeamStatistics-objekt korrekt', () => {
      const stats1 = TeamStatistics.create({
        teamId,
        period: StatisticsPeriod.WEEKLY,
        activityCount: 10,
        completedGoals: 2,
        activeGoals: 3,
        memberParticipation: 5,
        averageGoalProgress: 60,
        goalsByStatus: {},
        activityTrend: [],
        lastUpdated: new Date(now)
      }).unwrap();

      const stats2 = TeamStatistics.create({
        teamId,
        period: StatisticsPeriod.WEEKLY,
        activityCount: 10,
        completedGoals: 2,
        activeGoals: 3,
        memberParticipation: 5,
        averageGoalProgress: 60,
        goalsByStatus: {},
        activityTrend: [],
        lastUpdated: new Date(now)
      }).unwrap();

      expect(stats1.equals(stats2)).toBe(true);
    });
  });
}); 