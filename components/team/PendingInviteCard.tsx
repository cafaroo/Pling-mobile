import { View, Text, StyleSheet } from 'react-native';
import { Mail } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import Card from '@/components/ui/Card';
import { TeamInvitation } from '@/types';
import Button from '@/components/ui/Button';
import { format } from 'date-fns';

type PendingInviteCardProps = {
  invitation: TeamInvitation;
  onAccept: () => void;
  isLoading?: boolean;
  style?: object;
};

export default function PendingInviteCard({ 
  invitation,
  onAccept, 
  isLoading = false,
  style 
}: PendingInviteCardProps) {
  const { colors } = useTheme();

  // Format expiry date
  const formatExpiryTime = (dateString: string) => {
    const expiryDate = new Date(dateString);
    return format(expiryDate, 'MMM d, yyyy');
  };

  return (
    <Card style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.accent.yellow }]}>
          <Mail color={colors.background.dark} size={20} />
        </View>
        <Text style={[styles.title, { color: colors.text.main }]}>
          Pending Team Invitation
        </Text>
      </View>
      
      <Text style={[styles.description, { color: colors.text.light }]}>
        You have been invited to join a team. Accept the invitation to join and collaborate with your team members.
      </Text>
      
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.text.light }]}>
            Team:
          </Text>
          <Text style={[styles.detailValue, { color: colors.text.main }]}>
            {invitation.teamName}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.text.light }]}>
            Role:
          </Text>
          <Text style={[styles.detailValue, { color: colors.text.main }]}>
            {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.text.light }]}>
            Expires:
          </Text>
          <Text style={[styles.detailValue, { color: colors.text.main }]}>
            {formatExpiryTime(invitation.expiresAt)}
          </Text>
        </View>
      </View>
      
      <View style={styles.expiryContainer}>
        <Mail size={16} color={colors.text.light} />
        <Text style={[styles.expiryText, { color: colors.text.light }]}>
          This invitation was sent to {invitation.email}
        </Text>
      </View>
      
      <Button
        title="Accept Invitation"
        variant="primary"
        size="large"
        onPress={onAccept}
        loading={isLoading}
        style={styles.acceptButton}
      />
    </Card>
  );
}