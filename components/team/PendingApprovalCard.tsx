import { View, Text, StyleSheet, Image } from 'react-native';
import { UserCheck, UserX, Clock, Mail } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { TeamMember } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { format } from 'date-fns';

type PendingApprovalCardProps = {
  pendingMembers: TeamMember[];
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
  isLoading?: boolean;
  style?: object;
};

export default function PendingApprovalCard({
  pendingMembers,
  onApprove,
  onReject,
  isLoading = false,
  style
}: PendingApprovalCardProps) {
  const { colors } = useTheme();

  if (pendingMembers.length === 0) {
    return null;
  }

  return (
    <Card style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Clock size={20} color={colors.accent.yellow} style={styles.titleIcon} />
          <Text style={[styles.title, { color: colors.text.main }]}>
            Pending Approvals
          </Text>
        </View>
        <Text style={[styles.count, { color: colors.accent.yellow }]}>
          {pendingMembers.length}
        </Text>
      </View>

      <Text style={[styles.description, { color: colors.text.light }]}>
        The following users have requested to join your team and are waiting for approval.
      </Text>

      <View style={styles.membersList}>
        {pendingMembers.map((member) => (
          <View key={member.id} style={styles.memberItem}>
            <View style={styles.memberInfo}>
              {member.user?.avatarUrl ? (
                <Image 
                  source={{ uri: member.user.avatarUrl }} 
                  style={styles.avatar} 
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary.light }]}>
                  <Text style={styles.avatarInitial}>
                    {member.user?.name?.charAt(0) || '?'}
                  </Text>
                </View>
              )}
              
              <View style={styles.memberDetails}>
                <Text style={[styles.memberName, { color: colors.text.main }]}>
                  {member.user?.name || 'Unknown User'}
                </Text>
                
                <View style={styles.emailContainer}>
                  <Mail size={12} color={colors.text.light} style={styles.emailIcon} />
                  <Text style={[styles.memberEmail, { color: colors.text.light }]}>
                    {member.user?.email || 'No email'}
                  </Text>
                </View>
                
                <Text style={[styles.joinDate, { color: colors.text.light }]}>
                  Requested {format(new Date(member.createdAt), 'MMM d, yyyy')}
                </Text>
              </View>
            </View>
            
            <View style={styles.actionButtons}>
              <Button
                title=""
                icon={UserX}
                onPress={() => onReject(member.userId)}
                variant="outline"
                size="small"
                style={[styles.actionButton, { borderColor: colors.error }]}
                disabled={isLoading}
              />
              <Button
                title=""
                icon={UserCheck}
                onPress={() => onApprove(member.userId)}
                variant="outline"
                size="small"
                style={[styles.actionButton, { borderColor: colors.success }]}
                disabled={isLoading}
              />
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 8,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
  },
  count: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 20,
  },
  membersList: {
    gap: 16,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: 'white',
  },
  memberDetails: {
    marginLeft: 12,
    flex: 1,
  },
  memberName: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginBottom: 4,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  emailIcon: {
    marginRight: 4,
  },
  memberEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  joinDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    padding: 0,
  },
});