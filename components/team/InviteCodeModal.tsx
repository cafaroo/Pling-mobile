import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Copy, Check, X, MessageCircle } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
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
  const [copied, setCopied] = React.useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);
  
  const snapPoints = useMemo(() => ['45%'], []);

  const handleClosePress = useCallback(() => {
    bottomSheetRef.current?.close();
    setTimeout(onClose, 200);
  }, [onClose]);

  const handleChatPress = useCallback(() => {
    handleClosePress();
    setTimeout(() => {
      router.push(`/team/${teamId}/chat`);
    }, 300);
  }, [teamId, handleClosePress]);

  React.useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible]);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        opacity={0.8}
      />
    ),
    []
  );

  if (!isVisible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: colors.background.dark,
      }}
      handleIndicatorStyle={{
        backgroundColor: colors.text.main,
        width: 40,
      }}
    >
      <LinearGradient
        colors={[colors.background.dark, colors.background.main]}
        style={styles.gradient}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={handleClosePress} style={styles.closeButton}>
              <X size={24} color={colors.text.main} />
            </Pressable>
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: colors.text.main }]}>
                Inbjudningskod genererad
              </Text>
              <Text style={[styles.subtitle, { color: colors.text.main }]}>
                Koden är giltig i 7 dagar
              </Text>
            </View>
          </View>

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
            <Text style={[styles.code, { color: colors.accent.yellow }]}>
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

          <Text style={[styles.description, { color: colors.text.main }]}>
            Dela denna kod med personer du vill bjuda in till teamet
          </Text>

          <View style={styles.buttonContainer}>
            <Button
              title="Kopiera kod"
              onPress={handleCopy}
              variant="primary"
              icon={copied ? Check : Copy}
              style={styles.button}
            />
            <Button
              title="Gå till team chat"
              onPress={handleChatPress}
              variant="secondary"
              icon={MessageCircle}
              style={styles.button}
            />
            <Button
              title="Stäng"
              onPress={handleClosePress}
              variant="outline"
              style={styles.button}
            />
          </View>
        </View>
      </LinearGradient>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    marginTop: 10,
    marginBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
    zIndex: 1,
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    opacity: 0.7,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 20,
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.8,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 8,
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
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
  },
});