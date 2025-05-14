import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react-native';

interface ErrorStateProps {
  title: string;
  message: string;
  retry?: () => void;
}

export const ErrorState = ({ title, message, retry }: ErrorStateProps) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <AlertTriangle
        size={48}
        color={colors.error}
        style={styles.icon}
      />
      <Text style={[styles.title, { color: colors.text.main }]}>
        {title}
      </Text>
      <Text style={[styles.message, { color: colors.text.light }]}>
        {message}
      </Text>
      {retry && (
        <Button
          title="Försök igen"
          onPress={retry}
          variant="primary"
          size="medium"
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    minWidth: 200,
  },
}); 