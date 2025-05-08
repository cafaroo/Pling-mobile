import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { TextInput, Button, HelperText, Card, Title, Text } from 'react-native-paper';
import { useTeam } from '@/application/team/hooks/useTeam';
import { useAuth } from '@/application/auth/hooks/useAuth';
import { useRouter } from 'expo-router';

interface TeamCreateProps {
  onCreateSuccess?: (teamId: string) => void;
}

export const TeamCreate: React.FC<TeamCreateProps> = ({ onCreateSuccess }) => {
  const { user } = useAuth();
  const { useCreateTeam } = useTeam();
  const createTeam = useCreateTeam();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Teamnamn är obligatoriskt';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Teamnamn måste vara minst 2 tecken';
    }
    
    if (description.trim().length > 300) {
      newErrors.description = 'Beskrivningen kan vara max 300 tecken';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleCreate = async () => {
    if (!user) return;
    
    if (!validate()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const teamId = await createTeam.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        ownerId: user.id
      });
      
      setName('');
      setDescription('');
      
      Alert.alert(
        'Team skapat',
        'Ditt team har skapats framgångsrikt!',
        [
          { 
            text: 'OK', 
            onPress: () => {
              if (onCreateSuccess) {
                onCreateSuccess(teamId);
              } else {
                router.push(`/teams/${teamId}`);
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Fel', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (!user) {
    return (
      <Card style={styles.container}>
        <Card.Content>
          <Text>Du måste vara inloggad för att skapa ett team.</Text>
        </Card.Content>
      </Card>
    );
  }
  
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} testID="create-team-form">
      <Card style={styles.container}>
        <Card.Content>
          <Title style={styles.title}>Skapa nytt team</Title>
          
          <TextInput
            label="Teamnamn *"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            error={!!errors.name}
            disabled={loading}
            placeholder="Ange teamets namn"
            testID="team-name-input"
          />
          
          {errors.name && (
            <HelperText type="error" visible={!!errors.name}>
              {errors.name}
            </HelperText>
          )}
          
          <TextInput
            label="Beskrivning (valfri)"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
            error={!!errors.description}
            disabled={loading}
            placeholder="Beskriv teamets syfte"
            testID="team-description-input"
          />
          
          {errors.description && (
            <HelperText type="error" visible={!!errors.description}>
              {errors.description}
            </HelperText>
          )}
          
          <Text style={styles.helperText}>
            När du skapar ett team blir du automatiskt ägare. Du kan bjuda in 
            medlemmar efter att teamet skapats.
          </Text>
          
          <Button
            mode="contained"
            onPress={handleCreate}
            loading={loading}
            disabled={loading || !name.trim()}
            style={styles.button}
            testID="create-team-button"
          >
            Skapa team
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  container: {
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 16,
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
}); 