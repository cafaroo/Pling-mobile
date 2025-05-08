import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, Text, Card, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PlingScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header
        style={{ backgroundColor: theme.colors.surface }}
        statusBarHeight={0} // Assuming status bar is handled by SafeAreaView or a global component
      >
        <Appbar.Content title="Pling" titleStyle={{ color: theme.colors.primary }} />
      </Appbar.Header>
      <View style={styles.content}>
        <Card style={[styles.card, { backgroundColor: theme.colors.elevation?.level2 || theme.colors.surfaceVariant }]}>
          <Card.Title title="Välkommen till Pling!" titleStyle={{ color: theme.colors.onSurface }} />
          <Card.Content>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Detta är din huvudsida i Pling-appen. Här kommer du snart att se aviseringar och viktig information.
            </Text>
          </Card.Content>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  card: {
    marginHorizontal: 8, // Ensure card does not touch screen edges
    paddingVertical: 8, // Add some vertical padding inside the card
  },
});