import React from 'react';
import { TextInput as RNTextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface CustomTextInputProps extends TextInputProps {
  label?: string;
  error?: string | null;
}

export default function TextInput({ 
  label, 
  error, 
  style,
  ...props 
}: CustomTextInputProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text.main }]}>
          {label}
        </Text>
      )}
      
      <RNTextInput
        style={[
          styles.input,
          {
            borderColor: error ? colors.error : colors.neutral[700],
            color: colors.text.main,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          },
          style,
        ]}
        placeholderTextColor={colors.neutral[400]}
        {...props}
      />
      
      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
}); 