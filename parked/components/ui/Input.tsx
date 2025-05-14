import React from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  StyleSheet,
  Platform,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Text } from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  style,
  ...props
}) => {
  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      gap: theme.spacing.xs,
    },
    input: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: error ? theme.colors.error : theme.colors.border,
      padding: theme.spacing.sm,
      color: theme.colors.foreground,
      fontSize: 16,
      ...Platform.select({
        ios: {
          paddingVertical: theme.spacing.sm,
        },
        android: {
          paddingVertical: theme.spacing.xs,
        },
      }),
    },
    multiline: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
  });

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="label" color={error ? theme.colors.error : undefined}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          props.multiline && styles.multiline,
          style,
        ]}
        placeholderTextColor={theme.colors.foreground + '60'}
        {...props}
      />
      {error && (
        <Text variant="caption" color={theme.colors.error}>
          {error}
        </Text>
      )}
    </View>
  );
};

export type { InputProps }; 