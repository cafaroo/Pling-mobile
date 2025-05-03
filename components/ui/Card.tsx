import React from 'react';
import { View, StyleSheet, Platform, ViewStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'standard' | 'interactive' | 'highlighted';
}

export function Card({ children, style, onPress, variant = 'standard' }: CardProps) {
  const { colors } = useTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'highlighted':
        return `${colors.accent.yellow}10`; // 10% opacity
      default:
        return colors.background.card;
    }
  };

  const cardStyle = [
    styles.card,
    { 
      backgroundColor: getBackgroundColor(),
      borderColor: colors.border.subtle,
      borderWidth: 1,
      ...(Platform.OS === 'web' 
        ? { boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }
        : {
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }
      )
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity 
        style={cardStyle} 
        onPress={onPress}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    overflow: 'hidden',
  },
});

export default Card;