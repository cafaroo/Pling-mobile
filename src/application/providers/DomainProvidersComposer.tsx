import React, { ReactNode, useEffect } from 'react';
import { TeamContextProvider } from '../team/hooks/useTeamContext';
import { UserContextProvider } from '../user/hooks/useUserContext';
import { OrganizationContextProvider } from '../organization/hooks/useOrganizationContext';
import { SubscriptionContextProvider } from '../subscription/hooks/useSubscriptionContext.tsx';
import { SupabaseTeamRepository } from '@/infrastructure/supabase/repositories/TeamRepository';
import { SupabaseUserRepository } from '@/infrastructure/supabase/repositories/UserRepository';
import { SupabaseOrganizationRepository } from '@/infrastructure/supabase/repositories/OrganizationRepository';
import { SupabaseSubscriptionRepository } from '@/infrastructure/supabase/repositories/subscription/SupabaseSubscriptionRepository';
import { SupabaseTeamActivityRepository } from '@/infrastructure/supabase/repositories/TeamActivityRepository';
import { DomainEventHandlerInitializer } from '@/infrastructure/events/DomainEventHandlers';
import { DefaultLogger } from '@/infrastructure/logger/DefaultLogger';

/**
 * Props för DomainProvidersComposer
 */
interface DomainProvidersComposerProps {
  children: ReactNode;
  supabaseClient: any; // Ersätt med SupabaseClient-typen
}

/**
 * Komponerar alla domän-providers för att konfigurera globala beroenden
 * 
 * Denna komponent initierar:
 * 1. Repositories för alla domäner (team, user, organization, subscription)
 * 2. DomainEventPublisher och registrerar handlers
 * 3. Konfigurerar alla Context-providers för hooks
 */
export function DomainProvidersComposer({ children, supabaseClient }: DomainProvidersComposerProps) {
  // Skapa logger
  const logger = new DefaultLogger();
  
  // Skapa repositories
  const teamRepository = new SupabaseTeamRepository(supabaseClient);
  const userRepository = new SupabaseUserRepository(supabaseClient);
  const organizationRepository = new SupabaseOrganizationRepository(supabaseClient);
  const teamActivityRepository = new SupabaseTeamActivityRepository(supabaseClient);
  const subscriptionRepository = new SupabaseSubscriptionRepository(supabaseClient);
  
  // Skapa och konfigurera event handlers via eventPublisher
  const domainEventHandlerInitializer = DomainEventHandlerInitializer.initializeWithDefaultRepositories(
    logger,
    teamRepository,
    userRepository
  );
  
  const eventPublisher = domainEventHandlerInitializer.publisher;
  
  // Konfigurera publisher för repositories som behöver det
  teamRepository.setEventPublisher(eventPublisher);
  userRepository.setEventPublisher(eventPublisher);
  
  // Rensa alla event handlers när komponenten unmounts
  useEffect(() => {
    return () => {
      // Cleanup-logik för event handlers och andra resurser
      eventPublisher.clearListeners();
    };
  }, [eventPublisher]);
  
  return (
    <TeamContextProvider
      teamRepository={teamRepository}
      userRepository={userRepository}
      teamActivityRepository={teamActivityRepository}
      eventPublisher={eventPublisher}
    >
      <UserContextProvider
        userRepository={userRepository}
        eventPublisher={eventPublisher}
      >
        <OrganizationContextProvider
          organizationRepository={organizationRepository}
          eventPublisher={eventPublisher}
        >
          <SubscriptionContextProvider
            subscriptionRepository={subscriptionRepository}
            eventPublisher={eventPublisher}
          >
            {/* Andra domänproviders läggs till här */}
            {children}
          </SubscriptionContextProvider>
        </OrganizationContextProvider>
      </UserContextProvider>
    </TeamContextProvider>
  );
} 