import { createContext, useContext } from 'react';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { TeamActivityRepository } from '@/domain/team/repositories/TeamActivityRepository';
import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';
import { useTeamStandardized } from './useTeamStandardized';

/**
 * Kontext för att hantera team-relaterade beroenden
 */
interface TeamContextType {
  teamRepository: TeamRepository;
  userRepository: UserRepository;
  teamActivityRepository: TeamActivityRepository;
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
  userRepository: UserRepository;
  teamActivityRepository: TeamActivityRepository;
  eventPublisher: IDomainEventPublisher;
  children: React.ReactNode;
}

/**
 * Provider för team-relaterade beroenden
 */
export function TeamContextProvider({
  teamRepository,
  userRepository,
  teamActivityRepository,
  eventPublisher,
  children,
}: TeamContextProviderProps) {
  const value = {
    teamRepository,
    userRepository,
    teamActivityRepository,
    eventPublisher,
  };

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
}

/**
 * Hook för att hämta beroenden till team-relaterade funktioner
 */
export function useTeamDependencies(): TeamContextType {
  const context = useContext(TeamContext);
  
  if (!context) {
    throw new Error('useTeamDependencies måste användas inom en TeamContextProvider');
  }
  
  return context;
}

/**
 * Hook för att hämta standardiserade team-relaterade hooks
 */
export function useTeam() {
  const {
    teamRepository,
    userRepository,
    teamActivityRepository,
    eventPublisher,
  } = useTeamDependencies();
  
  return useTeamStandardized(
    teamRepository,
    userRepository,
    teamActivityRepository,
    eventPublisher
  );
} 