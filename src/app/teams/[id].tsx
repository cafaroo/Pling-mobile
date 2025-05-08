import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView, StyleSheet } from 'react-native';
import { TeamDashboard } from '@/components/team/TeamDashboard';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function TeamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  if (!id) {
    return <ErrorBoundary error={new Error('Inget team-ID tillhandahölls')} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ErrorBoundary>
        <TeamDashboard teamId={id} />
      </ErrorBoundary>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
}); 