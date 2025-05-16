import React, { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import { TeamDetailsScreenPresentation } from './TeamDetailsScreenPresentation';
import { useTeamWithStandardHook } from '@/application/team/hooks/useTeamWithStandardHook';
import { useTeamStatistics } from '@/application/team/hooks/useTeamStatistics';
import { useTeamActivities } from '@/application/team/hooks/useTeamActivities';

export interface TeamDetailsScreenContainerProps {
  teamId?: string;
}

export const TeamDetailsScreenContainer: React.FC<TeamDetailsScreenContainerProps> = ({ 
  teamId: propTeamId 
}) => {
  const router = useRouter();
  const params = useLocalSearchParams<{ teamId: string }>();
  
  // Använd teamId från props om det finns, annars från URL-parametrar
  const teamId = propTeamId || params.teamId;
  
  // Hämta team med standardiserad hook
  const { getTeam } = useTeamWithStandardHook();
  
  // Hämta teamstatistik
  const { 
    data: teamStatistics, 
    isLoading: isStatisticsLoading, 
    error: statisticsError,
    refetch: refetchStatistics
  } = useTeamStatistics({ teamId });
  
  // Hämta senaste aktiviteter för teamet
  const { 
    data: recentActivities, 
    isLoading: isActivitiesLoading, 
    error: activitiesError,
    refetch: refetchActivities 
  } = useTeamActivities({ 
    teamId, 
    limit: 5, 
    showOnlyRecent: true 
  });
  
  // Hämta team när komponenten laddas
  useEffect(() => {
    if (teamId) {
      getTeam.execute({ teamId });
    }
  }, [teamId]);
  
  // Hantera navigering till medlemslistan
  const handleViewAllMembers = () => {
    router.push(`/teams/${teamId}/members`);
  };
  
  // Hantera navigering till aktiviteter
  const handleViewAllActivities = () => {
    router.push(`/teams/${teamId}/activities`);
  };
  
  // Hantera navigering till redigering av teamdetaljer
  const handleEditDetails = () => {
    router.push(`/teams/${teamId}/edit`);
  };
  
  // Hantera navigering till inställningar
  const handleSettingsPress = () => {
    router.push(`/teams/${teamId}/settings`);
  };
  
  // Hantera klick på medlem
  const handleMemberPress = (memberId: string) => {
    router.push(`/teams/${teamId}/member/${memberId}`);
  };
  
  // Hantera försök igen för statistik
  const handleRetryStatistics = () => {
    refetchStatistics();
  };
  
  // Hantera försök igen för aktiviteter
  const handleRetryActivities = () => {
    refetchActivities();
  };
  
  return (
    <TeamDetailsScreenPresentation
      team={getTeam.data}
      teamStatistics={teamStatistics}
      recentActivities={recentActivities}
      isLoading={getTeam.isLoading}
      isStatisticsLoading={isStatisticsLoading}
      isActivitiesLoading={isActivitiesLoading}
      error={getTeam.error}
      statisticsError={statisticsError}
      activitiesError={activitiesError}
      onRetry={() => getTeam.retry()}
      onRetryStatistics={handleRetryStatistics}
      onRetryActivities={handleRetryActivities}
      onEditDetails={handleEditDetails}
      onViewAllMembers={handleViewAllMembers}
      onViewAllActivities={handleViewAllActivities}
      onMemberPress={handleMemberPress}
      onSettingsPress={handleSettingsPress}
    />
  );
}; 