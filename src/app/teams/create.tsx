import React from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TeamCreate } from '@/components/team/TeamCreate';
import { useAuth } from '@context/AuthContext';

export default function CreateTeamScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const handleCreateSuccess = (teamId: string) => {
    router.replace(`/teams/${teamId}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Skapa team',
          headerTitleStyle: { color: theme.colors.primary },
        }}
      />
      
      <TeamCreate onCreateSuccess={handleCreateSuccess} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
}); 