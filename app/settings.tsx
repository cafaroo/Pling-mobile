import { Stack } from 'expo-router';
import { SettingsScreen } from '@/screens/SettingsScreen';

export default function Settings() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Inställningar',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#0F0E2A', // Background Dark från designreglerna
          },
          headerTintColor: '#FFFFFF', // Text Main från designreglerna
          headerTitleStyle: {
            fontFamily: 'Inter-Bold',
          },
        }}
      />
      <SettingsScreen />
    </>
  );
} 