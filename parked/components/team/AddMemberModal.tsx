import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Mail, User, Plus } from 'lucide-react-native';

interface AddMemberModalProps {
  isVisible: boolean;
  onClose: () => void;
  onInviteByEmail: (email: string) => Promise<void>;
  isLoading?: boolean;
}

export const AddMemberModal = ({
  isVisible,
  onClose,
  onInviteByEmail,
  isLoading = false,
}: AddMemberModalProps) => {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  const handleInvite = async () => {
    if (!email.trim()) {
      setError('Vänligen ange en e-postadress');
      return;
    }

    if (!validateEmail(email)) {
      setError('Vänligen ange en giltig e-postadress');
      return;
    }

    setError(null);
    try {
      await onInviteByEmail(email);
      setEmail('');
      onClose();
    } catch (err) {
      setError('Kunde inte skicka inbjudan. Försök igen.');
    }
  };

  return (
    <Modal
      visible={isVisible}
      onClose={onClose}
      title="Lägg till medlem"
    >
      <View style={styles.container}>
        <Text style={[styles.description, { color: colors.text.light }]}>
          Bjud in en ny medlem genom att ange deras e-postadress. De kommer få 
          ett mail med en inbjudan att gå med i teamet.
        </Text>

        <View style={[styles.inputContainer, { borderColor: error ? colors.error : colors.border.main }]}>
          <Mail size={20} color={colors.text.light} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text.main }]}
            placeholder="E-postadress"
            placeholderTextColor={colors.text.light}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError(null);
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCompleteType="email"
          />
        </View>

        {error && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        )}

        <Button
          variant="primary"
          onPress={handleInvite}
          loading={isLoading}
          style={styles.inviteButton}
          Icon={Plus}
        >
          Skicka inbjudan
        </Button>
      </View>
    </Modal>
  );
};

// Export som default för bakåtkompatibilitet
export default AddMemberModal;

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  description: {
    fontSize: 14,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
  },
  inviteButton: {
    marginTop: 16,
  },
});