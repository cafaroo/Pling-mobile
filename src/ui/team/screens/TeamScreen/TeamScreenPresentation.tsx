import React from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Button, TouchableOpacity, Animated } from 'react-native';
import { ProgressBar } from '@/ui/shared/components/ProgressBar';
import { ErrorMessage } from '@/ui/shared/components/ErrorMessage';
import { MemberCard } from '../../components/MemberCard';
import { AddMemberForm } from '../../components/AddMemberForm';
import { Team } from '@/domain/team/entities/Team';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface TeamScreenPresentationProps {
  // Data
  team?: Team;
  isCurrentUserAdmin: boolean;
  showAddMemberForm: boolean;
  fadeAnim: Animated.Value;
  
  // Laddningstillstånd
  isLoading: boolean;
  loadingMessage?: string;
  loadingProgress?: number;
  isAnyOperationLoading: boolean;
  operationLoadingMessage?: string;
  
  // Fel
  error?: {
    message: string;
    retryable?: boolean;
    context?: any;
  };
  
  // Callbacks
  onAddMember: (userId: string, role: string) => void;
  onRemoveMember: (memberId: string) => void;
  onRoleChange: (memberId: string, newRole: string) => void;
  onToggleAddMemberForm: () => void;
  onRetry: () => void;
  onRefresh: () => void;
  
  // Progress för add member operation
  addMemberProgress?: { message?: string; percent?: number };
  isAddMemberLoading: boolean;
}

export const TeamScreenPresentation: React.FC<TeamScreenPresentationProps> = ({
  team,
  isCurrentUserAdmin,
  showAddMemberForm,
  fadeAnim,
  isLoading,
  loadingMessage,
  loadingProgress,
  isAnyOperationLoading,
  operationLoadingMessage,
  error,
  onAddMember,
  onRemoveMember,
  onRoleChange,
  onToggleAddMemberForm,
  onRetry,
  onRefresh,
  addMemberProgress,
  isAddMemberLoading
}) => {
  // Renderingsfunktion för laddningstillstånd
  const renderLoading = () => {
    if (!isLoading) return null;
    
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>
          {loadingMessage || 'Laddar team...'}
        </Text>
        {loadingProgress !== undefined && (
          <ProgressBar 
            progress={loadingProgress} 
            width={300}
            color="#0066cc"
          />
        )}
      </View>
    );
  };
  
  // Renderingsfunktion för fel
  const renderError = () => {
    if (!error) return null;
    
    return (
      <ErrorMessage 
        message={error.message}
        onRetry={error.retryable ? onRetry : undefined}
        context={error.context}
      />
    );
  };
  
  // Om vi har team-data, visa teamet
  if (team) {
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
              onPress={onToggleAddMemberForm}
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
              onSubmit={onAddMember} 
              isLoading={isAddMemberLoading}
              progress={addMemberProgress}
            />
          )}
        </Animated.View>
        
        {/* Visa laddningsövertäckning när operationer pågår */}
        {isAnyOperationLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingOverlayText}>
              {operationLoadingMessage || 'Arbetar...'}
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
              onRemove={isCurrentUserAdmin ? () => onRemoveMember(item.id) : undefined}
              onRoleChange={isCurrentUserAdmin ? (role) => onRoleChange(item.id, role) : undefined}
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
            onPress={onRefresh} 
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