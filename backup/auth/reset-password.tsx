import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, CircleCheck as CheckCircle, Circle as XCircle } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/services/supabaseClient';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';

export default function ResetPasswordScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { token } = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [isTokenValid, setIsTokenValid] = useState(true);

  useEffect(() => {
    if (!token) {
      setIsTokenValid(false);
      setStatus('error');
      setMessage('Invalid password reset link');
    }
  }, [token]);

  const handleResetPassword = async () => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid password reset link');
      return;
    }

    if (!password) {
      setStatus('error');
      setMessage('Please enter a new password');
      return;
    }

    if (password.length < 6) {
      setStatus('error');
      setMessage('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match');
      return;
    }

    try {
      setIsProcessing(true);
      setStatus('idle');
      setMessage(null);

      // Update password using the token
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      setStatus('success');
      setMessage('Your password has been reset successfully');

      // Redirect to sign in after a delay
      setTimeout(() => {
        router.replace('/(auth)');
      }, 3000);
    } catch (error) {
      console.error('Error resetting password:', error);
      setStatus('error');
      setMessage('Failed to reset password. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isTokenValid) {
    return (
      <Container>
        <LinearGradient
          colors={[colors.background.dark, colors.primary.main]}
          style={styles.background}
        />
        
        <View style={styles.container}>
          <View style={styles.card}>
            <XCircle size={64} color={colors.error} style={styles.icon} />
            <Text style={[styles.title, { color: colors.error }]}>
              Invalid Link
            </Text>
            <Text style={[styles.message, { color: colors.text.light }]}>
              The password reset link is invalid or has expired.
            </Text>
            <Button
              title="Back to Sign In"
              variant="primary"
              size="large"
              onPress={() => router.replace('/(auth)')}
              style={styles.button}
            />
          </View>
        </View>
      </Container>
    );
  }

  if (status === 'success') {
    return (
      <Container>
        <LinearGradient
          colors={[colors.background.dark, colors.primary.main]}
          style={styles.background}
        />
        
        <View style={styles.container}>
          <View style={styles.card}>
            <CheckCircle size={64} color={colors.success} style={styles.icon} />
            <Text style={[styles.title, { color: colors.success }]}>
              Password Reset
            </Text>
            <Text style={[styles.message, { color: colors.text.light }]}>
              {message}
            </Text>
            <Text style={[styles.redirectText, { color: colors.text.light }]}>
              Redirecting to sign in...
            </Text>
          </View>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <LinearGradient
        colors={[colors.background.dark, colors.primary.main]}
        style={styles.background}
      />
      
      <View style={styles.container}>
        <View style={styles.card}>
          <Lock size={48} color={colors.accent.yellow} style={styles.icon} />
          <Text style={[styles.title, { color: colors.text.main }]}>
            Reset Password
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.light }]}>
            Enter your new password below
          </Text>

          {status === 'error' && message && (
            <View style={[styles.errorContainer, { backgroundColor: colors.error }]}>
              <Text style={styles.errorText}>{message}</Text>
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text.main }]}>
              New Password
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
              value={password}
              onChangeText={setPassword}
              placeholder="Enter new password"
              placeholderTextColor={colors.neutral[400]}
              secureTextEntry
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text.main }]}>
              Confirm Password
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
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor={colors.neutral[400]}
              secureTextEntry
            />
          </View>

          <Button
            title="Reset Password"
            variant="primary"
            size="large"
            onPress={handleResetPassword}
            loading={isProcessing}
            disabled={isProcessing || !password || !confirmPassword}
            style={styles.button}
          />

          <TouchableOpacity
            onPress={() => router.replace('/(auth)')}
            style={styles.backLink}
          >
            <Text style={[styles.backLinkText, { color: colors.accent.yellow }]}>
              Back to Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 400,
  },
  icon: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
  },
  backLink: {
    alignItems: 'center',
    padding: 8,
  },
  backLinkText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  message: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  redirectText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});