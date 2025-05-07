import React from 'react';
import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Appbar } from 'react-native-paper';
import { CreateUserForm } from '../components/CreateUserForm';
import { Screen } from '@/ui/components/Screen';

export const CreateUserScreen: React.FC = () => {
  const router = useRouter();

  const handleSuccess = () => {
    router.back();
  };

  return (
    <Screen>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Skapa ny användare" />
      </Appbar.Header>
      
      <ScrollView>
        <CreateUserForm onSuccess={handleSuccess} />
      </ScrollView>
    </Screen>
  );
}; 