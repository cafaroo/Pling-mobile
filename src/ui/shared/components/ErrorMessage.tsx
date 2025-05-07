import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  const theme = useTheme();
  
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons 
        name="alert-circle" 
        size={48} 
        color={theme.colors.error} 
      />
      <Text 
        style={[styles.message, { color: theme.colors.error }]}
        variant="titleMedium"
      >
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  message: {
    marginTop: 8,
    textAlign: 'center',
  },
}); 