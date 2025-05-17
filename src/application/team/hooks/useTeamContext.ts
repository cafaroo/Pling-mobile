import { createContext, useContext, createElement } from 'react';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { TeamService } from '@/domain/team/services/TeamService';
import { DefaultTeamService } from '@/domain/team/services/DefaultTeamService';
import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';
import { SupabaseTeamRepository } from '@/infrastructure/supabase/repositories/team/SupabaseTeamRepository';
import { DomainEventPublisher } from '@/infrastructure/events/DomainEventPublisher';
import { supabase } from '@/infrastructure/supabase';

/**
 * Kontext för hantering av team-relaterade beroenden
 */
interface TeamContextType {
  teamRepository: TeamRepository;
  teamService: TeamService;
  eventPublisher: IDomainEventPublisher;
}

/**
 * Skapa TeamContext
 */
const TeamContext = createContext<TeamContextType | null>(null);

/**
 * Provider-props för TeamContextProvider
 */
interface TeamContextProviderProps {
  teamRepository: TeamRepository;
  teamService?: TeamService;
  eventPublisher: IDomainEventPublisher;
  children: React.ReactNode;
}

/**
 * Provider för team-relaterade beroenden
 */
export function TeamContextProvider({
  teamRepository,
  teamService,
  eventPublisher,
  children,
}: TeamContextProviderProps) {
  // Skapa TeamService om den inte tillhandahålls
  const teamServiceInstance = teamService || new DefaultTeamService(teamRepository, eventPublisher);

  const value = {
    teamRepository,
    teamService: teamServiceInstance,
    eventPublisher,
  };

  return createElement(
    TeamContext.Provider,
    { value },
    children
  );
}

/**
 * Hook för att hämta beroenden till team-relaterade funktioner
 */
export function useTeamDependencies(): TeamContextType {
  const context = useContext(TeamContext);
  
  if (!context) {
    // Fallback till default implementationer om ingen provider finns
    const supabaseClient = supabase;
    const teamRepository = new SupabaseTeamRepository(supabaseClient);
    const eventPublisher = new DomainEventPublisher();
    const teamService = new DefaultTeamService(teamRepository, eventPublisher);
    
    return {
      teamRepository,
      teamService,
      eventPublisher
    };
  }
  
  return context;
}

/**
 * Hook för att hämta standardiserade team-relaterade beroenden
 */
export function useTeamContext(): TeamContextType {
  return useTeamDependencies();
} 