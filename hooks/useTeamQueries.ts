import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import * as teamService from '@/services/teamService';
import { Team, TeamMember, TeamInvitation } from '@/types/team';

// Konstanter för cache-tider
const CACHE_TIME = {
  LONG: 24 * 60 * 60 * 1000, // 24 timmar
  MEDIUM: 30 * 60 * 1000,    // 30 minuter
  SHORT: 10 * 60 * 1000,     // 10 minuter
};

// Konstanter för stale-tider
const STALE_TIME = {
  LONG: 15 * 60 * 1000,     // 15 minuter
  MEDIUM: 5 * 60 * 1000,    // 5 minuter
  SHORT: 1 * 60 * 1000,     // 1 minut
  REAL_TIME: 0,             // Alltid stale för realtidsuppdateringar
};

/**
 * Hook för att hantera alla team-relaterade queries med React Query
 * och optimera datahämtning, cachning och uppdatering.
 */
export function useTeamQueries() {
  /**
   * Hämtar alla team för en användare
   * Detta är grundläggande data som kan cacheas längre tid
   */
  const getUserTeams = (
    userId: string,
    options?: Partial<UseQueryOptions<Team[], Error, Team[]>>
  ): UseQueryResult<Team[], Error> => {
    return useQuery<Team[], Error, Team[]>({
      queryKey: ['user-teams', userId],
      queryFn: async () => {
        console.log('Anropar getUserTeams för userId:', userId);
        const response = await teamService.getUserTeams(userId);
        if (!response.success) {
          console.error('Fel vid hämtning av team:', response.error);
          throw new Error(response.error?.message || 'Kunde inte hämta team');
        }
        console.log('Hämtade team:', response.data);
        return response.data;
      },
      enabled: !!userId,
      staleTime: STALE_TIME.SHORT, // Minska staleTime för att uppdatera oftare
      cacheTime: CACHE_TIME.MEDIUM,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 2,
      ...options,
    });
  };

  /**
   * Hämtar ett specifikt team med ID
   * Teamdata ändras sällan så vi kan cacha den längre
   */
  const getTeam = (
    teamId: string,
    options?: Partial<UseQueryOptions<Team | null, Error, Team | null>>
  ): UseQueryResult<Team | null, Error> => {
    return useQuery<Team | null, Error, Team | null>({
      queryKey: ['team', teamId],
      queryFn: async () => {
        const response = await teamService.getTeam(teamId);
        if (!response.success) {
          throw new Error(response.error?.message || 'Kunde inte hämta team');
        }
        return response.data;
      },
      enabled: !!teamId,
      staleTime: STALE_TIME.MEDIUM,
      cacheTime: CACHE_TIME.MEDIUM,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      retry: 2,
      ...options,
    });
  };

  /**
   * Hämtar alla medlemmar i ett team
   * Medlemslistan kan ändras ofta så vi har kortare staleTime
   */
  const getTeamMembers = (
    teamId: string,
    options?: Partial<UseQueryOptions<TeamMember[], Error>>
  ) => {
    return useQuery<TeamMember[], Error>({
      queryKey: ['team-members', teamId],
      queryFn: () => teamService.getTeamMembers(teamId),
      enabled: !!teamId,
      staleTime: STALE_TIME.SHORT, 
      cacheTime: CACHE_TIME.MEDIUM,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      retry: 1,
      ...options,
    });
  };

  /**
   * Hämtar väntande medlemmar för ett team
   * Denna data kan ändras ofta så vi har kort staleTime men längre retry
   */
  const getPendingTeamMembers = (
    teamId: string,
    options?: Partial<UseQueryOptions<TeamMember[], Error>>
  ): UseQueryResult<TeamMember[], Error> => {
    return useQuery<TeamMember[], Error>({
      queryKey: ['pending-team-members', teamId],
      queryFn: async () => {
        const response = await teamService.getPendingTeamMembers(teamId);
        return response;
      },
      enabled: !!teamId,
      staleTime: STALE_TIME.SHORT,
      cacheTime: CACHE_TIME.SHORT,
      refetchOnMount: 'always',
      refetchOnWindowFocus: 'always',
      refetchOnReconnect: true,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      ...options,
    });
  };

  /**
   * Hämtar inbjudningar för en användare
   * Kritisk data som behöver vara färsk
   */
  const getTeamInvitation = (
    email: string,
    options?: Partial<UseQueryOptions<TeamInvitation | null, Error, TeamInvitation | null>>
  ): UseQueryResult<TeamInvitation | null, Error> => {
    return useQuery<TeamInvitation | null, Error, TeamInvitation | null>({
      queryKey: ['team-invitation', email],
      queryFn: async () => {
        const response = await teamService.getTeamInvitation(email);
        if (!response.success) {
          throw new Error(response.error?.message || 'Kunde inte hämta inbjudan');
        }
        return response.data;
      },
      enabled: !!email && email.includes('@'),
      staleTime: STALE_TIME.SHORT,
      cacheTime: CACHE_TIME.SHORT,
      refetchOnMount: 'always',
      refetchOnWindowFocus: 'always', 
      refetchOnReconnect: true,
      retry: 2,
      ...options,
    });
  };

  /**
   * Hämtar statistik för ett team
   * Denna data kan vara längre i cache med infrekventa uppdateringar
   */
  const getTeamStats = (
    teamId: string,
    options?: Partial<UseQueryOptions<any, Error>>
  ) => {
    return useQuery<any, Error>({
      queryKey: ['team-stats', teamId],
      queryFn: () => teamService.getTeamStats?.(teamId) || Promise.resolve({}),
      enabled: !!teamId,
      staleTime: STALE_TIME.LONG,
      cacheTime: CACHE_TIME.LONG,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      ...options,
    });
  };

  /**
   * Hämtar aktivitetsloggen för ett team
   * Ny data kommer hela tiden, så vi vill uppdatera oftare
   */
  const getTeamActivity = (
    teamId: string,
    options?: Partial<UseQueryOptions<any[], Error>>
  ) => {
    return useQuery<any[], Error>({
      queryKey: ['team-activity', teamId],
      queryFn: () => teamService.getTeamActivity?.(teamId) || Promise.resolve([]),
      enabled: !!teamId,
      staleTime: STALE_TIME.REAL_TIME,
      cacheTime: CACHE_TIME.SHORT,
      refetchOnMount: 'always',
      refetchOnWindowFocus: 'always',
      refetchInterval: 30000, // Poll var 30:e sekund
      ...options,
    });
  };

  return {
    getUserTeams,
    getTeam,
    getTeamMembers,
    getPendingTeamMembers,
    getTeamInvitation,
    getTeamStats,
    getTeamActivity,
  };
}

export default useTeamQueries; 