import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, HelperText, Card } from 'react-native-paper';
import { useTeam } from '@/application/team/hooks/useTeam';
import { useAuth } from '@context/AuthContext';
import { Team } from '@/domain/team/entities/Team';
import { TeamPermission } from '@/domain/team/value-objects/TeamPermission';

interface TeamInviteProps {
  team: Team;
  onInviteSent?: () => void;
}

export const TeamInvite: React.FC<TeamInviteProps> = ({ team, onInviteSent }) => {
  const { user } = useAuth();
  const { useInviteTeamMember } = useTeam();
  const inviteMutation = useInviteTeamMember();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Kontrollera om användaren har behörighet att bjuda in
  const currentUser = user?.id;
  const userMember = team.members.find(m => m.userId.toString() === currentUser);
  const canInvite = currentUser && team.hasMemberPermission(
    userMember?.userId, 
    TeamPermission.INVITE_MEMBERS
  );
  
  const handleInvite = async () => {
    if (!user) return;
    
    // Validera email
    if (!email || !email.includes('@')) {
      setErrorMessage('Ange en giltig e-postadress');
      return;
    }
    
    setLoading(true);
    setErrorMessage(null);
    
    try {
      await inviteMutation.mutateAsync({
        teamId: team.id.toString(),
        invitedById: user.id,
        email
      });
      
      setEmail('');
      
      Alert.alert(
        'Inbjudan skickad',
        `En inbjudan har skickats till ${email}`
      );
      
      if (onInviteSent) {
        onInviteSent();
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (!canInvite) {
    return null;
  }
  
  return (
    <Card style={styles.container} testID="team-invite-form">
      <Card.Content>
        <Text style={styles.title}>Bjud in medlemmar</Text>
        
        <TextInput
          label="E-postadress"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          right={
            <TextInput.Icon 
              name="email"
              color="#6200ee" 
            />
          }
          style={styles.input}
          disabled={loading}
          testID="email-input"
        />
        
        {errorMessage && (
          <HelperText type="error" visible={!!errorMessage}>
            {errorMessage}
          </HelperText>
        )}
        
        <Button
          mode="contained"
          onPress={handleInvite}
          loading={loading}
          disabled={loading || !email}
          style={styles.button}
          testID="send-invite-button"
        >
          Skicka inbjudan
        </Button>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
  },
}); 