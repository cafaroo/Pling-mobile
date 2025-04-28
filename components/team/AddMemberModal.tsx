import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Modal, TouchableOpacity, Platform } from 'react-native';
import { X, UserPlus, Crown, Star, Shield } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import Button from '@/components/ui/Button';

type AddMemberModalProps = {
  visible: boolean;
  onClose: () => void;
  onAdd: (email: string, role: string) => Promise<void>;
};

export default function AddMemberModal({ visible, onClose, onAdd }: AddMemberModalProps) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!email || !email.includes('@')) {
      setError('Ange en giltig e-postadress');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await onAdd(email, role);
      setEmail('');
      setRole('member');
      onClose();
    } catch (error) {
      setError('Kunde inte lägga till medlemmen. Försök igen.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.background.dark }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text.main }]}>
              Lägg till teammedlem
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={colors.text.light} size={24} />
            </TouchableOpacity>
          </View>

          {error && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {error}
            </Text>
          )}

          <Text style={[styles.label, { color: colors.text.main }]}>
            E-postadress
          </Text>
          <TextInput
            style={[
              styles.input,
              { 
                borderColor: colors.neutral[500],
                color: colors.text.main,
                backgroundColor: 'rgba(0, 0, 0, 0.2)'
              }
            ]}
            value={email}
            onChangeText={setEmail}
            placeholder="medlem@epost.se"
            placeholderTextColor={colors.neutral[400]}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <Text style={[styles.label, { color: colors.text.main }]}>
            Role
          </Text>
          <View style={styles.roleSelector}>
            <TouchableOpacity
              style={[
                styles.roleOption,
                role === 'member' && { backgroundColor: colors.primary.light }
              ]}
              onPress={() => setRole('member')}
            >
              <Shield size={20} color={role === 'member' ? colors.accent.yellow : colors.text.light} />
              <Text style={[
                styles.roleText,
                { color: role === 'member' ? colors.accent.yellow : colors.text.light }
              ]}>
                Member
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.roleOption,
                role === 'leader' && { backgroundColor: colors.primary.light }
              ]}
              onPress={() => setRole('leader')}
            >
              <Crown size={20} color={role === 'leader' ? colors.accent.yellow : colors.text.light} />
              <Text style={[
                styles.roleText,
                { color: role === 'leader' ? colors.accent.yellow : colors.text.light }
              ]}>
                Leader
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Lägg till"
            icon={UserPlus}
            onPress={handleAdd}
            variant="primary"
            size="large"
            style={styles.button}
            loading={isLoading}
            disabled={!email || isLoading}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
  },
  closeButton: {
    padding: 4,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: Platform.select({ ios: 48, android: 48, default: 48 }),
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 24,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  roleText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  button: {
    width: '100%',
  },
});