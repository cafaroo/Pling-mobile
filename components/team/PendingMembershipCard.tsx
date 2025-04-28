import { View, Text, StyleSheet } from 'react-native';
import { Clock, Bug } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import Card from '@/components/ui/Card';
import { useRouter } from 'expo-router';
import Button from '@/components/ui/Button';

type PendingMembershipCardProps = {
  teamName: string;
  style?: object;
};

export default function PendingMembershipCard({ teamName, style }: PendingMembershipCardProps) {
  const { colors } = useTheme();
  const router = useRouter();
  
  return (
    <Card style={[styles.container, { backgroundColor: 'rgba(250, 204, 21, 0.1)' }, style]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary.light }]}>
          <Clock size={24} color={colors.accent.yellow} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text.main }]}>
            Membership Pending Approval
          </Text>
          <Text style={[styles.description, { color: colors.text.light }]}>
            Your request to join {teamName} is waiting for approval from a team leader.
            You'll have full access once approved.
          </Text>
        </View>
        <Button
          title="Debug"
          icon={Bug}
          variant="outline"
          size="small"
          onPress={() => router.push('/debug-membership')}
          style={styles.debugButton}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    marginBottom: 4,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  debugButton: {
    marginLeft: 'auto',
    marginTop: 8
  },
});