import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/infrastructure/supabase/client';
import { Team } from '@/domain/team/entities/Team';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { SupabaseTeamRepository } from '@/infrastructure/supabase/repositories/TeamRepository';
import { CreateTeamUseCase } from '../useCases/createTeam';
import { InviteTeamMemberUseCase } from '../useCases/inviteTeamMember';
import { UniqueId } from '@/shared/core/UniqueId';
import { EventBus } from '@/shared/core/EventBus';
import { useUserRepository } from '@/application/user/hooks/useUserRepository';

// Skapa beroenden
const eventBus = new EventBus();
const teamRepository = new SupabaseTeamRepository(supabase, eventBus);

/**
 * Hook för att hantera team-operationer med React Query
 */
export function useTeam() {
  const queryClient = useQueryClient();
  const userRepository = useUserRepository();

  // Hämta team med ID
  const useTeamById = (teamId: string | undefined) => {
    return useQuery({
      queryKey: ['team', teamId],
      queryFn: async () => {
        if (!teamId) return null;
        
        const id = new UniqueId(teamId);
        const result = await teamRepository.findById(id);
        
        if (result.isErr()) {
          throw new Error(result.error);
        }
        
        return result.getValue();
      },
      enabled: !!teamId
    });
  };

  // Hämta användarens team
  const useUserTeams = (userId: string | undefined) => {
    return useQuery({
      queryKey: ['teams', 'user', userId],
      queryFn: async () => {
        if (!userId) return [];
        
        const id = new UniqueId(userId);
        const result = await teamRepository.findByUserId(id);
        
        if (result.isErr()) {
          throw new Error(result.error);
        }
        
        return result.getValue();
      },
      enabled: !!userId
    });
  };

  // Skapa team
  const useCreateTeam = () => {
    const createTeamUseCase = new CreateTeamUseCase(teamRepository);
    
    return useMutation({
      mutationFn: async ({ name, description, ownerId }: {
        name: string;
        description?: string;
        ownerId: string;
      }) => {
        const result = await createTeamUseCase.execute({
          name,
          description,
          ownerId
        });
        
        if (result.isErr()) {
          throw new Error(result.error);
        }
        
        return result.getValue();
      },
      onSuccess: (_, variables) => {
        // Invalidera cache för användarens team
        queryClient.invalidateQueries({ queryKey: ['teams', 'user', variables.ownerId] });
      }
    });
  };

  // Bjud in teammedlem
  const useInviteTeamMember = () => {
    const inviteTeamMemberUseCase = new InviteTeamMemberUseCase(
      teamRepository,
      userRepository
    );
    
    return useMutation({
      mutationFn: async ({ 
        teamId, 
        invitedById, 
        userId, 
        email, 
        expiresInDays 
      }: {
        teamId: string;
        invitedById: string;
        userId?: string;
        email?: string;
        expiresInDays?: number;
      }) => {
        const result = await inviteTeamMemberUseCase.execute({
          teamId,
          invitedById,
          userId,
          email,
          expiresInDays
        });
        
        if (result.isErr()) {
          throw new Error(result.error);
        }
        
        return result.getValue();
      },
      onSuccess: (_, variables) => {
        // Invalidera cache för teamets data
        queryClient.invalidateQueries({ queryKey: ['team', variables.teamId] });
      }
    });
  };

  // Uppdatera team
  const useUpdateTeam = () => {
    return useMutation({
      mutationFn: async ({ 
        teamId, 
        name, 
        description 
      }: { 
        teamId: string; 
        name?: string; 
        description?: string; 
      }) => {
        const id = new UniqueId(teamId);
        const teamResult = await teamRepository.findById(id);
        
        if (teamResult.isErr()) {
          throw new Error(teamResult.error);
        }
        
        const team = teamResult.getValue();
        const updateResult = team.update({
          name,
          description
        });
        
        if (updateResult.isErr()) {
          throw new Error(updateResult.error);
        }
        
        const saveResult = await teamRepository.save(team);
        
        if (saveResult.isErr()) {
          throw new Error(saveResult.error);
        }
        
        return team.id.toString();
      },
      onSuccess: (teamId) => {
        // Invalidera cache för teamet
        queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      }
    });
  };

  // Ta bort team
  const useDeleteTeam = () => {
    return useMutation({
      mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
        const id = new UniqueId(teamId);
        const teamResult = await teamRepository.findById(id);
        
        if (teamResult.isErr()) {
          throw new Error(teamResult.error);
        }
        
        const team = teamResult.getValue();
        
        // Verifiera att användaren är ägare
        if (team.ownerId.toString() !== userId) {
          throw new Error('Endast teamägaren kan ta bort teamet');
        }
        
        const deleteResult = await teamRepository.delete(id);
        
        if (deleteResult.isErr()) {
          throw new Error(deleteResult.error);
        }
        
        return teamId;
      },
      onSuccess: (_, variables) => {
        // Invalidera cache för användarens team och det borttagna teamet
        queryClient.invalidateQueries({ queryKey: ['teams', 'user', variables.userId] });
        queryClient.invalidateQueries({ queryKey: ['team', variables.teamId] });
      }
    });
  };

  // Lämna team
  const useLeaveTeam = () => {
    return useMutation({
      mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
        const teamIdObj = new UniqueId(teamId);
        const userIdObj = new UniqueId(userId);
        
        const teamResult = await teamRepository.findById(teamIdObj);
        
        if (teamResult.isErr()) {
          throw new Error(teamResult.error);
        }
        
        const team = teamResult.getValue();
        
        // Verifiera att användaren inte är ägare
        if (team.ownerId.toString() === userId) {
          throw new Error('Ägaren kan inte lämna teamet');
        }
        
        // Ta bort medlemmen från teamet
        const leaveResult = team.removeMember(userIdObj);
        
        if (leaveResult.isErr()) {
          throw new Error(leaveResult.error);
        }
        
        const saveResult = await teamRepository.save(team);
        
        if (saveResult.isErr()) {
          throw new Error(saveResult.error);
        }
        
        return teamId;
      },
      onSuccess: (_, variables) => {
        // Invalidera cache för användarens team och teamets data
        queryClient.invalidateQueries({ queryKey: ['teams', 'user', variables.userId] });
        queryClient.invalidateQueries({ queryKey: ['team', variables.teamId] });
      }
    });
  };

  // Uppdatera medlemsroll
  const useUpdateTeamMemberRole = () => {
    return useMutation({
      mutationFn: async ({ 
        teamId, 
        userId, 
        newRole, 
        currentUserId 
      }: { 
        teamId: string; 
        userId: string; 
        newRole: string; 
        currentUserId: string; 
      }) => {
        const teamIdObj = new UniqueId(teamId);
        const userIdObj = new UniqueId(userId);
        
        const teamResult = await teamRepository.findById(teamIdObj);
        
        if (teamResult.isErr()) {
          throw new Error(teamResult.error);
        }
        
        const team = teamResult.getValue();
        
        // Verifiera att användaren har behörighet att ändra roller
        const currentUserIdObj = new UniqueId(currentUserId);
        if (!team.hasMemberPermission(currentUserIdObj, 'manage_roles' as any)) {
          throw new Error('Du har inte behörighet att ändra roller');
        }
        
        // Uppdatera rollen
        const updateResult = team.updateMemberRole(userIdObj, newRole as any);
        
        if (updateResult.isErr()) {
          throw new Error(updateResult.error);
        }
        
        const saveResult = await teamRepository.save(team);
        
        if (saveResult.isErr()) {
          throw new Error(saveResult.error);
        }
        
        return { teamId, userId };
      },
      onSuccess: ({ teamId }) => {
        // Invalidera cache för teamets data
        queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      }
    });
  };

  return {
    useTeamById,
    useUserTeams,
    useCreateTeam,
    useInviteTeamMember,
    useUpdateTeam,
    useDeleteTeam,
    useLeaveTeam,
    useUpdateTeamMemberRole,
    teamRepository
  };
} 