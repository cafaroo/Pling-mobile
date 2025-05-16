import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { ErrorMessage } from './ErrorMessage';
import { createEnhancedHookError, HookErrorCode } from '@/application/shared/hooks/HookErrorTypes';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * En komponent som fångar JavaScript-fel i dess underkomponenter och visar
 * en fallback-UI istället för att krascha hela applikationen.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Logga fel till övervakningssystem eller lokal loggning
    console.error('UI-fel fångat i ErrorBoundary:', error, errorInfo);
    
    // Anropa eventuell onError callback från props
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }
  
  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Användarvänlig fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      const enhancedError = createEnhancedHookError(
        this.state.error,
        { 
          domain: 'ui', 
          operation: 'rendering',
          timestamp: new Date()
        }
      );
      
      return (
        <View style={styles.container}>
          <ErrorMessage 
            message={enhancedError.message}
            onRetry={this.handleReset}
            context={enhancedError.context}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 