import { useOrganizationContext as useOrganizationContextBase } from '../providers/OrganizationContextProvider';
import { OrganizationContextType } from '../providers/OrganizationContextProvider';

/**
 * Hook för att komma åt organisationskontexten
 */
export function useOrganizationContext(): OrganizationContextType {
  return useOrganizationContextBase();
} 