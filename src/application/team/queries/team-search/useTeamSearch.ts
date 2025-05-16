import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { TeamSearchParams, TeamSearchResult, TeamSearchQuery } from './TeamSearchQuery';
import { InfrastructureFactory } from '@/infrastructure/InfrastructureFactory';

/**
 * useTeamSearch
 * 
 * React hook for att söka efter team med olika filter och sorteringsalternativ.
 * Använder React Query för caching och återhämtning av data.
 */
export const useTeamSearch = (
  params: TeamSearchParams,
  options?: Omit<UseQueryOptions<TeamSearchResult, Error>, 'queryKey' | 'queryFn'>
) => {
  const queryKey = ['teams', 'search', params];
  
  return useQuery<TeamSearchResult, Error>({
    queryKey,
    queryFn: async () => {
      // Skapa en instans av infrastrukturen och hämta repository
      const infrastructure = InfrastructureFactory.getInstance();
      const teamRepository = infrastructure.getTeamRepository();
      
      // Skapa query-instance och utför sökning
      const query = new TeamSearchQuery(teamRepository);
      const result = await query.execute(params);
      
      if (result.isErr()) {
        throw new Error(result.error);
      }
      
      return result.value;
    },
    staleTime: 5 * 60 * 1000, // 5 minuter
    ...options,
  });
};

/**
 * Exempel på användning:
 * 
 * const { data, isLoading, error } = useTeamSearch({
 *   query: "projekt",
 *   includePublicOnly: true,
 *   sortBy: 'memberCount',
 *   sortDirection: 'desc'
 * });
 */ 