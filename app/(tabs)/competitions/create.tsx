import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import CompetitionForm from '@/components/competition/CompetitionForm';

export default function CreateCompetitionScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <Container>
      <LinearGradient
        colors={[colors.background.dark, colors.primary.dark]}
        style={styles.background}
      />
      <Header
        title="Create Competition"
        icon={Trophy}
        onBackPress={() => router.back()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        <CompetitionForm
          onSuccess={(id) => router.replace(`/competitions/${id}`)}
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
  }
});