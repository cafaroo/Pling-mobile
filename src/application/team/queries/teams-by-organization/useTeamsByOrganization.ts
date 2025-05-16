import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { TeamsByOrganizationParams, TeamsByOrganizationResult, TeamsByOrganizationQuery } from './TeamsByOrganizationQuery';
import { InfrastructureFactory } from '@/infrastructure/InfrastructureFactory';

/**
 * useTeamsByOrganization
 * 
 * React hook för att hämta team som tillhör en specifik organisation.
 * Använder React Query för caching och återhämtning av data.
 */
export const useTeamsByOrganization = (
  params: TeamsByOrganizationParams,
  options?: Omit<UseQueryOptions<TeamsByOrganizationResult, Error>, 'queryKey' | 'queryFn'>
) => {
  const queryKey = ['teams', 'organization', params.organizationId, params];
  
  return useQuery<TeamsByOrganizationResult, Error>({
    queryKey,
    queryFn: async () => {
      // Skapa en instans av infrastrukturen och hämta repositories
      const infrastructure = InfrastructureFactory.getInstance();
      const teamRepository = infrastructure.getTeamRepository();
      const organizationRepository = infrastructure.getOrganizationRepository();
      
      // Skapa query-instance och utför hämtning
      const query = new TeamsByOrganizationQuery(teamRepository, organizationRepository);
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
 * const { data, isLoading, error } = useTeamsByOrganization({
 *   organizationId: "123",
 *   includeMembers: true,
 *   sortBy: 'memberCount',
 *   sortDirection: 'desc'
 * });
 */ 