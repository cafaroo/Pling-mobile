import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { ToastService } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';

export default function CreateTeamScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateTeam = async () => {
    if (!name.trim()) {
      ToastService.show({
        title: 'Teamnamn krävs',
        type: 'error'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: team, error: createTeamError } = await supabase
        .from('teams')
        .insert({
          name: name.trim(),
          description: description.trim() || null
        })
        .select()
        .single();

      if (createTeamError) throw createTeamError;

      if (!team?.id) throw new Error('Kunde inte skapa team');

      const { error: createMemberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          role: 'owner'
        });

      if (createMemberError) throw createMemberError;

      ToastService.show({
        title: 'Team skapat!',
        type: 'success'
      });
      
      router.replace('/team');
    } catch (error) {
      console.error('Error creating team:', error);
      ToastService.show({
        title: 'Kunde inte skapa team',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Skapa nytt team"
        leftIcon={ArrowLeft}
        onLeftPress={() => router.back()}
      />
      <View style={styles.content}>
        <Input
          label="Teamnamn"
          value={name}
          onChangeText={setName}
          placeholder="Ange teamets namn"
          style={styles.input}
        />
        <Input
          label="Beskrivning (valfritt)"
          value={description}
          onChangeText={setDescription}
          placeholder="Beskriv teamets syfte"
          multiline
          numberOfLines={4}
          style={styles.input}
        />
        <Button
          onPress={handleCreateTeam}
          loading={isLoading}
          disabled={isLoading}
        >
          Skapa team
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  content: {
    flex: 1,
    padding: 20
  },
  input: {
    marginBottom: 16
  }
}); 