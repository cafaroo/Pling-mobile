import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, Button, TouchableOpacity, Animated } from 'react-native';
import { useTeamWithStandardHook } from '@/application/team/hooks/useTeamWithStandardHook';
import { useUserContext } from '@/ui/user/context/UserContext';
import { ProgressBar } from '@/ui/shared/components/ProgressBar';
import { ErrorMessage } from '@/ui/shared/components/ErrorMessage';
import { MemberCard } from '../components/MemberCard';
import { AddMemberForm } from '../components/AddMemberForm';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Komponent för att visa teaminformation med förbättrad laddningsstatus och felhantering
 */
export const TeamScreen = ({ teamId }: { teamId: string }) => {
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
  
  // Hantera laddningsmeddelande med progressindikator
  const renderLoading = () => {
    if (!getTeam.isLoading) return null;
    
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>
          {getTeam.progress?.message || 'Laddar team...'}
        </Text>
        {getTeam.progress?.percent !== undefined && (
          <ProgressBar 
            progress={getTeam.progress.percent} 
            width={300}
            color="#0066cc"
          />
        )}
      </View>
    );
  };
  
  // Hantera fel med möjlighet att försöka igen
  const renderError = () => {
    if (!getTeam.error) return null;
    
    return (
      <ErrorMessage 
        message={getTeam.error.message}
        onRetry={getTeam.error.retryable ? () => getTeam.retry() : undefined}
        context={getTeam.error.context}
      />
    );
  };
  
  // Hantera tillägg av ny medlem
  const handleAddMember = async (userId: string, role: string) => {
    try {
      const result = await addTeamMember.execute({ 
        teamId, 
        userId, 
        role 
      });
      
      if (result.isSuccess()) {
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
  
  // Uppdatera UI om vi har data
  if (getTeam.data) {
    const team = getTeam.data;
    const isCurrentUserAdmin = team.members?.some(
      m => m.id === currentUser?.id && m.role === 'admin'
    );
    
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.teamName}>{team.name}</Text>
          {team.description && (
            <Text style={styles.teamDescription}>{team.description}</Text>
          )}
        </View>
        
        <View style={styles.membersHeader}>
          <Text style={styles.sectionTitle}>Medlemmar</Text>
          {isCurrentUserAdmin && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddMemberForm(!showAddMemberForm)}
            >
              <Text style={styles.addButtonText}>
                {showAddMemberForm ? 'Avbryt' : 'Lägg till medlem'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Formregion med animation */}
        <Animated.View 
          style={[
            styles.formContainer, 
            { 
              opacity: fadeAnim,
              height: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 200]
              })
            }
          ]}
        >
          {showAddMemberForm && (
            <AddMemberForm 
              onSubmit={handleAddMember} 
              isLoading={addTeamMember.isLoading}
              progress={addTeamMember.progress}
            />
          )}
        </Animated.View>
        
        {/* Visa laddningsövertäckning när operationer pågår */}
        {isAnyOperationLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingOverlayText}>
              {addTeamMember.isLoading && addTeamMember.progress?.message}
              {removeTeamMember.isLoading && removeTeamMember.progress?.message}
              {updateTeamMemberRole.isLoading && updateTeamMemberRole.progress?.message}
            </Text>
          </View>
        )}
        
        {/* Medlemslista */}
        <FlatList
          data={team.members}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MemberCard
              member={item}
              isAdmin={isCurrentUserAdmin}
              onRemove={isCurrentUserAdmin ? () => handleRemoveMember(item.id) : undefined}
              onRoleChange={isCurrentUserAdmin ? (role) => handleRoleChange(item.id, role) : undefined}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Inga medlemmar hittades</Text>
          }
        />
        
        {/* Manuellt återförsöka laddning */}
        <View style={styles.refreshContainer}>
          <Button 
            title="Uppdatera team" 
            onPress={() => {
              queryClient.invalidateQueries({ queryKey: ['team', teamId] });
              getTeam.execute({ teamId });
            }} 
          />
        </View>
      </View>
    );
  }
  
  // Returvärde när laddning eller felhantering pågår
  return (
    <View style={styles.container}>
      {renderLoading()}
      {renderError()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa'
  },
  header: {
    marginBottom: 24
  },
  teamName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8
  },
  teamDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  addButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  formContainer: {
    overflow: 'hidden',
    marginBottom: 16
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    marginBottom: 8
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  loadingOverlayText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    color: '#666'
  },
  refreshContainer: {
    marginTop: 20,
    alignItems: 'center'
  }
}); 