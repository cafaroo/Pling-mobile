import React from 'react';
import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Appbar } from 'react-native-paper';
import { UserSettingsForm } from '../components/UserSettingsForm';
import { Screen } from '@/ui/components/Screen';
import { useUser } from '@/application/user/hooks/useUser';
import { LoadingSpinner } from '@/ui/shared/components/LoadingSpinner';
import { ErrorMessage } from '@/ui/shared/components/ErrorMessage';

export const SettingsScreen: React.FC = () => {
  const router = useRouter();
  const { data: user, isLoading, error } = useUser();

  const handleSuccess = () => {
    // Visa feedback till användaren
  };

  if (isLoading) {
    return (
      <Screen>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Inställningar" />
        </Appbar.Header>
        <LoadingSpinner />
      </Screen>
    );
  }

  if (error || !user) {
    return (
      <Screen>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Inställningar" />
        </Appbar.Header>
        <ErrorMessage message="Kunde inte ladda användarinställningar" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Inställningar" />
      </Appbar.Header>
      
      <ScrollView>
        <UserSettingsForm
          userId={user.id.toString()}
          initialSettings={user.settings}
          onSuccess={handleSuccess}
        />
      </ScrollView>
    </Screen>
  );
}; 