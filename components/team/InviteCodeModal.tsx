import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Copy, RefreshCw } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

interface InviteCodeModalProps {
  isVisible: boolean;
  onClose: () => void;
  inviteCode: string;
  onGenerateNewCode: () => void;
  isLoading?: boolean;
}

export const InviteCodeModal = ({
  isVisible,
  onClose,
  inviteCode,
  onGenerateNewCode,
  isLoading = false,
}: InviteCodeModalProps) => {
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      visible={isVisible}
      onClose={onClose}
      title="Inbjudningskod"
    >
      <View style={styles.container}>
        <Text style={[styles.description, { color: colors.text.light }]}>
          Dela denna kod med personer du vill bjuda in till teamet
        </Text>
        
        <View style={styles.codeContainer}>
          <Input
            value={inviteCode}
            editable={false}
            style={[styles.codeInput, { backgroundColor: colors.background.light }]}
          />
          <TouchableOpacity
            onPress={handleCopy}
            style={[styles.copyButton, { backgroundColor: colors.primary.main }]}
          >
            <Copy size={20} color={colors.text.inverse} />
          </TouchableOpacity>
        </View>

        {copied && (
          <Text style={[styles.copiedText, { color: colors.success }]}>
            Kopierad till urklipp!
          </Text>
        )}

        <View style={styles.divider} />

        <View style={styles.footer}>
          <Text style={[styles.warning, { color: colors.text.light }]}>
            Varning: Om du genererar en ny kod kommer den gamla att bli ogiltig
          </Text>
          <Button
            Icon={RefreshCw}
            variant="outline"
            onPress={onGenerateNewCode}
            loading={isLoading}
            style={styles.generateButton}
          >
            Generera ny kod
          </Button>
        </View>
      </View>
    </Modal>
  );
};

// Lägg även till en default export för bakåtkompatibilitet
export default InviteCodeModal;

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 16,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  codeInput: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    textAlign: 'center',
  },
  copyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copiedText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginVertical: 20,
  },
  footer: {
    gap: 12,
  },
  warning: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  generateButton: {
    marginTop: 8,
  },
});