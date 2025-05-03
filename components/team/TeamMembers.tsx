import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Team, Subscription, TeamRole } from '@/types';
import { TeamMemberList } from './TeamMemberList';
import { TeamSettings } from './TeamSettings';

interface TeamMembersProps {
  team: Team;
  isLeader: boolean;
  currentUserId?: string;
  subscription: Subscription | null;
}

export function TeamMembers({
  team,
  isLeader,
  currentUserId,
  subscription
}: TeamMembersProps) {
  // Avgör användarens roll för att skicka till TeamMemberList
  const currentUserRole = team.members?.find(m => m.user_id === currentUserId)?.role as TeamRole || 'member';
  
  // Hämta teamets medlemmar från team-objektet
  const members = team.members || [];
  
  return (
    <View style={styles.container}>
      {/* Använd den uppdaterade TeamMemberList med vanlig FlatList */}
      <TeamMemberList
        members={members}
        currentUserRole={currentUserRole}
        variant="default"
        showRoleBadges={true}
        showStatusBadges={true}
      />

      {isLeader && (
        <TeamSettings
          team={team}
          subscription={subscription}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
}); 