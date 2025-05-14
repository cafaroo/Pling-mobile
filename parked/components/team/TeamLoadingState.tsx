import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { AlertCircle } from 'lucide-react-native';

interface TeamLoadingStateProps {
  isLoading: boolean;
  error: string | null;
}

/**
 * Komponent för att visa laddningstillstånd och felmeddelanden för team-data
 */
export function TeamLoadingState({ isLoading, error }: TeamLoadingStateProps) {
  const { colors } = useTheme();

  if (!isLoading && !error) {
    // Om det inte är ett laddningstillstånd och inget fel, returnera null
    return null;
  }

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.yellow} />
          <Text style={[styles.loadingText, { color: colors.text.light }]}>
            Laddar team-data...
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle color={colors.error} size={24} />
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
}); 