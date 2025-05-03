import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Platform, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, ArrowRight, Wand as Wand2 } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export default function AuthScreen() {
  const { colors } = useTheme();
  const { signInWithEmail, signInWithMagicLink, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleAuth = async () => {
    // Clear any existing errors
    setError(null);

    // Validate email
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate password for non-magic link auth
    if (!useMagicLink && !password) {
      setError('Please enter your password');
      return;
    }

    if (!useMagicLink && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Disable form while processing
    setIsSending(true);
    
    // Dismiss keyboard
    Keyboard.dismiss();
    
    try {
      if (useMagicLink) {
        await signInWithMagicLink(email);
        setIsSent(true);
      } else if (isSignUp) {
        try {
          await signUp(email, password);
          setIsSent(true);
        } catch (error) {
          let errorMessage = 'Failed to create account. Please try again.';
          if (error instanceof Error && error.message.includes('already exists')) {
            errorMessage = 'An account with this email already exists. Try signing in instead.';
          }
          setError(errorMessage);
        }
      } else {
        try {
          await signInWithEmail(email, password);
        } catch (error) {
          let errorMessage = 'Failed to sign in. Please try again.';
          if (error instanceof Error && error.message.includes('Invalid login credentials')) {
            errorMessage = 'Invalid email or password.';
          }
          setError(errorMessage);
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      if (!error) {
        setError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background.dark, colors.primary.main]}
        style={styles.background}
      />
      
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={[styles.logoText, { color: colors.accent.yellow }]}>
            PLING!
          </Text>
        </View>
        
        <View style={styles.formContainer}>
          <Text style={[styles.title, { color: colors.text.main }]}>
            Welcome to Pling
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.light, marginBottom: error ? 16 : 32 }]}>
            {isSignUp ? 'Create an account to get started' : 'Sign in to your account'}
          </Text>

          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.error }]}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          {!isSent ? (
            <>
              <Text style={[styles.label, { color: colors.text.main }]}>Email</Text>
              <View style={[styles.inputContainer, { borderColor: colors.neutral[500] }]}>
                <Mail color={colors.neutral[400]} size={20} />
                <TextInput
                  style={[styles.input, { color: colors.text.main }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.neutral[400]}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType={useMagicLink ? "send" : "next"}
                  onSubmitEditing={() => {
                    if (!useMagicLink && password) {
                      handleAuth();
                    }
                  }}
                />
              </View>
              
              {!useMagicLink && (
                <>
                  <Text style={[styles.label, { color: colors.text.main }]}>Password</Text>
                  <View style={[styles.inputContainer, { borderColor: colors.neutral[500] }]}>
                    <Lock color={colors.neutral[400]} size={20} />
                    <TextInput
                      style={[styles.inputWithIcon, { color: colors.text.main }]}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="••••••••"
                      placeholderTextColor={colors.neutral[400]}
                      secureTextEntry
                      returnKeyType="send"
                      onSubmitEditing={handleAuth}
                    />
                  </View>
                </>
              )}
              
              <Button
                title={isSignUp ? "Create Account" : "Sign In"}
                icon={ArrowRight}
                onPress={handleAuth}
                variant="primary"
                size="large"
                style={styles.button}
                loading={isSending}
                disabled={!email || !email.includes('@') || (!useMagicLink && !password) || isSending}
              />
              
              <View style={styles.authOptions}>
                <TouchableOpacity
                  style={styles.authToggle}
                  onPress={() => setIsSignUp(!isSignUp)}
                >
                  <Text style={[styles.authToggleText, { color: colors.accent.yellow }]}>
                    {isSignUp ? "Already have an account? Sign in" : "New user? Create account"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.magicLinkToggle}
                  onPress={() => setUseMagicLink(!useMagicLink)}
                >
                  <Wand2 color={colors.accent.yellow} size={16} style={styles.magicLinkIcon} />
                  <Text style={[styles.magicLinkText, { color: colors.accent.yellow }]}>
                    {useMagicLink ? "Use password instead" : "Sign in with magic link"}
                  </Text>
                </TouchableOpacity>
              </View>

              {useMagicLink && (
                <Text style={[styles.infoText, { color: colors.text.light }]}>
                  We'll send a magic link to your email to sign in without a password
                </Text>
              )}
            </>
          ) : (
            <View style={styles.successContainer}>
              <Text style={[styles.successTitle, { color: colors.accent.yellow }]}>
                Check your email!
              </Text>
              <Text style={[styles.successText, { color: colors.text.light }]}>
                We've sent a sign in link to {email}. Click the link to sign in.
              </Text>
              
              <TouchableOpacity
                style={styles.resendButton}
                onPress={() => setIsSent(false)}
              >
                <Text style={[styles.resendText, { color: colors.accent.yellow }]}>
                  Use a different email address
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logoText: {
    fontFamily: 'Inter-Bold',
    fontSize: 48,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    textAlign: 'center',
    color: 'white',
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: Platform.select({ ios: 12, android: 8, default: 12 }),
    minHeight: Platform.select({ ios: 48, android: 48, default: 48 }),
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  input: {
    flex: 1,
    height: Platform.select({ ios: 24, android: 40, default: 24 }),
    marginLeft: Platform.select({ ios: 10, android: 8, default: 10 }),
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  inputWithIcon: {
    flex: 1,
    height: Platform.select({ ios: 24, android: 40, default: 24 }),
    marginLeft: Platform.select({ ios: 10, android: 8, default: 10 }),
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  button: {
    marginBottom: 16,
  },
  authOptions: {
    alignItems: 'center',
    gap: 12,
  },
  authToggle: {
    paddingVertical: 8,
  },
  authToggleText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  magicLinkToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  magicLinkIcon: {
    marginRight: 8,
  },
  magicLinkText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  infoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    marginBottom: 16,
  },
  successText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  resendButton: {
    paddingVertical: 12,
  },
  resendText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
});