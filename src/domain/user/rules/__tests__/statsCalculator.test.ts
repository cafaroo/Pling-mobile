import { User } from '../../entities/User';
import { UserStatsCalculator, UserStatistics, UserStatisticType } from '../statsCalculator';
import { UserTeamJoined, UserAchievementUnlocked } from '../../events/UserEvent';
import { UniqueId } from '@/shared/core/UniqueId';

describe('UserStatsCalculator', () => {
  describe('createInitialStatistics', () => {
    it('ska skapa initial statistik för alla statistiktyper', () => {
      const stats = UserStatsCalculator.createInitialStatistics();
      
      // Kontrollera att alla statistiktyper finns med
      Object.values(UserStatisticType).forEach(type => {
        expect(stats[type]).toBeDefined();
        expect(stats[type].type).toBe(type);
        expect(stats[type].lastUpdated).toBeInstanceOf(Date);
      });
      
      // Kontrollera specifika defaultvärden
      expect(stats[UserStatisticType.TOTAL_LOGINS].value).toBe(0);
      expect(stats[UserStatisticType.BADGES].value).toEqual([]);
      expect(stats[UserStatisticType.LAST_LOGIN].value).toBeNull();
    });
  });
  
  describe('updateStatisticsFromEvent', () => {
    let initialStats: UserStatistics;
    
    beforeEach(() => {
      initialStats = UserStatsCalculator.createInitialStatistics();
    });
    
    it('ska uppdatera teams_joined när ett UserTeamJoined-event inträffar', () => {
      // Skapa ett mockat User-objekt
      const user = {
        id: new UniqueId()
      } as User;
      
      // Skapa ett TeamJoined-event
      const teamId = new UniqueId();
      const event = new UserTeamJoined(user, teamId);
      
      // Uppdatera statistiken
      const result = UserStatsCalculator.updateStatisticsFromEvent(initialStats, event);
      
      // Kontrollera resultatet
      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const updatedStats = result.getValue();
        expect(updatedStats[UserStatisticType.TEAMS_JOINED].value).toBe(1);
        expect(updatedStats[UserStatisticType.CURRENT_TEAMS].value).toEqual([teamId.toString()]);
      }
    });
    
    it('ska uppdatera achievements när ett UserAchievementUnlocked-event inträffar', () => {
      // Skapa ett mockat User-objekt
      const user = {
        id: new UniqueId()
      } as User;
      
      // Skapa ett Achievement-event
      const achievementId = 'first_login';
      const achievementName = 'Första inloggningen';
      const event = new UserAchievementUnlocked(user, achievementId, achievementName);
      
      // Uppdatera statistiken
      const result = UserStatsCalculator.updateStatisticsFromEvent(initialStats, event);
      
      // Kontrollera resultatet
      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const updatedStats = result.getValue();
        expect(updatedStats[UserStatisticType.ACHIEVEMENTS_UNLOCKED].value).toBe(1);
        expect(updatedStats[UserStatisticType.BADGES].value).toEqual([achievementId]);
      }
    });
  });
  
  describe('calculateAdvancedStatistics', () => {
    it('ska beräkna användarens nivå baserat på poäng', () => {
      // Skapa mockad användarstatistik med poäng
      const initialStats = UserStatsCalculator.createInitialStatistics();
      
      // Sätt poäng till 250 (bör ge nivå 2)
      initialStats[UserStatisticType.POINTS_EARNED] = {
        type: UserStatisticType.POINTS_EARNED,
        value: 250,
        lastUpdated: new Date()
      };
      
      // Skapa mockad användare och events
      const user = {
        id: new UniqueId()
      } as User;
      const events: any[] = [];
      
      // Beräkna avancerad statistik
      const result = UserStatsCalculator.calculateAdvancedStatistics(user, initialStats, events);
      
      // Kontrollera att nivån beräknats korrekt
      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const updatedStats = result.getValue();
        expect(updatedStats[UserStatisticType.LEVEL].value).toBe(2);
      }
    });
    
    it('ska beräkna aktivitetsstreak baserat på events', () => {
      // Skapa mockad användarstatistik
      const initialStats = UserStatsCalculator.createInitialStatistics();
      
      // Skapa mockad användare
      const user = {
        id: new UniqueId()
      } as User;
      
      // Skapa events för 3 konsekutiva dagar (idag, igår, förrgår)
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      const events = [
        // Mockade events med olika datum
        {
          constructor: UserTeamJoined,
          data: {
            userId: user.id.toString(),
            occurredAt: today
          }
        },
        {
          constructor: UserAchievementUnlocked,
          data: {
            userId: user.id.toString(),
            occurredAt: yesterday
          }
        },
        {
          constructor: UserTeamJoined,
          data: {
            userId: user.id.toString(),
            occurredAt: twoDaysAgo
          }
        }
      ];
      
      // Beräkna avancerad statistik
      const result = UserStatsCalculator.calculateAdvancedStatistics(user, initialStats, events);
      
      // Kontrollera att streak beräknats korrekt
      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const updatedStats = result.getValue();
        expect(updatedStats[UserStatisticType.ACTIVITY_STREAK].value).toBe(3);
      }
    });
  });
  
  describe('generateStatisticsSummary', () => {
    it('ska generera en korrekt sammanfattning av användarstatistik', () => {
      // Skapa mockad användarstatistik med olika värden
      const stats = UserStatsCalculator.createInitialStatistics();
      
      // Sätt olika värden
      stats[UserStatisticType.LEVEL] = {
        type: UserStatisticType.LEVEL,
        value: 3,
        lastUpdated: new Date()
      };
      
      stats[UserStatisticType.POINTS_EARNED] = {
        type: UserStatisticType.POINTS_EARNED,
        value: 350,
        lastUpdated: new Date()
      };
      
      stats[UserStatisticType.ACHIEVEMENTS_UNLOCKED] = {
        type: UserStatisticType.ACHIEVEMENTS_UNLOCKED,
        value: 5,
        lastUpdated: new Date()
      };
      
      stats[UserStatisticType.TEAMS_JOINED] = {
        type: UserStatisticType.TEAMS_JOINED,
        value: 3,
        lastUpdated: new Date()
      };
      
      stats[UserStatisticType.CURRENT_TEAMS] = {
        type: UserStatisticType.CURRENT_TEAMS,
        value: ['team1', 'team2'],
        lastUpdated: new Date()
      };
      
      stats[UserStatisticType.GOALS_CREATED] = {
        type: UserStatisticType.GOALS_CREATED,
        value: 10,
        lastUpdated: new Date()
      };
      
      stats[UserStatisticType.GOALS_COMPLETED] = {
        type: UserStatisticType.GOALS_COMPLETED,
        value: 7,
        lastUpdated: new Date()
      };
      
      // Generera sammanfattning
      const summary = UserStatsCalculator.generateStatisticsSummary(stats);
      
      // Kontrollera sammanfattningsvärden
      expect(summary.level).toBe(3);
      expect(summary.points).toBe(350);
      expect(summary.achievements).toBe(5);
      expect(summary.teams.joined).toBe(3);
      expect(summary.teams.current).toBe(2);
      expect(summary.goals.created).toBe(10);
      expect(summary.goals.completed).toBe(7);
      expect(summary.goals.completion_rate).toBe(70); // 7/10 * 100
    });
  });
}); 