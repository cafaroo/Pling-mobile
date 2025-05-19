import React, { createContext, useContext, ReactNode } from 'react';
import { OrganizationRepository } from '@/domain/organization/repositories/OrganizationRepository';
import { OrganizationService } from '@/domain/organization/services/OrganizationService';
import { GetOrganizationUseCase } from '@/application/organization/useCases/getOrganization';
import { CreateOrganizationUseCase } from '@/application/organization/useCases/createOrganization';
import { AddTeamToOrganizationUseCase } from '@/application/organization/useCases/addTeamToOrganization';
import { RemoveTeamFromOrganizationUseCase } from '@/application/organization/useCases/removeTeamFromOrganization';
import { AddOrganizationMemberUseCase } from '@/application/organization/useCases/addOrganizationMember';
import { RemoveOrganizationMemberUseCase } from '@/application/organization/useCases/removeOrganizationMember';
import { UpdateOrganizationUseCase } from '@/application/organization/useCases/updateOrganization';

// Definiera kontexttypen
export interface OrganizationContextType {
  organizationRepository: OrganizationRepository;
  organizationService: OrganizationService;
  getOrganizationUseCase: GetOrganizationUseCase;
  createOrganizationUseCase: CreateOrganizationUseCase;
  addTeamToOrganizationUseCase: AddTeamToOrganizationUseCase;
  removeTeamFromOrganizationUseCase: RemoveTeamFromOrganizationUseCase;
  addOrganizationMemberUseCase: AddOrganizationMemberUseCase;
  removeOrganizationMemberUseCase: RemoveOrganizationMemberUseCase;
  updateOrganizationUseCase: UpdateOrganizationUseCase;
}

// Skapa kontexten
const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

// Props för providern
interface OrganizationContextProviderProps {
  children: ReactNode;
  organizationRepository: OrganizationRepository;
  organizationService: OrganizationService;
  getOrganizationUseCase?: GetOrganizationUseCase;
  createOrganizationUseCase?: CreateOrganizationUseCase;
  addTeamToOrganizationUseCase?: AddTeamToOrganizationUseCase;
  removeTeamFromOrganizationUseCase?: RemoveTeamFromOrganizationUseCase;
  addOrganizationMemberUseCase?: AddOrganizationMemberUseCase;
  removeOrganizationMemberUseCase?: RemoveOrganizationMemberUseCase;
  updateOrganizationUseCase?: UpdateOrganizationUseCase;
}

/**
 * Provider för organization-kontexten
 * Ger tillgång till organisationsrepositoryt och service till alla underkomponenter
 */
export const OrganizationContextProvider: React.FC<OrganizationContextProviderProps> = ({
  children,
  organizationRepository,
  organizationService,
  getOrganizationUseCase = new GetOrganizationUseCase(organizationRepository),
  createOrganizationUseCase = new CreateOrganizationUseCase(organizationRepository),
  addTeamToOrganizationUseCase = new AddTeamToOrganizationUseCase(organizationRepository),
  removeTeamFromOrganizationUseCase = new RemoveTeamFromOrganizationUseCase(organizationRepository),
  addOrganizationMemberUseCase = new AddOrganizationMemberUseCase(organizationRepository),
  removeOrganizationMemberUseCase = new RemoveOrganizationMemberUseCase(organizationRepository),
  updateOrganizationUseCase = new UpdateOrganizationUseCase(organizationRepository)
}) => {
  return (
    <OrganizationContext.Provider
      value={{
        organizationRepository,
        organizationService,
        getOrganizationUseCase,
        createOrganizationUseCase,
        addTeamToOrganizationUseCase,
        removeTeamFromOrganizationUseCase,
        addOrganizationMemberUseCase,
        removeOrganizationMemberUseCase,
        updateOrganizationUseCase
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

/**
 * Hook för att använda organization-kontexten
 * @returns OrganizationContext med repository och service
 */
export const useOrganizationContext = (): OrganizationContextType => {
  const context = useContext(OrganizationContext);
  
  if (!context) {
    throw new Error('useOrganizationContext måste användas inom en OrganizationContextProvider');
  }
  
  return context;
}; 