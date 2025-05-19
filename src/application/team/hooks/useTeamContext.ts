import { useTeamContext as useTeamContextBase, TeamContextType } from '../providers/TeamContextProvider';

/**
 * Hook för att komma åt teamkontexten
 */
export function useTeamContext(): TeamContextType {
  return useTeamContextBase();
} 