import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTeam, updateTeamMemberStatus, removeTeamMember } from '@/services/teamService';
import { Team, TeamMember } from '@/types/team';
import { Header } from '@/components/ui/Header';
import { PendingApprovalCard } from './PendingApprovalCard';
import { TeamMemberList } from './TeamMemberList';
import { TeamSettings } from './TeamSettings';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { Skeleton } from '@/components/ui/Skeleton';

/**
 * Props för TeamScreen-komponenten
 * 
 * @interface TeamScreenProps
 * @property {string} teamId - ID för teamet som ska visas
 * @property {() => void} [onBackPress] - Callback för när tillbakaknappen trycks
 */
interface TeamScreenProps {
  teamId: string;
  onBackPress?: () => void;
}

/**
 * Huvudskärm för att visa och hantera ett specifikt team
 * 
 * @param {TeamScreenProps} props - Komponentens props
 * @returns {React.ReactElement} Den renderade komponenten
 */
export const TeamScreen: React.FC<TeamScreenProps> = ({ teamId, onBackPress }) => {
  const { colors } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'members' | 'settings'>('members');
  
  // Hämta teamdata med React Query
  const { 
    data: teamResponse, 
    isLoading, 
    isError, 
    error,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => getTeam(teamId),
    staleTime: 1000 * 60 * 5, // 5 minuter
  });
  
  const team = teamResponse?.success ? teamResponse.data : undefined;
  
  // Filtrera medlemmar efter status
  const pendingMembers = team?.team_members?.filter(
    (member) => member.status === 'pending'
  ) || [];
  
  const activeMembers = team?.team_members?.filter(
    (member) => member.status === 'active'
  ) || [];
  
  // Mutation för att godkänna väntande medlemmar
  const approveMutation = useMutation({
    mutationFn: (userId: string) => 
      updateTeamMemberStatus(teamId, userId, 'active'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      toast.show('Medlem godkänd', { type: 'success' });
    },
    onError: (error) => {
      console.error('Error approving member:', error);
      toast.show('Kunde inte godkänna medlem', { type: 'error' });
    }
  });
  
  // Mutation för att avvisa väntande medlemmar
  const rejectMutation = useMutation({
    mutationFn: (userId: string) => 
      removeTeamMember(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      toast.show('Medlem avvisad', { type: 'success' });
    },
    onError: (error) => {
      console.error('Error rejecting member:', error);
      toast.show('Kunde inte avvisa medlem', { type: 'error' });
    }
  });
  
  // Hantera godkännande av medlem
  const handleApproveMember = (userId: string) => {
    approveMutation.mutate(userId);
  };
  
  // Hantera avvisning av medlem
  const handleRejectMember = (userId: string) => {
    rejectMutation.mutate(userId);
  };
  
  // Rendera laddningsläge för skärmen
  if (isLoading && !isRefetching) {
    return (
      <View style={styles.container}>
        <Header 
          title="Laddar team..." 
          showBackButton={!!onBackPress}
          onBackPress={onBackPress}
          testID="back-button"
        />
        <View style={styles.loadingContainer} testID="team-loading-skeleton">
          <Skeleton width="80%" height={40} style={styles.skeletonItem} />
          <Skeleton width="60%" height={20} style={styles.skeletonItem} />
          <Skeleton width="90%" height={120} style={styles.skeletonItem} />
          <Skeleton width="100%" height={70} style={styles.skeletonItem} />
          <Skeleton width="100%" height={70} style={styles.skeletonItem} />
          <Skeleton width="100%" height={70} style={styles.skeletonItem} />
        </View>
      </View>
    );
  }
  
  // Rendera felläge
  if (isError || !team) {
    return (
      <View style={styles.container}>
        <Header 
          title="Fel" 
          showBackButton={!!onBackPress}
          onBackPress={onBackPress}
          testID="back-button"
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {isError ? 'Kunde inte ladda teamet' : 'Teamet hittades inte'}
          </Text>
          <Text style={[styles.errorDetails, { color: colors.text.light }]}>
            {error instanceof Error ? error.message : 'Försök igen senare.'}
          </Text>
          <Button 
            title="Försök igen" 
            onPress={() => refetch()} 
            variant="primary"
            style={styles.retryButton}
            testID="retry-button"
          />
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Header 
        title={team.name} 
        showBackButton={!!onBackPress}
        onBackPress={onBackPress}
        testID="back-button"
      />
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'members' && { 
              borderBottomColor: colors.primary.main,
              borderBottomWidth: 2
            }
          ]}
          onPress={() => setActiveTab('members')}
          testID="members-tab"
        >
          <Text style={[
            styles.tabText, 
            { color: activeTab === 'members' ? colors.primary.main : colors.text.light }
          ]}>
            Medlemmar
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'settings' && { 
              borderBottomColor: colors.primary.main,
              borderBottomWidth: 2
            }
          ]}
          onPress={() => setActiveTab('settings')}
          testID="settings-tab"
        >
          <Text style={[
            styles.tabText, 
            { color: activeTab === 'settings' ? colors.primary.main : colors.text.light }
          ]}>
            Inställningar
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
          />
        }
        testID="team-scroll-view"
      >
        {activeTab === 'members' ? (
          <View testID="team-members">
            {pendingMembers.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
                  Väntande medlemmar
                </Text>
                {pendingMembers.map((member) => (
                  <PendingApprovalCard
                    key={member.id}
                    member={member}
                    onApprove={() => handleApproveMember(member.user_id)}
                    onReject={() => handleRejectMember(member.user_id)}
                    testID={`pending-member-${member.user_id}`}
                  />
                ))}
              </View>
            )}
            
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
                Aktiva medlemmar
              </Text>
              <TeamMemberList 
                members={activeMembers}
                testID="active-members-list"
              />
            </View>
          </View>
        ) : (
          <View testID="team-settings">
            <TeamSettings team={team} />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    padding: 16,
  },
  skeletonItem: {
    marginBottom: 16,
    borderRadius: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorDetails: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    minWidth: 150,
  },
}); 