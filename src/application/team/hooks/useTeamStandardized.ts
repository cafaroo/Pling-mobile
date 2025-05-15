import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UniqueId } from '@/shared/core/UniqueId';
import { 
  CreateTeamUseCase, 
  AddTeamMemberUseCase,
  RemoveTeamMemberUseCase,
  UpdateTeamMemberRoleUseCase,
  InviteTeamMemberUseCase,
  GetTeamStatisticsUseCase,
  CreateTeamActivityUseCase,
  CreateTeamMessageUseCase
} from '../useCases';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { TeamActivityRepository } from '@/domain/team/repositories/TeamActivityRepository';
import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';
import { 
  CreateTeamResponse, 
  CreateTeamDTO,
  AddTeamMemberDTO,
  RemoveTeamMemberDTO,
  UpdateTeamMemberRoleDTO,
  InviteTeamMemberDTO,
  TeamDTO,
  TeamStatisticsDTO,
  CreateTeamActivityDTO,
  CreateTeamMessageDTO
} from '../dto';

/**
 * Hook för hantering av team med de refaktorerade Use Cases
 * Följer standard DDD-principer och använder React Query
 */
export function useTeamStandardized(
  teamRepository: TeamRepository,
  userRepository: UserRepository,
  teamActivityRepository: TeamActivityRepository,
  eventPublisher: IDomainEventPublisher
) {
  const queryClient = useQueryClient();
  
  /**
   * Hämtar ett specifikt team med ID
   */
  const useTeamById = (teamId: string | undefined) => {
    return useQuery({
      queryKey: ['team', teamId],
      queryFn: async () => {
        if (!teamId) return null;
        
        const id = new UniqueId(teamId);
        const result = await teamRepository.findById(id);
        
        if (result.isFailure) {
          throw new Error(result.error);
        }
        
        return result.getValue();
      },
      enabled: !!teamId
    });
  };
  
  /**
   * Hämtar alla team som en användare är medlem i
   */
  const useUserTeams = (userId: string | undefined) => {
    return useQuery({
      queryKey: ['teams', 'user', userId],
      queryFn: async () => {
        if (!userId) return [];
        
        const id = new UniqueId(userId);
        const result = await teamRepository.findByMemberId(id);
        
        if (result.isFailure) {
          throw new Error(result.error);
        }
        
        return result.getValue();
      },
      enabled: !!userId
    });
  };
  
  /**
   * Skapar ett nytt team
   */
  const useCreateTeam = () => {
    const createTeamUseCase = new CreateTeamUseCase(teamRepository, eventPublisher);
    
    return useMutation({
      mutationFn: async (dto: CreateTeamDTO): Promise<CreateTeamResponse> => {
        const result = await createTeamUseCase.execute(dto);
        
        if (result.isFailure) {
          throw new Error(result.error);
        }
        
        return result.getValue();
      },
      onSuccess: (data, variables) => {
        // Invalidera relevanta queries
        queryClient.invalidateQueries({ queryKey: ['teams', 'user', variables.ownerId] });
        queryClient.invalidateQueries({ queryKey: ['team', data.teamId] });
      }
    });
  };
  
  /**
   * Lägger till en medlem i ett team
   */
  const useAddTeamMember = () => {
    const addTeamMemberUseCase = new AddTeamMemberUseCase(teamRepository, eventPublisher);
    
    return useMutation({
      mutationFn: async (dto: AddTeamMemberDTO) => {
        const result = await addTeamMemberUseCase.execute(dto);
        
        if (result.isFailure) {
          throw new Error(result.error);
        }
        
        return result.getValue();
      },
      onSuccess: (_, variables) => {
        // Invalidera team-data och medlemsdata
        queryClient.invalidateQueries({ queryKey: ['team', variables.teamId] });
        queryClient.invalidateQueries({ queryKey: ['teams', 'user', variables.userId] });
      }
    });
  };
  
  /**
   * Tar bort en medlem från ett team
   */
  const useRemoveTeamMember = () => {
    const removeTeamMemberUseCase = new RemoveTeamMemberUseCase(teamRepository, eventPublisher);
    
    return useMutation({
      mutationFn: async (dto: RemoveTeamMemberDTO) => {
        const result = await removeTeamMemberUseCase.execute(dto);
        
        if (result.isFailure) {
          throw new Error(result.error);
        }
        
        return result.getValue();
      },
      onSuccess: (_, variables) => {
        // Invalidera team-data och medlemsdata
        queryClient.invalidateQueries({ queryKey: ['team', variables.teamId] });
        queryClient.invalidateQueries({ queryKey: ['teams', 'user', variables.userId] });
      }
    });
  };
  
  /**
   * Uppdaterar rollen för en teammedlem
   */
  const useUpdateTeamMemberRole = () => {
    const updateTeamMemberRoleUseCase = new UpdateTeamMemberRoleUseCase(teamRepository, eventPublisher);
    
    return useMutation({
      mutationFn: async (dto: UpdateTeamMemberRoleDTO) => {
        const result = await updateTeamMemberRoleUseCase.execute(dto);
        
        if (result.isFailure) {
          throw new Error(result.error);
        }
        
        return result.getValue();
      },
      onSuccess: (_, variables) => {
        // Invalidera team-data
        queryClient.invalidateQueries({ queryKey: ['team', variables.teamId] });
      }
    });
  };
  
  /**
   * Bjuder in en användare till ett team
   */
  const useInviteTeamMember = () => {
    const inviteTeamMemberUseCase = new InviteTeamMemberUseCase(
      teamRepository, 
      userRepository, 
      eventPublisher
    );
    
    return useMutation({
      mutationFn: async (dto: InviteTeamMemberDTO) => {
        const result = await inviteTeamMemberUseCase.execute(dto);
        
        if (result.isFailure) {
          throw new Error(result.error);
        }
        
        return result.getValue();
      },
      onSuccess: (_, variables) => {
        // Invalidera team-data
        queryClient.invalidateQueries({ queryKey: ['team', variables.teamId] });
      }
    });
  };
  
  /**
   * Hämtar teamstatistik
   */
  const useTeamStatistics = (teamId: string | undefined) => {
    const getTeamStatisticsUseCase = new GetTeamStatisticsUseCase(
      teamRepository,
      teamActivityRepository
    );
    
    return useQuery({
      queryKey: ['team', teamId, 'statistics'],
      queryFn: async (): Promise<TeamStatisticsDTO | null> => {
        if (!teamId) return null;
        
        const result = await getTeamStatisticsUseCase.execute({ teamId });
        
        if (result.isFailure) {
          throw new Error(result.error);
        }
        
        return result.getValue();
      },
      enabled: !!teamId
    });
  };
  
  /**
   * Skapar en teamaktivitet
   */
  const useCreateTeamActivity = () => {
    const createTeamActivityUseCase = new CreateTeamActivityUseCase(
      teamActivityRepository,
      teamRepository,
      eventPublisher
    );
    
    return useMutation({
      mutationFn: async (dto: CreateTeamActivityDTO) => {
        const result = await createTeamActivityUseCase.execute(dto);
        
        if (result.isFailure) {
          throw new Error(result.error);
        }
        
        return result.getValue();
      },
      onSuccess: (_, variables) => {
        // Invalidera aktivitetsdata
        queryClient.invalidateQueries({ queryKey: ['team', variables.teamId, 'activities'] });
        queryClient.invalidateQueries({ queryKey: ['team', variables.teamId, 'statistics'] });
      }
    });
  };
  
  /**
   * Skapar ett teammeddelande
   */
  const useCreateTeamMessage = () => {
    const createTeamMessageUseCase = new CreateTeamMessageUseCase(
      teamRepository,
      eventPublisher
    );
    
    return useMutation({
      mutationFn: async (dto: CreateTeamMessageDTO) => {
        const result = await createTeamMessageUseCase.execute(dto);
        
        if (result.isFailure) {
          throw new Error(result.error);
        }
        
        return result.getValue();
      },
      onSuccess: (_, variables) => {
        // Invalidera meddelandedata
        queryClient.invalidateQueries({ queryKey: ['team', variables.teamId, 'messages'] });
      }
    });
  };
  
  return {
    // Queries
    useTeamById,
    useUserTeams,
    useTeamStatistics,
    
    // Mutations
    useCreateTeam,
    useAddTeamMember,
    useRemoveTeamMember,
    useUpdateTeamMemberRole,
    useInviteTeamMember,
    useCreateTeamActivity,
    useCreateTeamMessage
  };
} 