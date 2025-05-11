import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { CircleCheck as CheckCircle, Circle as XCircle } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@services/supabaseClient';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';

export default function ConfirmScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { token } = useLocalSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [status, setStatus] = useState<'success' | 'error' | 'processing'>('processing');
  const [message, setMessage] = useState<string>('Confirming your account...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid confirmation link');
      setIsProcessing(false);
      return;
    }

    confirmAccount();
  }, [token]);

  const confirmAccount = async () => {
    try {
      setIsProcessing(true);
      
      // Verify the token
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token as string,
        type: 'signup',
      });

      if (error) {
        console.error('Error confirming account:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to confirm your account. Please try again.');
      } else {
        setStatus('success');
        setMessage('Your account has been confirmed! You can now sign in.');
        
        // Redirect to sign in after a delay
        setTimeout(() => {
          router.replace('/(auth)');
        }, 3000);
      }
    } catch (error) {
      console.error('Error in confirmation process:', error);
      setStatus('error');
      setMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Container>
      <LinearGradient
        colors={[colors.background.dark, colors.primary.main]}
        style={styles.background}
      />
      
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            {status === 'processing' ? (
              <View style={styles.loadingContainer}>
                <Text style={[styles.loadingText, { color: colors.text.light }]}>
                  Processing...
                </Text>
              </View>
            ) : status === 'success' ? (
              <CheckCircle size={64} color={colors.success} />
            ) : (
              <XCircle size={64} color={colors.error} />
            )}
          </View>
          
          <Text style={[styles.title, { 
            color: status === 'success' ? colors.success : 
                  status === 'error' ? colors.error : 
                  colors.text.main 
          }]}>
            {status === 'success' ? 'Success!' : 
             status === 'error' ? 'Error' : 
             'Confirming...'}
          </Text>
          
          <Text style={[styles.message, { color: colors.text.light }]}>
            {message}
          </Text>
          
          {status === 'error' && (
            <Button
              title="Back to Sign In"
              variant="primary"
              size="large"
              onPress={() => router.replace('/(auth)')}
              style={styles.button}
            />
          )}
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
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
    height: 64,
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 18,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    minWidth: 200,
  },
});