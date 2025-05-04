import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import Header from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { ToastService } from '@/components/ui/Toast';
import teamService from '@/services/teamService';
import { Card } from '@/components/ui/Card';
import { useQueryClient } from '@tanstack/react-query';

export default function JoinTeamScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleJoinTeam = async () => {
    console.log('handleJoinTeam called with code:', inviteCode);
    
    if (!inviteCode.trim()) {
      console.log('No invite code provided');
      ToastService.show({
        title: 'Inbjudningskod krävs',
        type: 'error'
      });
      return;
    }

    setIsLoading(true);
    console.log('Attempting to join team with code:', inviteCode.trim());
    
    try {
      console.log('Calling teamService.joinTeamWithCode');
      const result = await teamService.joinTeamWithCode(inviteCode.trim());
      console.log('Join team result:', result);
      
      if (!result.success) {
        console.log('Join team failed:', result.message);
        ToastService.show({
          title: result.message || 'Kunde inte gå med i team',
          type: 'error'
        });
        return;
      }

      // Invalidera alla team-relaterade queries
      await queryClient.invalidateQueries({ queryKey: ['teams'] });
      if (result.team_id) {
        await queryClient.invalidateQueries({ queryKey: ['team', result.team_id] });
        await queryClient.invalidateQueries({ queryKey: ['team-members', result.team_id] });
      }

      console.log('Successfully joined team:', result.team_name);
      ToastService.show({
        title: `Gick med i ${result.team_name || 'teamet'}!`,
        type: 'success'
      });
      
      router.replace('/team');
    } catch (error) {
      console.error('Error joining team:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      ToastService.show({
        title: 'Kunde inte gå med i team',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.dark }]}>
      <Header
        title="Gå med i team"
        leftIcon={ArrowLeft}
        onLeftPress={() => router.back()}
      />
      <View style={[styles.content, { backgroundColor: colors.background.main }]}>
        <Card style={[styles.card, { backgroundColor: colors.background.light }]}>
          <Text style={[styles.description, { color: colors.text.main }]}>
            Har du fått en inbjudningskod? Ange den nedan för att gå med i teamet.
            Koden består av 6 tecken och är inte skiftlägeskänslig.
          </Text>
          
          <Input
            label="Inbjudningskod"
            value={inviteCode}
            onChangeText={(text) => {
              console.log('Input changed:', text);
              setInviteCode(text.toUpperCase());
            }}
            placeholder="T.ex. ABC123"
            style={styles.input}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            placeholderTextColor={colors.text.light}
          />

          <View style={styles.buttonContainer}>
            <Button
              onPress={() => router.back()}
              variant="secondary"
              style={styles.button}
            >
              Avbryt
            </Button>
            <Button
              onPress={() => {
                console.log('Join team button pressed');
                handleJoinTeam();
              }}
              loading={isLoading}
              disabled={isLoading || !inviteCode.trim()}
              variant="primary"
              style={styles.button}
            >
              Gå med i team
            </Button>
          </View>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    flex: 1,
    padding: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24
  },
  card: {
    padding: 20,
    marginTop: 16,
    borderRadius: 16
  },
  description: {
    marginBottom: 24,
    lineHeight: 22
  },
  input: {
    marginBottom: 24
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  button: {
    flex: 1
  }
}); 