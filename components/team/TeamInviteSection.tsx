import React, { useState } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { Button } from '@components/ui/Button';
import TextInput from '@components/ui/TextInput';
import { UserPlus, Copy, Check } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

// Definiera Team-typen lokalt
interface Team {
  id: string;
  name: string;
  is_private: boolean;
  owner_id: string;
  created_at: string;
  description?: string;
  team_members?: Array<any>;
}

interface TeamInviteSectionProps {
  selectedTeam: Team | null;
  isLeader: boolean;
  inviteCode: string | null;
  inviteError: string | null;
  onJoinTeam: (code: string) => void;
  onGenerateInviteCode: () => void;
  inviteCodeData: {
    code: string;
    expiresAt: string;
  } | null;
  style?: ViewStyle;
}

export function TeamInviteSection({
  selectedTeam,
  isLeader,
  inviteCode,
  inviteError,
  onJoinTeam,
  onGenerateInviteCode,
  inviteCodeData,
  style,
}: TeamInviteSectionProps) {
  const { colors } = useTheme();
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleJoinTeam = () => {
    if (!joinCode.trim()) {
      setError('Ange en inbjudningskod');
      return;
    }
    onJoinTeam(joinCode.trim());
  };

  const handleCopyCode = async () => {
    if (inviteCodeData?.code) {
      await Clipboard.setStringAsync(inviteCodeData.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!selectedTeam) {
    return (
      <View style={[styles.container, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }, style]}>
        <Text style={[styles.title, { color: colors.text.main }]}>
          Gå med i ett team
        </Text>
        
        <View style={styles.joinForm}>
          <TextInput
            label="Inbjudningskod"
            value={joinCode}
            onChangeText={(text: string) => {
              setJoinCode(text);
              setError('');
            }}
            placeholder="Ange inbjudningskod"
            error={error || inviteError}
          />
          
          <Button
            title="Gå med"
            onPress={handleJoinTeam}
            variant="primary"
            size="large"
            style={styles.button}
          />
        </View>
      </View>
    );
  }

  if (!isLeader) return null;

  return (
    <View style={[styles.container, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }, style]}>
      <Text style={[styles.title, { color: colors.text.main }]}>
        Bjud in medlemmar
      </Text>

      {inviteCodeData ? (
        <View style={styles.codeContainer}>
          <Text style={[styles.code, { color: colors.text.main }]}>
            {inviteCodeData.code}
          </Text>
          
          <Button
            title={copied ? 'Kopierad!' : 'Kopiera kod'}
            Icon={copied ? Check : Copy}
            onPress={handleCopyCode}
            variant="outline"
            size="medium"
            style={styles.button}
          />
          
          <Text style={[styles.expiry, { color: colors.text.light }]}>
            Koden är giltig i 24 timmar
          </Text>
        </View>
      ) : (
        <Button
          title="Generera inbjudningskod"
          Icon={UserPlus}
          onPress={onGenerateInviteCode}
          variant="primary"
          size="large"
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  joinForm: {
    gap: 16,
  },
  codeContainer: {
    gap: 16,
    alignItems: 'center',
  },
  code: {
    fontSize: 24,
    fontFamily: 'Inter-Medium',
    letterSpacing: 1,
  },
  expiry: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  button: {
    minWidth: 200,
  },
}); 
