import React, { ReactNode, useEffect } from 'react';
import { TeamContextProvider } from '../team/hooks/useTeamContext';
import { SupabaseTeamRepository } from '@/infrastructure/supabase/repositories/TeamRepository';
import { SupabaseUserRepository } from '@/infrastructure/supabase/repositories/UserRepository';
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
 * 1. Repositories för alla domäner
 * 2. DomainEventPublisher och registrerar handlers
 * 3. Konfigurerar alla Context-providers för hooks
 */
export function DomainProvidersComposer({ children, supabaseClient }: DomainProvidersComposerProps) {
  // Skapa logger
  const logger = new DefaultLogger();
  
  // Skapa repositories
  const teamRepository = new SupabaseTeamRepository(supabaseClient);
  const userRepository = new SupabaseUserRepository(supabaseClient);
  const teamActivityRepository = new SupabaseTeamActivityRepository(supabaseClient);
  
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
    };
  }, []);
  
  return (
    <TeamContextProvider
      teamRepository={teamRepository}
      userRepository={userRepository}
      teamActivityRepository={teamActivityRepository}
      eventPublisher={eventPublisher}
    >
      {/* Andra domänproviders läggs till här */}
      {children}
    </TeamContextProvider>
  );
} 