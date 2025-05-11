import { useMutation, useQueryClient } from '@tanstack/react-query';
import teamService from '@services/teamService';
import { TeamRole, TeamMemberStatus } from '@types/team';
import { useTeamState } from './useTeamState';
import { Team, TeamMember } from '@types';
import { supabase } from '@services/supabase';
import { TeamMutations } from '@types';
import { ToastService } from '@components/ui/Toast';

/**
 * Hook för att hantera team-relaterade mutationer
 */
export const useTeamMutations = (): TeamMutations => {
  const queryClient = useQueryClient();
  const { 
    updateMember: updateMemberState,
    removeMember: removeMemberState,
    addMember: addMemberState,
    updateTeam: updateTeamState,
    approveMember: approveMemberState,
    rejectMember: rejectMemberState,
    setInviteCode: setInviteCodeState,
    clearInviteCode: clearInviteCodeState,
    acceptInvite: acceptInviteState,
    declineInvite: declineInviteState,
    setGeneratingInvite
  } = useTeamState();

  // Skapa team
  const createTeam = useMutation({
    mutationFn: async (params: { name: string }) => {
      const response = await teamService.createTeam(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Kunde inte skapa team');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user-teams']);
    }
  });

  // Uppdatera team
  const updateTeam = useMutation({
    mutationFn: async (params: { teamId: string; updates: Partial<Team> }) => {
      const response = await teamService.updateTeam(params.teamId, params.updates);
      if (!response.success) {
        throw new Error(response.error?.message || 'Kunde inte uppdatera team');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['team', variables.teamId]);
      queryClient.invalidateQueries(['user-teams']);
      updateTeamState(variables.updates);
    }
  });

  // Gå med i team
  const joinTeam = useMutation({
    mutationFn: async (code: string) => {
      const response = await teamService.joinTeamWithCode(code);
      if (!response.success) {
        throw new Error(response.error?.message || 'Kunde inte gå med i team');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user-teams']);
    }
  });

  // Generera inbjudningskod
  const generateInviteCode = useMutation({
    mutationFn: async (params: { teamId: string }) => {
      const response = await teamService.generateInviteCode(params.teamId);
      if (!response.success) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (error: Error) => {
      ToastService.show({
        title: 'Fel',
        description: error.message || 'Kunde inte generera inbjudningskod',
        type: 'error'
      });
    }
  });

  // Acceptera inbjudan
  const acceptInvitation = useMutation({
    mutationFn: async (teamId: string) => {
      const response = await teamService.acceptTeamInvite(teamId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Kunde inte acceptera inbjudan');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user-teams']);
      queryClient.invalidateQueries(['team-invitations']);
    }
  });

  // Avböj inbjudan
  const declineInvitation = useMutation({
    mutationFn: async (teamId: string) => {
      const response = await teamService.declineTeamInvite(teamId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Kunde inte avböja inbjudan');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['team-invitations']);
    }
  });

  // Godkänn medlem
  const approveMember = useMutation({
    mutationFn: async (params: { teamId: string; userId: string }) => {
      const response = await teamService.approveTeamMember(params.teamId, params.userId, true);
      if (!response.success) {
        throw new Error(response.error?.message || 'Kunde inte godkänna medlem');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['team-members', variables.teamId]);
      queryClient.invalidateQueries(['pending-members', variables.teamId]);
    }
  });

  // Avvisa medlem
  const rejectMember = useMutation({
    mutationFn: (params: { teamId: string; userId: string }) =>
      teamService.approveTeamMember(params.teamId, params.userId, false),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['pending-members', variables.teamId]);
    }
  });

  // Uppdatera medlemsroll
  const updateMemberRole = useMutation({
    mutationFn: (params: { memberId: string; newRole: TeamRole }) => {
      console.log('useTeamMutations.updateMemberRole anropades med:', { memberId: params.memberId, newRole: params.newRole });
      // Rollen måste skickas som newRoleOrUserId enligt teamService API
      return teamService.updateTeamMemberRole(params.memberId, params.newRole);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['team-members']);
    },
    onError: (error) => {
      console.error('Fel i updateMemberRole mutation:', error);
    }
  });

  // Uppdatera medlemsstatus
  const updateMemberStatus = useMutation({
    mutationFn: (params: { memberId: string; status: TeamMemberStatus }) =>
      teamService.updateTeamMemberStatus(params.memberId, params.status),
    onSuccess: () => {
      queryClient.invalidateQueries(['team-members']);
    }
  });

  // Ta bort en medlem från teamet
  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      return teamService.removeTeamMember(memberId);
    },
    onMutate: async (memberId) => {
      await queryClient.cancelQueries(['team-members']);
      const previousMembers = queryClient.getQueryData(['team-members']);

      // Optimistiskt uppdatera React Query cache
      queryClient.setQueryData(['team-members'], (old: any) => {
        if (!old) return old;
        return old.filter((member: TeamMember) => member.id !== memberId);
      });

      // Optimistiskt uppdatera useTeamState
      removeMemberState(memberId);

      return { previousMembers };
    },
    onError: (err, variables, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(['team-members'], context.previousMembers);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(['team-members']);
    },
  });

  // Lägg till en ny medlem i teamet
  const addMember = useMutation({
    mutationFn: async ({ teamId, email, role }: { teamId: string, email: string, role: TeamRole }) => {
      return teamService.addTeamMember(teamId, email, role);
    },
    onSuccess: (newMember, variables) => {
      queryClient.invalidateQueries(['team-members']);
      queryClient.invalidateQueries(['team', variables.teamId]);
      
      // Uppdatera useTeamState med den nya medlemmen
      if (newMember) {
        addMemberState(newMember);
      }
    }
  });

  return {
    createTeam,
    updateTeam,
    joinTeam,
    generateInviteCode,
    acceptInvitation,
    declineInvitation,
    approveMember,
    rejectMember,
    updateMemberRole,
    updateMemberStatus,
    removeMember,
    addMember
  };
}; 