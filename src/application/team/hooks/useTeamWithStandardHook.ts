import { UniqueId } from '@/shared/core/UniqueId';
import { createStandardizedQuery, createStandardizedMutation } from '@/application/shared/hooks/createStandardizedHook';
import { unwrapResult } from '@/application/shared/hooks/BaseHook';
import { useTeamDependencies } from './useTeamContext';
import {
  CreateTeamUseCase,
  AddTeamMemberUseCase,
  TeamDTO,
  CreateTeamDTO,
  CreateTeamResponse,
  AddTeamMemberDTO,
  RemoveTeamMemberDTO,
  UpdateTeamMemberRoleDTO
} from '../';

/**
 * Förbättrad hook för team-operationer som använder standardiserade hook-verktyg
 * 
 * Denna hook använder konfigurationsbaserade creators för att standardisera
 * felhantering, caching och invalidering.
 */
export function useTeamWithStandardHook() {
  const {
    teamRepository,
    userRepository,
    teamActivityRepository,
    eventPublisher
  } = useTeamDependencies();
  
  // ==================== QUERIES ====================
  
  /**
   * Hämtar ett team med ID
   */
  const useTeamById = createStandardizedQuery<Team, [string | undefined]>({
    queryKeyPrefix: 'team',
    buildQueryKey: ([teamId]) => ['team', teamId],
    queryFn: async (teamId) => {
      if (!teamId) return null;
      
      const result = await teamRepository.findById(new UniqueId(teamId));
      return unwrapResult(result);
    },
    enabled: ([teamId]) => Boolean(teamId),
    staleTime: 5 * 60 * 1000, // 5 minuter
    refetchOnWindowFocus: true
  });
  
  /**
   * Hämtar alla team som en användare är medlem i
   */
  const useUserTeams = createStandardizedQuery<Team[], [string | undefined]>({
    queryKeyPrefix: 'userTeams',
    buildQueryKey: ([userId]) => ['teams', 'user', userId],
    queryFn: async (userId) => {
      if (!userId) return [];
      
      const result = await teamRepository.findByMemberId(new UniqueId(userId));
      return unwrapResult(result);
    },
    enabled: ([userId]) => Boolean(userId),
    staleTime: 5 * 60 * 1000 // 5 minuter
  });
  
  // ==================== MUTATIONS ====================
  
  /**
   * Skapar ett nytt team
   */
  const useCreateTeam = createStandardizedMutation<CreateTeamResponse, CreateTeamDTO>({
    mutationFn: async (dto) => {
      const createTeamUseCase = new CreateTeamUseCase(teamRepository, eventPublisher);
      const result = await createTeamUseCase.execute(dto);
      return unwrapResult(result);
    },
    invalidateQueryKey: (variables) => [
      ['teams', 'user', variables.ownerId]
    ],
    onSuccess: (data) => {
      // Ytterligare logik som ska köras vid framgång
      console.log(`Team skapat med ID: ${data.teamId}`);
    }
  });
  
  /**
   * Lägger till en medlem i ett team
   */
  const useAddTeamMember = createStandardizedMutation<void, AddTeamMemberDTO>({
    mutationFn: async (dto) => {
      const addTeamMemberUseCase = new AddTeamMemberUseCase(teamRepository, eventPublisher);
      const result = await addTeamMemberUseCase.execute(dto);
      return unwrapResult(result);
    },
    invalidateQueryKey: (variables) => [
      ['team', variables.teamId],
      ['teams', 'user', variables.userId]
    ]
  });
  
  /**
   * Tar bort en medlem från ett team
   */
  const useRemoveTeamMember = createStandardizedMutation<void, RemoveTeamMemberDTO>({
    mutationFn: async (dto) => {
      const removeTeamMemberUseCase = new RemoveTeamMemberUseCase(teamRepository, eventPublisher);
      const result = await removeTeamMemberUseCase.execute(dto);
      return unwrapResult(result);
    },
    invalidateQueryKey: (variables) => [
      ['team', variables.teamId],
      ['teams', 'user', variables.userId]
    ]
  });
  
  /**
   * Uppdaterar rollen för en teammedlem
   */
  const useUpdateTeamMemberRole = createStandardizedMutation<void, UpdateTeamMemberRoleDTO>({
    mutationFn: async (dto) => {
      const updateTeamMemberRoleUseCase = new UpdateTeamMemberRoleUseCase(teamRepository, eventPublisher);
      const result = await updateTeamMemberRoleUseCase.execute(dto);
      return unwrapResult(result);
    },
    invalidateQueryKey: (variables) => [
      ['team', variables.teamId]
    ]
  });
  
  return {
    // Queries
    useTeamById,
    useUserTeams,
    
    // Mutations
    useCreateTeam,
    useAddTeamMember,
    useRemoveTeamMember,
    useUpdateTeamMemberRole
  };
} 