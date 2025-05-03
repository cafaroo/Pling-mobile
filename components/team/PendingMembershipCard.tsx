import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Team, TeamMember, TeamMemberStatus } from '@/types/team';
import { Clock, X } from 'lucide-react-native';
import { MemberItem } from './MemberItem';

interface PendingMembershipListProps {
  pendingTeams: Team[];
  onCancel: (teamId: string) => void;
  isLoading?: boolean;
}

interface PendingMembershipSimpleProps {
  teamName: string;
  style?: object;
}

// Diskriminerad union för att acceptera olika prop-former
type PendingMembershipCardProps = 
  | PendingMembershipListProps
  | PendingMembershipSimpleProps;

// Typdiskriminator för att kontrollera vilken variant av props vi har fått
const isSimpleView = (props: PendingMembershipCardProps): props is PendingMembershipSimpleProps => {
  return 'teamName' in props;
};

// Hjälpfunktion för att konvertera Team till TeamMember-format för MemberItem
const teamToMemberFormat = (team: Team): TeamMember => {
  return {
    id: team.id,
    team_id: team.id,
    user_id: '', // Inte relevant i denna kontext
    role: 'member',
    status: TeamMemberStatus.PENDING,
    created_at: team.created_at,
    updated_at: team.updated_at,
    profile: {
      id: '',
      name: team.name,
      avatar_url: team.profile_image || null,
      email: '',
      created_at: team.created_at,
    },
    // Lägger till extra info för teamvisning
    user: {
      id: '',
      email: '',
      created_at: team.created_at,
      memberCount: team.team_members?.length || 0,
    }
  };
};

export const PendingMembershipCard = (props: PendingMembershipCardProps) => {
  const { colors } = useTheme();

  // Rendera enkel vy för väntande medlemskap
  if (isSimpleView(props)) {
    return (
      <Card style={[styles.card, props.style]}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Clock color={colors.accent.yellow} size={24} />
            <Text style={[styles.title, { color: colors.text.main }]}>
              Väntande Godkännande
            </Text>
          </View>
        </View>

        <Text style={[styles.teamName, { color: colors.text.main }]}>
          Din förfrågan till "{props.teamName}" väntar på godkännande
        </Text>
        <Text style={[styles.message, { color: colors.text.light }]}>
          Du kommer få en notifiering när din förfrågan har behandlats
        </Text>
      </Card>
    );
  }

  // Fullständig vy med lista av team
  if (props.pendingTeams.length === 0) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Clock color={colors.accent.yellow} size={24} />
          <Text style={[styles.title, { color: colors.text.main }]}>
            Väntande Förfrågningar
          </Text>
        </View>
        <Text style={[styles.count, { color: colors.text.light }]}>
          {props.pendingTeams.length} väntande
        </Text>
      </View>

      <View style={styles.teamsList}>
        {props.pendingTeams.map((team) => (
          <View key={team.id} style={styles.teamItem}>
            <MemberItem
              member={teamToMemberFormat(team)}
              variant="compact"
              showActions={false}
              showRoleBadge={false}
              showStatusBadge={false}
            />
            
            <Button
              Icon={X}
              variant="outline"
              size="small"
              onPress={() => props.onCancel(team.id)}
              disabled={props.isLoading}
              style={[styles.cancelButton, { borderColor: colors.error }]}
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
  teamsList: {
    gap: 16,
  },
  teamItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelButton: {
    minWidth: 40,
  },
  teamName: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginBottom: 8,
  },
  message: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 8,
  }
});