import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useTeam } from './useTeam';

interface TeamMemberProps {
  teamId: string;
  userId: string;
}

/**
 * Hook för att hämta en specifik teammedlem
 * Stöder både useTeamMember(teamId, userId) och useTeamMember({ teamId, userId })
 */
export function useTeamMember(teamIdOrProps: string | TeamMemberProps, userId?: string): {
  member: any | null;
  isLoading: boolean;
  error: Error | null;
  data: any | null;
} {
  // Hantera både objektformat och två separata parametrar
  let teamId: string;
  let memberId: string;

  if (typeof teamIdOrProps === 'string' && userId) {
    // Format: useTeamMember(teamId, userId)
    teamId = teamIdOrProps;
    memberId = userId;
  } else if (typeof teamIdOrProps === 'object') {
    // Format: useTeamMember({ teamId, userId })
    teamId = teamIdOrProps.teamId;
    memberId = teamIdOrProps.userId;
  } else {
    throw new Error('useTeamMember: Felaktiga argument');
  }

  // Använd useTeam för att hämta hela teamet
  const { data: team, isLoading: isTeamLoading, error: teamError } = useTeam({ teamId });

  // Callbackfunktion för att filtrera ut den specifika medlemmen
  const getMember = useCallback(() => {
    if (!team) return null;
    return team.members?.find(m => m.userId.toString() === memberId) || null;
  }, [team, memberId]);

  // Använd React Query för att hantera memberhämtning
  const { data: member, isLoading: isMemberLoading, error } = useQuery({
    queryKey: ['teamMember', teamId, memberId],
    queryFn: getMember,
    enabled: !!team && !isTeamLoading,
  });

  const isLoading = isTeamLoading || isMemberLoading;

  return {
    member,
    isLoading,
    error: error || teamError,
    data: member // För att stödja useTeamMember({ teamId, userId }) destrukturering
  };
} 