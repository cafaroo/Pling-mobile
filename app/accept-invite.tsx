import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, CircleCheck as CheckCircle, Circle as XCircle } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { acceptTeamInvitation } from '@/services/teamService';
import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function AcceptInviteScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { token } = useLocalSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid invitation link');
      return;
    }

    if (!user) {
      setStatus('error');
      setMessage('Please sign in to accept the invitation');
      return;
    }

    handleInvitation();
  }, [token, user]);

  const handleInvitation = async () => {
    try {
      setIsProcessing(true);
      const success = await acceptTeamInvitation(token as string, user?.id);

      if (success) {
        setStatus('success');
        setMessage('Successfully joined the team!');
        // Redirect to team page after a delay
        setTimeout(() => {
          router.replace('/(tabs)/team');
        }, 2000);
      } else {
        setStatus('error');
        setMessage('Invalid or expired invitation');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setStatus('error');
      setMessage('An error occurred while accepting the invitation');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle size={48} color={colors.success} />;
      case 'error':
        return <XCircle size={48} color={colors.error} />;
      default:
        return <Users size={48} color={colors.accent.yellow} />;
    }
  };

  return (
    <Container>
      <LinearGradient
        colors={[colors.background.dark, colors.primary.dark]}
        style={styles.background}
      />
      <Header title="Team Invitation" icon={Users} />

      <View style={styles.container}>
        <Card style={styles.card}>
          <View style={styles.iconContainer}>
            {getStatusIcon()}
          </View>

          <Text style={[
            styles.message,
            { color: status === 'error' ? colors.error : colors.text.main }
          ]}>
            {message || 'Processing invitation...'}
          </Text>

          {status === 'error' && (
            <Button
              title="Go to Home"
              variant="outline"
              size="large"
              onPress={() => router.replace('/(tabs)')}
              style={styles.button}
            />
          )}
        </Card>
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
    padding: 24,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  iconContainer: {
    marginBottom: 24,
  },
  message: {
    fontFamily: 'Inter-Medium',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    minWidth: 200,
  },
});