import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import GoalApiTester from '@/components/debug/GoalApiTester';
import { defaultTheme } from '@/constants/ThemeContext';

const COLORS = defaultTheme.colors;

/**
 * Debug-sida för utvecklingsändamål
 * Innehåller testverktyg och utvecklingshjälpmedel
 */
export default function DebugScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Debug-verktyg',
          headerStyle: {
            backgroundColor: COLORS.background.dark,
          },
          headerTintColor: '#fff',
        }}
      />
      
      <LinearGradient
        colors={[COLORS.background.dark, COLORS.primary.dark]}
        style={styles.background}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API-tester</Text>
          <Text style={styles.sectionDescription}>
            Verktyg för att testa att API-anropen fungerar korrekt mot Supabase
          </Text>
          
          <GoalApiTester />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
  },
}); 