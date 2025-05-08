import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  Animated, 
  Easing,
  Dimensions,
  ActivityIndicator,
  ImageBackground
} from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { Link, router } from 'expo-router';
import { useAuth } from '@context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Kontrollera om vi kör på webben
const IS_WEB = Platform.OS === 'web';

// Plattformsspecifika easing-funktioner för att undvika kompatibilitetsproblem med webben
const createEasing = () => {
  if (IS_WEB) {
    // Enklare easing-funktioner för webb
    return {
      easeInOut: Easing.ease, // Använd standardfunktionen ease istället för inOut
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

export default function LoginScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signInWithEmail, isLoading } = useAuth();
  const easingFunctions = createEasing();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const formFadeAnim = useRef(new Animated.Value(0)).current;
  const formSlideAnim = useRef(new Animated.Value(50)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const buttonPressAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  
  // Bakgrundsanimation värden
  const bgScaleAnim = useRef(new Animated.Value(1)).current;
  const bgRotateAnim = useRef(new Animated.Value(0)).current;
  const bgMoveXAnim = useRef(new Animated.Value(0)).current;
  const bgMoveYAnim = useRef(new Animated.Value(0)).current;

  // Animate shimmer effect - keep it simple for compatibility
  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: !IS_WEB,
      })
    );
    shimmerAnimation.start();
    return () => shimmerAnimation.stop();
  }, []);
  
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
          ]),
          
          // Rörelse i X-led
          Animated.sequence([
            Animated.timing(bgMoveXAnim, {
              toValue: 10,
              duration: 25000,
              easing: easingFunctions.move,
              useNativeDriver: true,
            }),
            Animated.timing(bgMoveXAnim, {
              toValue: -10,
              duration: 25000,
              easing: easingFunctions.move,
              useNativeDriver: true,
            })
          ]),
          
          // Rörelse i Y-led
          Animated.sequence([
            Animated.timing(bgMoveYAnim, {
              toValue: 10,
              duration: 30000,
              easing: easingFunctions.move,
              useNativeDriver: true,
            }),
            Animated.timing(bgMoveYAnim, {
              toValue: -10,
              duration: 30000,
              easing: easingFunctions.move,
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

  const handleLogin = async () => {
    setError(null);
    
    // Enkel knapp-animation som fungerar på alla plattformar
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
    
    try {
      await signInWithEmail(email, password);
      // Navigation handled by AuthProvider
    } catch (err: any) {
      setError(err.message || 'Ett oväntat fel inträffade vid inloggning.');
      
      // Förenklad fel-animation
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

  // Shimmer effect for gradient button
  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 350]
  });

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
          source={require('../../../assets/images/pling_confetti_bg.png')} 
          style={styles.background}
          resizeMode="cover"
        >
          {/* Overlay för bättre kontrast - mörkare än tidigare */}
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
                source={require('../../../assets/images/logo.png')} 
                style={styles.logo} 
                resizeMode="contain"
              />
            </View>
            <Text variant="headlineLarge" style={styles.title}>
              Välkommen tillbaka
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Logga in för att fortsätta din Pling-resa
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

          {/* Login Form */}
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
                    background: 'rgba(0, 0, 0, 0.2)',
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
                    background: 'rgba(0, 0, 0, 0.2)',
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

            <TouchableOpacity 
              style={styles.forgotPassword} 
              onPress={() => router.push('/forgot-password')}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>Glömt lösenord?</Text>
            </TouchableOpacity>

            {/* Förenklad knapp som fungerar på alla plattformar */}
            <Animated.View 
              style={[
                styles.buttonContainer,
                IS_WEB ? {} : { transform: [{ scale: buttonScaleAnim }] }
              ]}
            >
              <TouchableOpacity
                onPress={handleLogin}
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
                  {/* Simplified shimmer effect */}
                  {!IS_WEB && (
                    <Animated.View
                      style={[
                        styles.shimmer,
                        {
                          transform: [{ translateX }] 
                        }
                      ]}
                    />
                  )}
                  
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#0F0E2A" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={styles.buttonText}>Logga in</Text>
                      <ArrowRight size={20} color="#0F0E2A" style={styles.buttonIcon} />
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
              onPress={() => router.push('/register')}
              disabled={isLoading}
              style={styles.registerButton}
              activeOpacity={0.7}
            >
              <Text style={styles.registerButtonText}>Skapa nytt konto</Text>
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
    backgroundColor: 'rgba(15, 14, 42, 0.80)', // Mörkblå med 80% opacitet för bättre kontrast med logotypen
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
    marginBottom: 48,
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: 48,
    alignItems: 'center',
    width: '100%',
  },
  logo: {
    width: 306,
    height: 306,
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
  logoGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'transparent',
    ...(IS_WEB ? {
      // Webbspecifik styling med CSS
      boxShadow: '0 0 30px rgba(250, 204, 21, 0.6)'
    } : {
      shadowColor: '#FACC15',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 30,
      elevation: 15,
    }),
    top: 0,
    left: 0,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    ...(IS_WEB ? {
      // Webbspecifik styling med CSS
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
      // Webbspecifik styling med CSS
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
      // Webbspecifik styling med CSS
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#FACC15', // Accent Yellow
    fontSize: 14,
    ...(IS_WEB ? {
      // Webbspecifik styling med CSS
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
      // Webbspecifik styling med CSS
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
  shimmer: {
    width: 150,
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    position: 'absolute',
    transform: [{ rotate: '25deg' }],
    borderRadius: 50,
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
      // Webbspecifik styling med CSS
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
      // Webbspecifik styling med CSS
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