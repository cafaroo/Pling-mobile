import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';
import { Screen } from '@/ui/components/Screen';
import { UserSettingsForm } from '../../components/UserSettingsForm';
import { LoadingSpinner } from '@/ui/shared/components/LoadingSpinner';
import { ErrorMessage } from '@/ui/shared/components/ErrorMessage';

// Definiera SettingsFormData type baserat på vad UserSettingsForm förväntar sig
export type SettingsFormData = {
  theme: 'light' | 'dark' | 'system';
  language: 'sv' | 'en' | 'no' | 'dk';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    frequency: 'immediately' | 'daily' | 'weekly';
  };
  privacy: {
    profileVisibility: 'public' | 'team' | 'private';
    showEmail: boolean;
    showPhone: boolean;
  };
};

export interface SettingsScreenPresentationProps {
  // Data
  userId?: string;
  settings?: SettingsFormData;
  
  // Tillstånd
  isLoading: boolean;
  isUpdating: boolean;
  error?: Error;
  
  // Callbacks
  onSaveSettings: (settings: SettingsFormData) => void;
  onSettingsSuccess: () => void;
  onBack: () => void;
}

export const SettingsScreenPresentation: React.FC<SettingsScreenPresentationProps> = ({
  userId,
  settings,
  isLoading,
  isUpdating,
  error,
  onSaveSettings,
  onSettingsSuccess,
  onBack,
}) => {
  if (isLoading) {
    return (
      <Screen>
        <Appbar.Header>
          <Appbar.BackAction onPress={onBack} />
          <Appbar.Content title="Inställningar" />
        </Appbar.Header>
        <LoadingSpinner />
      </Screen>
    );
  }

  if (error || !userId || !settings) {
    return (
      <Screen>
        <Appbar.Header>
          <Appbar.BackAction onPress={onBack} />
          <Appbar.Content title="Inställningar" />
        </Appbar.Header>
        <ErrorMessage message="Kunde inte ladda användarinställningar" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Appbar.Header>
        <Appbar.BackAction onPress={onBack} />
        <Appbar.Content title="Inställningar" />
      </Appbar.Header>
      
      <ScrollView style={styles.container}>
        <UserSettingsForm
          userId={userId}
          initialSettings={settings}
          onSuccess={onSettingsSuccess}
        />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 