import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface ErrorBoundaryProps {
  /** Komponenter som ska wrappas */
  children: ReactNode;
  /** Anpassad felkomponent */
  fallback?: React.FC<{ 
    error: Error; 
    resetError: () => void;
  }>;
}

interface ErrorBoundaryState {
  /** Om ett fel har inträffat */
  hasError: boolean;
  /** Felobjektet */
  error: Error | null;
}

/**
 * Komponent som fångar JavaScript-fel i sitt komponentträd och visar en
 * användarvänlig fallback istället för att krascha hela applikationen.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Uppdatera tillståndet så att nästa rendering visar fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Här kan vi logga felet till en felrapporteringstjänst
    console.error('ErrorBoundary fångade ett fel:', error, errorInfo);
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback: CustomFallback } = this.props;

    if (hasError && error) {
      // Om en anpassad fallback-komponent är angiven, använd den
      if (CustomFallback) {
        return <CustomFallback error={error} resetError={this.resetError} />;
      }

      // Annars, använd standardfallback
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Något gick fel</Text>
          <Text style={styles.description}>
            Ett oväntat fel inträffade i applikationen. 
          </Text>
          <View style={styles.errorDetails}>
            <Text style={styles.errorName}>{error.name}</Text>
            <Text style={styles.errorMessage}>{error.message}</Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={this.resetError}>
            <Text style={styles.buttonText}>Försök igen</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#f44336',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#333',
  },
  errorDetails: {
    width: '100%',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 24,
  },
  errorName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#d32f2f',
  },
  errorMessage: {
    fontSize: 14,
    color: '#333',
  },
  button: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 