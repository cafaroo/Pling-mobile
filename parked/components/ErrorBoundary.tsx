import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View } from 'react-native';

/**
 * Props för ErrorBoundary-komponenten
 * 
 * @interface ErrorBoundaryProps
 * @property {ReactNode} children - Barn-komponenter som ska renderas
 * @property {ReactNode} fallback - Komponent som ska visas om ett fel uppstår
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

/**
 * State för ErrorBoundary-komponenten
 * 
 * @interface ErrorBoundaryState
 * @property {boolean} hasError - Om ett fel har inträffat
 * @property {Error | null} error - Felobjektet om det finns
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * En komponent som fångar JavaScript-fel i sin underträd och visar en fallback-komponent
 * 
 * Den här komponenten implementerar Error Boundary-mönstret i React för att 
 * förhindra att hela applikationen kraschar när ett fel uppstår i en komponent.
 * 
 * @example
 * <ErrorBoundary fallback={<Text>Ett fel inträffade</Text>}>
 *   <KomponentSomKanKrasha />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Uppdatera state så att nästa rendering visar fallback UI
    return { 
      hasError: true,
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Här kan du logga felet till en felrapporteringstjänst
    console.error('ErrorBoundary fångade ett fel:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Visa fallback UI
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 