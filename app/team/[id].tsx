import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useTeam } from '@/hooks/useTeam';
import { useAuth } from '@/context/AuthContext';
import { TeamMemberRole } from '@/types/team';
import { TeamCard } from '@/components/team/TeamCard';
import { TeamMemberList } from '@/components/team/TeamMemberList';
import { TeamSettingsForm } from '@/components/team/TeamSettingsForm';
import { PendingApprovalCard } from '@/components/team/PendingApprovalCard';
import { PendingMembershipCard } from '@/components/team/PendingMembershipCard';
import { PendingInviteCard } from '@/components/team/PendingInviteCard';
import { InviteCodeModal } from '@/components/team/InviteCodeModal';
import { Button } from '@/components/ui/Button';
import { Users } from 'lucide-react-native';

export default function TeamScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const { user } = useAuth();
  const {
    team,
    members,
    pendingMembers,
    pendingInvites,
    pendingMemberships,
    isLoading,
    inviteCode,
    error,
    fetchTeam,
    approveTeamMember,
    rejectTeamMember,
    removeTeamMember,
    updateTeamMemberRole,
    generateInviteCode,
    acceptInvite,
    declineInvite,
    cancelMembership,
  } = useTeam(id as string);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  useEffect(() => {
    if (error) {
      // Hantera fel här
      console.error('Team error:', error);
    }
  }, [error]);

  const handleGenerateCode = async () => {
    setIsGeneratingCode(true);
    try {
      await generateInviteCode();
      setShowInviteModal(true);
    } catch (error) {
      console.error('Error generating invite code:', error);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const currentUserRole = members?.find(m => m.user_id === user?.id)?.role;
  const canManageTeam = currentUserRole === TeamMemberRole.OWNER || 
                       currentUserRole === TeamMemberRole.ADMIN;

  if (!team || !members) return null;

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen 
        options={{
          title: team.name,
          headerRight: () => (
            canManageTeam && (
              <Button
                icon={Users}
                variant="ghost"
                onPress={() => setShowInviteModal(true)}
                style={styles.inviteButton}
              />
            )
          ),
        }}
      />

      <View style={styles.content}>
        <TeamCard
          team={team}
          style={styles.card}
        />

        {pendingInvites.length > 0 && (
          <PendingInviteCard
            invites={pendingInvites}
            onAccept={acceptInvite}
            onDecline={declineInvite}
            isLoading={isLoading}
          />
        )}

        {pendingMemberships.length > 0 && (
          <PendingMembershipCard
            pendingTeams={pendingMemberships}
            onCancel={cancelMembership}
            isLoading={isLoading}
          />
        )}

        {canManageTeam && pendingMembers.length > 0 && (
          <PendingApprovalCard
            pendingMembers={pendingMembers}
            onApprove={approveTeamMember}
            onReject={rejectTeamMember}
            isLoading={isLoading}
          />
        )}

        <TeamMemberList
          members={members}
          currentUserId={user?.id}
          currentUserRole={currentUserRole}
          onUpdateRole={updateTeamMemberRole}
          onRemove={removeTeamMember}
          isLoading={isLoading}
        />

        {canManageTeam && (
          <TeamSettingsForm
            team={team}
            onUpdate={fetchTeam}
          />
        )}
      </View>

      <InviteCodeModal
        isVisible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        inviteCode={inviteCode || ''}
        onGenerateNewCode={handleGenerateCode}
        isLoading={isGeneratingCode}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  card: {
    marginBottom: 0,
  },
  inviteButton: {
    marginRight: 8,
  },
}); 