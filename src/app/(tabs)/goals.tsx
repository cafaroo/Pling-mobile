import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Appbar, Text, Card, useTheme, Chip, ProgressBar, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Target } from 'lucide-react-native'; // Assuming lucide-react-native is installed

const mockGoals = [
  { id: '1', title: 'Avsluta 10 säljsamtal', progress: 0.7, category: 'Veckomål', status: 'Pågående' },
  { id: '2', title: 'Boka 5 nya kundmöten', progress: 0.3, category: 'Veckomål', status: 'Pågående' },
  { id: '3', title: 'Nå 50 000 kr i försäljning', progress: 0.9, category: 'Månadsmål', status: 'Nästan där' },
  { id: '4', title: 'Delta i produktträning', progress: 1, category: 'Utveckling', status: 'Slutfört' },
  { id: '5', title: 'Uppdatera CRM med alla leads', progress: 0.1, category: 'Administration', status: 'Startat' },
];

export default function GoalsScreen() {
  const theme = useTheme();

  const renderGoalItem = ({ item }: { item: typeof mockGoals[0] }) => (
    <Card style={[styles.card, { backgroundColor: theme.colors.elevation?.level1 || theme.colors.surfaceContainerLow }]}>
      <Card.Title 
        title={item.title} 
        titleStyle={{ color: theme.colors.onSurface, fontWeight: 'bold' }}
        subtitle={item.category}
        subtitleStyle={{ color: theme.colors.onSurfaceVariant }}
        left={(props) => <Target {...props} color={theme.colors.primary} />}
      />
      <Card.Content>
        <View style={styles.goalDetails}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Status: </Text>
          <Chip 
            icon={item.progress === 1 ? 'check-circle' : 'progress-clock'} 
            style={{ backgroundColor: item.progress === 1 ? theme.colors.tertiaryContainer : theme.colors.secondaryContainer }}
            textStyle={{ color: item.progress === 1 ? theme.colors.onTertiaryContainer : theme.colors.onSecondaryContainer }}
          >
            {item.status}
          </Chip>
        </View>
        <ProgressBar progress={item.progress} color={theme.colors.primary} style={styles.progressBar} />
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'right' }}>{(item.progress * 100).toFixed(0)}%</Text>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header 
        style={{ backgroundColor: theme.colors.surface }} 
        statusBarHeight={0}
      >
        <Appbar.Content title="Mål" titleStyle={{ color: theme.colors.primary }}/>
        <Appbar.Action icon="filter-variant" onPress={() => console.log('Filter goals')} color={theme.colors.primary} />
      </Appbar.Header>
      <FlatList
        data={mockGoals}
        renderItem={renderGoalItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primaryContainer }]}
        color={theme.colors.onPrimaryContainer}
        onPress={() => console.log('Add new goal')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  goalDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
}); 