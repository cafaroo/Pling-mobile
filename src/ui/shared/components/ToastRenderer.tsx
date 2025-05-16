import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useUIState } from '../context/UIStateContext';

interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, type, message, duration = 3000, onClose }) => {
  const [animation] = useState(new Animated.Value(0));
  
  // Visa toast med animation
  useEffect(() => {
    Animated.sequence([
      // Slide in
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Visa
      Animated.delay(duration),
      // Slide out
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose(id);
    });
    
    return () => {
      animation.stopAnimation();
    };
  }, [id, duration, animation, onClose]);
  
  // Välj stil baserat på typ
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return styles.success;
      case 'error':
        return styles.error;
      case 'warning':
        return styles.warning;
      case 'info':
      default:
        return styles.info;
    }
  };
  
  // Välj ikon baserat på typ
  const getTypeIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };
  
  return (
    <Animated.View 
      style={[
        styles.toast,
        getTypeStyles(),
        {
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [-100, 0],
              }),
            },
          ],
          opacity: animation,
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{getTypeIcon()}</Text>
      </View>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => onClose(id)}
      >
        <Text style={styles.closeButtonText}>×</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

/**
 * Komponent som renderar toast-meddelanden baserat på UIStateContext
 */
export const ToastRenderer: React.FC = () => {
  const { state, hideToast } = useUIState();
  const { messages } = state.toasts;
  
  return (
    <View style={styles.container}>
      {messages.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          onClose={hideToast}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40, // Anpassa för statusbar
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  success: {
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  error: {
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  warning: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  info: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  message: {
    flex: 1,
    fontSize: 14,
  },
  closeButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#757575',
  },
}); 