import { 
  createStandardizedQuery, 
  createStandardizedMutation,
  unwrapResult 
} from '@/application/shared/hooks/createStandardizedHook';
import { 
  HookErrorCode, 
  ErrorContext
} from '@/application/shared/hooks/HookErrorTypes';
import { ProgressInfo } from '@/application/shared/hooks/useStandardizedHook';
import { Team } from '@/domain/team/entities/Team';
import { useTeamContext } from './useTeamContext';
import { CreateTeamDTO } from '../dto/CreateTeamDTO';
import { AddTeamMemberDTO } from '../dto/AddTeamMemberDTO';
import { TeamMemberRoleDTO } from '../dto/TeamMemberRoleDTO';
import { createLogger } from '@/infrastructure/logger';
import { UniqueId } from '@/shared/core/UniqueId';

const logger = createLogger('useTeamWithStandardHook');

/**
 * Skapar en standard felkontext för team-relaterade operationer
 */
const createTeamErrorContext = (operation: string, details?: Record<string, any>): ErrorContext => ({
  domain: 'team',
  operation,
  details,
  timestamp: new Date()
});

/**
 * Hook för att hantera team-operationer med standardiserad felhantering och caching
 * @returns Ett objekt med standardiserade team-operationer
 */
export function useTeamWithStandardHook() {
  const { 
    createTeamUseCase, 
    getTeamUseCase,
    getTeamsForUserUseCase,
    addTeamMemberUseCase,
    removeTeamMemberUseCase,
    updateTeamMemberRoleUseCase,
    getTeamStatisticsUseCase
  } = useTeamContext();

  // ==================== QUERIES ====================
  
  /**
   * Hämtar ett team med ID
   */
  const useGetTeam = createStandardizedQuery<Team, [string | undefined]>({
    queryKeyPrefix: 'team',
    buildQueryKey: (params) => {
      const teamId = params?.[0] ?? '';
      return ['team', teamId];
    },
    queryFn: async (teamId) => {
      if (!teamId) return null;
      
      logger.info('Hämtar team', { teamId });
      const result = await getTeamUseCase.execute({ teamId });
      return unwrapResult(result);
    },
    enabled: (params) => {
      const teamId = params?.[0];
      return Boolean(teamId);
    },
    staleTime: 2 * 60 * 1000, // 2 minuter
    errorContext: (params) => {
      const teamId = params?.[0] ?? '';
      return createTeamErrorContext('getTeam', { teamId });
    },
    retry: 2
  });
  
  /**
   * Hämtar alla team för en användare
   */
  const useGetTeamsForUser = createStandardizedQuery<Team[], [string | undefined]>({
    queryKeyPrefix: 'userTeams',
    buildQueryKey: (params) => {
      const userId = params?.[0] ?? '';
      return ['teams', 'user', userId];
    },
    queryFn: async (userId) => {
      if (!userId) return [];
      
      logger.info('Hämtar team för användare', { userId });
      const result = await getTeamsForUserUseCase.execute({ userId });
      return unwrapResult(result);
    },
    enabled: (params) => {
      const userId = params?.[0];
      return Boolean(userId);
    },
    staleTime: 5 * 60 * 1000, // 5 minuter
    errorContext: (params) => {
      const userId = params?.[0] ?? '';
      return createTeamErrorContext('getTeamsForUser', { userId });
    }
  });
  
  /**
   * Hämtar teamstatistik
   */
  const useGetTeamStatistics = createStandardizedQuery<any, [string | undefined]>({
    queryKeyPrefix: 'teamStatistics',
    buildQueryKey: (params) => {
      const teamId = params?.[0] ?? '';
      return ['team', teamId, 'statistics'];
    },
    queryFn: async (teamId) => {
      if (!teamId) return null;
      
      logger.info('Hämtar teamstatistik', { teamId });
      const result = await getTeamStatisticsUseCase.execute({ teamId });
      return unwrapResult(result);
    },
    enabled: (params) => {
      const teamId = params?.[0];
      return Boolean(teamId);
    },
    staleTime: 10 * 60 * 1000, // 10 minuter
    errorContext: (params) => {
      const teamId = params?.[0] ?? '';
      return createTeamErrorContext('getTeamStatistics', { teamId });
    }
  });

  // ==================== MUTATIONS ====================
  
  /**
   * Skapar ett nytt team
   */
  const useCreateTeam = createStandardizedMutation<Team, CreateTeamDTO>({
    mutationFn: async (params, updateProgress) => {
      logger.info('Skapar nytt team', { name: params.name });
      
      // Simulera stegvist laddningsframsteg
      updateProgress?.({ percent: 10, message: 'Validerar teamuppgifter...' });
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulerar validering
      
      updateProgress?.({ percent: 30, message: 'Skapar team...' });
      const result = await createTeamUseCase.execute(params);
      
      if (result.isOk()) {
        updateProgress?.({ percent: 80, message: 'Uppdaterar användarbehörigheter...' });
        await new Promise(resolve => setTimeout(resolve, 200)); // Simulerar ytterligare steg
        
        updateProgress?.({ percent: 100, message: 'Klart!' });
      }
      
      return unwrapResult(result);
    },
    invalidateQueryKey: (params) => [
      ['userTeams', params.ownerId]
    ],
    errorContext: (params) => createTeamErrorContext('createTeam', { params }),
    onSuccess: (team) => {
      logger.info('Team skapat framgångsrikt', { teamId: team.id });
    }
  });
  
  /**
   * Lägger till en medlem i ett team
   */
  const useAddTeamMember = createStandardizedMutation<void, AddTeamMemberDTO>({
    mutationFn: async (params, updateProgress) => {
      updateProgress?.({ percent: 20, message: 'Validerar medlem...' });
      await new Promise(resolve => setTimeout(resolve, 200));
      
      updateProgress?.({ percent: 50, message: 'Lägger till medlem...' });
      const result = await addTeamMemberUseCase.execute(params);
      
      if (result.isOk()) {
        updateProgress?.({ percent: 80, message: 'Uppdaterar teamstatistik...' });
        await new Promise(resolve => setTimeout(resolve, 200));
        
        updateProgress?.({ percent: 100, message: 'Medlem tillagd!' });
      }
      
      return unwrapResult(result);
    },
    invalidateQueryKey: (params) => [
      ['team', params.teamId],
      ['team', params.teamId, 'members']
    ],
    optimisticUpdate: {
      queryKey: ['team', params => params.teamId],
      updateFn: (oldData: Team, variables) => {
        if (!oldData) return oldData;
        
        // Optimistiskt lägga till användare i medlemslistan
        const newMembers = [...oldData.members, {
          id: variables.userId,
          role: variables.role,
          joinedAt: new Date()
        }];
        
        return {
          ...oldData,
          members: newMembers
        };
      }
    },
    errorContext: (params) => createTeamErrorContext('addTeamMember', { params })
  });
  
  /**
   * Tar bort en medlem från ett team
   */
  const useRemoveTeamMember = createStandardizedMutation<void, { teamId: string, memberId: string }>({
    mutationFn: async (params, updateProgress) => {
      updateProgress?.({ percent: 30, message: 'Tar bort medlem...' });
      const result = await removeTeamMemberUseCase.execute(params);
      updateProgress?.({ percent: 100, message: 'Medlem borttagen' });
      return unwrapResult(result);
    },
    invalidateQueryKey: (params) => [
      ['team', params.teamId],
      ['team', params.teamId, 'members']
    ],
    optimisticUpdate: {
      queryKey: ['team', params => params.teamId],
      updateFn: (oldData: Team, variables) => {
        if (!oldData) return oldData;
        
        // Optimistiskt ta bort användare från medlemslistan
        const newMembers = oldData.members.filter(
          member => member.id !== variables.memberId
        );
        
        return {
          ...oldData,
          members: newMembers
        };
      }
    },
    errorContext: (params) => createTeamErrorContext('removeTeamMember', { params })
  });
  
  /**
   * Uppdaterar en teammedlems roll
   */
  const useUpdateTeamMemberRole = createStandardizedMutation<void, TeamMemberRoleDTO>({
    mutationFn: async (params, updateProgress) => {
      updateProgress?.({ percent: 40, message: 'Uppdaterar roll...' });
      const result = await updateTeamMemberRoleUseCase.execute(params);
      updateProgress?.({ percent: 100, message: 'Roll uppdaterad' });
      return unwrapResult(result);
    },
    invalidateQueryKey: (params) => [
      ['team', params.teamId],
      ['team', params.teamId, 'members']
    ],
    optimisticUpdate: {
      queryKey: ['team', params => params.teamId],
      updateFn: (oldData: Team, variables) => {
        if (!oldData) return oldData;
        
        // Optimistiskt uppdatera användarens roll
        const newMembers = oldData.members.map(member => 
          member.id === variables.memberId
            ? { ...member, role: variables.role }
            : member
        );
        
        return {
          ...oldData,
          members: newMembers
        };
      }
    },
    errorContext: (params) => createTeamErrorContext('updateTeamMemberRole', { params })
  });

  return {
    // Queries
    useGetTeam,
    useGetTeamsForUser, 
    useGetTeamStatistics,
    
    // Mutations
    useCreateTeam,
    useAddTeamMember,
    useRemoveTeamMember,
    useUpdateTeamMemberRole
  };
}

// Exportera typer för enklare användning
export type UseTeamWithStandardHookResult = ReturnType<typeof useTeamWithStandardHook>; 