import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react-native';
import { useTheme } from '@hooks/useTheme';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  title: string;
  description?: string;
  type?: ToastVariant;
  duration?: number;
}

// Global toast instance
let toastInstance: {
  show: (options: ToastOptions) => void;
  hide: () => void;
} | null = null;

export const ToastService = {
  setInstance(instance: typeof toastInstance) {
    toastInstance = instance;
  },

  show(options: ToastOptions) {
    toastInstance?.show(options);
  },

  hide() {
    toastInstance?.hide();
  }
};

const getIconByVariant = (variant: ToastVariant) => {
  switch (variant) {
    case 'success':
      return CheckCircle;
    case 'error':
      return AlertCircle;
    case 'warning':
      return AlertCircle;
    case 'info':
    default:
      return Info;
  }
};

const getVariantColors = (variant: ToastVariant, colors: any) => {
  switch (variant) {
    case 'success':
      return {
        background: colors.success + '20',
        border: colors.success,
        icon: colors.success,
      };
    case 'error':
      return {
        background: colors.error + '20',
        border: colors.error,
        icon: colors.error,
      };
    case 'warning':
      return {
        background: colors.warning + '20',
        border: colors.warning,
        icon: colors.warning,
      };
    case 'info':
    default:
      return {
        background: colors.primary + '20',
        border: colors.primary,
        icon: colors.primary,
      };
  }
};

export function ToastContainer() {
  const [isVisible, setIsVisible] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [variant, setVariant] = React.useState<ToastVariant>('info');
  const { colors } = useTheme();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  const handleShow = (options: ToastOptions) => {
    setMessage(options.title + (options.description ? `\n${options.description}` : ''));
    setVariant(options.type || 'info');
    setIsVisible(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (Platform.OS === 'web') {
      timeoutRef.current = setTimeout(() => {
        handleHide();
      }, options.duration || 3000);
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();

      timeoutRef.current = setTimeout(() => {
        handleHide();
      }, options.duration || 3000);
    }
  };

  const handleHide = () => {
    if (Platform.OS === 'web') {
      setIsVisible(false);
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(translateY, {
          toValue: 20,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setIsVisible(false);
      });
    }
  };

  useEffect(() => {
    ToastService.setInstance({
      show: handleShow,
      hide: handleHide,
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      ToastService.setInstance(null);
    };
  }, []);

  if (!isVisible) return null;

  const Icon = getIconByVariant(variant);
  const variantColors = getVariantColors(variant, colors);

  const Container = Platform.OS === 'web' ? View : Animated.View;
  const containerStyle = Platform.OS === 'web' 
    ? {
        opacity: isVisible ? 1 : 0,
        transform: `translateY(${isVisible ? 0 : 20}px)`,
        transition: 'opacity 0.2s ease-in-out, transform 0.2s ease-in-out',
      }
    : {
        opacity: fadeAnim,
        transform: [{ translateY }],
      };

  return (
    <Container
      style={[
        styles.container,
        {
          backgroundColor: variantColors.background,
          borderColor: variantColors.border,
          ...containerStyle,
        },
      ]}
    >
      <View style={styles.content}>
        <Icon size={20} color={variantColors.icon} />
        <Text style={[styles.message, { color: '#FFFFFF' }]}>{message}</Text>
      </View>
      <TouchableOpacity onPress={handleHide} style={styles.closeButton}>
        <X size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 100 : 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          zIndex: 9999,
        }
      : Platform.OS === 'android'
      ? { elevation: 5 }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        }),
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  message: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
}); 