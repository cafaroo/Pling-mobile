import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  Animated, 
  Easing,
  Dimensions,
  ActivityIndicator,
  ImageBackground,
  Keyboard,
  TextInput
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '@context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle, Bell } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';

// Platform check
const IS_WEB = Platform.OS === 'web';
const { width, height } = Dimensions.get('window');

// Custom TextInput component with animations
const AnimatedInput = ({ 
  label, 
  value, 
  onChangeText, 
  icon, 
  secureTextEntry = false, 
  keyboardType = 'default',
  disabled = false,
  rightIcon = null,
  onRightIconPress = () => {}
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const labelPositionAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(labelPositionAnim, {
      toValue: (isFocused || value) ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
      easing: Easing.ease
    }).start();
    
    Animated.timing(borderAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
      easing: Easing.ease
    }).start();
  }, [isFocused, value]);
  
  const labelStyle = {
    position: 'absolute',
    left: icon ? 44 : 16,
    top: labelPositionAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [17, 8]
    }),
    fontSize: labelPositionAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12]
    }),
    color: labelPositionAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(255, 255, 255, 0.6)', '#FACC15']
    }),
    zIndex: 2
  };
  
  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 255, 255, 0.15)', '#FACC15']
  });
  
  return (
    <View style={styles.inputContainer}>
      {icon && <View style={styles.inputIconContainer}>{icon}</View>}
      
      <Animated.Text style={labelStyle}>
        {label}
      </Animated.Text>
      
      <Animated.View style={[
        styles.inputWrapper,
        { borderColor }
      ]}>
        <TextInput
          style={[
            styles.textInput,
            {
              color: '#FFFFFF',
              height: 56,
              paddingHorizontal: 16,
              fontSize: 16,
              paddingTop: 16,
              paddingBottom: 8,
              width: '100%',
              paddingLeft: 40
            }
          ]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          editable={!disabled}
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          selectionColor="#FACC15"
          autoCapitalize="none"
        />
        
        {rightIcon && (
          <TouchableOpacity 
            style={styles.rightIconContainer} 
            onPress={onRightIconPress}
            disabled={disabled}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
};

// Animated gradient text component
const GradientText = ({ text, style, colors = ['#FACC15', '#F59E0B'] }) => {
  // Använd enklare lösning för alla plattformar för att undvika MaskedView-problem
  return (
    <Text 
      style={[
        { 
          color: colors[0], 
          fontWeight: 'bold',
          ...(IS_WEB ? {
            background: `-webkit-linear-gradient(left, ${colors[0]}, ${colors[1]})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          } : {})
        }, 
        style
      ]}
    >
      {text}
    </Text>
  );
};

// Floating particles component
const FloatingParticles = () => {
  // Förenkla implementationen för att undvika problem
  if (IS_WEB) {
    return null; // Skip på webben
  }
  
  // Create a small number of static particles with simple styling
  const particles = Array.from({ length: 5 }).map((_, index) => {
    const size = 8 + (index * 2);
    const left = (index * width / 5) + (Math.random() * 20);
    const top = 100 + (index * 60) + (Math.random() * 40);
    
    return (
      <View
        key={index}
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          left: left,
          top: top,
          opacity: 0.3 + (Math.random() * 0.3),
          backgroundColor: index % 3 === 0 
            ? '#FACC15' // Yellow
            : index % 3 === 1 
              ? '#EC4899' // Pink
              : '#5B21B6' // Purple
        }}
      />
    );
  });
  
  return <>{particles}</>;
};

// Main login screen component
export default function LoginScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const { signInWithEmail, isLoading } = useAuth();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScaleAnim = useRef(new Animated.Value(1)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const buttonPressAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const bellAnim = useRef(new Animated.Value(0)).current;

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        // Scale down logo when keyboard appears
        Animated.timing(logoScaleAnim, {
          toValue: 0.7,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.ease
        }).start();
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        // Scale logo back up when keyboard hides
        Animated.timing(logoScaleAnim, {
        toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.ease
        }).start();
      }
    );
    
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  // Bell animation
  useEffect(() => {
    if (IS_WEB) return; // Skip på webben
    
    const animateBell = () => {
          Animated.sequence([
        Animated.timing(bellAnim, {
          toValue: 0.1,
          duration: 50,
              useNativeDriver: true,
          easing: Easing.linear
            }),
        Animated.timing(bellAnim, {
          toValue: -0.1,
          duration: 50,
              useNativeDriver: true,
          easing: Easing.linear
        }),
        Animated.timing(bellAnim, {
          toValue: 0.1,
          duration: 50,
              useNativeDriver: true,
          easing: Easing.linear
            }),
        Animated.timing(bellAnim, {
              toValue: 0,
          duration: 50,
              useNativeDriver: true,
          easing: Easing.linear
            }),
        Animated.delay(3000)
      ]).start(() => animateBell());
    };
    
    animateBell();
    return () => bellAnim.stopAnimation();
  }, []);
  
  // Shimmer animation
  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
              useNativeDriver: true,
            })
    ).start();
  }, []);
  
  // Entry animations
  useEffect(() => {
    Animated.stagger(200, [
      // Logo and title animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]),
    ]).start();
  }, []);

  const handleLogin = async () => {
    setError(null);
    Keyboard.dismiss();
    
    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
    ]).start();
    
    try {
      await signInWithEmail(email, password);
      // Navigation handled by AuthProvider
    } catch (err) {
      setError(err.message || 'Ett oväntat fel inträffade vid inloggning.');
      
      // Error shake animation
      Animated.sequence([
        Animated.timing(buttonPressAnim, { toValue: 8, duration: 50, useNativeDriver: true, easing: Easing.ease }),
        Animated.timing(buttonPressAnim, { toValue: -8, duration: 50, useNativeDriver: true, easing: Easing.ease }),
        Animated.timing(buttonPressAnim, { toValue: 8, duration: 50, useNativeDriver: true, easing: Easing.ease }),
        Animated.timing(buttonPressAnim, { toValue: -8, duration: 50, useNativeDriver: true, easing: Easing.ease }),
        Animated.timing(buttonPressAnim, { toValue: 0, duration: 50, useNativeDriver: true, easing: Easing.ease }),
      ]).start();
    }
  };

  // Shimmer effect for gradient button
  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 350]
  });

  // Bell rotation animation
  const bellRotate = bellAnim.interpolate({
    inputRange: [-0.1, 0, 0.1],
    outputRange: ['-10deg', '0deg', '10deg']
  });

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="light" />
      
      {/* Background */}
        <ImageBackground 
          source={require('@assets/images/pling_confetti_bg.png')} 
          style={styles.background}
          resizeMode="cover"
        >
          <View style={styles.overlay} />
        
        {/* Floating particles */}
        <FloatingParticles />
        
        {/* Glass card effect */}
        {!IS_WEB && Platform.OS !== 'web' && (
          <BlurView
            intensity={20}
            tint="dark"
            style={styles.blurContainer}
          />
        )}
        
        {IS_WEB && (
          <View style={styles.webGlassEffect} />
        )}

      <SafeAreaView style={styles.safeArea}>
          {/* Logo & Header */}
          <Animated.View 
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: logoScaleAnim }
                ]
              }
            ]}
          >
            <View style={styles.logoWrapper}>
              <Animated.View
                style={{
                  transform: [{ rotate: bellRotate }]
                }}
              >
                <Bell size={40} color="#FACC15" style={styles.bellIcon} />
              </Animated.View>
              
              <GradientText 
                text="Pling" 
                style={styles.logoText}
                colors={['#FACC15', '#F59E0B']}
              />
            </View>
            
            <Text variant="headlineMedium" style={styles.title}>
              Välkommen tillbaka!
            </Text>
            
            <Text variant="bodyLarge" style={styles.subtitle}>
              Logga in för att fortsätta din säljresa
            </Text>
          </Animated.View>

          {/* Login Form */}
          <View style={styles.formContainer}>
          {/* Error message */}
          {error && (
            <Animated.View 
              style={[
                styles.errorContainer,
                  { transform: [{ translateX: buttonPressAnim }] }
              ]}
            >
              <AlertCircle size={20} color="#EF4444" style={styles.errorIcon} />
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}

            <AnimatedInput
                label="E-postadress"
                value={email}
                onChangeText={setEmail}
              icon={<Mail size={20} color="rgba(255, 255, 255, 0.6)" />}
                keyboardType="email-address"
                disabled={isLoading}
            />
            
            <AnimatedInput
                label="Lösenord"
                value={password}
                onChangeText={setPassword}
              icon={<Lock size={20} color="rgba(255, 255, 255, 0.6)" />}
                secureTextEntry={!showPassword}
                disabled={isLoading}
              rightIcon={
                      showPassword 
                  ? <EyeOff size={20} color="rgba(255, 255, 255, 0.6)" /> 
                  : <Eye size={20} color="rgba(255, 255, 255, 0.6)" />
                    } 
              onRightIconPress={() => setShowPassword(!showPassword)}
              />

            <TouchableOpacity 
              style={styles.forgotPassword} 
              onPress={() => router.push('/forgot-password')}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>Glömt lösenord?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <Animated.View 
              style={[
                styles.buttonContainer,
                { transform: [{ scale: buttonScaleAnim }] }
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
                  {/* Shimmer effect */}
                    <Animated.View
                      style={[
                        styles.shimmer,
                        {
                          transform: [{ translateX }] 
                        }
                      ]}
                    />
                  
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
          </View>
      </SafeAreaView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30, 27, 75, 0.85)', // Dark blue with opacity
  },
  blurContainer: {
    position: 'absolute',
    top: height * 0.15,
    left: width * 0.05,
    right: width * 0.05,
    bottom: height * 0.1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(91, 33, 182, 0.15)', // Primary color with opacity
  },
  webGlassEffect: {
    position: 'absolute',
    top: height * 0.15,
    left: width * 0.05,
    right: width * 0.05,
    bottom: height * 0.1,
    borderRadius: 24,
    backgroundColor: 'rgba(91, 33, 182, 0.15)', // Primary color with opacity
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 48,
    marginLeft: 8,
  },
  bellIcon: {
    marginRight: 4,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: 12,
    height: 56,
    backgroundColor: 'rgba(15, 14, 42, 0.5)',
    overflow: 'hidden',
  },
  inputIconContainer: {
    position: 'absolute',
    left: 12,
    top: 18,
    zIndex: 2,
  },
  rightIconContainer: {
    position: 'absolute',
    right: 12,
    top: 18,
    zIndex: 2,
  },
  textInput: {
    paddingLeft: 40,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: 4,
  },
  forgotPasswordText: {
    color: '#FACC15', // Accent Yellow
    fontSize: 14,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
  },
  buttonContainer: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 10,
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
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
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
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    color: '#EF4444',
    flex: 1,
    fontSize: 14,
  },
  particle: {
    position: 'absolute',
    opacity: 0.5,
  },
}); 