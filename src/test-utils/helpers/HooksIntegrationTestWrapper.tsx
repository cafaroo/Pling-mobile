import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OrganizationContextProvider } from '@/application/organization/providers/OrganizationContextProvider';
import { TeamContextProvider } from '@/application/team/providers/TeamContextProvider';
import { UserContextProvider } from '@/application/user/providers/UserContextProvider';
import { MockOrganizationRepository } from '@/test-utils/mocks/mockOrganizationRepository';
import { MockTeamRepository } from '@/test-utils/mocks/mockTeamRepository';
import { MockUserRepository } from '@/test-utils/mocks/mockUserRepository';
import { ReactQueryTestProvider, createTestQueryClient } from '../ReactQueryTestProvider';
import { DefaultOrganizationService } from '@/domain/organization/services/DefaultOrganizationService';
import { DefaultTeamService } from '@/domain/team/services/DefaultTeamService';
import { DefaultUserService } from '@/domain/user/services/DefaultUserService';

/**
 * Skapar en mockad eventbus för tester
 */
export function createMockEventBus() {
  return {
    publish: jest.fn(),
    register: jest.fn(),
    unregister: jest.fn()
  };
}

/**
 * Wrapper-komponent för hooks-integrationstester
 * Denna komponent tillhandahåller alla nödvändiga providers för hooks-tester
 */
export const HooksIntegrationTestWrapper: React.FC<{
  children: React.ReactNode;
  queryClient: any;
  organizationRepository?: any;
  teamRepository?: any;
  userRepository?: any;
  eventBus?: any;
  mockUseCases?: any;
}> = ({
  children,
  queryClient,
  organizationRepository,
  teamRepository,
  userRepository,
  eventBus = createMockEventBus(),
  mockUseCases = {}
}) => {
  // Skapa services om repositories finns
  const organizationService = organizationRepository ? 
    new DefaultOrganizationService(organizationRepository, eventBus) : 
    undefined;
    
  const teamService = teamRepository ?
    new DefaultTeamService(teamRepository, eventBus) :
    undefined;
    
  const userService = userRepository ?
    new DefaultUserService(userRepository, eventBus) :
    undefined;

  // Skapa innehållet stegvis med provisioners
  let content = children;
  
  // Wrap med UserContextProvider om repository finns
  if (userRepository && userService) {
    content = (
      <UserContextProvider
        userRepository={userRepository}
        userService={userService}
      >
        {content}
      </UserContextProvider>
    );
  }
  
  // Wrap med TeamContextProvider om repository finns
  if (teamRepository && teamService) {
    content = (
      <TeamContextProvider
        teamRepository={teamRepository}
        teamService={teamService}
      >
        {content}
      </TeamContextProvider>
    );
  }
  
  // Wrap med OrganizationContextProvider om repository finns
  if (organizationRepository && organizationService) {
    content = (
      <OrganizationContextProvider
        organizationRepository={organizationRepository}
        organizationService={organizationService}
      >
        {content}
      </OrganizationContextProvider>
    );
  }
  
  // Slutligen wrap alltid med QueryClientProvider
  return (
    <QueryClientProvider client={queryClient}>
      {content}
    </QueryClientProvider>
  );
}; 