import { createContext, useContext } from 'react';
import { OrganizationRepository } from '@/domain/organization/repositories/OrganizationRepository';
import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';
import { SupabaseOrganizationRepository } from '@/infrastructure/supabase/repositories/OrganizationRepository';
import { DomainEventPublisher } from '@/infrastructure/events/DomainEventPublisher';
import { supabase } from '@/infrastructure/supabase';

/**
 * Kontext för att hantera organisations-relaterade beroenden
 */
interface OrganizationContextType {
  organizationRepository: OrganizationRepository;
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
  eventPublisher: IDomainEventPublisher;
  children: React.ReactNode;
}

/**
 * Provider för organisations-relaterade beroenden
 */
export function OrganizationContextProvider({
  organizationRepository,
  eventPublisher,
  children,
}: OrganizationContextProviderProps) {
  const value = {
    organizationRepository,
    eventPublisher,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

/**
 * Hook för att hämta beroenden till organisations-relaterade funktioner
 */
export function useOrganizationDependencies(): OrganizationContextType {
  const context = useContext(OrganizationContext);
  
  if (!context) {
    // Fallback till default implementationer om ingen provider finns
    // I produktion bör detta ersättas med en felmeddelande
    return {
      organizationRepository: new SupabaseOrganizationRepository(supabase),
      eventPublisher: new DomainEventPublisher()
    };
  }
  
  return context;
}

/**
 * Hook för att hämta standardiserade organisations-relaterade beroenden
 * Detta är en simplifierad version som direkt returnerar instanser
 * I en mer robust implementation skulle detta använda en factory eller DI-container
 */
export function useOrganizationContext(): OrganizationContextType {
  // Detta kan senare ersättas med Context-baserad implementation
  // För nu returnerar vi direkta instanser som fallback
  return useOrganizationDependencies();
} 