import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { ProfileScreen } from '../../../ui/user/screens/ProfileScreen';
import { useUser } from '../../../application/user/hooks/useUser';
import { LoadingSpinner } from '../../../ui/shared/components/LoadingSpinner';
import { ErrorMessage } from '../../../ui/shared/components/ErrorMessage';

export default function ProfileRoute() {
  const theme = useTheme();
  const { data: user, isLoading, error } = useUser();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !user) {
    return <ErrorMessage message={error?.message ?? 'Kunde inte ladda profil'} />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Min profil',
          headerStyle: {
            backgroundColor: theme.colors.primary
          },
          headerTintColor: theme.colors.onPrimary,
          headerShadowVisible: false
        }}
      />
      <ProfileScreen
        initialValues={{
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          displayName: user.profile.displayName ?? '',
          bio: user.profile.bio ?? '',
          location: user.profile.location ?? '',
          avatarUrl: user.profile.avatarUrl ?? '',
          contact: {
            email: user.profile.contact.email ?? '',
            phone: user.profile.contact.phone ?? '',
            website: user.profile.contact.website ?? ''
          }
        }}
      />
    </>
  );
} 