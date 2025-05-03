import { useState, useEffect } from 'react';
import { Team, TeamMember, TeamRole } from '@/types/team';
import * as teamService from '@/services/teamService';

export function useTeam(teamId: string) {
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pendingMembers, setPendingMembers] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [pendingMemberships, setPendingMemberships] = useState<Team[]>([]);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTeam = async () => {
    setIsLoading(true);
    try {
      const fetchedTeam = await teamService.getTeam(teamId);
      setTeam(fetchedTeam);
      
      // Separera medlemmar baserat på status
      const allMembers = fetchedTeam.team_members || [];
      setMembers(allMembers.filter(m => m.status === 'active'));
      setPendingMembers(allMembers.filter(m => m.status === 'pending'));
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch team'));
    } finally {
      setIsLoading(false);
    }
  };

  const approveTeamMember = async (userId: string) => {
    setIsLoading(true);
    try {
      await teamService.updateTeamMemberStatus(teamId, userId, 'active');
      await fetchTeam();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to approve member'));
    } finally {
      setIsLoading(false);
    }
  };

  const rejectTeamMember = async (userId: string) => {
    setIsLoading(true);
    try {
      await teamService.removeTeamMember(teamId, userId);
      await fetchTeam();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to reject member'));
    } finally {
      setIsLoading(false);
    }
  };

  const removeTeamMember = async (userId: string) => {
    setIsLoading(true);
    try {
      await teamService.removeTeamMember(teamId, userId);
      await fetchTeam();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to remove member'));
    } finally {
      setIsLoading(false);
    }
  };

  const updateTeamMemberRole = async (userId: string, role: TeamRole) => {
    setIsLoading(true);
    try {
      await teamService.updateTeamMemberRole(teamId, userId, role);
      await fetchTeam();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update member role'));
    } finally {
      setIsLoading(false);
    }
  };

  const generateInviteCode = async () => {
    setIsLoading(true);
    try {
      const code = await teamService.generateInviteCode(teamId);
      setInviteCode(code);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to generate invite code'));
    } finally {
      setIsLoading(false);
    }
  };

  const acceptInvite = async (inviteId: string) => {
    setIsLoading(true);
    try {
      await teamService.acceptTeamInvite(inviteId);
      await fetchTeam();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to accept invite'));
    } finally {
      setIsLoading(false);
    }
  };

  const declineInvite = async (inviteId: string) => {
    setIsLoading(true);
    try {
      await teamService.declineTeamInvite(inviteId);
      await fetchTeam();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to decline invite'));
    } finally {
      setIsLoading(false);
    }
  };

  const cancelMembership = async (teamId: string) => {
    setIsLoading(true);
    try {
      await teamService.cancelTeamMembership(teamId);
      await fetchTeam();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to cancel membership'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [teamId]);

  return {
    team,
    members,
    pendingMembers,
    pendingInvites,
    pendingMemberships,
    isLoading,
    inviteCode,
    error,
    fetchTeam,
    approveTeamMember,
    rejectTeamMember,
    removeTeamMember,
    updateTeamMemberRole,
    generateInviteCode,
    acceptInvite,
    declineInvite,
    cancelMembership,
  };
} 