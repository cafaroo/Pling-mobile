import { View, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { useUser } from '@/context/UserContext';
import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import GoalForm from '@/components/goals/GoalForm';

export default function CreateTeamGoalScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useUser();

  // Check if user is team leader or owner
  const isTeamLeader = user?.team?.members?.some(
    m => m.userId === user.id && (m.role === 'leader' || m.role === 'owner')
  );

  if (!isTeamLeader) {
    router.replace('/team/goals');
    return null;
  }

  return (
    <Container>
      <LinearGradient
        colors={[colors.background.dark, colors.primary.dark]}
        style={styles.background}
      />
      <Header 
        title="Create Team Goal" 
        icon={Target}
        leftIcon={ArrowLeft}
        onLeftIconPress={() => router.back()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <GoalForm
          isTeamGoal
          teamId={user?.team?.id}
          onSuccess={(goalId) => router.replace(`/team/goals/${goalId}`)}
        />
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
});