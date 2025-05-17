import { createContext, useContext, createElement } from 'react';
import { SubscriptionRepository } from '@/domain/subscription/repositories/SubscriptionRepository';
import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';
import { SupabaseSubscriptionRepository } from '@/infrastructure/supabase/repositories/subscription/SupabaseSubscriptionRepository';
import { DefaultSubscriptionService } from '@/domain/subscription/services/DefaultSubscriptionService';
import { DefaultFeatureFlagService } from '@/domain/subscription/services/DefaultFeatureFlagService';
import { UsageTrackingService } from '@/domain/subscription/services/UsageTrackingService';
import { DomainEventPublisher } from '@/infrastructure/events/DomainEventPublisher';
import { supabase } from '@/infrastructure/supabase';

/**
 * Kontext för att hantera prenumerations-relaterade beroenden
 */
interface SubscriptionContextType {
  subscriptionRepository: SubscriptionRepository;
  subscriptionService: DefaultSubscriptionService;
  featureFlagService: DefaultFeatureFlagService;
  usageTrackingService: UsageTrackingService;
  eventPublisher: IDomainEventPublisher;
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
  subscriptionService?: DefaultSubscriptionService;
  featureFlagService?: DefaultFeatureFlagService;
  usageTrackingService?: UsageTrackingService;
  eventPublisher: IDomainEventPublisher;
  children: React.ReactNode;
}

/**
 * Provider för prenumerations-relaterade beroenden
 */
export function SubscriptionContextProvider({
  subscriptionRepository,
  subscriptionService,
  featureFlagService,
  usageTrackingService,
  eventPublisher,
  children,
}: SubscriptionContextProviderProps) {
  // Skapa services om de inte tillhandahålls
  const subscriptionServiceInstance = subscriptionService || 
    new DefaultSubscriptionService(subscriptionRepository, eventPublisher);
  
  const featureFlagServiceInstance = featureFlagService ||
    new DefaultFeatureFlagService(subscriptionRepository);
  
  const usageTrackingServiceInstance = usageTrackingService ||
    new UsageTrackingService(subscriptionRepository, eventPublisher);

  const value = {
    subscriptionRepository,
    subscriptionService: subscriptionServiceInstance,
    featureFlagService: featureFlagServiceInstance,
    usageTrackingService: usageTrackingServiceInstance,
    eventPublisher,
  };

  return createElement(
    SubscriptionContext.Provider,
    { value },
    children
  );
}

/**
 * Hook för att hämta beroenden till prenumerations-relaterade funktioner
 */
export function useSubscriptionDependencies(): SubscriptionContextType {
  const context = useContext(SubscriptionContext);
  
  if (!context) {
    // Fallback till default implementationer om ingen provider finns
    // I produktion bör detta ersättas med ett felmeddelande
    const supabaseClient = supabase;
    const subscriptionRepository = new SupabaseSubscriptionRepository(supabaseClient);
    const eventPublisher = new DomainEventPublisher();
    
    return {
      subscriptionRepository,
      subscriptionService: new DefaultSubscriptionService(subscriptionRepository, eventPublisher),
      featureFlagService: new DefaultFeatureFlagService(subscriptionRepository),
      usageTrackingService: new UsageTrackingService(subscriptionRepository, eventPublisher),
      eventPublisher
    };
  }
  
  return context;
}

/**
 * Hook för att hämta standardiserade prenumerations-relaterade beroenden
 */
export function useSubscriptionContext(): SubscriptionContextType {
  return useSubscriptionDependencies();
}

/**
 * Hook för att hämta prenumerationsdata via hook.
 * Detta är en fördefinerad hook som kombinerar de mest använda funktionerna.
 */
export function useSubscription() {
  const {
    subscriptionService,
    featureFlagService
  } = useSubscriptionContext();
  
  // Här skulle vi kunna implementera standardiserade hooks för att hämta prenumerationer
  // och kontrollera funktioner baserat på prenumerationsstatus
  
  return {
    subscriptionService,
    featureFlagService,
    // Lägg till fler operationer här
  };
} 