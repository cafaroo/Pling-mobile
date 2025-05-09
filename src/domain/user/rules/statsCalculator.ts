import { User } from '../entities/User';
import { Result, ok, err } from '@/shared/core/Result';
import { UserEvent, UserTeamJoined, UserTeamLeft, UserRoleAdded, UserAchievementUnlocked } from '../events/UserEvent';

/**
 * Representerar olika typer av användarstatistik
 */
export enum UserStatisticType {
  // Generell aktivitet
  TOTAL_LOGINS = 'total_logins',
  LAST_LOGIN = 'last_login',
  LOGIN_STREAK = 'login_streak',
  DAYS_ACTIVE = 'days_active',
  
  // Team-relaterad
  TEAMS_JOINED = 'teams_joined',
  CURRENT_TEAMS = 'current_teams',
  TEAM_PARTICIPATIONS = 'team_participations',
  
  // Mål och tävlingar
  GOALS_CREATED = 'goals_created',
  GOALS_COMPLETED = 'goals_completed',
  COMPETITIONS_JOINED = 'competitions_joined',
  COMPETITIONS_WON = 'competitions_won',
  
  // Engagemang
  TOTAL_ACTIVITIES = 'total_activities',
  ACTIVITY_STREAK = 'activity_streak',
  LAST_ACTIVITY = 'last_activity',
  
  // Prestationer och erkännanden
  ACHIEVEMENTS_UNLOCKED = 'achievements_unlocked',
  POINTS_EARNED = 'points_earned',
  LEVEL = 'level',
  BADGES = 'badges'
}

/**
 * Representerar en användarstatistik
 */
export interface UserStatistic {
  type: UserStatisticType;
  value: number | string | string[] | Date | null;
  lastUpdated: Date;
}

/**
 * Representerar alla användarstatistik
 */
export interface UserStatistics {
  [key: string]: UserStatistic;
}

/**
 * Klass för att beräkna och hantera användarstatistik
 */
export class UserStatsCalculator {
  private constructor() {}
  
  /**
   * Beräknar och uppdaterar användarstatistik baserat på ett event
   */
  public static updateStatisticsFromEvent(
    currentStats: UserStatistics,
    event: UserEvent
  ): Result<UserStatistics, string> {
    try {
      const updatedStats = { ...currentStats };
      const now = new Date();
      
      // Hantera olika event-typer
      switch (event.constructor) {
        case UserTeamJoined:
          this.incrementStatistic(
            updatedStats, 
            UserStatisticType.TEAMS_JOINED,
            now
          );
          this.updateArrayStatistic(
            updatedStats,
            UserStatisticType.CURRENT_TEAMS,
            [(event as UserTeamJoined).teamId.toString()],
            'add',
            now
          );
          break;
          
        case UserTeamLeft:
          this.updateArrayStatistic(
            updatedStats,
            UserStatisticType.CURRENT_TEAMS,
            [(event as UserTeamLeft).teamId.toString()],
            'remove',
            now
          );
          break;
          
        case UserRoleAdded:
          // Hantera rollbaserade statistikuppdateringar
          break;
          
        case UserAchievementUnlocked:
          const achievementEvent = event as UserAchievementUnlocked;
          this.incrementStatistic(
            updatedStats,
            UserStatisticType.ACHIEVEMENTS_UNLOCKED,
            now
          );
          this.updateArrayStatistic(
            updatedStats,
            UserStatisticType.BADGES,
            [achievementEvent.achievement.id],
            'add',
            now
          );
          break;
          
        // Lägg till fler case för andra events när de implementeras
      }
      
      return ok(updatedStats);
    } catch (error) {
      return err(`Fel vid uppdatering av statistik: ${error}`);
    }
  }
  
  /**
   * Skapar initial användarstatistik
   */
  public static createInitialStatistics(): UserStatistics {
    const now = new Date();
    const initialStats: UserStatistics = {};
    
    // Skapa tomma statistikobjekt för alla statistiktyper
    Object.values(UserStatisticType).forEach(type => {
      let initialValue: number | string | string[] | Date | null;
      
      // Sätt defaultvärden baserat på typ
      switch (type) {
        case UserStatisticType.TEAMS_JOINED:
        case UserStatisticType.GOALS_CREATED:
        case UserStatisticType.GOALS_COMPLETED:
        case UserStatisticType.COMPETITIONS_JOINED:
        case UserStatisticType.COMPETITIONS_WON:
        case UserStatisticType.TOTAL_ACTIVITIES:
        case UserStatisticType.TOTAL_LOGINS:
        case UserStatisticType.ACHIEVEMENTS_UNLOCKED:
        case UserStatisticType.POINTS_EARNED:
        case UserStatisticType.LEVEL:
          initialValue = 0;
          break;
          
        case UserStatisticType.CURRENT_TEAMS:
        case UserStatisticType.BADGES:
          initialValue = [];
          break;
          
        case UserStatisticType.LAST_LOGIN:
        case UserStatisticType.LAST_ACTIVITY:
          initialValue = null;
          break;
          
        case UserStatisticType.LOGIN_STREAK:
        case UserStatisticType.ACTIVITY_STREAK:
        case UserStatisticType.DAYS_ACTIVE:
          initialValue = 0;
          break;
          
        case UserStatisticType.TEAM_PARTICIPATIONS:
          initialValue = {};
          break;
          
        default:
          initialValue = null;
      }
      
      initialStats[type] = {
        type: type as UserStatisticType,
        value: initialValue,
        lastUpdated: now
      };
    });
    
    return initialStats;
  }
  
  /**
   * Beräknar avancerade statistik baserat på användarens historik och nuvarande tillstånd
   */
  public static calculateAdvancedStatistics(
    user: User,
    currentStats: UserStatistics,
    events: UserEvent[]
  ): Result<UserStatistics, string> {
    try {
      const updatedStats = { ...currentStats };
      const now = new Date();
      
      // Beräkna nivå baserat på poäng
      const currentPoints = this.getStatisticValue(updatedStats, UserStatisticType.POINTS_EARNED) as number || 0;
      const newLevel = this.calculateLevel(currentPoints);
      
      updatedStats[UserStatisticType.LEVEL] = {
        type: UserStatisticType.LEVEL,
        value: newLevel,
        lastUpdated: now
      };
      
      // Analysera aktivitetsstreak baserat på events
      if (events.length > 0) {
        const activityStreak = this.calculateActivityStreak(events);
        updatedStats[UserStatisticType.ACTIVITY_STREAK] = {
          type: UserStatisticType.ACTIVITY_STREAK,
          value: activityStreak,
          lastUpdated: now
        };
      }
      
      // Beräkna dagar aktiv - här exemplet använder vi antal team som approximation
      const teamsCount = (this.getStatisticValue(updatedStats, UserStatisticType.CURRENT_TEAMS) as string[] || []).length;
      const daysActive = Math.max(
        this.getStatisticValue(updatedStats, UserStatisticType.DAYS_ACTIVE) as number || 0,
        teamsCount * 5  // Exempel: mer aktiv med fler team
      );
      
      updatedStats[UserStatisticType.DAYS_ACTIVE] = {
        type: UserStatisticType.DAYS_ACTIVE,
        value: daysActive,
        lastUpdated: now
      };
      
      return ok(updatedStats);
    } catch (error) {
      return err(`Fel vid beräkning av avancerad statistik: ${error}`);
    }
  }
  
  /**
   * Beräknar nivå baserat på poäng
   */
  private static calculateLevel(points: number): number {
    // Exempel på en enkel nivåformel: varje nivå kräver 100 poäng mer än föregående
    // Nivå 1: 0-99 poäng
    // Nivå 2: 100-299 poäng
    // Nivå 3: 300-599 poäng
    // osv.
    
    if (points < 100) return 1;
    
    let level = 1;
    let threshold = 0;
    
    while (points >= threshold + (level * 100)) {
      threshold += level * 100;
      level++;
    }
    
    return level;
  }
  
  /**
   * Beräknar aktivitetsstreak baserat på events
   */
  private static calculateActivityStreak(events: UserEvent[]): number {
    if (events.length === 0) return 0;
    
    // Sortera events efter datum, nyast först
    const sortedEvents = [...events].sort((a, b) => 
      b.data.occurredAt.getTime() - a.data.occurredAt.getTime()
    );
    
    let streak = 1;
    let lastDate = new Date(sortedEvents[0].data.occurredAt);
    lastDate.setHours(0, 0, 0, 0); // Normalisera till start av dagen
    
    for (let i = 1; i < sortedEvents.length; i++) {
      const eventDate = new Date(sortedEvents[i].data.occurredAt);
      eventDate.setHours(0, 0, 0, 0);
      
      // Beräkna dagsskillnaden
      const diffDays = Math.floor(
        (lastDate.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (diffDays === 1) {
        // Konsekutiv dag
        streak++;
        lastDate = eventDate;
      } else if (diffDays === 0) {
        // Samma dag, fortsätt kolla
        continue;
      } else {
        // Bruten streak
        break;
      }
    }
    
    return streak;
  }
  
  /**
   * Ökar ett numeriskt statistikvärde
   */
  private static incrementStatistic(
    stats: UserStatistics,
    type: UserStatisticType,
    timestamp: Date,
    amount: number = 1
  ): void {
    const currentValue = this.getStatisticValue(stats, type) as number || 0;
    
    stats[type] = {
      type,
      value: currentValue + amount,
      lastUpdated: timestamp
    };
  }
  
  /**
   * Uppdaterar ett array-baserat statistikvärde
   */
  private static updateArrayStatistic(
    stats: UserStatistics,
    type: UserStatisticType,
    items: string[],
    operation: 'add' | 'remove',
    timestamp: Date
  ): void {
    const currentItems = this.getStatisticValue(stats, type) as string[] || [];
    let newItems: string[];
    
    if (operation === 'add') {
      // Lägg till nya unika items
      newItems = Array.from(new Set([...currentItems, ...items]));
    } else {
      // Ta bort items
      newItems = currentItems.filter(item => !items.includes(item));
    }
    
    stats[type] = {
      type,
      value: newItems,
      lastUpdated: timestamp
    };
  }
  
  /**
   * Uppdaterar ett datum-baserat statistikvärde
   */
  private static updateDateStatistic(
    stats: UserStatistics,
    type: UserStatisticType,
    date: Date
  ): void {
    stats[type] = {
      type,
      value: date,
      lastUpdated: date
    };
  }
  
  /**
   * Hämtar värdet för en specifik statistiktyp
   */
  private static getStatisticValue(
    stats: UserStatistics,
    type: UserStatisticType
  ): number | string | string[] | Date | null {
    return stats[type]?.value ?? null;
  }
  
  /**
   * Genererar en sammanfattning av användarstatistik
   */
  public static generateStatisticsSummary(stats: UserStatistics): Record<string, any> {
    const summary: Record<string, any> = {};
    
    // Grundläggande information
    summary.level = this.getStatisticValue(stats, UserStatisticType.LEVEL) || 1;
    summary.points = this.getStatisticValue(stats, UserStatisticType.POINTS_EARNED) || 0;
    summary.achievements = this.getStatisticValue(stats, UserStatisticType.ACHIEVEMENTS_UNLOCKED) || 0;
    
    // Team-aktivitet
    summary.teams = {
      joined: this.getStatisticValue(stats, UserStatisticType.TEAMS_JOINED) || 0,
      current: (this.getStatisticValue(stats, UserStatisticType.CURRENT_TEAMS) as string[] || []).length,
    };
    
    // Mål och tävlingar
    summary.goals = {
      created: this.getStatisticValue(stats, UserStatisticType.GOALS_CREATED) || 0,
      completed: this.getStatisticValue(stats, UserStatisticType.GOALS_COMPLETED) || 0,
      completion_rate: this.calculateCompletionRate(stats)
    };
    
    summary.competitions = {
      joined: this.getStatisticValue(stats, UserStatisticType.COMPETITIONS_JOINED) || 0,
      won: this.getStatisticValue(stats, UserStatisticType.COMPETITIONS_WON) || 0,
      win_rate: this.calculateWinRate(stats)
    };
    
    // Engagemang
    summary.engagement = {
      activity_streak: this.getStatisticValue(stats, UserStatisticType.ACTIVITY_STREAK) || 0,
      days_active: this.getStatisticValue(stats, UserStatisticType.DAYS_ACTIVE) || 0,
      login_streak: this.getStatisticValue(stats, UserStatisticType.LOGIN_STREAK) || 0
    };
    
    // Badges och utmärkelser
    summary.badges = this.getStatisticValue(stats, UserStatisticType.BADGES) || [];
    
    return summary;
  }
  
  /**
   * Beräknar färdigställandegrad för mål
   */
  private static calculateCompletionRate(stats: UserStatistics): number {
    const created = this.getStatisticValue(stats, UserStatisticType.GOALS_CREATED) as number || 0;
    const completed = this.getStatisticValue(stats, UserStatisticType.GOALS_COMPLETED) as number || 0;
    
    if (created === 0) return 0;
    return Math.round((completed / created) * 100);
  }
  
  /**
   * Beräknar vinstprocent för tävlingar
   */
  private static calculateWinRate(stats: UserStatistics): number {
    const joined = this.getStatisticValue(stats, UserStatisticType.COMPETITIONS_JOINED) as number || 0;
    const won = this.getStatisticValue(stats, UserStatisticType.COMPETITIONS_WON) as number || 0;
    
    if (joined === 0) return 0;
    return Math.round((won / joined) * 100);
  }
} 