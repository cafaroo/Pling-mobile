import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Stack } from 'expo-router';
import { useAuth } from '@context/AuthContext';
import { TeamList } from '@/components/team/TeamList';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TeamsScreen() {
  const { isAuthenticated } = useAuth();
  const theme = useTheme();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Team',
          headerTitleStyle: { color: theme.colors.primary },
        }}
      />
      
      {!isAuthenticated ? (
        <View style={styles.authMessageContainer}>
          <Text style={styles.authMessage}>
            Du måste vara inloggad för att visa och hantera team.
          </Text>
        </View>
      ) : (
        <TeamList />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  authMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  authMessage: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
}); 