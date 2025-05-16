import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { 
  TeamActivityFeedParams, 
  TeamActivityFeedResult, 
  TeamActivityFeedQuery 
} from './TeamActivityFeedQuery';
import { InfrastructureFactory } from '@/infrastructure/InfrastructureFactory';

/**
 * useTeamActivityFeed
 * 
 * React hook för att hämta en aktivitetsfeed för ett team med stöd för paginering,
 * filtrering och sortering. Använder React Query för caching och återhämtning av data.
 */
export const useTeamActivityFeed = (
  params: TeamActivityFeedParams,
  options?: Omit<UseQueryOptions<TeamActivityFeedResult, Error>, 'queryKey' | 'queryFn'>
) => {
  // Skapa en queryKey baserad på alla parametrar
  const queryKey = ['team', 'activity', 'feed', params.teamId, {
    page: params.page || 1,
    pageSize: params.pageSize || 20,
    activityTypes: params.activityTypes || [],
    performedBy: params.performedBy,
    startDate: params.startDate,
    endDate: params.endDate,
    sortBy: params.sortBy || 'timestamp',
    sortDirection: params.sortDirection || 'desc'
  }];
  
  return useQuery<TeamActivityFeedResult, Error>({
    queryKey,
    queryFn: async () => {
      // Skapa en instans av infrastrukturen och hämta repositories
      const infrastructure = InfrastructureFactory.getInstance();
      const teamRepository = infrastructure.getTeamRepository();
      const teamActivityRepository = infrastructure.getTeamActivityRepository();
      const userRepository = infrastructure.getUserRepository();
      
      // Skapa query-instance och utför hämtning
      const query = new TeamActivityFeedQuery(
        teamRepository,
        teamActivityRepository,
        userRepository
      );
      
      const result = await query.execute(params);
      
      if (result.isErr()) {
        throw new Error(result.error);
      }
      
      return result.value;
    },
    // Aktivitetsfeeds kan uppdateras oftare 
    staleTime: 60 * 1000, // 1 minut
    // Men behåll data i cachen en tid
    cacheTime: 5 * 60 * 1000, // 5 minuter
    // Standardalternativ för pagination
    keepPreviousData: true, // Behåll tidigare data medan ny data laddas (för bättre UX)
    ...options,
  });
};

/**
 * Exempel på användning:
 * 
 * // Grundläggande användning
 * const { data, isLoading, error } = useTeamActivityFeed({
 *   teamId: "123",
 *   page: 1,
 *   pageSize: 20
 * });
 * 
 * // Med filtrering
 * const { data, isLoading, error } = useTeamActivityFeed({
 *   teamId: "123",
 *   page: 1,
 *   pageSize: 20,
 *   activityTypes: ["message_created", "member_joined"],
 *   performedBy: "user-456",
 *   startDate: "2024-01-01",
 *   sortBy: "timestamp",
 *   sortDirection: "desc"
 * });
 * 
 * // Visa resultat
 * if (isLoading) return <LoadingIndicator />;
 * if (error) return <ErrorMessage error={error} />;
 * 
 * return (
 *   <ActivityFeed 
 *     activities={data.activities}
 *     teamName={data.teamName}
 *     pagination={{
 *       currentPage: data.page,
 *       totalPages: Math.ceil(data.totalCount / data.pageSize),
 *       hasNextPage: data.hasNextPage,
 *       onPageChange: (newPage) => setPage(newPage)
 *     }}
 *   />
 * );
 */ 