import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ErrorMessage } from './ErrorMessage';
import { categorizeError, getErrorMessage, HookErrorCode } from '@/application/shared/hooks/HookErrorTypes';

interface QueryErrorHandlerProps {
  /** Felobjekt från React Query */
  error: unknown;
  /** Funktion som anropas för att försöka igen */
  onRetry?: () => void;
  /** Domännamn för felkontext */
  domain?: string;
  /** Operationsnamn för felkontext */
  operation?: string;
  /** Ytterligare detaljer för felkontext */
  details?: Record<string, any>;
}

/**
 * Komponent för att standardisera hantering av React Query-fel
 */
export const QueryErrorHandler = ({
  error,
  onRetry,
  domain = 'query',
  operation,
  details,
}: QueryErrorHandlerProps) => {
  // Kategorisera felet för att få rätt felkod
  const errorCode = categorizeError(error);
  
  // Få användarvänligt felmeddelande
  const errorMessage = getErrorMessage(
    errorCode, 
    error instanceof Error ? error.message : String(error)
  );
  
  // Skapa felkontext
  const errorContext = {
    domain,
    operation,
    details,
    timestamp: new Date(),
  };
  
  return (
    <View style={styles.container}>
      <ErrorMessage 
        message={errorMessage}
        onRetry={onRetry}
        context={errorContext}
      />
    </View>
  );
};

/**
 * Hook för att hantera React Query-fel på ett standardiserat sätt
 */
export function useQueryErrorHandler(
  domain?: string,
  operation?: string,
  details?: Record<string, any>
) {
  return (error: unknown, onRetry?: () => void) => (
    <QueryErrorHandler
      error={error}
      onRetry={onRetry}
      domain={domain}
      operation={operation}
      details={details}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
}); 