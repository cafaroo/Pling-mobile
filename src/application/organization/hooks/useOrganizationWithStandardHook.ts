import { UniqueId } from '@/shared/core/UniqueId';
import { createStandardizedQuery, createStandardizedMutation } from '@/application/shared/hooks/createStandardizedHook';
import { unwrapResult } from '@/application/shared/hooks/BaseHook';
import { Organization } from '@/domain/organization/entities/Organization';
import { useOrganizationContext } from './useOrganizationContext';

// DTOs och interfaces som behöver definieras baserat på Organization entity
export interface CreateOrganizationDTO {
  name: string;
  ownerId: string;
}

export interface UpdateOrganizationDTO {
  organizationId: string;
  name?: string;
  settings?: any;
}

export interface AddTeamToOrganizationDTO {
  organizationId: string;
  teamId: string;
}

export interface RemoveTeamFromOrganizationDTO {
  organizationId: string;
  teamId: string;
}

/**
 * Hook för organisations-operationer som använder standardiserade hook-verktyg
 * 
 * Denna hook använder konfigurationsbaserade creators för att standardisera
 * felhantering, caching och invalidering.
 */
export function useOrganizationWithStandardHook() {
  const {
    organizationRepository,
    eventPublisher
  } = useOrganizationContext();
  
  // ==================== QUERIES ====================
  
  /**
   * Hämtar en organisation med ID
   */
  const useOrganizationById = createStandardizedQuery<Organization, [string | undefined]>({
    queryKeyPrefix: 'organization',
    buildQueryKey: ([orgId]) => ['organization', orgId],
    queryFn: async (orgId) => {
      if (!orgId) return null;
      
      const result = await organizationRepository.findById(new UniqueId(orgId));
      return unwrapResult(result);
    },
    enabled: ([orgId]) => Boolean(orgId),
    staleTime: 5 * 60 * 1000, // 5 minuter
    refetchOnWindowFocus: true
  });
  
  /**
   * Hämtar en organisation med namn
   */
  const useOrganizationByName = createStandardizedQuery<Organization, [string | undefined]>({
    queryKeyPrefix: 'organizationByName',
    buildQueryKey: ([name]) => ['organization', 'name', name],
    queryFn: async (name) => {
      if (!name) return null;
      
      const result = await organizationRepository.findByName(name);
      return unwrapResult(result);
    },
    enabled: ([name]) => Boolean(name),
    staleTime: 5 * 60 * 1000 // 5 minuter
  });
  
  /**
   * Hämtar alla organisationer som en användare är medlem i
   */
  const useUserOrganizations = createStandardizedQuery<Organization[], [string | undefined]>({
    queryKeyPrefix: 'userOrganizations',
    buildQueryKey: ([userId]) => ['organizations', 'user', userId],
    queryFn: async (userId) => {
      if (!userId) return [];
      
      const result = await organizationRepository.findByUserId(new UniqueId(userId));
      return unwrapResult(result);
    },
    enabled: ([userId]) => Boolean(userId),
    staleTime: 5 * 60 * 1000 // 5 minuter
  });
  
  // ==================== MUTATIONS ====================
  
  /**
   * Skapar en ny organisation
   */
  const useCreateOrganization = createStandardizedMutation<Organization, CreateOrganizationDTO>({
    mutationFn: async (dto) => {
      // Här skulle normalt usecase användas, men vi använder repository direkt för nu
      const result = await Organization.create({
        name: dto.name,
        ownerId: dto.ownerId
      });
      
      if (result.isErr()) {
        throw new Error(result.error);
      }
      
      const org = result.value;
      await organizationRepository.save(org);
      
      // Publicera domänevents
      org.getDomainEvents().forEach(event => {
        eventPublisher.publish(event);
      });
      
      return org;
    },
    invalidateQueryKey: (variables) => [
      ['organizations', 'user', variables.ownerId]
    ],
    onSuccess: (data) => {
      console.log(`Organisation skapad med ID: ${data.id.toString()}`);
    }
  });
  
  /**
   * Uppdaterar en organisation
   */
  const useUpdateOrganization = createStandardizedMutation<void, UpdateOrganizationDTO>({
    mutationFn: async (dto) => {
      const orgResult = await organizationRepository.findById(new UniqueId(dto.organizationId));
      if (orgResult.isErr()) {
        throw new Error(orgResult.error);
      }
      
      const org = orgResult.value;
      if (!org) {
        throw new Error('Organisationen hittades inte');
      }
      
      if (dto.name) {
        org.updateName(dto.name);
      }
      
      if (dto.settings) {
        org.updateSettings(dto.settings);
      }
      
      const saveResult = await organizationRepository.save(org);
      if (saveResult.isErr()) {
        throw new Error(saveResult.error);
      }
      
      // Publicera domänevents
      org.getDomainEvents().forEach(event => {
        eventPublisher.publish(event);
      });
    },
    invalidateQueryKey: (variables) => [
      ['organization', variables.organizationId]
    ]
  });
  
  /**
   * Lägger till ett team till en organisation
   */
  const useAddTeamToOrganization = createStandardizedMutation<void, AddTeamToOrganizationDTO>({
    mutationFn: async (dto) => {
      const result = await organizationRepository.addTeam(
        new UniqueId(dto.organizationId), 
        new UniqueId(dto.teamId)
      );
      
      return unwrapResult(result);
    },
    invalidateQueryKey: (variables) => [
      ['organization', variables.organizationId]
    ]
  });
  
  /**
   * Tar bort ett team från en organisation
   */
  const useRemoveTeamFromOrganization = createStandardizedMutation<void, RemoveTeamFromOrganizationDTO>({
    mutationFn: async (dto) => {
      const result = await organizationRepository.removeTeam(
        new UniqueId(dto.organizationId), 
        new UniqueId(dto.teamId)
      );
      
      return unwrapResult(result);
    },
    invalidateQueryKey: (variables) => [
      ['organization', variables.organizationId]
    ]
  });
  
  return {
    // Queries
    useOrganizationById,
    useOrganizationByName,
    useUserOrganizations,
    
    // Mutations
    useCreateOrganization,
    useUpdateOrganization,
    useAddTeamToOrganization,
    useRemoveTeamFromOrganization
  };
} 