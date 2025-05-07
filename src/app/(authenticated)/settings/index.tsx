import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { SettingsForm } from '../../../ui/user/components/SettingsForm';
import { useUser } from '../../../application/user/hooks/useUser';
import { useUpdateSettings } from '../../../application/user/hooks/useUpdateSettings';
import { LoadingSpinner } from '../../../ui/shared/components/LoadingSpinner';
import { ErrorMessage } from '../../../ui/shared/components/ErrorMessage';

export default function SettingsRoute() {
  const theme = useTheme();
  const { data: user, isLoading: userLoading, error: userError } = useUser();
  const { mutate: updateSettings, isLoading: updateLoading } = useUpdateSettings();

  if (userLoading) {
    return <LoadingSpinner />;
  }

  if (userError || !user) {
    return <ErrorMessage message={userError?.message ?? 'Kunde inte ladda inställningar'} />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Inställningar',
          headerStyle: {
            backgroundColor: theme.colors.primary
          },
          headerTintColor: theme.colors.onPrimary,
          headerShadowVisible: false
        }}
      />
      <SettingsForm
        initialValues={{
          theme: user.settings.theme,
          language: user.settings.language,
          notifications: {
            enabled: user.settings.notifications.enabled,
            frequency: user.settings.notifications.frequency,
            emailEnabled: user.settings.notifications.emailEnabled,
            pushEnabled: user.settings.notifications.pushEnabled
          },
          privacy: {
            profileVisibility: user.settings.privacy.profileVisibility,
            showOnlineStatus: user.settings.privacy.showOnlineStatus,
            showLastSeen: user.settings.privacy.showLastSeen
          }
        }}
        onSubmit={updateSettings}
        isLoading={updateLoading}
      />
    </>
  );
} 