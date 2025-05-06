import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Dimensions, Modal, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import { Copy, Check, X, MessageCircle, Share2 } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { Button } from '@/components/ui/Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

interface InviteCodeModalProps {
  isVisible: boolean;
  onClose: () => void;
  inviteCode: string;
  teamId: string;
}

export function InviteCodeModal({ isVisible, onClose, inviteCode, teamId }: InviteCodeModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  
  // Funktion för att kopiera koden
  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [inviteCode]);

  // Funktion för att navigera till chatten
  const handleChatPress = useCallback(() => {
    onClose();
    setTimeout(() => {
      router.push(`/team/${teamId}/chat`);
    }, 300);
  }, [teamId, onClose, router]);

  if (!isVisible) return null;

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[
              styles.menuContainer, 
              { 
                backgroundColor: colors.background.dark,
                borderColor: colors.border.default,
                borderWidth: 1,
              }
            ]}>
              <View style={styles.menuHeader}>
                <Text style={[styles.menuTitle, { color: colors.text.main }]}>
                  Inbjudningskod genererad
                </Text>
                <Text style={[styles.menuSubtitle, { color: colors.text.light }]}>
                  Koden är giltig i 7 dagar
                </Text>
                
                <Pressable 
                  onPress={onClose} 
                  style={styles.closeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={24} color={colors.text.main} />
                </Pressable>
              </View>
              
              <View style={styles.menuDivider} />
              
              <Pressable
                onPress={handleCopy}
                style={({ pressed }) => [
                  styles.codeContainer,
                  { 
                    backgroundColor: colors.background.light,
                    borderColor: colors.accent.yellow,
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }]
                  }
                ]}
              >
                <Text style={[
                  styles.code, 
                  { color: colors.accent.yellow }
                ]}>
                  {inviteCode}
                </Text>
                <Animated.View
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(200)}
                >
                  {copied ? (
                    <Check size={24} color={colors.success} />
                  ) : (
                    <Copy size={24} color={colors.accent.yellow} />
                  )}
                </Animated.View>
              </Pressable>
              
              <Text style={[
                styles.description, 
                { color: colors.text.main }
              ]}>
                Dela denna kod med personer du vill bjuda in till teamet
              </Text>
              
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleCopy}
                >
                  <Copy size={20} color={colors.primary.light} style={{ marginRight: 12 }} />
                  <Text style={[styles.menuItemText, { color: colors.text.main }]}>
                    Kopiera kod
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleChatPress}
                >
                  <MessageCircle size={20} color={colors.primary.light} style={{ marginRight: 12 }} />
                  <Text style={[styles.menuItemText, { color: colors.text.main }]}>
                    Gå till team chat
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.menuItem, styles.cancelItem]}
                  onPress={onClose}
                >
                  <Text style={[styles.menuItemText, { color: colors.text.light }]}>
                    Stäng
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  menuContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  menuHeader: {
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 1,
  },
  menuTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  menuSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    opacity: 0.7,
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    width: '100%',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '90%',
    alignSelf: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginTop: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  code: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    letterSpacing: 2,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 24,
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.8,
    paddingHorizontal: 24,
  },
  actionsContainer: {
    width: '100%',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  cancelItem: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
});