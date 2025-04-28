import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/services/supabaseClient';

export default function AuthCallbackScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    // Handle auth callback
    const handleAuthCallback = async () => {
      try {
        // Get the auth code from URL params
        const code = params.code as string;
        
        if (!code) {
          console.error('No code found in URL');
          router.replace('/(auth)');
          return;
        }

        // Exchange code for session
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          console.error('Error exchanging code for session:', error);
          router.replace('/(auth)');
          return;
        }

        // Redirect to home on success
        router.replace('/(tabs)');
      } catch (error) {
        console.error('Error in auth callback:', error);
        router.replace('/(auth)');
      }
    };

    handleAuthCallback();
  }, [params]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background.dark, colors.primary.main]}
        style={styles.background}
      />
      <ActivityIndicator size="large" color={colors.accent.yellow} />
      <Text style={[styles.text, { color: colors.text.light }]}>
        Completing authentication...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});