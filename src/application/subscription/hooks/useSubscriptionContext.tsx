import { createContext, useContext } from 'react';
import { SubscriptionRepository } from '@/domain/subscription/repositories/SubscriptionRepository';
import { FeatureFlagService } from '@/domain/subscription/services/FeatureFlagService';
import { UsageTrackingService } from '@/domain/subscription/services/UsageTrackingService';
import { useSubscriptionStandardized } from './useSubscriptionStandardized';

/**
 * Kontext för att hantera subscription-relaterade beroenden
 */
interface SubscriptionContextType {
  subscriptionRepository: SubscriptionRepository;
  featureFlagService: FeatureFlagService;
  usageTrackingService: UsageTrackingService;
}

/**
 * Skapa SubscriptionContext
 */
const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

/**
 * Provider-props för SubscriptionContextProvider
 */
interface SubscriptionContextProviderProps {
  subscriptionRepository: SubscriptionRepository;
  featureFlagService: FeatureFlagService;
  usageTrackingService: UsageTrackingService;
  children: React.ReactNode;
}

/**
 * Provider för subscription-relaterade beroenden
 */
export function SubscriptionContextProvider({
  subscriptionRepository,
  featureFlagService,
  usageTrackingService,
  children,
}: SubscriptionContextProviderProps) {
  const value = {
    subscriptionRepository,
    featureFlagService,
    usageTrackingService,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

/**
 * Hook för att hämta beroenden till subscription-relaterade funktioner
 */
export function useSubscriptionDependencies(): SubscriptionContextType {
  const context = useContext(SubscriptionContext);
  
  if (!context) {
    throw new Error('useSubscriptionDependencies måste användas inom en SubscriptionContextProvider');
  }
  
  return context;
}

/**
 * Hook för att hämta standardiserade subscription-relaterade hooks
 */
export function useSubscription() {
  const {
    subscriptionRepository,
    featureFlagService,
    usageTrackingService,
  } = useSubscriptionDependencies();
  
  return useSubscriptionStandardized(
    subscriptionRepository,
    featureFlagService,
    usageTrackingService
  );
} 