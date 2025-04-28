import { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { X, Copy, Share as ShareIcon } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

type InviteCodeModalProps = {
  visible: boolean;
  onClose: () => void;
  code: string | null;
  expiresAt: string | null;
  isLoading: boolean;
  onGenerateCode: () => void;
};

export default function InviteCodeModal({
  visible,
  onClose,
  code,
  expiresAt,
  isLoading,
  onGenerateCode,
}: InviteCodeModalProps) {
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    if (code) {
      try {
        if (Platform.OS === 'web') {
          await navigator.clipboard.writeText(code);
        }
        // For native platforms, implement clipboard functionality
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Error copying code:', error);
      }
    }
  };

  const handleShareCode = async () => {
    if (!code) return;

    try {
      // Check if running in web and if Web Share API is available and allowed
      if (Platform.OS === 'web' && navigator.share && window.isSecureContext) {
        await navigator.share({
          title: 'Team Invite Code',
          text: `Join my team on Pling! Use invite code: ${code}`,
        });
      } else {
        // Fallback to copy if sharing is not available
        await handleCopyCode();
      }
    } catch (error) {
      // If sharing fails, fallback to copy
      if (error instanceof Error && error.name !== 'AbortError') {
        await handleCopyCode();
      }
    }
  };

  const formatExpiryTime = (dateString: string) => {
    if (!dateString) return '';
    
    const expiryDate = new Date(dateString);
    const now = new Date();
    
    // Calculate hours remaining
    const hoursRemaining = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (hoursRemaining < 1) {
      return 'Expires in less than an hour';
    } else if (hoursRemaining === 1) {
      return 'Expires in 1 hour';
    } else if (hoursRemaining < 24) {
      return `Expires in ${hoursRemaining} hours`;
    } else {
      const days = Math.floor(hoursRemaining / 24);
      return `Expires in ${days} ${days === 1 ? 'day' : 'days'}`;
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
        <Card style={styles.container}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text.main }]}>
              Team Invite Code
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={colors.text.light} size={24} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent.yellow} />
              <Text style={[styles.loadingText, { color: colors.text.light }]}>
                Generating invite code...
              </Text>
            </View>
          ) : code ? (
            <View style={styles.codeContainer}>
              <Text style={[styles.codeLabel, { color: colors.text.light }]}>
                Share this code with your team members:
              </Text>
              
              <View style={[styles.codeBox, { backgroundColor: 'rgba(0, 0, 0, 0.2)', borderColor: colors.accent.yellow }]}>
                <Text style={[styles.codeText, { color: colors.accent.yellow }]}>
                  {code}
                </Text>
              </View>
              
              {expiresAt && (
                <Text style={[styles.expiryText, { color: colors.text.light }]}>
                  {formatExpiryTime(expiresAt)}
                </Text>
              )}
              
              <View style={styles.actionButtons}>
                <Button
                  title={copied ? "Copied!" : "Copy Code"}
                  icon={Copy}
                  onPress={handleCopyCode}
                  variant="outline"
                  size="medium"
                  style={styles.actionButton}
                />
                
                <Button
                  title="Share"
                  icon={ShareIcon}
                  onPress={handleShareCode}
                  variant="primary"
                  size="medium"
                  style={styles.actionButton}
                />
              </View>
              
              <Text style={[styles.noteText, { color: colors.text.light }]}>
                This code can only be used once and will expire in 24 hours.
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text.light }]}>
                Generate a new invite code to share with your team members.
              </Text>
              
              <Button
                title="Generate Code"
                onPress={onGenerateCode}
                variant="primary"
                size="large"
                style={styles.generateButton}
              />
            </View>
          )}
        </Card>
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
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginTop: 16,
  },
  codeContainer: {
    alignItems: 'center',
  },
  codeLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  codeBox: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  codeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    letterSpacing: 4,
  },
  expiryText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
  },
  noteText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  generateButton: {
    minWidth: 200,
  },
});