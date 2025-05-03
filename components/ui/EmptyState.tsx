import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Button } from './Button';
import { FolderOpen } from 'lucide-react-native';

interface EmptyStateProps {
  title: string;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const EmptyState = ({ title, message, action }: EmptyStateProps) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <FolderOpen
        size={48}
        color={colors.text.light}
        style={styles.icon}
      />
      <Text style={[styles.title, { color: colors.text.main }]}>
        {title}
      </Text>
      <Text style={[styles.message, { color: colors.text.light }]}>
        {message}
      </Text>
      {action && (
        <Button
          title={action.label}
          onPress={action.onPress}
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

export default EmptyState; 