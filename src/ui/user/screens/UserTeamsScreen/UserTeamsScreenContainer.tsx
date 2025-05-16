import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { UserTeamsScreenPresentation, TeamItem } from './UserTeamsScreenPresentation';
import { useTeam } from '@/application/team/hooks/useTeam';
import { useUser } from '@/application/user/hooks/useUser';

export interface UserTeamsScreenContainerProps {
  // Eventuella container-props kan läggas till här
}

export const UserTeamsScreenContainer: React.FC<UserTeamsScreenContainerProps> = () => {
  const router = useRouter();
  const { useUserTeams } = useTeam();
  const { data: user, isLoading: isLoadingUser } = useUser();
  
  // Hämta användarens team
  const { 
    data: teams = [], 
    isLoading: isLoadingTeams, 
    error: teamsError 
  } = useUserTeams(user?.id?.toString());
  
  // Formatera team för visning
  const formattedTeams: TeamItem[] = teams.map(team => {
    // Bestäm användarens roll i teamet
    const member = team.members.find(m => m.userId.toString() === user?.id?.toString());
    const userRole = member ? member.role : 'Medlem';
    
    return {
      id: team.id.toString(),
      name: team.name,
      description: team.description,
      memberCount: team.members.length,
      userRole: userRole,
      // Om teamet har en avatar, använd den
      avatarUrl: team.avatarUrl
    };
  });
  
  // Hantera team-tryck - navigera till teamdetaljskärm
  const handleTeamPress = useCallback((teamId: string) => {
    router.push(`/team/${teamId}`);
  }, [router]);
  
  // Hantera skapa team-tryck - navigera till skapa team-skärm
  const handleCreateTeamPress = useCallback(() => {
    router.push('/team/create');
  }, [router]);
  
  // Hantera tillbaka-tryck
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);
  
  return (
    <UserTeamsScreenPresentation
      teams={formattedTeams}
      isLoading={isLoadingUser || isLoadingTeams}
      error={teamsError}
      onTeamPress={handleTeamPress}
      onCreateTeamPress={handleCreateTeamPress}
      onBack={handleBack}
    />
  );
}; 