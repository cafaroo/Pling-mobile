import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'expo-router';
import { useSubscription } from '@/hooks/useSubscription';
import { useTeamQueries } from '@/hooks/useTeamQueries';
import { useQueryClient } from '@tanstack/react-query';
import Container from '@/components/ui/Container';
import { TeamHeader } from '@/components/team/TeamHeader';
import { TeamActions } from '@/components/team/TeamActions';
import { TeamDashboard } from '@/components/team/TeamDashboard';
import { TeamInviteSection } from '@/components/team/TeamInviteSection';
import { TeamPendingSection } from '@/components/team/TeamPendingSection';
import { TeamMembers } from '@/components/team/TeamMembers';
import type { Team, TeamMember, TeamRole, TeamInvitation } from '@/types/team';
import { useTeamMutations } from '@/hooks/useTeamMutations';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ToastContainer, ToastService } from '@/components/ui/Toast';

export default function TeamScreen() {
  const { colors } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  const teamQueries = useTeamQueries();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  
  // State
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  
  // Använd React Query för att hämta team-data
  const {
    data: teams = [],
    isLoading: isLoadingTeams,
    error: teamsError,
    refetch: refetchTeams
  } = teamQueries.getUserTeams(user?.id || '');

  // Säkerställ att teams är en array
  const teamsArray = Array.isArray(teams) ? teams : [];

  // Hämta valt team
  const {
    data: selectedTeam,
    isLoading: isLoadingSelectedTeam,
    error: selectedTeamError
  } = teamQueries.getTeam(selectedTeamId || '', {
    enabled: !!selectedTeamId
  });

  // Hämta väntande medlemmar
  const {
    data: pendingMembers = [],
    isLoading: isLoadingPending,
    error: pendingError
  } = teamQueries.getPendingTeamMembers(selectedTeamId || '', {
    enabled: !!selectedTeamId
  });

  // Hämta inbjudningar om användaren inte har något team
  const {
    data: invitation,
    isLoading: isLoadingInvitation,
    error: invitationError
  } = teamQueries.getTeamInvitation(user?.email || '', {
    enabled: teamsArray.length === 0 && !!user?.email
  });

  // Använd useTeamMutations för alla mutationer
  const {
    createTeam,
    updateTeam,
    joinTeam,
    acceptInvitation,
    approveMember,
    rejectMember,
    generateInviteCode,
  } = useTeamMutations();

  // Sätt initialt team när data laddas
  useEffect(() => {
    if (teamsArray.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teamsArray[0].id);
    }
  }, [teamsArray.length, selectedTeamId]);

  // Beräkna användarroller
  const currentTeamMember = selectedTeam?.team_members?.find(
    (member) => member.user_id === user?.id
  ) || null;
  
  const isOwner = currentTeamMember?.role === 'owner';
  const isAdmin = currentTeamMember?.role === 'admin';
  const isLeader = isOwner || isAdmin;

  // Hanterare för team-actions
  const handleTeamSelect = (team: Team) => {
    setSelectedTeamId(team.id);
  };

  const handleCreateTeam = async (name: string) => {
    try {
      await createTeam({ name });
      refetchTeams();
      ToastService.show({ title: 'Team skapat!', type: 'success' });
    } catch (error) {
      ToastService.show({ title: 'Kunde inte skapa team', type: 'error' });
      console.error('Fel vid skapande av team:', error);
    }
  };

  const handleEditTeam = async (name: string) => {
    if (!selectedTeamId) return;
    try {
      await updateTeam({ id: selectedTeamId, name });
      queryClient.invalidateQueries({ queryKey: ['team', selectedTeamId] });
      ToastService.show({ title: 'Team uppdaterat!', type: 'success' });
    } catch (error) {
      ToastService.show({ title: 'Kunde inte uppdatera team', type: 'error' });
      console.error('Fel vid uppdatering av team:', error);
    }
  };

  const handleJoinTeam = async (code: string) => {
    try {
      await joinTeam(code);
      refetchTeams();
      ToastService.show({ title: 'Gick med i team!', type: 'success' });
    } catch (error) {
      ToastService.show({ title: 'Kunde inte gå med i team', type: 'error' });
      console.error('Fel vid anslutning till team:', error);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!invitation) return;
    try {
      await acceptInvitation(invitation.id);
      refetchTeams();
      ToastService.show({ title: 'Accepterade inbjudan!', type: 'success' });
    } catch (error) {
      ToastService.show({ title: 'Kunde inte acceptera inbjudan', type: 'error' });
      console.error('Fel vid accepterande av inbjudan:', error);
    }
  };

  const handleApproveMember = async (userId: string) => {
    if (!selectedTeamId) return;
    try {
      await approveMember({ teamId: selectedTeamId, userId });
      queryClient.invalidateQueries({ queryKey: ['pending-team-members', selectedTeamId] });
      ToastService.show({ title: 'Godkände medlem!', type: 'success' });
    } catch (error) {
      ToastService.show({ title: 'Kunde inte godkänna medlem', type: 'error' });
      console.error('Fel vid godkännande av medlem:', error);
    }
  };

  const handleRejectMember = async (userId: string) => {
    if (!selectedTeamId) return;
    try {
      await rejectMember({ teamId: selectedTeamId, userId });
      queryClient.invalidateQueries({ queryKey: ['pending-team-members', selectedTeamId] });
      ToastService.show({ title: 'Avvisade medlem', type: 'success' });
    } catch (error) {
      ToastService.show({ title: 'Kunde inte avvisa medlem', type: 'error' });
      console.error('Fel vid avvisande av medlem:', error);
    }
  };

  const handleGenerateInviteCode = async () => {
    try {
      const code = await generateInviteCode.mutateAsync({ teamId: selectedTeamId! });
      ToastService.show({
        title: 'Inbjudningskod genererad',
        description: `Koden är: ${code}`,
        type: 'success'
      });
    } catch (error) {
      ToastService.show({
        title: 'Kunde inte generera inbjudningskod',
        description: 'Ett fel uppstod. Försök igen senare.',
        type: 'error'
      });
    }
  };

  // Laddar initial data
  if (isLoadingTeams || (selectedTeamId && isLoadingSelectedTeam)) {
    return (
      <Container>
        <LoadingState message="Laddar team..." />
      </Container>
    );
  }

  // Visa fel
  if (teamsError || selectedTeamError) {
    return (
      <Container>
        <ErrorState 
          title="Kunde inte ladda team"
          message="Ett fel uppstod när team skulle laddas." 
          retry={refetchTeams} 
        />
      </Container>
    );
  }

  // Visa tom state om användaren inte har några team
  if (teamsArray.length === 0 && !invitation) {
    return (
      <Container>
        <EmptyState
          title="Inga team"
          message="Du har inga team än. Skapa ett nytt team eller gå med i ett befintligt."
          action={{
            label: 'Skapa team',
            onPress: () => router.push('/team/create')
          }}
        />
      </Container>
    );
  }

  return (
    <Container>
      <ToastContainer />
      <TeamHeader
        teams={teamsArray}
        selectedTeam={selectedTeam || null}
        onTeamSelect={handleTeamSelect}
      />
      
      {selectedTeam && (
        <TeamDashboard
          team={selectedTeam}
          userRole={currentTeamMember?.role || 'guest'}
          onManageMembers={() => {}}
          onManageSettings={() => {}}
          onManageInvites={handleGenerateInviteCode}
          onManageNotifications={() => {}}
        />
      )}

      {selectedTeam && isLeader && (
        <TeamInviteSection
          selectedTeam={selectedTeam}
          isLeader={isLeader}
          inviteCode={null}
          inviteError={null}
          onJoinTeam={handleJoinTeam}
          onGenerateInviteCode={handleGenerateInviteCode}
          inviteCodeData={null}
        />
      )}

      {selectedTeam && isLeader && pendingMembers.length > 0 && (
        <TeamPendingSection
          selectedTeam={selectedTeam}
          isLeader={isLeader}
          pendingMembers={pendingMembers}
          invitation={null}
          isPendingMember={false}
          pendingTeamName=""
          onApproveMember={handleApproveMember}
          onRejectMember={handleRejectMember}
          onAcceptInvitation={handleAcceptInvitation}
        />
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  gradient: {
    flex: 1,
    padding: 16,
  },
});