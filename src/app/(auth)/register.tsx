import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Dimensions,
  ImageBackground
} from 'react-native';
import { TextInput, Button, Text, useTheme, Checkbox } from 'react-native-paper';
import { Link, router } from 'expo-router';
import { useAuth } from '@context/AuthContext'; 
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, Mail, Lock, User, Check, AlertCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Kontrollera om vi kör på webben
const IS_WEB = Platform.OS === 'web';

// Plattformsspecifika easing-funktioner för att undvika kompatibilitetsproblem med webben
const createEasing = () => {
  if (IS_WEB) {
    // Enklare easing-funktioner för webb
    return {
      easeInOut: Easing.ease, 
      rotate: Easing.linear,
      move: Easing.ease
    };
  } else {
    // Fullständiga easing-funktioner för nativt
    return {
      easeInOut: Easing.inOut(Easing.sin),
      rotate: Easing.inOut(Easing.sin),
      move: Easing.inOut(Easing.sin)
    };
  }
};

export default function RegisterScreen() {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp, isLoading } = useAuth();
  const easingFunctions = createEasing();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const formFadeAnim = useRef(new Animated.Value(0)).current;
  const formSlideAnim = useRef(new Animated.Value(50)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const buttonPressAnim = useRef(new Animated.Value(0)).current;
  
  // Bakgrundsanimation värden
  const bgScaleAnim = useRef(new Animated.Value(1)).current;
  const bgRotateAnim = useRef(new Animated.Value(0)).current;
  const bgMoveXAnim = useRef(new Animated.Value(0)).current;
  const bgMoveYAnim = useRef(new Animated.Value(0)).current;

  // Animera bakgrunden med en långsam pulsering och rörelse
  useEffect(() => {
    if (IS_WEB) {
      // Enklare animationer för webbversionen med färre parallella animationer
      const animateBgWeb = () => {
        // Kör bara en animation åt gången på webben
        Animated.sequence([
          // Sakta skala upp bakgrunden
          Animated.timing(bgScaleAnim, {
            toValue: 1.03, // Något mindre skalning på webben
            duration: 10000,
            easing: Easing.ease,
            useNativeDriver: false, // false för webben
          }),
          // Sakta skala ner bakgrunden
          Animated.timing(bgScaleAnim, {
            toValue: 1,
            duration: 10000,
            easing: Easing.ease,
            useNativeDriver: false,
          }),
        ]).start(() => {
          // När animationerna är klara, börja om
          animateBgWeb();
        });
      };
      
      // Starta den enklare bakgrundsanimationen för webb
      animateBgWeb();
    } else {
      // Standardanimationer för nativa plattformar
      const animateBg = () => {
        // Starta flera parallella animationer
        Animated.parallel([
          // Sakta skala upp/ner bakgrunden
          Animated.sequence([
            Animated.timing(bgScaleAnim, {
              toValue: 1.05,
              duration: 15000,
              easing: easingFunctions.easeInOut,
              useNativeDriver: true,
            }),
            Animated.timing(bgScaleAnim, {
              toValue: 1,
              duration: 15000,
              easing: easingFunctions.easeInOut,
              useNativeDriver: true,
            })
          ]),
          
          // Sakta rotera bakgrunden fram och tillbaka
          Animated.sequence([
            Animated.timing(bgRotateAnim, {
              toValue: 1,
              duration: 20000,
              easing: easingFunctions.rotate,
              useNativeDriver: true,
            }),
            Animated.timing(bgRotateAnim, {
              toValue: 0,
              duration: 20000,
              easing: easingFunctions.rotate,
              useNativeDriver: true,
            })
          ])
        ]).start(() => {
          // När animationerna är klara, börja om
          animateBg();
        });
      };
      
      // Starta bakgrundsanimationen
      animateBg();
    }
  }, []);
  
  // Entry animations
  useEffect(() => {
    Animated.stagger(200, [
      // Logo and title animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: !IS_WEB,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: !IS_WEB,
          easing: Easing.out(Easing.cubic),
        }),
      ]),
      
      // Form animations (appears after logo)
      Animated.parallel([
        Animated.timing(formFadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: !IS_WEB,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(formSlideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: !IS_WEB,
          easing: Easing.out(Easing.cubic),
        }),
      ]),
    ]).start();
  }, []);

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setError('Lösenorden matchar inte.');
      
      // Fel-animation
      Animated.sequence([
        Animated.timing(buttonPressAnim, { toValue: 8, duration: 50, useNativeDriver: !IS_WEB, easing: Easing.ease }),
        Animated.timing(buttonPressAnim, { toValue: -8, duration: 50, useNativeDriver: !IS_WEB, easing: Easing.ease }),
        Animated.timing(buttonPressAnim, { toValue: 0, duration: 50, useNativeDriver: !IS_WEB, easing: Easing.ease }),
      ]).start();
      
      return;
    }
    if (!agreedToTerms) {
      setError('Du måste godkänna användarvillkoren.');
      
      // Fel-animation
      Animated.sequence([
        Animated.timing(buttonPressAnim, { toValue: 8, duration: 50, useNativeDriver: !IS_WEB, easing: Easing.ease }),
        Animated.timing(buttonPressAnim, { toValue: -8, duration: 50, useNativeDriver: !IS_WEB, easing: Easing.ease }),
        Animated.timing(buttonPressAnim, { toValue: 0, duration: 50, useNativeDriver: !IS_WEB, easing: Easing.ease }),
      ]).start();
      
      return;
    }

    // Knapp-animation
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: !IS_WEB,
        easing: Easing.ease,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: !IS_WEB,
        easing: Easing.ease,
      }),
    ]).start();

    setError(null);
    try {
      await signUp(email, password);
      Alert.alert('Registrering lyckades', 'Kontrollera din e-post för att verifiera ditt konto.');
    } catch (err: any) {
      setError(err.message || 'Ett oväntat fel inträffade vid registrering.');
      
      // Fel-animation
      Animated.sequence([
        Animated.timing(buttonPressAnim, { toValue: 8, duration: 50, useNativeDriver: !IS_WEB, easing: Easing.ease }),
        Animated.timing(buttonPressAnim, { toValue: -8, duration: 50, useNativeDriver: !IS_WEB, easing: Easing.ease }),
        Animated.timing(buttonPressAnim, { toValue: 0, duration: 50, useNativeDriver: !IS_WEB, easing: Easing.ease }),
      ]).start();
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Interpolera rotationen för bakgrunden
  const bgRotate = bgRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '2deg']
  });

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Animerad bakgrundsbild med konfetti */}
      <Animated.View
        style={[
          styles.animatedBgContainer,
          {
            transform: [
              { scale: bgScaleAnim },
              { rotate: bgRotate },
              { translateX: bgMoveXAnim },
              { translateY: bgMoveYAnim }
            ]
          }
        ]}
      >
        <ImageBackground 
          source={require('@assets/images/pling_confetti_bg.png')} 
          style={styles.background}
          resizeMode="cover"
        >
          {/* Overlay för bättre kontrast */}
          <View style={styles.overlay} />
        </ImageBackground>
      </Animated.View>

      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo & Header */}
          <Animated.View 
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: IS_WEB ? [] : [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.logoWrapper}>
              <Image 
                source={require('@assets/images/logo.png')} 
                style={styles.logo} 
                resizeMode="contain"
              />
            </View>
            <Text variant="headlineLarge" style={styles.title}>
              Skapa konto
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Registrera dig för att bli en del av Pling-gemenskapen
            </Text>
          </Animated.View>

          {/* Error message */}
          {error && (
            <Animated.View 
              style={[
                styles.errorContainer,
                IS_WEB ? {} : { transform: [{ translateX: buttonPressAnim }] }
              ]}
            >
              <AlertCircle size={20} color="#EF4444" style={styles.errorIcon} />
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}

          {/* Registration Form */}
          <Animated.View 
            style={[
              styles.formContainer,
              {
                opacity: formFadeAnim,
                transform: IS_WEB ? [] : [{ translateY: formSlideAnim }]
              }
            ]}
          >
            <View style={styles.inputWrapper}>
              <User 
                size={20} 
                color={theme.colors.onSurfaceVariant} 
                style={styles.inputIcon} 
              />
              <TextInput
                label="Namn"
                value={name}
                onChangeText={setName}
                mode="flat"
                style={styles.input}
                disabled={isLoading}
                textColor={theme.colors.onSurface}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                theme={{ 
                  colors: { 
                    background: 'rgba(15, 14, 42, 0.75)',
                    onSurfaceVariant: theme.colors.onSurfaceVariant
                  } 
                }}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Mail 
                size={20} 
                color={theme.colors.onSurfaceVariant} 
                style={styles.inputIcon} 
              />
              <TextInput
                label="E-postadress"
                value={email}
                onChangeText={setEmail}
                mode="flat"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                disabled={isLoading}
                textColor={theme.colors.onSurface}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                theme={{ 
                  colors: { 
                    background: 'rgba(15, 14, 42, 0.75)',
                    onSurfaceVariant: theme.colors.onSurfaceVariant
                  } 
                }}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Lock 
                size={20} 
                color={theme.colors.onSurfaceVariant} 
                style={styles.inputIcon} 
              />
              <TextInput
                label="Lösenord"
                value={password}
                onChangeText={setPassword}
                mode="flat"
                style={styles.input}
                secureTextEntry={!showPassword}
                disabled={isLoading}
                textColor={theme.colors.onSurface}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                theme={{ 
                  colors: { 
                    background: 'rgba(15, 14, 42, 0.75)',
                    onSurfaceVariant: theme.colors.onSurfaceVariant
                  } 
                }}
                right={
                  <TextInput.Icon 
                    icon={() => 
                      showPassword 
                        ? <EyeOff size={20} color={theme.colors.onSurfaceVariant} /> 
                        : <Eye size={20} color={theme.colors.onSurfaceVariant} />
                    } 
                    onPress={toggleShowPassword} 
                  />
                }
              />
            </View>

            <View style={styles.inputWrapper}>
              <Lock 
                size={20} 
                color={theme.colors.onSurfaceVariant} 
                style={styles.inputIcon} 
              />
              <TextInput
                label="Bekräfta lösenord"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                mode="flat"
                style={styles.input}
                secureTextEntry={!showConfirmPassword}
                disabled={isLoading}
                textColor={theme.colors.onSurface}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                theme={{ 
                  colors: { 
                    background: 'rgba(15, 14, 42, 0.75)',
                    onSurfaceVariant: theme.colors.onSurfaceVariant
                  } 
                }}
                right={
                  <TextInput.Icon 
                    icon={() => 
                      showConfirmPassword 
                        ? <EyeOff size={20} color={theme.colors.onSurfaceVariant} /> 
                        : <Eye size={20} color={theme.colors.onSurfaceVariant} />
                    } 
                    onPress={toggleShowConfirmPassword} 
                  />
                }
              />
            </View>

            <View style={styles.checkboxContainer}>
              <Checkbox
                status={agreedToTerms ? 'checked' : 'unchecked'}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
                disabled={isLoading}
                color="#FACC15" // Använd samma gula accent som i loginknappen
              />
              <Text style={styles.checkboxLabel}>Jag godkänner användarvillkoren</Text>
            </View>

            {/* Register Button */}
            <Animated.View 
              style={[
                styles.buttonContainer,
                IS_WEB ? {} : { transform: [{ scale: buttonScaleAnim }] }
              ]}
            >
              <TouchableOpacity
                onPress={handleRegister}
                disabled={isLoading}
                style={styles.buttonTouchable}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#FACC15', '#F59E0B']} // Yellow gradient
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <Text style={styles.buttonText}>Registrerar...</Text>
                    </View>
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={styles.buttonText}>Registrera dig</Text>
                      <Check size={20} color="#0F0E2A" style={styles.buttonIcon} />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
            
            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>eller</Text>
              <View style={styles.separatorLine} />
            </View>

            <TouchableOpacity
              onPress={() => router.push('/login')}
              disabled={isLoading}
              style={styles.registerButton}
              activeOpacity={0.7}
            >
              <Text style={styles.registerButtonText}>Har du redan ett konto? Logga in</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  animatedBgContainer: {
    position: 'absolute',
    width: width + 40, // Lite större än skärmen för att undvika vita kanter vid animering
    height: height + 40,
    left: -20, // Centrera den förstorade bakgrunden
    top: -20,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 14, 42, 0.80)', // Mörkblå med 80% opacitet för bättre kontrast
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: 32,
    alignItems: 'center',
    width: '100%',
  },
  logo: {
    width: 180,
    height: 180,
    zIndex: 1,
    ...(IS_WEB ? {
      filter: 'drop-shadow(0 0 10px rgba(250, 204, 21, 0.3))'
    } : {
      shadowColor: '#FACC15',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 15,
    }),
  },
  title: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    ...(IS_WEB ? {
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
    } : {
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    }),
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    ...(IS_WEB ? {
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
    } : {
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    }),
  },
  formContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 20,
    position: 'relative',
    ...(IS_WEB ? {
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    } : {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 5,
    }),
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: 24,
    zIndex: 1,
  },
  input: {
    backgroundColor: 'rgba(15, 14, 42, 0.75)', // Mörkare bakgrund för bättre kontrast
    borderRadius: 12,
    paddingLeft: 40,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginLeft: 0,
  },
  checkboxLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
    ...(IS_WEB ? {
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
    } : {
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    }),
  },
  buttonContainer: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    ...(IS_WEB ? {
      boxShadow: '0 6px 10px rgba(0, 0, 0, 0.3)'
    } : {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 10,
    }),
  },
  buttonTouchable: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#0F0E2A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  separatorText: {
    color: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 12,
    fontSize: 14,
  },
  registerButton: {
    borderRadius: 12,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    ...(IS_WEB ? {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
    } : {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    }),
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    ...(IS_WEB ? {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
    } : {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    }),
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    color: '#EF4444',
    flex: 1,
    fontSize: 14,
  },
}); 