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
import { TeamDashboard } from '@/components/team/TeamDashboard';
import { TeamPendingSection } from '@/components/team/TeamPendingSection';
import type { Team, TeamMember, TeamRole } from '@/types/team';
import { useTeamMutations } from '@/hooks/useTeamMutations';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ToastContainer, ToastService } from '@/components/ui/Toast';
import { InviteCodeModal } from '@/components/team/InviteCodeModal';
import { useTeamContext } from '@/context/TeamContext';
import { useAuth } from '@/context/AuthContext';

export default function TeamScreen() {
  const { colors } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  const teamQueries = useTeamQueries();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { teams, selectedTeam, setSelectedTeam } = useTeamContext();
  const { user: authUser } = useAuth();
  
  // State
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [userRole, setUserRole] = useState<TeamRole>();

  // Använd React Query för att hämta team-data
  const {
    data: teamsData = [],
    isLoading: isLoadingTeams,
    error: teamsError,
    refetch: refetchTeams
  } = teamQueries.getUserTeams(user?.id || '');

  // Säkerställ att teams är en array
  const teamsArray = Array.isArray(teamsData) ? teamsData : [];

  // Sätt initialt team när data laddas
  useEffect(() => {
    if (teamsArray.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teamsArray[0].id);
    }
  }, [teamsArray.length, selectedTeamId]);

  // Hämta valt team
  const {
    data: selectedTeamData,
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

  // Beräkna användarroller
  const currentTeamMember = selectedTeamData?.team_members?.find(
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
      await createTeam.mutateAsync({ name });
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
      await joinTeam.mutateAsync(code);
      refetchTeams();
      ToastService.show({ title: 'Gick med i team!', type: 'success' });
    } catch (error) {
      ToastService.show({ title: 'Kunde inte gå med i team', type: 'error' });
      console.error('Fel vid anslutning till team:', error);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!selectedTeamData) return;
    try {
      await acceptInvitation.mutateAsync(selectedTeamData.id);
      refetchTeams();
      ToastService.show({ title: 'Accepterade inbjudan!', type: 'success' });
    } catch (error) {
      ToastService.show({ title: 'Kunde inte acceptera inbjudan', type: 'error' });
      console.error('Fel vid accepterande av inbjudan:', error);
    }
  };

  const handleGenerateInviteCode = async () => {
    if (!selectedTeamId) return;
    try {
      const code = await generateInviteCode.mutateAsync({ teamId: selectedTeamId });
      setInviteCode(code);
      setTimeout(() => {
        setShowInviteModal(true);
      }, 100);
    } catch (error) {
      console.error('Error generating invite code:', error);
      ToastService.show({
        title: 'Kunde inte generera inbjudningskod',
        description: 'Ett fel uppstod. Försök igen senare.',
        type: 'error'
      });
    }
  };

  const handleCloseModal = () => {
    setShowInviteModal(false);
    setInviteCode('');
  };

  const handleApproveMember = async (userId: string) => {
    if (!selectedTeamId) return;
    try {
      await approveMember.mutateAsync({ teamId: selectedTeamId, userId });
      ToastService.show({ title: 'Godkände medlem!', type: 'success' });
    } catch (error) {
      ToastService.show({ title: 'Kunde inte godkänna medlem', type: 'error' });
      console.error('Fel vid godkännande av medlem:', error);
    }
  };

  const handleRejectMember = async (userId: string) => {
    if (!selectedTeamId) return;
    try {
      await rejectMember.mutateAsync({ teamId: selectedTeamId, userId });
      ToastService.show({ title: 'Avvisade medlem', type: 'success' });
    } catch (error) {
      ToastService.show({ title: 'Kunde inte avvisa medlem', type: 'error' });
      console.error('Fel vid avvisande av medlem:', error);
    }
  };

  const handleNavigateToChat = () => {
    if (!selectedTeamData?.id) {
      return;
    }
    router.push({
      pathname: '/chat',
      params: {
        teamId: selectedTeamData.id
      }
    });
  };

  useEffect(() => {
    if (selectedTeam && user) {
      const member = selectedTeam.team_members?.find((m: TeamMember) => m.user_id === user.id);
      setUserRole(member?.role);
    }
  }, [selectedTeam, user]);

  // Laddar initial data
  if (isLoadingTeams || (selectedTeamId && selectedTeamData === null)) {
    return (
      <Container>
        <LoadingState message="Laddar team..." />
      </Container>
    );
  }

  // Visa fel
  if (teamsArray.length === 0 && !selectedTeamData) {
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
      <LinearGradient
        colors={[colors.background.dark, colors.background.main]}
        style={[styles.gradient, { paddingTop: insets.top }]}
      >
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={isLoadingTeams}
              onRefresh={refetchTeams}
              tintColor={colors.text.main}
            />
          }
        >
          <TeamHeader
            teams={teamsArray}
            selectedTeam={selectedTeamData || null}
            onTeamSelect={handleTeamSelect}
            userRole={userRole}
            style={styles.header}
          />

          {selectedTeamData && (
            <TeamDashboard
              team={selectedTeamData}
              userRole={currentTeamMember?.role || 'member'}
              onManageMembers={() => router.push(`/team/${selectedTeamData.id}/members`)}
              onManageSettings={() => router.push(`/team/${selectedTeamData.id}/settings`)}
              onManageInvites={handleGenerateInviteCode}
              onManageNotifications={() => router.push(`/team/${selectedTeamData.id}/notifications`)}
              onManageChat={handleNavigateToChat}
            />
          )}
        </ScrollView>
      </LinearGradient>

      <InviteCodeModal
        isVisible={showInviteModal}
        onClose={handleCloseModal}
        inviteCode={inviteCode}
        teamId={selectedTeamId || ''}
      />

      <ToastContainer />
    </Container>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    // Add any necessary styles for the header
  },
});