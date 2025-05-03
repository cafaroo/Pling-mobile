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

export default function JoinTeamScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinTeam = async () => {
    if (!inviteCode.trim()) {
      ToastService.show({
        title: 'Inbjudningskod krävs',
        type: 'error'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: invite, error: inviteError } = await supabase
        .from('team_invites')
        .select('*, team:teams(*)')
        .eq('code', inviteCode.trim())
        .single();

      if (inviteError) throw inviteError;

      if (!invite) {
        ToastService.show({
          title: 'Ogiltig inbjudningskod',
          type: 'error'
        });
        return;
      }

      const { error: joinError } = await supabase
        .from('team_members')
        .insert({
          team_id: invite.team.id,
          role: 'member'
        });

      if (joinError) throw joinError;

      ToastService.show({
        title: `Gick med i ${invite.team.name}!`,
        type: 'success'
      });
      
      router.replace('/team');
    } catch (error) {
      console.error('Error joining team:', error);
      ToastService.show({
        title: 'Kunde inte gå med i team',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Gå med i team"
        leftIcon={ArrowLeft}
        onLeftPress={() => router.back()}
      />
      <View style={styles.content}>
        <Input
          label="Inbjudningskod"
          value={inviteCode}
          onChangeText={setInviteCode}
          placeholder="Ange inbjudningskod"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Button
          onPress={handleJoinTeam}
          loading={isLoading}
          disabled={isLoading}
        >
          Gå med i team
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