import { Stack } from 'expo-router';
import { ProfileScreen } from '@/ui/user/screens/ProfileScreen';

export default function Profile() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Min Profil',
          headerShown: true,
        }}
      />
      <ProfileScreen />
    </>
  );
} 