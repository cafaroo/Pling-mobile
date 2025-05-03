import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Card } from '@/components/ui/Card';
import { PendingApprovalCard } from './PendingApprovalCard';
import { PendingMembershipCard } from './PendingMembershipCard';
import { PendingInviteCard } from './PendingInviteCard';
import { Team, TeamMember } from '@/types';

interface TeamPendingSectionProps {
  selectedTeam: Team | null;
  isLeader: boolean;
  pendingMembers: TeamMember[];
  invitation: any;
  isPendingMember: boolean;
  pendingTeamName: string;
  onApproveMember: (userId: string) => Promise<void>;
  onRejectMember: (userId: string) => Promise<void>;
  onAcceptInvitation: () => Promise<void>;
}

export function TeamPendingSection({
  selectedTeam,
  isLeader,
  pendingMembers,
  invitation,
  isPendingMember,
  pendingTeamName,
  onApproveMember,
  onRejectMember,
  onAcceptInvitation,
}: TeamPendingSectionProps) {
  const { colors } = useTheme();

  // Inget att visa om det inte finns pendingMembers, inbjudningar, eller pending-status
  const hasPendingItems = 
    (isLeader && pendingMembers && pendingMembers.length > 0) || 
    isPendingMember || 
    (invitation && invitation.id);

  if (!selectedTeam && !hasPendingItems) return null;

  return (
    <Card style={styles.container}>
      <Text style={[styles.title, { color: colors.text.main }]}>
        Väntande ärenden
      </Text>
      
      <ScrollView style={styles.scrollView}>
        {invitation && invitation.id && (
          <PendingInviteCard
            teamName={invitation.team?.name || 'Ditt Team'}
            onAccept={onAcceptInvitation}
          />
        )}

        {isPendingMember && (
          <PendingMembershipCard
            teamName={pendingTeamName}
          />
        )}

        {isLeader && pendingMembers.map((member) => (
          <PendingApprovalCard
            key={member.user_id}
            member={member}
            onApprove={() => onApproveMember(member.user_id)}
            onReject={() => onRejectMember(member.user_id)}
          />
        ))}

        {isLeader && pendingMembers.length === 0 && !invitation && !isPendingMember && (
          <Text style={[styles.emptyText, { color: colors.text.light }]}>
            Inga väntande ärenden
          </Text>
        )}
      </ScrollView>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    marginBottom: 16,
  },
  scrollView: {
    maxHeight: 300,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: 8,
  },
}); 