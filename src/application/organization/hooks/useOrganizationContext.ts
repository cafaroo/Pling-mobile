import { createContext, useContext, createElement } from 'react';
import { OrganizationRepository } from '@/domain/organization/repositories/OrganizationRepository';
import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';
import { SupabaseOrganizationRepository } from '@/infrastructure/supabase/repositories/organization/SupabaseOrganizationRepository';
import { DomainEventPublisher } from '@/infrastructure/events/DomainEventPublisher';
import { OrganizationService } from '@/domain/organization/services/OrganizationService';
import { DefaultOrganizationService } from '@/domain/organization/services/DefaultOrganizationService';
import { supabase } from '@/infrastructure/supabase';

/**
 * Kontext för hantering av organisations-relaterade beroenden
 */
interface OrganizationContextType {
  organizationRepository: OrganizationRepository;
  organizationService: OrganizationService;
  eventPublisher: IDomainEventPublisher;
}

/**
 * Skapa OrganizationContext
 */
const OrganizationContext = createContext<OrganizationContextType | null>(null);

/**
 * Provider-props för OrganizationContextProvider
 */
interface OrganizationContextProviderProps {
  organizationRepository: OrganizationRepository;
  organizationService?: OrganizationService;
  eventPublisher: IDomainEventPublisher;
  children: React.ReactNode;
}

/**
 * Provider för organisations-relaterade beroenden
 */
export function OrganizationContextProvider({
  organizationRepository,
  organizationService,
  eventPublisher,
  children,
}: OrganizationContextProviderProps) {
  // Skapa OrganizationService om den inte tillhandahålls
  const organizationServiceInstance = organizationService || 
    new DefaultOrganizationService(organizationRepository, eventPublisher);

  const value = {
    organizationRepository,
    organizationService: organizationServiceInstance,
    eventPublisher,
  };

  return createElement(
    OrganizationContext.Provider,
    { value },
    children
  );
}

/**
 * Hook för att hämta beroenden till organisations-relaterade funktioner
 */
export function useOrganizationDependencies(): OrganizationContextType {
  const context = useContext(OrganizationContext);
  
  if (!context) {
    // Fallback till default implementationer om ingen provider finns
    const supabaseClient = supabase;
    const organizationRepository = new SupabaseOrganizationRepository(supabaseClient);
    const eventPublisher = new DomainEventPublisher();
    const organizationService = new DefaultOrganizationService(organizationRepository, eventPublisher);
    
    return {
      organizationRepository,
      organizationService,
      eventPublisher
    };
  }
  
  return context;
}

/**
 * Hook för att hämta standardiserade organisations-relaterade beroenden
 */
export function useOrganizationContext(): OrganizationContextType {
  return useOrganizationDependencies();
} 