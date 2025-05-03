import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export type BadgeVariant = 'default' | 'success' | 'error' | 'warning' | 'info';
export type BadgeSize = 'small' | 'medium';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  color?: string;
  style?: object;
}

export const Badge = ({
  label,
  variant = 'default',
  size = 'medium',
  color,
  style,
}: BadgeProps) => {
  const { colors } = useTheme();

  const getBackgroundColor = () => {
    if (color) return color;
    
    switch (variant) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'warning':
        return colors.accent.yellow;
      case 'info':
        return colors.primary.light;
      default:
        return colors.background.light;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'warning':
        return colors.background.dark;
      default:
        return colors.text.main;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 2,
          paddingHorizontal: 8,
          borderRadius: 8,
          fontSize: 12,
        };
      default:
        return {
          paddingVertical: 4,
          paddingHorizontal: 12,
          borderRadius: 12,
          fontSize: 14,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          borderRadius: sizeStyles.borderRadius,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: getTextColor(),
            fontSize: sizeStyles.fontSize,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
}); 