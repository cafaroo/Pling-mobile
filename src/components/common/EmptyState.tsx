import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Icon, useTheme, Button } from 'react-native-paper';

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction
}: EmptyStateProps) {
  const theme = useTheme();
  
  return (
    <View style={styles.container}>
      <Icon
        source={icon}
        size={64}
        color={theme.colors.primary}
      />
      
      <Text style={styles.title} variant="headlineSmall">
        {title}
      </Text>
      
      <Text style={styles.message} variant="bodyMedium">
        {message}
      </Text>
      
      {actionLabel && onAction && (
        <Button 
          mode="contained" 
          onPress={onAction}
          style={styles.button}
        >
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  title: {
    marginTop: 16,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  message: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7
  },
  button: {
    marginTop: 24
  }
}); 