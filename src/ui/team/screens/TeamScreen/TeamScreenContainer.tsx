import React, { useState, useEffect } from 'react';
import { Alert, Animated } from 'react-native';
import { useTeamWithStandardHook } from '@/application/team/hooks/useTeamWithStandardHook';
import { useUserContext } from '@/ui/user/context/UserContext';
import { useQueryClient } from '@tanstack/react-query';
import { TeamScreenPresentation } from './TeamScreenPresentation';
import { PresentationAdapter } from '@/ui/shared/adapters/PresentationAdapter';

export interface TeamScreenContainerProps {
  teamId: string;
}

export const TeamScreenContainer: React.FC<TeamScreenContainerProps> = ({ teamId }) => {
  const { currentUser } = useUserContext();
  const { 
    getTeam, 
    addTeamMember, 
    removeTeamMember,
    updateTeamMemberRole,
    getTeamStatistics 
  } = useTeamWithStandardHook();
  
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const queryClient = useQueryClient();
  
  // Hämta team-data med standardiserad hook
  useEffect(() => {
    const fetchTeam = async () => {
      await getTeam.execute({ teamId });
    };
    
    fetchTeam();
  }, [teamId]);
  
  // Animera in formuläret
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: showAddMemberForm ? 1 : 0,
      duration: 300,
      useNativeDriver: true
    }).start();
  }, [showAddMemberForm, fadeAnim]);
  
  // Hantera tillägg av ny medlem
  const handleAddMember = async (userId: string, role: string) => {
    try {
      const result = await addTeamMember.execute({ 
        teamId, 
        userId, 
        role 
      });
      
      if (result.isOk()) {
        setShowAddMemberForm(false);
        Alert.alert('Lyckades', 'Medlemmen har lagts till i teamet.');
      }
    } catch (error) {
      // Felhanteringen sköts automatiskt av standardiserade hook
    }
  };
  
  // Hantera borttagning av medlem
  const handleRemoveMember = async (memberId: string) => {
    Alert.alert(
      'Ta bort medlem',
      'Är du säker på att du vill ta bort denna medlem från teamet?',
      [
        { text: 'Avbryt', style: 'cancel' },
        { 
          text: 'Ta bort', 
          style: 'destructive',
          onPress: async () => {
            await removeTeamMember.execute({ teamId, userId: memberId });
          }
        }
      ]
    );
  };
  
  // Hantera ändring av roll
  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await updateTeamMemberRole.execute({ 
        teamId, 
        userId: memberId, 
        role: newRole 
      });
    } catch (error) {
      // Felhanteringen sköts automatiskt av standardiserade hook
    }
  };
  
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
  
  // Visa information om operationer pågår
  const isAnyOperationLoading = 
    addTeamMember.isLoading || 
    removeTeamMember.isLoading || 
    updateTeamMemberRole.isLoading;
    
  // Bestäm aktuellt operationsmeddelande
  const operationLoadingMessage = 
    (addTeamMember.isLoading && addTeamMember.progress?.message) ||
    (removeTeamMember.isLoading && removeTeamMember.progress?.message) ||
    (updateTeamMemberRole.isLoading && updateTeamMemberRole.progress?.message);
  
  // Hantera toggle av formulär
  const handleToggleAddMemberForm = () => {
    setShowAddMemberForm(prev => !prev);
  };
  
  // Hantera manuell uppdatering
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['team', teamId] });
    getTeam.execute({ teamId });
  };
  
  // Bestäm om användaren är admin
  const isCurrentUserAdmin = getTeam.data?.members?.some(
    m => m.id === currentUser?.id && m.role === 'admin'
  ) || false;
  
  // Använd PresentationAdapter för att hantera olika tillstånd
  return (
    <PresentationAdapter
      data={getTeam.data}
      loading={getTeam.isLoading}
      error={getTeam.error}
      onRetry={() => getTeam.retry()}
      renderData={(team) => (
        <TeamScreenPresentation
          team={team}
          isCurrentUserAdmin={isCurrentUserAdmin}
          showAddMemberForm={showAddMemberForm}
          fadeAnim={fadeAnim}
          isLoading={getTeam.isLoading}
          loadingMessage={getTeam.progress?.message}
          loadingProgress={getTeam.progress?.percent}
          isAnyOperationLoading={isAnyOperationLoading}
          operationLoadingMessage={operationLoadingMessage}
          error={getTeam.error}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
          onRoleChange={handleRoleChange}
          onToggleAddMemberForm={handleToggleAddMemberForm}
          onRetry={() => getTeam.retry()}
          onRefresh={handleRefresh}
          addMemberProgress={addTeamMember.progress}
          isAddMemberLoading={addTeamMember.isLoading}
        />
      )}
    />
  );
}; 