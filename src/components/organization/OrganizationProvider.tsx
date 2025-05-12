import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { OrganizationRepository } from '@/domain/organization/repositories/OrganizationRepository';
import { Organization } from '@/domain/organization/entities/Organization';
import { OrganizationInvitation } from '@/domain/organization/value-objects/OrganizationInvitation';
import { UniqueId } from '@/shared/core/UniqueId';
import { useEventBus } from '@/infrastructure/events/EventBusProvider';
import { InfrastructureFactory } from '@/infrastructure/InfrastructureFactory';
import { useAuth } from '@/hooks/useAuth';
import { OrganizationResource } from '@/domain/organization/entities/OrganizationResource';
import { ResourceType } from '@/domain/organization/value-objects/ResourceType';
import { ResourcePermission } from '@/domain/organization/value-objects/ResourcePermission';
import { NoOpSubscriptionService, ResourceLimitType, SubscriptionPlan, SubscriptionStatus } from '@/domain/organization/interfaces/SubscriptionService';

// Uppdatera Team interface
interface Team {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  createdAt: Date;
}

interface OrganizationContextValue {
  userOrganizations: Organization[];
  userInvitations: OrganizationInvitation[];
  loadingOrganizations: boolean;
  loadingInvitations: boolean;
  currentOrganization: Organization | null;
  setCurrentOrganization: (org: Organization | null) => void;
  createOrganization: (name: string) => Promise<{ success: boolean; error?: string }>;
  updateOrganization: (
    id: string,
    data: { name?: string }
  ) => Promise<{ success: boolean; error?: string }>;
  getOrganizationById: (id: string) => Promise<Organization | null>;
  inviteUserToOrganization: (
    organizationId: string,
    userId: string,
    email: string
  ) => Promise<{ success: boolean; error?: string }>;
  acceptInvitation: (
    invitationId: string
  ) => Promise<{ success: boolean; error?: string }>;
  declineInvitation: (
    invitationId: string
  ) => Promise<{ success: boolean; error?: string }>;
  refreshInvitations: () => Promise<void>;
  // Team-relaterade metoder
  getOrganizationTeams: (organizationId: string) => Promise<Team[]>;
  createTeam: (organizationId: string, teamData: { name: string; description?: string }) => 
    Promise<{ success: boolean; teamId?: string; error?: string }>;
  loadingTeams: boolean;
  
  // Resurshantering
  getResourceById: (resourceId: string) => Promise<OrganizationResource | null>;
  getResourcesByOrganizationId: (organizationId: string) => Promise<OrganizationResource[]>;
  getResourcesByType: (organizationId: string, type: ResourceType) => Promise<OrganizationResource[]>;
  getAccessibleResources: (organizationId: string) => Promise<OrganizationResource[]>;
  createResource: (data: {
    name: string;
    description?: string;
    type: ResourceType;
    organizationId: string;
    metadata?: Record<string, any>;
  }) => Promise<{success: boolean, resourceId?: string, error?: string}>;
  updateResource: (resourceId: string, data: {
    name?: string;
    description?: string;
    ownerId?: string;
    metadata?: Record<string, any>;
  }) => Promise<{success: boolean, error?: string}>;
  deleteResource: (resourceId: string) => Promise<{success: boolean, error?: string}>;
  addResourcePermission: (
    resourceId: string, 
    userId?: string, 
    teamId?: string, 
    role?: string, 
    permissions?: ResourcePermission[]
  ) => Promise<{success: boolean, error?: string}>;
  removeResourcePermission: (
    resourceId: string, 
    userId?: string, 
    teamId?: string, 
    role?: string
  ) => Promise<{success: boolean, error?: string}>;
  loadingResources: boolean;
  
  // Nya metoder för prenumerationsfunktionalitet
  hasActiveSubscription: (organizationId: string) => Promise<boolean>;
  getSubscriptionStatus: (organizationId: string) => Promise<SubscriptionStatus | null>;
  canPerformResourceAction: (
    organizationId: string,
    limitType: ResourceLimitType,
    additionalUsage?: number
  ) => Promise<{ allowed: boolean; message: string | null }>;
  getSubscriptionManagementUrl: (organizationId: string) => Promise<string | null>;
  getAvailablePlans: () => Promise<SubscriptionPlan[]>;
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supabase = useSupabaseClient();
  const eventBus = useEventBus();
  const { user } = useAuth();
  
  const [repository, setRepository] = useState<OrganizationRepository | null>(null);
  const [resourceRepository, setResourceRepository] = useState<any>(null);
  const [userOrganizations, setUserOrganizations] = useState<Organization[]>([]);
  const [userInvitations, setUserInvitations] = useState<OrganizationInvitation[]>([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(true);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingResources, setLoadingResources] = useState(false);

  // Skapa en instans av NoOpSubscriptionService för utvecklingsläge
  // I produktion skulle denna ersättas med en riktig implementation
  const subscriptionService = useMemo(() => new NoOpSubscriptionService(), []);

  // Initiera repositories
  useEffect(() => {
    if (supabase && eventBus) {
      const factory = InfrastructureFactory.getInstance(supabase, eventBus);
      setRepository(factory.getOrganizationRepository());
      setResourceRepository(factory.getOrganizationResourceRepository());
    }
  }, [supabase, eventBus]);

  // Ladda användarens organisationer
  useEffect(() => {
    const loadUserOrganizations = async () => {
      if (!repository || !user) return;
      
      setLoadingOrganizations(true);
      try {
        const userId = new UniqueId(user.id);
        const result = await repository.findByMemberId(userId);
        
        if (result.isOk()) {
          setUserOrganizations(result.value);
          
          // Om användaren endast har en organisation, sätt den som aktiv
          if (result.value.length === 1 && !currentOrganization) {
            setCurrentOrganization(result.value[0]);
          }
        } else {
          console.error('Fel vid hämtning av användarens organisationer:', result.error);
        }
      } catch (error) {
        console.error('Fel vid hämtning av användarens organisationer:', error);
      } finally {
        setLoadingOrganizations(false);
      }
    };

    loadUserOrganizations();
  }, [repository, user, currentOrganization]);

  // Ladda användarens inbjudningar
  useEffect(() => {
    loadUserInvitations();
  }, [repository, user]);

  const loadUserInvitations = async () => {
    if (!repository || !user) return;
    
    setLoadingInvitations(true);
    try {
      const userId = new UniqueId(user.id);
      const result = await repository.findInvitationsByUserId(userId);
      
      if (result.isOk()) {
        setUserInvitations(result.value);
      } else {
        console.error('Fel vid hämtning av användarens inbjudningar:', result.error);
      }
    } catch (error) {
      console.error('Fel vid hämtning av användarens inbjudningar:', error);
    } finally {
      setLoadingInvitations(false);
    }
  };

  const refreshInvitations = async () => {
    await loadUserInvitations();
  };

  // Skapa ny organisation
  const createOrganization = async (name: string) => {
    if (!repository || !user) {
      return { success: false, error: 'Inte inloggad eller repository ej tillgängligt' };
    }

    try {
      const organizationResult = Organization.create({
        name,
        ownerId: user.id
      });

      if (organizationResult.isErr()) {
        return { success: false, error: organizationResult.error };
      }

      const saveResult = await repository.save(organizationResult.value);
      
      if (saveResult.isErr()) {
        return { success: false, error: saveResult.error };
      }

      // Ladda om användarens organisationer
      const userId = new UniqueId(user.id);
      const refreshResult = await repository.findByMemberId(userId);
      
      if (refreshResult.isOk()) {
        setUserOrganizations(refreshResult.value);
        
        // Hitta den nya organisationen och sätt den som aktiv
        const newOrg = refreshResult.value.find(
          org => org.name === name && org.ownerId.toString() === user.id
        );
        
        if (newOrg) {
          setCurrentOrganization(newOrg);
        }
      }

      // Efter att ha hämtat organization-instansen, injicera subscriptionService
      if (organizationResult.isOk()) {
        const organization = organizationResult.value;
        organization.setSubscriptionService(subscriptionService);
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Okänt fel' 
      };
    }
  };

  // Uppdatera organisation
  const updateOrganization = async (id: string, data: { name?: string }) => {
    if (!repository) {
      return { success: false, error: 'Repository ej tillgängligt' };
    }

    try {
      const orgId = new UniqueId(id);
      const getResult = await repository.findById(orgId);
      
      if (getResult.isErr()) {
        return { success: false, error: getResult.error };
      }

      const organization = getResult.value;
      const updateResult = organization.update({
        name: data.name
      });

      if (updateResult.isErr()) {
        return { success: false, error: updateResult.error };
      }

      const saveResult = await repository.save(organization);
      
      if (saveResult.isErr()) {
        return { success: false, error: saveResult.error };
      }

      // Uppdatera lokala tillstånd
      if (currentOrganization?.id.equals(orgId)) {
        setCurrentOrganization(organization);
      }

      setUserOrganizations(prev => 
        prev.map(org => org.id.equals(orgId) ? organization : org)
      );

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Okänt fel' 
      };
    }
  };

  // Bjud in användare till organisation
  const inviteUserToOrganization = async (organizationId: string, userId: string, email: string) => {
    if (!repository || !user) {
      return { success: false, error: 'Inte inloggad eller repository ej tillgängligt' };
    }

    try {
      const orgId = new UniqueId(organizationId);
      const targetUserId = new UniqueId(userId);
      const invitedBy = new UniqueId(user.id);

      const orgResult = await repository.findById(orgId);
      if (orgResult.isErr()) {
        return { success: false, error: orgResult.error };
      }

      const organization = orgResult.value;
      const inviteResult = organization.inviteUser(targetUserId, email, invitedBy);
      
      if (inviteResult.isErr()) {
        return { success: false, error: inviteResult.error };
      }

      const saveResult = await repository.save(organization);
      if (saveResult.isErr()) {
        return { success: false, error: saveResult.error };
      }

      // Uppdatera lokala tillstånd
      if (currentOrganization?.id.equals(orgId)) {
        setCurrentOrganization(organization);
      }

      setUserOrganizations(prev => 
        prev.map(org => org.id.equals(orgId) ? organization : org)
      );

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Okänt fel' 
      };
    }
  };

  // Acceptera inbjudan
  const acceptInvitation = async (invitationId: string) => {
    if (!repository || !user) {
      return { success: false, error: 'Inte inloggad eller repository ej tillgängligt' };
    }

    try {
      const invId = new UniqueId(invitationId);
      const userId = new UniqueId(user.id);

      // Hitta inbjudningen
      const invitation = userInvitations.find(inv => inv.id?.equals(invId));
      if (!invitation) {
        return { success: false, error: 'Inbjudan hittas inte' };
      }

      // Hämta organisationen
      const orgResult = await repository.findById(invitation.organizationId);
      if (orgResult.isErr()) {
        return { success: false, error: orgResult.error };
      }

      const organization = orgResult.value;
      const acceptResult = organization.acceptInvitation(invId, userId);
      
      if (acceptResult.isErr()) {
        return { success: false, error: acceptResult.error };
      }

      const saveResult = await repository.save(organization);
      if (saveResult.isErr()) {
        return { success: false, error: saveResult.error };
      }

      // Uppdatera inbjudningar och organisationer
      await refreshInvitations();
      
      const refreshResult = await repository.findByMemberId(userId);
      if (refreshResult.isOk()) {
        setUserOrganizations(refreshResult.value);
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Okänt fel' 
      };
    }
  };

  // Avböj inbjudan
  const declineInvitation = async (invitationId: string) => {
    if (!repository || !user) {
      return { success: false, error: 'Inte inloggad eller repository ej tillgängligt' };
    }

    try {
      const invId = new UniqueId(invitationId);
      const userId = new UniqueId(user.id);

      // Hitta inbjudningen
      const invitation = userInvitations.find(inv => inv.id?.equals(invId));
      if (!invitation) {
        return { success: false, error: 'Inbjudan hittas inte' };
      }

      // Hämta organisationen
      const orgResult = await repository.findById(invitation.organizationId);
      if (orgResult.isErr()) {
        return { success: false, error: orgResult.error };
      }

      const organization = orgResult.value;
      const declineResult = organization.declineInvitation(invId, userId);
      
      if (declineResult.isErr()) {
        return { success: false, error: declineResult.error };
      }

      const saveResult = await repository.save(organization);
      if (saveResult.isErr()) {
        return { success: false, error: saveResult.error };
      }

      // Uppdatera inbjudningar
      await refreshInvitations();

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Okänt fel' 
      };
    }
  };

  // Hämta organisation via ID
  const getOrganizationById = async (id: string): Promise<Organization | null> => {
    if (!repository) return null;

    try {
      const orgId = new UniqueId(id);
      const result = await repository.findById(orgId);
      
      return result.isOk() ? result.value : null;
    } catch (error) {
      console.error('Fel vid hämtning av organisation:', error);
      return null;
    }
  };

  // Hämta organisationens team
  const getOrganizationTeams = async (organizationId: string): Promise<Team[]> => {
    if (!supabase) {
      console.error('Supabase ej tillgänglig');
      return [];
    }

    setLoadingTeams(true);
    try {
      // Anropa Supabase för att hämta team för organisationen
      const { data, error } = await supabase
        .from('team_organizations')
        .select(`
          team_id,
          v2_teams (
            id,
            name,
            description,
            created_at,
            team_members (count)
          )
        `)
        .eq('organization_id', organizationId);

      if (error) {
        console.error('Fel vid hämtning av organisationens team:', error);
        return [];
      }

      // Formatera data till Team-objekt
      const teams: Team[] = data.map(item => ({
        id: item.v2_teams.id,
        name: item.v2_teams.name,
        description: item.v2_teams.description,
        memberCount: item.v2_teams.team_members_count,
        createdAt: new Date(item.v2_teams.created_at)
      }));

      return teams;
    } catch (error) {
      console.error('Fel vid hämtning av organisationens team:', error);
      return [];
    } finally {
      setLoadingTeams(false);
    }
  };

  // Skapa nytt team och koppla till organisationen
  const createTeam = async (
    organizationId: string, 
    teamData: { name: string; description?: string }
  ): Promise<{ success: boolean; teamId?: string; error?: string }> => {
    if (!supabase || !user) {
      return { success: false, error: 'Inte inloggad eller Supabase ej tillgänglig' };
    }

    try {
      // 1. Skapa nytt team
      const { data: teamData, error: teamError } = await supabase
        .from('v2_teams')
        .insert({
          name: teamData.name,
          description: teamData.description || '',
          created_by: user.id,
          status: 'active',
          max_members: 10, // Standard värde, kan ändras beroende på organisations-prenumeration
          settings: {}
        })
        .select()
        .single();

      if (teamError) {
        return { success: false, error: teamError.message };
      }

      // 2. Lägg till kopplingen mellan team och organisation
      const { error: linkError } = await supabase
        .from('team_organizations')
        .insert({
          team_id: teamData.id,
          organization_id: organizationId
        });

      if (linkError) {
        return { success: false, error: linkError.message };
      }

      // 3. Lägg till användaren som teammedlem (leader)
      const { error: memberError } = await supabase
        .from('v2_team_members')
        .insert({
          team_id: teamData.id,
          user_id: user.id,
          role: 'leader',
          status: 'active'
        });

      if (memberError) {
        return { success: false, error: memberError.message };
      }

      return { success: true, teamId: teamData.id };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Okänt fel vid skapande av team' 
      };
    }
  };

  // Resursfunktioner
  const getResourceById = async (resourceId: string): Promise<OrganizationResource | null> => {
    if (!resourceRepository) return null;
    
    try {
      setLoadingResources(true);
      const id = new UniqueId(resourceId);
      const result = await resourceRepository.findById(id);
      return result.isOk() ? result.value : null;
    } catch (error) {
      console.error('Fel vid hämtning av resurs:', error);
      return null;
    } finally {
      setLoadingResources(false);
    }
  };

  const getResourcesByOrganizationId = async (organizationId: string): Promise<OrganizationResource[]> => {
    if (!resourceRepository) return [];
    
    try {
      setLoadingResources(true);
      const orgId = new UniqueId(organizationId);
      const result = await resourceRepository.findByOrganizationId(orgId);
      return result.isOk() ? result.value : [];
    } catch (error) {
      console.error('Fel vid hämtning av resurser för organisation:', error);
      return [];
    } finally {
      setLoadingResources(false);
    }
  };

  const getResourcesByType = async (organizationId: string, type: ResourceType): Promise<OrganizationResource[]> => {
    if (!resourceRepository) return [];
    
    try {
      setLoadingResources(true);
      const orgId = new UniqueId(organizationId);
      const result = await resourceRepository.findByType(orgId, type);
      return result.isOk() ? result.value : [];
    } catch (error) {
      console.error(`Fel vid hämtning av resurser av typ ${type}:`, error);
      return [];
    } finally {
      setLoadingResources(false);
    }
  };

  const getAccessibleResources = async (organizationId: string): Promise<OrganizationResource[]> => {
    if (!resourceRepository || !user) return [];
    
    try {
      setLoadingResources(true);
      const orgId = new UniqueId(organizationId);
      const userId = new UniqueId(user.id);
      const result = await resourceRepository.findAccessibleByUserId(orgId, userId);
      return result.isOk() ? result.value : [];
    } catch (error) {
      console.error('Fel vid hämtning av tillgängliga resurser:', error);
      return [];
    } finally {
      setLoadingResources(false);
    }
  };

  const createResource = async (data: {
    name: string;
    description?: string;
    type: ResourceType;
    organizationId: string;
    metadata?: Record<string, any>;
  }): Promise<{success: boolean, resourceId?: string, error?: string}> => {
    if (!resourceRepository || !user) {
      return { success: false, error: 'Inte inloggad eller repository ej tillgängligt' };
    }

    try {
      setLoadingResources(true);
      
      // Skapa resursdata
      const resourceData = {
        name: data.name,
        description: data.description,
        type: data.type,
        organizationId: data.organizationId,
        ownerId: user.id,
        metadata: data.metadata || {}
      };
      
      // Skapa resursen via domänmodellen
      const resourceResult = OrganizationResource.create(resourceData);
      if (resourceResult.isErr()) {
        return { success: false, error: resourceResult.error };
      }
      
      // Spara via repository
      const saveResult = await resourceRepository.save(resourceResult.value);
      if (saveResult.isErr()) {
        return { success: false, error: saveResult.error };
      }
      
      return { success: true, resourceId: resourceResult.value.id.toString() };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Okänt fel vid skapande av resurs' 
      };
    } finally {
      setLoadingResources(false);
    }
  };

  const updateResource = async (resourceId: string, data: {
    name?: string;
    description?: string;
    ownerId?: string;
    metadata?: Record<string, any>;
  }): Promise<{success: boolean, error?: string}> => {
    if (!resourceRepository) {
      return { success: false, error: 'Repository ej tillgängligt' };
    }

    try {
      setLoadingResources(true);
      
      // Hämta resursen
      const resourceResult = await resourceRepository.findById(new UniqueId(resourceId));
      if (resourceResult.isErr()) {
        return { success: false, error: `Kunde inte hitta resursen: ${resourceResult.error}` };
      }
      
      // Uppdatera resursen
      const resource = resourceResult.value;
      const updateResult = resource.update(data);
      if (updateResult.isErr()) {
        return { success: false, error: updateResult.error };
      }
      
      // Spara resursen
      const saveResult = await resourceRepository.save(resource);
      if (saveResult.isErr()) {
        return { success: false, error: saveResult.error };
      }
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Okänt fel vid uppdatering av resurs' 
      };
    } finally {
      setLoadingResources(false);
    }
  };

  const deleteResource = async (resourceId: string): Promise<{success: boolean, error?: string}> => {
    if (!resourceRepository) {
      return { success: false, error: 'Repository ej tillgängligt' };
    }

    try {
      setLoadingResources(true);
      
      // Ta bort resursen
      const deleteResult = await resourceRepository.delete(new UniqueId(resourceId));
      if (deleteResult.isErr()) {
        return { success: false, error: deleteResult.error };
      }
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Okänt fel vid borttagning av resurs' 
      };
    } finally {
      setLoadingResources(false);
    }
  };

  const addResourcePermission = async (
    resourceId: string, 
    userId?: string, 
    teamId?: string, 
    role?: string, 
    permissions: ResourcePermission[] = []
  ): Promise<{success: boolean, error?: string}> => {
    if (!resourceRepository) {
      return { success: false, error: 'Repository ej tillgängligt' };
    }

    try {
      setLoadingResources(true);
      
      // Hämta resursen
      const resourceResult = await resourceRepository.findById(new UniqueId(resourceId));
      if (resourceResult.isErr()) {
        return { success: false, error: `Kunde inte hitta resursen: ${resourceResult.error}` };
      }
      
      // Skapa behörighetstilldelning
      const resource = resourceResult.value;
      const permissionAssignment = {
        userId: userId ? new UniqueId(userId) : undefined,
        teamId: teamId ? new UniqueId(teamId) : undefined,
        role,
        permissions
      };
      
      // Lägg till behörighet
      const addResult = resource.addPermission(permissionAssignment);
      if (addResult.isErr()) {
        return { success: false, error: addResult.error };
      }
      
      // Spara resurs
      const saveResult = await resourceRepository.save(resource);
      if (saveResult.isErr()) {
        return { success: false, error: saveResult.error };
      }
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Okänt fel vid tillägg av resursbehörighet' 
      };
    } finally {
      setLoadingResources(false);
    }
  };

  const removeResourcePermission = async (
    resourceId: string, 
    userId?: string, 
    teamId?: string, 
    role?: string
  ): Promise<{success: boolean, error?: string}> => {
    if (!resourceRepository) {
      return { success: false, error: 'Repository ej tillgängligt' };
    }

    try {
      setLoadingResources(true);
      
      // Hämta resursen
      const resourceResult = await resourceRepository.findById(new UniqueId(resourceId));
      if (resourceResult.isErr()) {
        return { success: false, error: `Kunde inte hitta resursen: ${resourceResult.error}` };
      }
      
      // Ta bort behörighet
      const resource = resourceResult.value;
      const removeResult = resource.removePermission(
        userId ? new UniqueId(userId) : undefined,
        teamId ? new UniqueId(teamId) : undefined,
        role
      );
      
      if (removeResult.isErr()) {
        return { success: false, error: removeResult.error };
      }
      
      // Spara resurs
      const saveResult = await resourceRepository.save(resource);
      if (saveResult.isErr()) {
        return { success: false, error: saveResult.error };
      }
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Okänt fel vid borttagning av resursbehörighet' 
      };
    } finally {
      setLoadingResources(false);
    }
  };

  // Implementera de nya metoderna
  const hasActiveSubscription = async (organizationId: string): Promise<boolean> => {
    const orgResult = await repository?.findById(new UniqueId(organizationId));
    if (orgResult.isErr()) {
      return false;
    }
    
    const organization = orgResult.value;
    organization.setSubscriptionService(subscriptionService);
    return await organization.hasActiveSubscription();
  };
  
  const getSubscriptionStatus = async (organizationId: string): Promise<SubscriptionStatus | null> => {
    const result = await subscriptionService.getSubscriptionStatus(organizationId);
    if (result.isErr()) {
      console.error('Fel vid hämtning av prenumerationsstatus:', result.error);
      return null;
    }
    return result.value;
  };
  
  const canPerformResourceAction = async (
    organizationId: string,
    limitType: ResourceLimitType,
    additionalUsage: number = 1
  ): Promise<{ allowed: boolean; message: string | null }> => {
    const orgResult = await repository?.findById(new UniqueId(organizationId));
    if (orgResult.isErr()) {
      return { allowed: false, message: 'Organisationen kunde inte hittas' };
    }
    
    const organization = orgResult.value;
    organization.setSubscriptionService(subscriptionService);
    
    const result = await organization.canPerformResourceAction(limitType, additionalUsage);
    if (result.isErr()) {
      return { allowed: false, message: result.error };
    }
    
    return { allowed: true, message: null };
  };
  
  const getSubscriptionManagementUrl = async (organizationId: string): Promise<string | null> => {
    const result = await subscriptionService.getSubscriptionManagementUrl(organizationId);
    if (result.isErr()) {
      console.error('Fel vid hämtning av prenumerations-URL:', result.error);
      return null;
    }
    return result.value;
  };
  
  const getAvailablePlans = async (): Promise<SubscriptionPlan[]> => {
    const result = await subscriptionService.getAvailablePlans();
    if (result.isErr()) {
      console.error('Fel vid hämtning av tillgängliga planer:', result.error);
      return [];
    }
    return result.value;
  };

  // Value for the context
  const value: OrganizationContextValue = {
    userOrganizations,
    userInvitations,
    loadingOrganizations,
    loadingInvitations,
    currentOrganization,
    setCurrentOrganization,
    createOrganization,
    updateOrganization,
    getOrganizationById,
    inviteUserToOrganization,
    acceptInvitation,
    declineInvitation,
    refreshInvitations,
    // Team-relaterade metoder
    getOrganizationTeams,
    createTeam,
    loadingTeams,
    // Resurshantering
    getResourceById,
    getResourcesByOrganizationId,
    getResourcesByType,
    getAccessibleResources,
    createResource,
    updateResource,
    deleteResource,
    addResourcePermission,
    removeResourcePermission,
    loadingResources,
    // Nya metoder för prenumerationsfunktionalitet
    hasActiveSubscription,
    getSubscriptionStatus,
    canPerformResourceAction,
    getSubscriptionManagementUrl,
    getAvailablePlans
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  
  if (context === undefined) {
    throw new Error('useOrganization måste användas inom en OrganizationProvider');
  }
  
  return context;
}; 