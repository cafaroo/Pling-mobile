import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'button' | 'label';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string;
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  style,
  color,
  ...props
}) => {
  const theme = useTheme();

  const styles = StyleSheet.create({
    base: {
      color: color || theme.colors.foreground,
    },
    h1: {
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      lineHeight: 20,
      color: color || theme.colors.foreground + '99', // 60% opacity
    },
    button: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 24,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 20,
    },
  });

  return (
    <RNText
      style={[styles.base, styles[variant], style]}
      {...props}
    />
  );
};

export type { TextProps, TextVariant }; 