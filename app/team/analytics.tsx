import React from 'react';
import { TeamAnalytics } from '@/components/team/TeamAnalytics';
import { TeamProvider } from '@/context/TeamContext';
import { Stack } from 'expo-router';

export default function AnalyticsScreen() {
  return (
    <TeamProvider>
      <Stack.Screen 
        options={{
          title: 'Team Analytics',
          headerShown: true,
        }} 
      />
      <TeamAnalytics />
    </TeamProvider>
  );
} 