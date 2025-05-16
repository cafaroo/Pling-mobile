import React, { ReactNode } from 'react';
import { UIStateProvider } from '../context/UIStateContext';
import { DialogRenderer } from '../components/DialogRenderer';
import { ErrorBoundary } from '../components/ErrorBoundary';

interface UIProvidersProps {
  children: ReactNode;
}

/**
 * Kombinerar alla UI-relaterade providers och globala UI-komponenter
 * i en enda wrapper-komponent.
 */
export const UIProviders: React.FC<UIProvidersProps> = ({ children }) => {
  return (
    <ErrorBoundary>
      <UIStateProvider>
        {children}
        <DialogRenderer />
      </UIStateProvider>
    </ErrorBoundary>
  );
};

/**
 * Exporterar alla UI-relaterade providers för enskild användning
 * om det skulle behövas i specifika komponenter.
 */
export {
  UIStateProvider,
  ErrorBoundary
}; 