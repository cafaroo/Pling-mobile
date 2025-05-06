import { View, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useActiveTeam } from '@/hooks/useTeam';
import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import { GoalForm } from '@/components/goals/GoalForm';
import { Goal } from '@/types/goal';

export default function CreateTeamGoalScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { activeTeam } = useActiveTeam();

  const handleSuccess = (goal: Goal) => {
    router.replace(`/team/goals/${goal.id}`);
  };

  return (
    <Container>
      <LinearGradient
        colors={[colors.background.dark, colors.primary.dark]}
        style={styles.background}
      />
      <Header 
        title="Skapa teammål" 
        icon={Target}
        leftIcon={ArrowLeft}
        onLeftIconPress={() => router.back()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <GoalForm
          teamId={activeTeam?.id}
          defaultScope="team"
          onSuccess={handleSuccess}
          onCancel={() => router.back()}
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
    padding: 16,
    paddingBottom: 100,
  },
});