import { Result, ok, err } from '@/shared/core/Result';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { TeamActivityRepository } from '@/domain/team/repositories/TeamActivityRepository';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { UniqueId } from '@/shared/core/UniqueId';
import { TeamActivity } from '@/domain/team/entities/TeamActivity';

export interface TeamActivityFeedParams {
  teamId: string;
  page?: number;
  pageSize?: number;
  activityTypes?: string[];
  performedBy?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'timestamp' | 'type' | 'performedBy';
  sortDirection?: 'asc' | 'desc';
}

export interface ActivityFeedItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  performedBy: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  metadata?: Record<string, any>;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

export interface TeamActivityFeedResult {
  activities: ActivityFeedItem[];
  totalCount: number;
  hasNextPage: boolean;
  page: number;
  pageSize: number;
  teamId: string;
  teamName: string;
}

/**
 * TeamActivityFeedQuery
 * 
 * En specialiserad query för att hämta en aktivitetsfeed för ett team
 * med stöd för paginering, filtrering och sortering.
 */
export class TeamActivityFeedQuery {
  constructor(
    private teamRepository: TeamRepository,
    private teamActivityRepository: TeamActivityRepository,
    private userRepository: UserRepository
  ) {}

  /**
   * Utför hämtning av aktivitetsfeed för ett team
   */
  async execute(params: TeamActivityFeedParams): Promise<Result<TeamActivityFeedResult, string>> {
    try {
      if (!params.teamId) {
        return err('teamId är obligatoriskt');
      }

      const teamId = new UniqueId(params.teamId);
      const page = params.page || 1;
      const pageSize = params.pageSize || 20;
      const sortBy = params.sortBy || 'timestamp';
      const sortDirection = params.sortDirection || 'desc';
      
      // Validera pagination
      if (page < 1) {
        return err('Sidnummer måste vara större än 0');
      }
      
      if (pageSize < 1 || pageSize > 100) {
        return err('Sidstorleken måste vara mellan 1 och 100');
      }
      
      // Validera datum om de anges
      const startDate = params.startDate ? new Date(params.startDate) : undefined;
      const endDate = params.endDate ? new Date(params.endDate) : undefined;
      
      if (startDate && isNaN(startDate.getTime())) {
        return err('Ogiltigt startdatum');
      }
      
      if (endDate && isNaN(endDate.getTime())) {
        return err('Ogiltigt slutdatum');
      }
      
      if (startDate && endDate && startDate > endDate) {
        return err('Startdatum kan inte vara senare än slutdatum');
      }
      
      // Hämta team-information
      const teamResult = await this.teamRepository.findById(teamId);
      
      if (teamResult.isErr()) {
        return err(`Kunde inte hämta team: ${teamResult.error}`);
      }
      
      const team = teamResult.value;
      
      if (!team) {
        return err(`Teamet hittades inte`);
      }
      
      // Skapa filter för aktiviteter
      const filter: any = {
        limit: pageSize + 1, // Hämta en extra för att veta om det finns fler
        offset: (page - 1) * pageSize,
        performedBy: params.performedBy ? new UniqueId(params.performedBy) : undefined,
        activityTypes: params.activityTypes,
        startDate,
        endDate
      };
      
      // Hämta aktiviteter med filter
      const activitiesResult = await this.teamActivityRepository.findByTeam(teamId, filter);
      
      if (activitiesResult.isErr()) {
        return err(`Kunde inte hämta aktiviteter: ${activitiesResult.error}`);
      }
      
      let activities = activitiesResult.value;
      
      // Sortering
      activities = this.sortActivities(activities, sortBy, sortDirection);
      
      // Kontrollera om det finns fler resultat
      const hasNextPage = activities.length > pageSize;
      
      // Ta bort det extra resultatet om det finns ett
      if (hasNextPage) {
        activities = activities.slice(0, pageSize);
      }
      
      // Hämta användardata för aktiviteterna
      const enrichedActivities = await this.enrichActivitiesWithUserData(activities);
      
      if (enrichedActivities.isErr()) {
        return err(`Kunde inte hämta användardata för aktiviteter: ${enrichedActivities.error}`);
      }
      
      // Hämta total antal aktiviteter för pagination
      const countResult = await this.teamActivityRepository.countByTeam(teamId, {
        performedBy: params.performedBy ? new UniqueId(params.performedBy) : undefined,
        activityTypes: params.activityTypes,
        startDate,
        endDate
      });
      
      const totalCount = countResult.isOk() ? countResult.value : activities.length;
      
      return ok({
        activities: enrichedActivities.value,
        totalCount,
        hasNextPage,
        page,
        pageSize,
        teamId: teamId.toString(),
        teamName: team.name
      });
    } catch (error) {
      return err(`Ett fel inträffade vid hämtning av aktivitetsfeed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Hjälpmetod för att sortera aktiviteter
   */
  private sortActivities(
    activities: TeamActivity[], 
    sortBy: 'timestamp' | 'type' | 'performedBy', 
    sortDirection: 'asc' | 'desc'
  ): TeamActivity[] {
    return [...activities].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'timestamp':
          comparison = a.timestamp.getTime() - b.timestamp.getTime();
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'performedBy':
          comparison = a.performedBy.toString().localeCompare(b.performedBy.toString());
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }
  
  /**
   * Hjälpmetod för att berika aktiviteter med användardata
   */
  private async enrichActivitiesWithUserData(
    activities: TeamActivity[]
  ): Promise<Result<ActivityFeedItem[], string>> {
    try {
      // Samla användar-IDs
      const userIds = activities.map(activity => activity.performedBy);
      
      // Hämta användardata
      const usersResult = await this.userRepository.findByIds(userIds);
      
      if (usersResult.isErr()) {
        return err(`Kunde inte hämta användarinformation: ${usersResult.error}`);
      }
      
      const users = usersResult.value;
      
      // Skapa en map för snabb åtkomst av användardata
      const userMap = new Map();
      users.forEach(user => userMap.set(user.id.toString(), user));
      
      // Berika aktiviteter med användardata
      const enrichedActivities: ActivityFeedItem[] = activities.map(activity => {
        const user = userMap.get(activity.performedBy.toString());
        
        return {
          id: activity.id.toString(),
          type: activity.type,
          description: activity.description,
          timestamp: activity.timestamp.toISOString(),
          performedBy: {
            id: activity.performedBy.toString(),
            name: user ? `${user.profile.firstName} ${user.profile.lastName}` : 'Okänd användare',
            avatarUrl: user?.profile.avatarUrl
          },
          metadata: activity.metadata,
          relatedEntityId: activity.relatedEntityId?.toString(),
          relatedEntityType: activity.relatedEntityType
        };
      });
      
      return ok(enrichedActivities);
    } catch (error) {
      return err(`Ett fel inträffade vid berikning av aktiviteter med användardata: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 