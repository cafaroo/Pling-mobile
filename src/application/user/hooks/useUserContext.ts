import { useUserContext as useUserContextBase, UserContextType } from '../providers/UserContextProvider';

/**
 * Hook för att komma åt användarkontext
 */
export function useUserContext(): UserContextType {
  return useUserContextBase();
} 