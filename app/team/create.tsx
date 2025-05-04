import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useTeamMutations } from '@/hooks/useTeamMutations';
import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import TextInput from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { ToastService } from '@/components/ui/Toast';

export default function CreateTeamScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { createTeam } = useTeamMutations();

  const handleSubmit = async () => {
    if (!name.trim()) {
      ToastService.show({
        title: 'Fel',
        description: 'Du måste ange ett namn för teamet',
        type: 'error'
      });
      return;
    }

    setIsLoading(true);
    try {
      await createTeam.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined
      });

      ToastService.show({
        title: 'Team skapat!',
        description: 'Ditt nya team har skapats',
        type: 'success'
      });

      router.back();
    } catch (error) {
      console.error('Fel vid skapande av team:', error);
      ToastService.show({
        title: 'Kunde inte skapa team',
        description: 'Ett fel uppstod. Försök igen senare.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <Header 
        title="Skapa nytt team"
        showBackButton
        onBackPress={() => router.back()}
      />

      <View style={styles.content}>
        <TextInput
          label="Teamnamn"
          value={name}
          onChangeText={setName}
          placeholder="Ange teamets namn"
          autoFocus
          style={styles.input}
        />

        <TextInput
          label="Beskrivning (valfritt)"
          value={description}
          onChangeText={setDescription}
          placeholder="Beskriv teamets syfte"
          multiline
          numberOfLines={3}
          style={styles.input}
        />

        <Button
          title="Skapa team"
          onPress={handleSubmit}
          loading={isLoading}
          disabled={isLoading || !name.trim()}
          variant="primary"
          size="large"
          style={styles.button}
        />
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 24,
  },
}); 