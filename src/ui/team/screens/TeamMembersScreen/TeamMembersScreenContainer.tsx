import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTeamWithStandardHook } from '@/application/team/hooks/useTeamWithStandardHook';
import { useUserContext } from '@/ui/user/context/UserContext';
import { useQueryClient } from '@tanstack/react-query';
import { TeamMembersScreenPresentation } from './TeamMembersScreenPresentation';
import { PresentationAdapter } from '@/ui/shared/adapters/PresentationAdapter';

export interface TeamMembersScreenContainerProps {
  // Dessa props används endast för direkt komponentanrop, inte vid användning med Expo Router
  teamId?: string;
}

export const TeamMembersScreenContainer: React.FC<TeamMembersScreenContainerProps> = ({ 
  teamId: propTeamId 
}) => {
  const router = useRouter();
  const { id: paramTeamId } = useLocalSearchParams<{ id: string }>();
  const teamId = propTeamId || paramTeamId || '';
  const { currentUser } = useUserContext();
  const { 
    getTeam, 
    addTeamMember, 
    removeTeamMember,
    updateTeamMemberRole,
    getTeamMembers // Antag att denna hook existerar för att specifikt hämta medlemmar med paginering
  } = useTeamWithStandardHook();
  
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  
  // Hämta team-data med standardiserad hook
  useEffect(() => {
    if (teamId && (!getTeam.data || getTeam.data.id !== teamId)) {
      getTeam.execute({ teamId });
    }
  }, [teamId, getTeam]);

  // Hämta medlemmar med paginering när teamId, sida eller sökfråga ändras
  useEffect(() => {
    if (teamId) {
      // Om getTeamMembers finns, använd den för paginering
      if (getTeamMembers?.execute) {
        getTeamMembers.execute({ 
          teamId, 
          page: currentPage, 
          pageSize,
          searchQuery: searchQuery.trim() || undefined
        });
      }
    }
  }, [teamId, currentPage, pageSize, searchQuery, getTeamMembers]);
  
  // Animera in formuläret
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: showAddMemberForm ? 1 : 0,
      duration: 300,
      useNativeDriver: true
    }).start();
  }, [showAddMemberForm, fadeAnim]);
  
  // Hantera tillägg av ny medlem
  const handleAddMember = useCallback(async (userId: string, role: string) => {
    try {
      const result = await addTeamMember.execute({ 
        teamId, 
        userId, 
        role 
      });
      
      if (result.isOk()) {
        setShowAddMemberForm(false);
        Alert.alert('Lyckades', 'Medlemmen har lagts till i teamet.');
        
        // Invalidera cache för att uppdatera medlemslistan
        queryClient.invalidateQueries({ queryKey: ['team', teamId] });
        queryClient.invalidateQueries({ queryKey: ['teamMembers', teamId] });
      }
    } catch (error) {
      // Felhanteringen sköts automatiskt av standardiserade hook
    }
  }, [addTeamMember, teamId, queryClient]);
  
  // Hantera borttagning av medlem
  const handleRemoveMember = useCallback(async (memberId: string) => {
    Alert.alert(
      'Ta bort medlem',
      'Är du säker på att du vill ta bort denna medlem från teamet?',
      [
        { text: 'Avbryt', style: 'cancel' },
        { 
          text: 'Ta bort', 
          style: 'destructive',
          onPress: async () => {
            const result = await removeTeamMember.execute({ teamId, userId: memberId });
            
            if (result.isOk()) {
              // Invalidera cache för att uppdatera medlemslistan
              queryClient.invalidateQueries({ queryKey: ['team', teamId] });
              queryClient.invalidateQueries({ queryKey: ['teamMembers', teamId] });
            }
          }
        }
      ]
    );
  }, [removeTeamMember, teamId, queryClient]);
  
  // Hantera ändring av roll
  const handleRoleChange = useCallback(async (memberId: string, newRole: string) => {
    try {
      const result = await updateTeamMemberRole.execute({ 
        teamId, 
        userId: memberId, 
        role: newRole 
      });
      
      if (result.isOk()) {
        // Invalidera cache för att uppdatera medlemslistan
        queryClient.invalidateQueries({ queryKey: ['team', teamId] });
        queryClient.invalidateQueries({ queryKey: ['teamMembers', teamId] });
      }
    } catch (error) {
      // Felhanteringen sköts automatiskt av standardiserade hook
    }
  }, [updateTeamMemberRole, teamId, queryClient]);
  
  // Visa fel för operationer om de uppstår
  useEffect(() => {
    if (addTeamMember.error) {
      Alert.alert('Fel vid tillägg av medlem', addTeamMember.error.message);
    }
    
    if (removeTeamMember.error) {
      Alert.alert('Fel vid borttagning av medlem', removeTeamMember.error.message);
    }
    
    if (updateTeamMemberRole.error) {
      Alert.alert('Fel vid uppdatering av roll', updateTeamMemberRole.error.message);
    }
  }, [
    addTeamMember.error, 
    removeTeamMember.error, 
    updateTeamMemberRole.error
  ]);
  
  // Visa information om operationer pågår med useMemo
  const isAnyOperationLoading = useMemo(() => 
    addTeamMember.isLoading || 
    removeTeamMember.isLoading || 
    updateTeamMemberRole.isLoading,
  [addTeamMember.isLoading, removeTeamMember.isLoading, updateTeamMemberRole.isLoading]);
    
  // Bestäm aktuellt operationsmeddelande med useMemo
  const operationLoadingMessage = useMemo(() => 
    (addTeamMember.isLoading && addTeamMember.progress?.message) ||
    (removeTeamMember.isLoading && removeTeamMember.progress?.message) ||
    (updateTeamMemberRole.isLoading && updateTeamMemberRole.progress?.message),
  [
    addTeamMember.isLoading, addTeamMember.progress, 
    removeTeamMember.isLoading, removeTeamMember.progress, 
    updateTeamMemberRole.isLoading, updateTeamMemberRole.progress
  ]);
  
  // Hantera toggle av formulär med useCallback
  const handleToggleAddMemberForm = useCallback(() => {
    setShowAddMemberForm(prev => !prev);
  }, []);
  
  // Hantera manuell uppdatering med useCallback
  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['team', teamId] });
    queryClient.invalidateQueries({ queryKey: ['teamMembers', teamId] });
    getTeam.execute({ teamId });
    
    // Om getTeamMembers finns, använd den för paginering
    if (getTeamMembers?.execute) {
      getTeamMembers.execute({ 
        teamId, 
        page: currentPage, 
        pageSize,
        searchQuery: searchQuery.trim() || undefined
      });
    }
  }, [queryClient, getTeam, getTeamMembers, teamId, currentPage, pageSize, searchQuery]);

  // Hantera sökning
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Återställ till första sidan vid ny sökning
  }, []);

  // Hantera sidändring
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  // Hantera tillbaka-navigering med useCallback
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);
  
  // Bestäm om användaren är admin med useMemo
  const isCurrentUserAdmin = useMemo(() => 
    getTeam.data?.members?.some(
      m => m.id === currentUser?.id && (m.role === 'admin' || m.role === 'owner')
    ) || false,
  [getTeam.data, currentUser?.id]);
  
  // Använd PresentationAdapter för att hantera olika tillstånd
  return (
    <PresentationAdapter
      data={getTeam.data}
      loading={getTeam.isLoading}
      error={getTeam.error}
      onRetry={() => getTeam.retry()}
      renderData={(team) => (
        <TeamMembersScreenPresentation
          teamId={teamId}
          teamName={team.name}
          teamDescription={team.description}
          members={getTeamMembers?.data || team.members}
          totalMembersCount={getTeamMembers?.data?.totalCount || team.members?.length || 0}
          currentPage={currentPage}
          pageSize={pageSize}
          searchQuery={searchQuery}
          isCurrentUserAdmin={isCurrentUserAdmin}
          showAddMemberForm={showAddMemberForm}
          fadeAnim={fadeAnim}
          isLoading={getTeam.isLoading}
          isMembersLoading={getTeamMembers?.isLoading || false}
          loadingMessage={getTeam.progress?.message}
          loadingProgress={getTeam.progress?.percent}
          isAnyOperationLoading={isAnyOperationLoading}
          operationLoadingMessage={operationLoadingMessage}
          error={getTeam.error}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
          onRoleChange={handleRoleChange}
          onToggleAddMemberForm={handleToggleAddMemberForm}
          onSearch={handleSearch}
          onPageChange={handlePageChange}
          onRetry={() => getTeam.retry()}
          onRefresh={handleRefresh}
          onBack={handleBack}
          addMemberProgress={addTeamMember.progress}
          isAddMemberLoading={addTeamMember.isLoading}
        />
      )}
    />
  );
}; 