import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { TeamInvite, TeamMember } from '@types/team';
import { Mail, Check, X } from 'lucide-react-native';
import { MemberItem } from '@components/team/MemberItem';

interface PendingInviteListProps {
  invites: TeamInvite[];
  onAccept: (inviteId: string) => void;
  onDecline: (inviteId: string) => void;
  isLoading?: boolean;
}

interface PendingInviteSingleProps {
  teamName?: string;
  invitation?: any; // Enkel invitation object
  onAccept: () => void;
  isLoading?: boolean;
  style?: object;
}

// Diskriminerad union för att acceptera olika prop-former
type PendingInviteCardProps = PendingInviteListProps | PendingInviteSingleProps;

// Typväktare för att kontrollera vilken variant av props vi har
const isSingleInvite = (props: PendingInviteCardProps): props is PendingInviteSingleProps => {
  return 'invitation' in props || 'teamName' in props;
};

// Hjälpfunktion för att konvertera TeamInvite till TeamMember-format för MemberItem
const inviteToMemberFormat = (invite: TeamInvite): TeamMember => {
  return {
    id: invite.id,
    team_id: invite.team_id,
    user_id: invite.invited_by,
    role: invite.role,
    status: 'invited',
    created_at: invite.created_at,
    updated_at: invite.created_at,
    profile: {
      id: '',
      name: invite.team?.name || 'Namnlöst team',
      avatar_url: invite.team?.avatar_url || null,
      email: '',
      created_at: invite.created_at,
    },
    user: {
      id: invite.invited_by,
      email: invite.email,
      created_at: invite.created_at,
      name: invite.inviter?.name || 'En teammedlem',
    }
  };
};

interface ActionButtonsProps {
  inviteId: string;
  onAccept: (inviteId: string) => void;
  onDecline: (inviteId: string) => void;
  isLoading?: boolean;
}

const ActionButtons = ({ inviteId, onAccept, onDecline, isLoading }: ActionButtonsProps) => {
  const { colors } = useTheme();
  
  return (
    <View style={styles.actions}>
      <Button
        Icon={X}
        variant="outline"
        size="small"
        onPress={() => onDecline(inviteId)}
        disabled={isLoading}
        style={[styles.actionButton, { borderColor: colors.error }]}
      />
      <Button
        Icon={Check}
        variant="outline"
        size="small"
        onPress={() => onAccept(inviteId)}
        disabled={isLoading}
        style={[styles.actionButton, { borderColor: colors.success }]}
      />
    </View>
  );
};

export const PendingInviteCard = (props: PendingInviteCardProps) => {
  const { colors } = useTheme();

  // Enkel invitation (för visning i team/index.tsx)
  if (isSingleInvite(props)) {
    const { invitation, teamName, onAccept, isLoading = false, style } = props;
    
    // Hämta teamnamnet antingen från teamName-proppen eller från invitation-objektet
    const displayTeamName = teamName || 
      (invitation?.team?.name || invitation?.team_name || 'Namnlöst team');
    
    const inviterName = invitation?.inviter?.name || 'En teammedlem';
    
    return (
      <Card style={[styles.card, style]}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Mail color={colors.accent.blue} size={24} />
            <Text style={[styles.title, { color: colors.text.main }]}>
              Team Invitation
            </Text>
          </View>
        </View>

        <View style={styles.singleInviteContent}>
          <Text style={[styles.inviteText, { color: colors.text.main }]}>
            Du har blivit inbjuden att gå med i teamet
          </Text>
          
          <Text style={[styles.teamNameBig, { color: colors.text.main }]}>
            {displayTeamName}
          </Text>
          
          <Text style={[styles.inviterText, { color: colors.text.light }]}>
            Inbjuden av {inviterName}
          </Text>
          
          <Button
            title="Acceptera inbjudan"
            Icon={Check}
            onPress={onAccept}
            variant="primary"
            size="large"
            disabled={isLoading}
            style={styles.acceptButton}
          />
        </View>
      </Card>
    );
  }

  // Lista av inbjudningar
  const { invites, onAccept, onDecline, isLoading = false } = props;
  if (invites.length === 0) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Mail color={colors.accent.blue} size={24} />
          <Text style={[styles.title, { color: colors.text.main }]}>
            Inbjudningar
          </Text>
        </View>
        <Text style={[styles.count, { color: colors.text.light }]}>
          {invites.length} nya
        </Text>
      </View>

      <View style={styles.invitesList}>
        {invites.map((invite) => (
          <View key={invite.id} style={styles.inviteItem}>
            <MemberItem
              member={inviteToMemberFormat(invite)}
              variant="compact"
              showActions={false}
              showRoleBadge={false}
              showStatusBadge={false}
            />
            
            <ActionButtons
              inviteId={invite.id}
              onAccept={onAccept}
              onDecline={onDecline}
              isLoading={isLoading}
            />
          </View>
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
  },
  count: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  invitesList: {
    gap: 16,
  },
  inviteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    minWidth: 40,
  },
  singleInviteContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  inviteText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  teamNameBig: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  inviterText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  acceptButton: {
    minWidth: 200,
  },
});