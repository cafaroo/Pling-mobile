import { useMutation, useQueryClient } from '@tanstack/react-query';
import { teamService } from '@/services/teamService';
import { TeamRole, TeamMemberStatus } from '@/types/team';
import { useTeamState } from './useTeamState';
import { Team, TeamMember } from '@/types';
import { supabase } from '@/lib/supabase';
import { TeamMutations } from '@/types';

/**
 * Hook för att hantera team-relaterade mutationer med optimistiska uppdateringar.
 * Kombinerar React Query med useTeamState för att uppdatera både server och lokal state.
 */
export const useTeamMutations = (): TeamMutations => {
  const queryClient = useQueryClient();
  
  // Använd useTeamState för att synkronisera med reducer-state
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

  const createTeam = async (name: string): Promise<Team> => {
    const { data, error } = await supabase
      .from('teams')
      .insert([{ name }])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateTeam = async (teamId: string, updates: Partial<Team>): Promise<Team> => {
    const { data, error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', teamId)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const deleteTeam = async (teamId: string): Promise<void> => {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (error) throw error;
  };

  const joinTeam = async (inviteCode: string): Promise<void> => {
    const { error } = await supabase.rpc('join_team', { invite_code: inviteCode });
    if (error) throw error;
  };

  const leaveTeam = async (teamId: string): Promise<void> => {
    const { error } = await supabase.rpc('leave_team', { team_id: teamId });
    if (error) throw error;
  };

  const selectTeam = async (teamId: string): Promise<void> => {
    await queryClient.setQueryData(['selectedTeamId'], teamId);
  };

  const generateInviteCode = async (teamId: string): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_invite_code', { team_id: teamId });
    if (error) throw error;
    return data;
  };

  const acceptInvitation = async (invitationId: string): Promise<void> => {
    const { error } = await supabase.rpc('accept_invitation', { invitation_id: invitationId });
    if (error) throw error;
  };

  const declineInvitation = async (invitationId: string): Promise<void> => {
    const { error } = await supabase.rpc('decline_invitation', { invitation_id: invitationId });
    if (error) throw error;
  };

  const approveMember = async (memberId: string): Promise<void> => {
    const { error } = await supabase.rpc('approve_member', { member_id: memberId });
    if (error) throw error;
  };

  const rejectMember = async (memberId: string): Promise<void> => {
    const { error } = await supabase.rpc('reject_member', { member_id: memberId });
    if (error) throw error;
  };

  // Uppdatera team information (namn, bild, etc)
  const updateTeamMutation = useMutation({
    mutationFn: async ({ teamId, updates }: { teamId: string, updates: Partial<Team> }) => {
      // Hantera olika typer av uppdateringar
      if ('name' in updates) {
        return teamService.updateTeamName(teamId, updates.name as string);
      } else if ('image_url' in updates) {
        return teamService.updateTeamProfileImage(teamId, updates.image_url as string);
      } else {
        return teamService.updateTeam(teamId, updates);
      }
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries(['team', variables.teamId]);
      const previousTeam = queryClient.getQueryData(['team', variables.teamId]);

      // Optimistiskt uppdatera React Query cache
      queryClient.setQueryData(['team', variables.teamId], (old: any) => {
        return { ...old, ...variables.updates };
      });

      // Optimistiskt uppdatera useTeamState
      updateTeamState(variables.updates);

      return { previousTeam };
    },
    onError: (err, variables, context) => {
      // Återställ cache vid fel
      if (context?.previousTeam) {
        queryClient.setQueryData(['team', variables.teamId], context.previousTeam);
      }
    },
    onSettled: (_, __, variables) => {
      // Alltid uppdatera data från servern efter en mutation
      queryClient.invalidateQueries(['team', variables.teamId]);
      queryClient.invalidateQueries(['user-teams']);
    },
  });

  // Skapa ett nytt team
  const createTeamMutation = useMutation({
    mutationFn: async (name: string) => {
      return teamService.createTeam(name);
    },
    onSuccess: (newTeam) => {
      queryClient.invalidateQueries(['user-teams']);
      
      // Sätt det nya teamet i useTeamState
      if (newTeam) {
        updateTeamState(newTeam);
      }
    }
  });

  // Uppdatera en medlems roll
  const updateMemberRole = useMutation({
    mutationFn: async ({ memberId, newRole }: { memberId: string, newRole: TeamRole }) => {
      return teamService.updateTeamMemberRole(memberId, newRole);
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries(['team-members']);
      const previousMembers = queryClient.getQueryData(['team-members']);

      // Optimistiskt uppdatera React Query cache
      queryClient.setQueryData(['team-members'], (old: any) => {
        if (!old) return old;
        return old.map((member: TeamMember) =>
          member.id === variables.memberId
            ? { ...member, role: variables.newRole }
            : member
        );
      });

      // Optimistiskt uppdatera useTeamState
      updateMemberState(variables.memberId, { role: variables.newRole });

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

  // Uppdatera en medlems status
  const updateMemberStatus = useMutation({
    mutationFn: async ({ memberId, newStatus }: { memberId: string, newStatus: TeamMemberStatus }) => {
      return teamService.updateTeamMemberStatus(memberId, newStatus);
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries(['team-members']);
      const previousMembers = queryClient.getQueryData(['team-members']);

      // Optimistiskt uppdatera React Query cache
      queryClient.setQueryData(['team-members'], (old: any) => {
        if (!old) return old;
        return old.map((member: TeamMember) =>
          member.id === variables.memberId
            ? { ...member, status: variables.newStatus }
            : member
        );
      });

      // Optimistiskt uppdatera useTeamState
      updateMemberState(variables.memberId, { status: variables.newStatus });

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

  // Godkänn en väntande medlem
  const approveMemberMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) => {
      return teamService.approveTeamMember(teamId, userId, true);
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries(['pending-team-members']);
      await queryClient.cancelQueries(['team-members']);
      
      const previousPending = queryClient.getQueryData(['pending-team-members']);
      const previousMembers = queryClient.getQueryData(['team-members']);

      // Optimistiskt uppdatera useTeamState
      approveMemberState(variables.userId);

      return { previousPending, previousMembers };
    },
    onError: (_, __, context) => {
      if (context?.previousPending) {
        queryClient.setQueryData(['pending-team-members'], context.previousPending);
      }
      if (context?.previousMembers) {
        queryClient.setQueryData(['team-members'], context.previousMembers);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(['pending-team-members']);
      queryClient.invalidateQueries(['team-members']);
    }
  });

  // Avvisa en väntande medlem
  const rejectMemberMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) => {
      return teamService.approveTeamMember(teamId, userId, false);
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries(['pending-team-members']);
      const previousPending = queryClient.getQueryData(['pending-team-members']);

      // Optimistiskt uppdatera useTeamState
      rejectMemberState(variables.userId);

      return { previousPending };
    },
    onError: (_, __, context) => {
      if (context?.previousPending) {
        queryClient.setQueryData(['pending-team-members'], context.previousPending);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(['pending-team-members']);
    }
  });

  // Generera inbjudningskod
  const generateInviteCodeMutation = useMutation({
    mutationFn: (teamId: string) => {
      setGeneratingInvite(true); // Ange laddningsstate
      return teamService.createTeamInviteCode(teamId);
    },
    onSuccess: (data) => {
      if (data?.code) {
        setInviteCodeState(data.code);
      }
    },
    onSettled: () => {
      setGeneratingInvite(false);
    }
  });

  // Gå med i team med inbjudningskod
  const joinTeamMutation = useMutation({
    mutationFn: (code: string) => {
      return teamService.joinTeamWithCode(code);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user-teams']);
      clearInviteCodeState();
    }
  });

  // Acceptera en inbjudan
  const acceptInvitationMutation = useMutation({
    mutationFn: (inviteId: string) => {
      return teamService.acceptTeamInvite(inviteId);
    },
    onMutate: async (inviteId) => {
      await queryClient.cancelQueries(['team-invitation']);
      const previousInvitation = queryClient.getQueryData(['team-invitation']);

      // Optimistiskt uppdatera useTeamState
      acceptInviteState(inviteId);
      
      return { previousInvitation };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user-teams']);
      queryClient.invalidateQueries(['team-invitation']);
    },
    onError: (_, __, context) => {
      if (context?.previousInvitation) {
        queryClient.setQueryData(['team-invitation'], context.previousInvitation);
      }
    }
  });

  // Avböj en inbjudan
  const declineInvitationMutation = useMutation({
    mutationFn: (inviteId: string) => {
      return teamService.declineTeamInvite(inviteId);
    },
    onMutate: async (inviteId) => {
      await queryClient.cancelQueries(['team-invitation']);
      const previousInvitation = queryClient.getQueryData(['team-invitation']);

      // Optimistiskt uppdatera useTeamState
      declineInviteState(inviteId);
      
      return { previousInvitation };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['team-invitation']);
    },
    onError: (_, __, context) => {
      if (context?.previousInvitation) {
        queryClient.setQueryData(['team-invitation'], context.previousInvitation);
      }
    }
  });

  return {
    // Team-åtgärder
    createTeam: createTeamMutation,
    updateTeam: updateTeamMutation,
    deleteTeam,
    joinTeam: joinTeamMutation,
    leaveTeam,
    selectTeam,
    
    // Medlem-åtgärder
    addMember,
    removeMember,
    updateMemberRole,
    updateMemberStatus,
    approveMember: approveMemberMutation,
    rejectMember: rejectMemberMutation,
    
    // Inbjudnings-åtgärder
    generateInviteCode: generateInviteCodeMutation,
    acceptInvitation: acceptInvitationMutation,
    declineInvitation: declineInvitationMutation
  };
}; 