import React, { Component, ReactNode, ErrorInfo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { router } from 'expo-router';

interface ErrorBoundaryProps {
  children?: ReactNode;
  error?: Error; // För att visa initiala fel
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: !!props.error,
      error: props.error || null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleGoBack = (): void => {
    router.back();
  };

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text variant="headlineSmall" style={styles.title}>Något gick fel</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'Ett oväntat fel inträffade'}
          </Text>
          
          <View style={styles.buttonContainer}>
            <Button 
              mode="outlined" 
              onPress={this.handleGoBack}
              style={styles.button}
            >
              Gå tillbaka
            </Button>
            
            <Button 
              mode="contained" 
              onPress={this.handleRetry}
              style={styles.button}
            >
              Försök igen
            </Button>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    marginBottom: 20,
    textAlign: 'center',
    color: '#555',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  button: {
    minWidth: 120,
    marginHorizontal: 10,
  },
});

export default ErrorBoundary; 