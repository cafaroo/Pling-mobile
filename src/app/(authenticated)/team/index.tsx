import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Text, useTheme } from 'react-native-paper';

export default function TeamScreen() {
  const theme = useTheme();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Team',
          headerStyle: {
            backgroundColor: theme.colors.primary
          },
          headerTintColor: theme.colors.onPrimary,
          headerShadowVisible: false
        }}
      />
      <View style={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>
          Teamhantering
        </Text>
        <Text variant="bodyLarge" style={styles.info}>
          Här kommer du kunna hantera dina team och se teammedlemmar.
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
  title: {
    marginBottom: 16,
    textAlign: 'center'
  },
  info: {
    textAlign: 'center',
    opacity: 0.7
  }
}); 