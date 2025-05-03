import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Text } from './Text';
import type { LucideIcon } from 'lucide-react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  Icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  title?: string;
  onPress?: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  Icon,
  iconPosition = 'left',
  style,
  children,
  title,
  onPress,
  ...props
}) => {
  const { colors } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary.main,
          borderColor: colors.primary.main,
        };
      case 'secondary':
        return {
          backgroundColor: colors.secondary.main,
          borderColor: colors.secondary.main,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.neutral[500],
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
        };
      case 'medium':
        return {
          paddingVertical: 12,
          paddingHorizontal: 20,
        };
      case 'large':
        return {
          paddingVertical: 16,
          paddingHorizontal: 24,
        };
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'medium':
        return 20;
      case 'large':
        return 24;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.text.disabled;
    switch (variant) {
      case 'primary':
      case 'secondary':
        return colors.text.inverse;
      case 'outline':
      case 'ghost':
        return colors.text.main;
    }
  };

  const styles = StyleSheet.create({
    button: {
      borderRadius: 8,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    disabled: {
      opacity: 0.5,
    },
    text: {
      fontFamily: 'Inter-Medium',
      fontSize: 16,
      textAlign: 'center',
    },
    smallText: {
      fontSize: 14,
    },
    iconLeft: {
      marginRight: 8,
    },
    iconRight: {
      marginLeft: 8,
    },
  });

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator color={getTextColor()} />;
    }

    const textColor = getTextColor();
    const iconSize = getIconSize();

    return (
      <>
        {Icon && iconPosition === 'left' && (
          <View style={styles.iconLeft}>
            <Icon color={textColor} size={iconSize} />
          </View>
        )}
        {(title || children) && (
          <Text style={[
            styles.text,
            { color: textColor },
            size === 'small' && styles.smallText,
          ]}>
            {title || children}
          </Text>
        )}
        {Icon && iconPosition === 'right' && (
          <View style={styles.iconRight}>
            <Icon color={textColor} size={iconSize} />
          </View>
        )}
      </>
    );
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        getVariantStyles(),
        getSizeStyles(),
        disabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      <View style={styles.content}>
        {renderContent()}
      </View>
    </TouchableOpacity>
  );
};

export type { ButtonProps, ButtonVariant };