import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { 
  TeamMemberDetailsParams, 
  TeamMemberDetailsResult, 
  TeamMemberDetailsQuery 
} from './TeamMemberDetailsQuery';
import { InfrastructureFactory } from '@/infrastructure/InfrastructureFactory';

/**
 * useTeamMemberDetails
 * 
 * React hook för att hämta detaljerad information om teammedlemmar.
 * Använder React Query för caching och återhämtning av data.
 */
export const useTeamMemberDetails = (
  params: TeamMemberDetailsParams,
  options?: Omit<UseQueryOptions<TeamMemberDetailsResult, Error>, 'queryKey' | 'queryFn'>
) => {
  const baseKey = ['team', 'members', 'details', params.teamId];
  
  // Lägg till extra parametrar i cache-nyckeln baserat på vilka flaggor som är aktiverade
  const queryKey = [
    ...baseKey,
    params.includeInactive ? 'with-inactive' : 'active-only',
    params.includeMemberActivity ? 'with-activity' : 'no-activity',
    params.includeProfileDetails ? 'with-profile' : 'basic-profile'
  ];
  
  return useQuery<TeamMemberDetailsResult, Error>({
    queryKey,
    queryFn: async () => {
      // Skapa en instans av infrastrukturen och hämta repositories
      const infrastructure = InfrastructureFactory.getInstance();
      const teamRepository = infrastructure.getTeamRepository();
      const userRepository = infrastructure.getUserRepository();
      
      // Skapa query-instance och utför hämtning
      const query = new TeamMemberDetailsQuery(teamRepository, userRepository);
      const result = await query.execute(params);
      
      if (result.isErr()) {
        throw new Error(result.error);
      }
      
      return result.value;
    },
    // Data om teammedlemmar ska vara relativt färskt
    staleTime: 2 * 60 * 1000, // 2 minuter
    // Behåll data i cachen en tid efter att komponenten avmonteras
    cacheTime: 10 * 60 * 1000, // 10 minuter
    ...options,
  });
};

/**
 * Exempel på användning:
 * 
 * const { data, isLoading, error } = useTeamMemberDetails({
 *   teamId: "123",
 *   includeInactive: false,
 *   includeMemberActivity: true,
 *   includeProfileDetails: true
 * });
 * 
 * if (isLoading) return <LoadingIndicator />;
 * if (error) return <ErrorMessage error={error} />;
 * 
 * return (
 *   <TeamMemberList 
 *     members={data.members} 
 *     teamName={data.team.name} 
 *   />
 * );
 */ 