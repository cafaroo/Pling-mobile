import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { 
  TeamStatisticsDashboardParams, 
  TeamStatisticsDashboardResult, 
  TeamStatisticsDashboardQuery 
} from './TeamStatisticsDashboardQuery';
import { InfrastructureFactory } from '@/infrastructure/InfrastructureFactory';

/**
 * useTeamStatisticsDashboard
 * 
 * React hook för att hämta kombinerade statistikuppgifter för ett team till en dashboard-vy.
 * Använder React Query för caching och återhämtning av data.
 */
export const useTeamStatisticsDashboard = (
  params: TeamStatisticsDashboardParams,
  options?: Omit<UseQueryOptions<TeamStatisticsDashboardResult, Error>, 'queryKey' | 'queryFn'>
) => {
  // Skapa en genomtänkt cache-nyckel baserad på parametrarna
  const queryKey = ['team', 'statistics', 'dashboard', params.teamId, params];
  
  return useQuery<TeamStatisticsDashboardResult, Error>({
    queryKey,
    queryFn: async () => {
      // Skapa en instans av infrastrukturen och hämta repositories
      const infrastructure = InfrastructureFactory.getInstance();
      const teamRepository = infrastructure.getTeamRepository();
      const teamActivityRepository = infrastructure.getTeamActivityRepository();
      const teamStatisticsRepository = infrastructure.getTeamStatisticsRepository();
      
      // Skapa query-instance och utför hämtning
      const query = new TeamStatisticsDashboardQuery(
        teamRepository,
        teamActivityRepository,
        teamStatisticsRepository
      );
      
      const result = await query.execute(params);
      
      if (result.isErr()) {
        throw new Error(result.error);
      }
      
      return result.value;
    },
    // Anpassa staleTime baserat på datamängd för bättre prestanda
    staleTime: determineStaleTime(params),
    // Standardalternativ som kan överskridas
    cacheTime: 30 * 60 * 1000, // 30 minuter
    retry: 1,
    refetchOnWindowFocus: false,
    ...options,
  });
};

/**
 * Hjälpfunktion för att bestämma lämplig staleTime baserat på parametrar
 */
function determineStaleTime(params: TeamStatisticsDashboardParams): number {
  // Trender och stora datamängder kan cachas längre
  if (params.includeTrends) {
    return 15 * 60 * 1000; // 15 minuter
  }
  
  // Om vi bara behöver grundläggande statistik, kortare cacheperiod
  if (!params.includeMemberStats && !params.includeActivities) {
    return 5 * 60 * 1000; // 5 minuter
  }
  
  // Standard för kombinerade datamängder
  return 10 * 60 * 1000; // 10 minuter
}

/**
 * Exempel på användning:
 * 
 * const { data, isLoading, error } = useTeamStatisticsDashboard({
 *   teamId: "123",
 *   includeTrends: true,
 *   includeMemberStats: true,
 *   includeTeamDetails: true,
 *   includeActivities: true,
 *   limit: 5
 * });
 */ 