import React from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { TeamGoal } from '@/domain/team/entities/TeamGoal';
import { TeamGoalCard } from './TeamGoalCard';
import { useTeamGoals, UseTeamGoalsOptions } from '@/application/team/hooks/useTeamGoals';
import { Text } from '@/components/Text';
import { ErrorMessage } from '@/components/ErrorMessage';
import { useTheme } from '@/hooks/useTheme';

interface TeamGoalListProps extends UseTeamGoalsOptions {
  onGoalPress?: (goal: TeamGoal) => void;
}

export function TeamGoalList({ onGoalPress, ...options }: TeamGoalListProps) {
  const { goals, isLoading, error } = useTeamGoals(options);
  const theme = useTheme();

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <ErrorMessage message="Det gick inte att hämta målen. Försök igen senare." />
      </View>
    );
  }

  if (!goals?.length) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Inga mål hittades</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={goals}
      keyExtractor={goal => goal.id.toString()}
      renderItem={({ item: goal }) => (
        <TeamGoalCard
          goal={goal}
          onPress={() => onGoalPress?.(goal)}
          style={styles.card}
        />
      )}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
}); 