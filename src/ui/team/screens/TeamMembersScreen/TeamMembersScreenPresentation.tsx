import React from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Button, Text, TouchableOpacity, Animated } from 'react-native';
import { Appbar, Searchbar, Divider } from 'react-native-paper';
import { Screen } from '@/ui/components/Screen';
import { ProgressBar } from '@/ui/shared/components/ProgressBar';
import { ErrorMessage } from '@/ui/shared/components/ErrorMessage';
import { EmptyState } from '@/ui/shared/components/EmptyState';
import { MemberCard } from '../../components/MemberCard';
import { AddMemberForm } from '../../components/AddMemberForm';
import { Pagination } from '@/ui/shared/components/Pagination';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface TeamMembersScreenPresentationProps {
  // Team data
  teamId: string;
  teamName: string;
  teamDescription?: string;
  members: TeamMember[];
  totalMembersCount: number;
  currentPage: number;
  pageSize: number;
  searchQuery: string;
  isCurrentUserAdmin: boolean;
  
  // UI-tillstånd
  showAddMemberForm: boolean;
  fadeAnim: Animated.Value;
  
  // Laddningstillstånd
  isLoading: boolean;
  isMembersLoading?: boolean;
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
  onSearch: (query: string) => void;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onRefresh: () => void;
  onBack: () => void;
  
  // Progress för add member operation
  addMemberProgress?: { message?: string; percent?: number };
  isAddMemberLoading: boolean;
}

export const TeamMembersScreenPresentation: React.FC<TeamMembersScreenPresentationProps> = ({
  teamId,
  teamName,
  teamDescription,
  members,
  totalMembersCount,
  currentPage,
  pageSize,
  searchQuery,
  isCurrentUserAdmin,
  showAddMemberForm,
  fadeAnim,
  isLoading,
  isMembersLoading,
  loadingMessage,
  loadingProgress,
  isAnyOperationLoading,
  operationLoadingMessage,
  error,
  onAddMember,
  onRemoveMember,
  onRoleChange,
  onToggleAddMemberForm,
  onSearch,
  onPageChange,
  onRetry,
  onRefresh,
  onBack,
  addMemberProgress,
  isAddMemberLoading
}) => {
  // Renderingsfunktion för laddningstillstånd
  const renderLoading = () => {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>
          {loadingMessage || 'Laddar medlemmar...'}
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
  
  // Renderingsfunktion för innehåll
  const renderContent = () => {
    if (isLoading) {
      return renderLoading();
    }
    
    if (error) {
      return (
        <ErrorMessage 
          message={error.message}
          onRetry={error.retryable ? onRetry : undefined}
          context={error.context}
        />
      );
    }
    
    // Beräkna sidnumrering
    const totalPages = Math.ceil(totalMembersCount / pageSize);
    
    return (
      <>
        {/* Sökfält */}
        <Searchbar
          placeholder="Sök medlemmar..."
          onChangeText={onSearch}
          value={searchQuery}
          style={styles.searchBar}
        />
        
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
        
        {/* Visa antal visade medlemmar och filtrering */}
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            Visar {members.length} av {totalMembersCount} medlemmar
            {searchQuery ? ` (filtrerade: "${searchQuery}")` : ''}
          </Text>
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
        
        {/* Medlemslista med laddningsindikator */}
        {isMembersLoading ? (
          <View style={styles.membersLoadingContainer}>
            <ActivityIndicator size="small" color="#0066cc" />
            <Text style={styles.membersLoadingText}>Laddar medlemmar...</Text>
          </View>
        ) : (
          <FlatList
            data={members}
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
              <EmptyState
                title="Inga medlemmar hittades"
                description={searchQuery 
                  ? `Inga medlemmar matchade "${searchQuery}"`
                  : "Detta team har inga medlemmar ännu."}
                actionLabel={isCurrentUserAdmin ? "Lägg till medlem" : undefined}
                onAction={isCurrentUserAdmin ? onToggleAddMemberForm : undefined}
              />
            }
            contentContainerStyle={styles.listContainer}
          />
        )}
        
        {/* Pagination om det finns flera sidor */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            disabled={isMembersLoading}
          />
        )}
        
        {/* Visa laddningsövertäckning när operationer pågår */}
        {isAnyOperationLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingOverlayText}>
              {operationLoadingMessage || 'Arbetar...'}
            </Text>
          </View>
        )}
      </>
    );
  };
  
  return (
    <Screen>
      <Appbar.Header>
        <Appbar.BackAction onPress={onBack} />
        <Appbar.Content title={`${teamName} - Medlemmar`} subtitle={teamDescription} />
        <Appbar.Action icon="refresh" onPress={onRefresh} />
      </Appbar.Header>
      
      <View style={styles.container}>
        {renderContent()}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa'
  },
  searchBar: {
    marginBottom: 16,
    elevation: 1,
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  statsRow: {
    marginBottom: 16,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
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
  membersLoadingContainer: {
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  membersLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    marginBottom: 8
  },
  listContainer: {
    flexGrow: 1
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  loadingOverlayText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16
  }
}); 