import React, { ReactNode } from 'react';
import { UIStateProvider } from '../context/UIStateContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { DialogRenderer } from '../components/DialogRenderer';
import { ToastRenderer } from '../components/ToastRenderer';
import { View, StyleSheet } from 'react-native';

interface UIProvidersProps {
  /** Children-komponenter som ska wrappas med alla UI providers */
  children: ReactNode;
  /** Custom error boundary fallback */
  errorBoundaryFallback?: React.FC<{
    error: Error;
    resetError: () => void;
  }>;
  /** Initialt UI-tillstånd */
  initialUIState?: any;
  /** Om dialog-renderer ska inkluderas */
  includeDialogRenderer?: boolean;
  /** Om toast-renderer ska inkluderas */
  includeToastRenderer?: boolean;
}

/**
 * En komponent som samlar alla UI-relaterade providers
 * för att enkelt kunna wrappes applikationen.
 */
export const UIProviders: React.FC<UIProvidersProps> = ({
  children,
  errorBoundaryFallback,
  initialUIState,
  includeDialogRenderer = true,
  includeToastRenderer = true,
}) => {
  return (
    <ErrorBoundary fallback={errorBoundaryFallback}>
      <UIStateProvider initialUIState={initialUIState}>
        <View style={styles.container}>
          {children}
          
          {/* Rendera dialog-komponenten för att hantera modala fönster */}
          {includeDialogRenderer && <DialogRenderer />}
          
          {/* Rendera toast-komponenten för meddelanden */}
          {includeToastRenderer && <ToastRenderer />}
        </View>
      </UIStateProvider>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

/**
 * Exporterar alla UI-relaterade providers för enskild användning
 * om det skulle behövas i specifika komponenter.
 */
export {
  UIStateProvider,
  ErrorBoundary
}; 