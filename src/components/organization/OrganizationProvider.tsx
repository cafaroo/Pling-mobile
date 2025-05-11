import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { OrganizationRepository } from '@/domain/organization/repositories/OrganizationRepository';
import { Organization } from '@/domain/organization/entities/Organization';
import { OrganizationInvitation } from '@/domain/organization/value-objects/OrganizationInvitation';
import { UniqueId } from '@/shared/core/UniqueId';
import { useEventBus } from '@/infrastructure/events/EventBusProvider';
import { InfrastructureFactory } from '@/infrastructure/InfrastructureFactory';
import { useAuth } from '@/hooks/useAuth';

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
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supabase = useSupabaseClient();
  const eventBus = useEventBus();
  const { user } = useAuth();
  
  const [repository, setRepository] = useState<OrganizationRepository | null>(null);
  const [userOrganizations, setUserOrganizations] = useState<Organization[]>([]);
  const [userInvitations, setUserInvitations] = useState<OrganizationInvitation[]>([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(true);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);

  // Initiera repository
  useEffect(() => {
    if (supabase && eventBus) {
      const factory = InfrastructureFactory.getInstance(supabase, eventBus);
      setRepository(factory.getOrganizationRepository());
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

  const value = {
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
    refreshInvitations
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