import { View, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import GoalForm from '@/components/goals/GoalForm';

export default function CreateGoalScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <Container>
      <LinearGradient
        colors={[colors.background.dark, colors.primary.dark]}
        style={styles.background}
      />
      <Header 
        title="Create Goal" 
        icon={Target}
        leftIcon={ArrowLeft}
        onLeftIconPress={() => router.back()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <GoalForm
          onSuccess={(goalId) => router.replace(`/goals/${goalId}`)}
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