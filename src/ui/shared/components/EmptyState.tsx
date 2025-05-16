import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

interface EmptyStateProps {
  /** Titel som visas i tomma tillståndet */
  title: string;
  /** Beskrivande meddelande */
  message: string;
  /** Eventuell funktion vid klick på åtgärdsknappen */
  onAction?: () => void;
  /** Text på åtgärdsknappen */
  actionText?: string;
  /** Valfri ikon-komponent att visa */
  icon?: React.ReactNode;
  /** Container style override */
  style?: ViewStyle;
}

/**
 * Visar information när data saknas med möjlighet till åtgärd
 */
export const EmptyState = ({
  title,
  message,
  onAction,
  actionText,
  icon,
  style,
}: EmptyStateProps) => {
  return (
    <View style={[styles.container, style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      
      {onAction && actionText && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionButtonText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginVertical: 20,
    minHeight: 200,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
}); 