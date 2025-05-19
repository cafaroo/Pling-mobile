import React, { createContext, useContext, ReactNode } from 'react';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { TeamService } from '@/domain/team/services/TeamService';

// Definiera kontexttypen
export interface TeamContextType {
  teamRepository: TeamRepository;
  teamService: TeamService;
}

// Skapa kontexten
const TeamContext = createContext<TeamContextType | undefined>(undefined);

// Props för providern
interface TeamContextProviderProps {
  children: ReactNode;
  teamRepository: TeamRepository;
  teamService: TeamService;
}

/**
 * Provider för team-kontexten
 * Ger tillgång till teamrepositoryt och service till alla underkomponenter
 */
export const TeamContextProvider: React.FC<TeamContextProviderProps> = ({
  children,
  teamRepository,
  teamService
}) => {
  return (
    <TeamContext.Provider
      value={{
        teamRepository,
        teamService
      }}
    >
      {children}
    </TeamContext.Provider>
  );
};

/**
 * Hook för att använda team-kontexten
 * @returns TeamContext med repository och service
 */
export const useTeamContext = (): TeamContextType => {
  const context = useContext(TeamContext);
  
  if (!context) {
    throw new Error('useTeamContext måste användas inom en TeamContextProvider');
  }
  
  return context;
}; 