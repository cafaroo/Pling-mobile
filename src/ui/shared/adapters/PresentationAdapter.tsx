import React, { ReactNode } from 'react';
import { QueryErrorHandler } from '../components/QueryErrorHandler';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface PresentationAdapterProps<T> {
  /** Data som ska presenteras */
  data: T | null | undefined;
  /** Om data håller på att laddas */
  isLoading: boolean;
  /** Eventuellt fel */
  error: unknown;
  /** Funktion för att försöka igen vid fel */
  onRetry?: () => void;
  /** Rendering funktion för data */
  renderData: (data: T) => ReactNode;
  /** Konfigurera tom data-vy */
  emptyState?: {
    title: string;
    message: string;
    actionText?: string;
    onAction?: () => void;
  };
  /** Felkontextinformation */
  errorContext?: {
    domain?: string;
    operation?: string;
    details?: Record<string, any>;
  };
}

/**
 * En generisk adapter som separerar presentationslogik från affärslogik
 * och hanterar olika tillstånd (laddning, fel, tom data) konsekvent.
 */
export function PresentationAdapter<T>({
  data,
  isLoading,
  error,
  onRetry,
  renderData,
  emptyState,
  errorContext,
}: PresentationAdapterProps<T>): JSX.Element {
  // Visa laddningsindikator om data håller på att laddas
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  // Visa felmeddelande om det finns ett fel
  if (error) {
    return (
      <QueryErrorHandler
        error={error}
        onRetry={onRetry}
        domain={errorContext?.domain}
        operation={errorContext?.operation}
        details={errorContext?.details}
      />
    );
  }
  
  // Visa tom tillstånd om data är null eller undefined
  if (data === null || data === undefined || (Array.isArray(data) && data.length === 0)) {
    if (emptyState) {
      return (
        <EmptyState
          title={emptyState.title}
          message={emptyState.message}
          actionText={emptyState.actionText}
          onAction={emptyState.onAction}
        />
      );
    }
    
    // Om ingen tom tillståndskonfiguration finns, använd standard
    return (
      <EmptyState
        title="Inget innehåll"
        message="Det finns inget innehåll att visa just nu."
      />
    );
  }
  
  // Rendera data när allt är laddat och inga fel uppstått
  return <>{renderData(data as T)}</>;
} 