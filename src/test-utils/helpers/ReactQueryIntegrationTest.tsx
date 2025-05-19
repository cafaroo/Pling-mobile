import React from 'react';
import { renderHook, act, RenderHookResult } from '@testing-library/react-hooks';
import { HooksIntegrationTestWrapper } from './HooksIntegrationTestWrapper';
import { QueryClient } from '@tanstack/react-query';
import { createMockEventBus } from './HooksIntegrationTestWrapper';
import { Result, ok } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { Organization } from '@/domain/organization/entities/Organization';
import { Team } from '@/domain/team/entities/Team';
import { OrganizationRole } from '@/domain/organization/value-objects/OrganizationRole';
import { TeamRole, TeamRoleEnum } from '@/domain/team/value-objects/TeamRole';
import { TeamMember } from '@/domain/team/entities/TeamMember';
import { TeamSettings } from '@/domain/team/entities/TeamSettings';
import { TeamName } from '@/domain/team/value-objects/TeamName';
import { TeamDescription } from '@/domain/team/value-objects/TeamDescription';
import { OrganizationMember } from '@/domain/organization/entities/OrganizationMember';
import { createTestQueryClient } from '../ReactQueryTestProvider';
import { OrganizationName } from '@/domain/organization/value-objects/OrganizationName';
import { OrgSettings } from '@/domain/organization/value-objects/OrgSettings';

// Standard väntealternativ för hooks-tester
export const WAIT_OPTIONS = {
  timeout: 10000,
  interval: 50
};

// Type för hook-resultat med tilläggsmetoder
interface ExtendedRenderHookResult<TResult, TProps> extends RenderHookResult<TProps, TResult> {
  waitFor: (callback: () => boolean | void, options?: { timeout?: number, interval?: number }) => Promise<void>;
  waitForNextUpdate: (options?: { timeout?: number }) => Promise<void>;
  queryClient: QueryClient;
}

/**
 * Render en hook med QueryClient och alla nödvändiga providers
 */
export function renderHookWithQueryClient<TProps, TResult>(
  callback: (props: TProps) => TResult,
  {
    initialProps,
    wrapper: customWrapper,
    organizationRepository,
    teamRepository,
    userRepository,
    eventBus,
    mockUseCases,
    queryClient
  }: {
    initialProps?: TProps;
    wrapper?: React.ComponentType<any>;
    organizationRepository?: any;
    teamRepository?: any;
    userRepository?: any;
    eventBus?: any;
    mockUseCases?: any;
    queryClient?: QueryClient;
  } = {}
): ExtendedRenderHookResult<TResult, TProps> {
  // Använd alltid vår förbättrade QueryClient för tester om ingen annan anges
  const qc = queryClient || createTestQueryClient();
  const eventPublisher = eventBus || createMockEventBus();

  // Om en custom wrapper finns, kombinera den med HooksIntegrationTestWrapper
  const TestWrapper: React.FC<{children: React.ReactNode}> = ({ children }) => {
    if (customWrapper) {
      const CustomWrapper = customWrapper;
      return (
        <HooksIntegrationTestWrapper
          queryClient={qc}
          organizationRepository={organizationRepository}
          teamRepository={teamRepository}
          userRepository={userRepository}
          eventBus={eventPublisher}
          mockUseCases={mockUseCases}
        >
          <CustomWrapper>{children}</CustomWrapper>
        </HooksIntegrationTestWrapper>
      );
    }

    return (
      <HooksIntegrationTestWrapper
        queryClient={qc}
        organizationRepository={organizationRepository}
        teamRepository={teamRepository}
        userRepository={userRepository}
        eventBus={eventPublisher}
        mockUseCases={mockUseCases}
      >
        {children}
      </HooksIntegrationTestWrapper>
    );
  };

  const result = renderHook(callback, {
    wrapper: TestWrapper,
    initialProps
  });

  // Skapa en waitFor-funktion som låter oss vänta på villkor
  const waitFor = async (
    callback: () => boolean | void,
    options = WAIT_OPTIONS
  ): Promise<void> => {
    const timeout = options.timeout || 5000;
    const interval = options.interval || 50;
    const startTime = Date.now();

    while (true) {
      try {
        const result = callback();
        // Om callback returnerar true eller undefined, avsluta väntandet
        if (result === true || result === undefined) {
          return;
        }
      } catch (error) {
        // Om callback kastar fel, fortsätt vänta
      }

      // Kontrollera timeout
      if (Date.now() - startTime > timeout) {
        throw new Error(`waitFor timeout efter ${timeout}ms`);
      }

      // Vänta intervall
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  };

  // Skapa en waitForNextUpdate-funktion
  const waitForNextUpdate = async (options = { timeout: 5000 }): Promise<void> => {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const cleanup = result.waitForNextUpdate().then(() => {
        cleanup();
        resolve();
      });
      
      setTimeout(() => {
        cleanup();
        reject(new Error(`waitForNextUpdate timeout efter ${options.timeout}ms`));
      }, options.timeout);
    });
  };

  // Returnera utökat resultat med extra hjälpmetoder
  return {
    ...result,
    waitFor,
    waitForNextUpdate,
    queryClient: qc
  };
}

/**
 * Hjälpfunktion för att populera testdata i repositories
 */
export async function populateTestData(options: {
  organizationRepository?: any;
  teamRepository?: any;
  userRepository?: any;
  testData?: {
    organizations?: any[];
    teams?: any[];
    users?: any[];
  };
}) {
  const { organizationRepository, teamRepository, userRepository, testData = {} } = options;
  
  // Populera users
  if (userRepository && testData.users) {
    for (const user of testData.users) {
      if (user.id) {
        await userRepository.save(user);
      }
    }
  }
  
  // Populera organizations
  if (organizationRepository && testData.organizations) {
    for (const org of testData.organizations) {
      if (org.id) {
        await organizationRepository.save(org);
      }
    }
  }
  
  // Populera teams
  if (teamRepository && testData.teams) {
    for (const team of testData.teams) {
      if (team.id) {
        await teamRepository.save(team);
      }
    }
  }
}

/**
 * Hjälpfunktion för att skapa testteam
 */
export function createTestTeam(
  id: string, 
  name: string, 
  description: string, 
  ownerId: string,
  organizationId: string | null,
  extraMembers: {userId: string, role: TeamRoleEnum}[] = []
): Team {
  try {
    // Skapa TeamName och TeamDescription värde-objekt
    const nameResult = TeamName.create(name);
    if (nameResult.isErr()) {
      throw new Error(`Kunde inte skapa TeamName: ${nameResult.error}`);
    }
    
    const descriptionResult = TeamDescription.create(description);
    if (descriptionResult.isErr()) {
      throw new Error(`Kunde inte skapa TeamDescription: ${descriptionResult.error}`);
    }
    
    // Skapa ägare som medlem
    const ownerRoleResult = TeamRole.create(TeamRoleEnum.OWNER);
    if (ownerRoleResult.isErr()) {
      throw new Error(`Kunde inte skapa ägarroll: ${ownerRoleResult.error}`);
    }
    
    const ownerMemberResult = TeamMember.create({
      userId: new UniqueId(ownerId),
      role: ownerRoleResult.value
    });
    
    if (ownerMemberResult.isErr()) {
      throw new Error(`Kunde inte skapa ägarmedlem: ${ownerMemberResult.error}`);
    }
    
    // Skapa ytterligare medlemmar
    const members = [ownerMemberResult.value];
    
    for (const extraMember of extraMembers) {
      const roleResult = TeamRole.create(extraMember.role);
      if (roleResult.isErr()) {
        throw new Error(`Kunde inte skapa medlemsroll: ${roleResult.error}`);
      }
      
      const memberResult = TeamMember.create({
        userId: new UniqueId(extraMember.userId),
        role: roleResult.value
      });
      
      if (memberResult.isErr()) {
        throw new Error(`Kunde inte skapa medlem: ${memberResult.error}`);
      }
      
      members.push(memberResult.value);
    }
    
    // Skapa team direkt istället för via Team.create för att undvika name.trim-felet
    const now = new Date();
    const settings = TeamSettings.createDefault().value;
    
    const team = new Team({
      id: new UniqueId(id),
      name: nameResult.value,
      description: descriptionResult.value,
      ownerId: new UniqueId(ownerId),
      organizationId: organizationId ? new UniqueId(organizationId) : null,
      members: members,
      settings: settings,
      createdAt: now,
      updatedAt: now
    });
    
    return team;
  } catch (error) {
    throw new Error(`Kunde inte skapa team: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Hjälpfunktion för att skapa testorganisation
 */
export function createTestOrganization(
  id: string,
  name: string,
  ownerId: string,
  extraMembers: {userId: string, role: string}[] = []
): Organization {
  try {
    // Skapa OrganizationName värde-objekt
    const nameResult = OrganizationName.create(name);
    if (nameResult.isErr()) {
      throw new Error(`Kunde inte skapa OrganizationName: ${nameResult.error}`);
    }
    
    // Förberedelser för att skapa organisationen
    const orgId = new UniqueId(id);
    const ownerUniqueId = new UniqueId(ownerId);
    
    // Skapa standardinställningar
    const settingsResult = OrgSettings.create();
    if (settingsResult.isErr()) {
      throw new Error(`Kunde inte skapa organisationsinställningar: ${settingsResult.error}`);
    }
    
    // Skapa ägare som medlem
    const ownerMemberResult = OrganizationMember.create({
      userId: ownerUniqueId,
      role: OrganizationRole.OWNER
    });
    
    if (ownerMemberResult.isErr()) {
      throw new Error(`Kunde inte skapa ägarmedlem: ${ownerMemberResult.error}`);
    }
    
    // Skapa ytterligare medlemmar
    const members = [ownerMemberResult.value];
    
    for (const extraMember of extraMembers) {
      // Konvertera rollsträngen till OrganizationRole
      let role = OrganizationRole.MEMBER; // Standard
      
      if (extraMember.role === 'OWNER') {
        role = OrganizationRole.OWNER;
      } else if (extraMember.role === 'ADMIN') {
        role = OrganizationRole.ADMIN;
      } else if (extraMember.role === 'MEMBER') {
        role = OrganizationRole.MEMBER;
      } else if (extraMember.role === 'INVITED') {
        role = OrganizationRole.INVITED;
      }
      
      const memberResult = OrganizationMember.create({
        userId: new UniqueId(extraMember.userId),
        role: role
      });
      
      if (memberResult.isErr()) {
        throw new Error(`Kunde inte skapa medlem: ${memberResult.error}`);
      }
      
      members.push(memberResult.value);
    }
    
    // Skapa organisation
    const now = new Date();
    
    // Skapa organisationen direkt (kringgår vanliga Organization.create för att kunna specificera id)
    const organization = new Organization({
      id: orgId,
      name: nameResult.value.toString(),
      ownerId: ownerUniqueId,
      settings: settingsResult.value,
      members: members,
      invitations: [],
      teamIds: [],
      createdAt: now,
      updatedAt: now
    });
    
    return organization;
  } catch (error) {
    throw new Error(`Kunde inte skapa organisation: ${error instanceof Error ? error.message : String(error)}`);
  }
} 