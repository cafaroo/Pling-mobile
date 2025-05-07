import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Text, useTheme } from 'react-native-paper';
import { useUser } from '../../application/user/hooks/useUser';
import { LoadingSpinner } from '../../ui/shared/components/LoadingSpinner';
import { ErrorMessage } from '../../ui/shared/components/ErrorMessage';

export default function HomeScreen() {
  const theme = useTheme();
  const { data: user, isLoading, error } = useUser();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !user) {
    return <ErrorMessage message={error?.message ?? 'Kunde inte ladda användardata'} />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Hem',
          headerStyle: {
            backgroundColor: theme.colors.primary
          },
          headerTintColor: theme.colors.onPrimary,
          headerShadowVisible: false
        }}
      />
      <View style={styles.container}>
        <Text variant="headlineMedium" style={styles.welcome}>
          Välkommen {user.profile.firstName}!
        </Text>
        <Text variant="bodyLarge" style={styles.info}>
          Här kommer din aktivitetsöversikt att visas snart.
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  welcome: {
    marginBottom: 16,
    textAlign: 'center'
  },
  info: {
    textAlign: 'center',
    opacity: 0.7
  }
}); 