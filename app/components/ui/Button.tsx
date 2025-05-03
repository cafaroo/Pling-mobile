import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { LucideIcon } from 'lucide-react-native';

interface ButtonProps {
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  Icon?: LucideIcon;
  label?: string;
  style?: any;
}

export default function Button({
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  Icon,
  label,
  style,
}: ButtonProps) {
  const { colors } = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return colors.neutral[300];
    switch (variant) {
      case 'primary':
        return colors.primary.main;
      case 'secondary':
        return colors.secondary.main;
      case 'ghost':
        return 'transparent';
      default:
        return colors.primary.main;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.neutral[500];
    switch (variant) {
      case 'primary':
        return colors.text.light;
      case 'secondary':
        return colors.text.main;
      case 'ghost':
        return colors.text.main;
      default:
        return colors.text.light;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'small':
        return 8;
      case 'medium':
        return 12;
      case 'large':
        return 16;
      default:
        return 12;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          padding: getPadding(),
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {Icon && <Icon size={24} color={getTextColor()} style={label ? styles.iconWithLabel : undefined} />}
          {label && (
            <Text style={[
              styles.label,
              { color: getTextColor() }
            ]}>
              {label}
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  iconWithLabel: {
    marginRight: 8,
  },
}); 