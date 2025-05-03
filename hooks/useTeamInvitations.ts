import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TeamInvitation } from '@/types/team';
import { supabase } from '@/lib/supabase';

export function useTeamInvitations(teamId: string) {
  const queryClient = useQueryClient();

  const { data: invitation, isLoading, error } = useQuery({
    queryKey: ['teamInvitation', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('team_id', teamId)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) throw error;
      return data as TeamInvitation;
    }
  });

  const createInvitation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const { data, error } = await supabase
        .from('team_invitations')
        .insert({
          team_id: teamId,
          email,
          role,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dagar
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['teamInvitation', teamId]);
    }
  });

  const acceptInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { data, error } = await supabase
        .from('team_invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['teamInvitation', teamId]);
    }
  });

  return {
    invitation,
    isLoading,
    error,
    createInvitation,
    acceptInvitation
  };
} 