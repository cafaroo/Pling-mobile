import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ErrorContext } from '@/application/shared/hooks/HookErrorTypes';

interface ErrorMessageProps {
  /** Felmeddelande att visa */
  message: string;
  /** Funktion som anropas vid återförsök */
  onRetry?: () => void;
  /** Felkontext med detaljer om var felet uppstod */
  context?: ErrorContext;
}

/**
 * Komponent för att visa felmeddelanden med möjlighet att försöka igen
 * och expandera för att visa teknisk information
 */
export const ErrorMessage = ({ message, onRetry, context }: ErrorMessageProps) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const toggleDetails = () => {
    setShowDetails(prev => !prev);
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>❌</Text>
      </View>
      
      <Text style={styles.title}>Ett fel uppstod</Text>
      <Text style={styles.message}>{message}</Text>
      
      <View style={styles.buttonsContainer}>
        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>Försök igen</Text>
          </TouchableOpacity>
        )}
        
        {context && (
          <TouchableOpacity 
            style={styles.detailsButton} 
            onPress={toggleDetails}
          >
            <Text style={styles.detailsButtonText}>
              {showDetails ? 'Dölj detaljer' : 'Visa detaljer'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {showDetails && context && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Teknisk information:</Text>
          
          {context.domain && (
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Domän: </Text>
              {context.domain}
            </Text>
          )}
          
          {context.operation && (
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Operation: </Text>
              {context.operation}
            </Text>
          )}
          
          {context.timestamp && (
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Tidpunkt: </Text>
              {context.timestamp.toLocaleString()}
            </Text>
          )}
          
          {context.attempts !== undefined && (
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Försök: </Text>
              {context.attempts}
            </Text>
          )}
          
          {context.details && Object.keys(context.details).length > 0 && (
            <>
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Detaljer:</Text>
              </Text>
              {Object.entries(context.details).map(([key, value]) => (
                <Text key={key} style={styles.nestedDetailText}>
                  {key}: {JSON.stringify(value)}
                </Text>
              ))}
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  detailsButton: {
    backgroundColor: '#9e9e9e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  detailsButtonText: {
    color: 'white',
  },
  detailsContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 4,
    marginTop: 8,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    marginBottom: 4,
  },
  detailLabel: {
    fontWeight: 'bold',
  },
  nestedDetailText: {
    fontSize: 12,
    marginLeft: 16,
    marginBottom: 2,
    color: '#616161',
  },
}); 