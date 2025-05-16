/**
 * Integrationstester för organization, team och user hooks
 * 
 * Dessa tester fokuserar på hur organization-relaterade hooks interagerar med 
 * team- och användarrelaterade hooks i komplexa flöden som berör flera domäner.
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Result } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';

// Organization hooks
import { useOrganizationWithStandardHook } from '@/application/organization/hooks/useOrganizationWithStandardHook';
import { useOrganizationContext } from '@/application/organization/hooks/useOrganizationContext';

// Team hooks
import { useTeamWithStandardHook } from '@/application/team/hooks/useTeamWithStandardHook';
import { useTeamContext } from '@/application/team/hooks/useTeamContext';

// User hooks
import { useUserWithStandardHook } from '@/application/user/hooks/useUserWithStandardHook';
import { useUserContext } from '@/application/user/hooks/useUserContext';

// Domain entities
import { Organization } from '@/domain/organization/entities/Organization';
import { Team } from '@/domain/team/entities/Team';
import { User } from '@/domain/user/entities/User';
import { TeamRole } from '@/domain/team/value-objects/TeamRole';
import { OrganizationRole } from '@/domain/organization/value-objects/OrganizationRole';
import { Email } from '@/domain/user/value-objects/Email';
import { UserProfile } from '@/domain/user/value-objects/UserProfile';
import { UserSettings } from '@/domain/user/value-objects/UserSettings';
import { ResourcePermission } from '@/domain/organization/value-objects/ResourcePermission';

// Mock implementations
import { MockOrganizationRepository } from '@/test-utils/mocks/mockOrganizationRepository';
import { MockTeamRepository } from '@/test-utils/mocks/mockTeamRepository';
import { MockUserRepository } from '@/test-utils/mocks/mockUserRepository';
import { MockDomainEventPublisher } from '@/test-utils/mocks/mockDomainEventPublisher';
import { MockEntityFactory } from '@/test-utils/mocks/mockEntityFactory';

// Skapa en wrapper för att tillhandahålla QueryClient till hooks
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Mocka hooks för att returnera mockade repositories och event publisher
jest.mock('@/application/organization/hooks/useOrganizationContext');
jest.mock('@/application/team/hooks/useTeamContext');
jest.mock('@/application/user/hooks/useUserContext');

describe('Organization, Team och User Hooks Integration', () => {
  let mockOrganizationRepository: MockOrganizationRepository;
  let mockTeamRepository: MockTeamRepository;
  let mockUserRepository: MockUserRepository;
  let mockEventPublisher: MockDomainEventPublisher;
  let wrapper: React.FC<{children: React.ReactNode}>;
  
  // Testdata
  const testOrgId = 'org-123';
  const testTeamId1 = 'team-123';
  const testTeamId2 = 'team-456';
  const testUserId1 = 'user-123';
  const testUserId2 = 'user-456';
  const testUserId3 = 'user-789';
  
  let testOrg: Organization;
  let testTeam1: Team;
  let testTeam2: Team;
  let testUser1: User;
  let testUser2: User;
  let testUser3: User;
  
  beforeEach(() => {
    // Återställ mocks
    jest.clearAllMocks();
    
    // Skapa mockade repositories och event publisher
    mockOrganizationRepository = new MockOrganizationRepository();
    mockTeamRepository = new MockTeamRepository();
    mockUserRepository = new MockUserRepository();
    mockEventPublisher = new MockDomainEventPublisher();
    
    // Skapa wrapper
    wrapper = createTestWrapper();
    
    // Skapa testdata
    testUser1 = MockEntityFactory.createUser({
      id: new UniqueId(testUserId1),
      email: Email.create('user1@example.com').value,
      profile: UserProfile.create({
        firstName: 'User',
        lastName: 'One',
        displayName: 'User One'
      }).value,
      settings: UserSettings.create({
        theme: 'light',
        language: 'sv'
      }).value,
      teamIds: []
    });
    
    testUser2 = MockEntityFactory.createUser({
      id: new UniqueId(testUserId2),
      email: Email.create('user2@example.com').value,
      profile: UserProfile.create({
        firstName: 'User',
        lastName: 'Two',
        displayName: 'User Two'
      }).value,
      settings: UserSettings.create({
        theme: 'dark',
        language: 'en'
      }).value,
      teamIds: []
    });
    
    testUser3 = MockEntityFactory.createUser({
      id: new UniqueId(testUserId3),
      email: Email.create('user3@example.com').value,
      profile: UserProfile.create({
        firstName: 'User',
        lastName: 'Three',
        displayName: 'User Three'
      }).value,
      settings: UserSettings.create({
        theme: 'system',
        language: 'sv'
      }).value,
      teamIds: []
    });
    
    testOrg = MockEntityFactory.createOrganization({
      id: new UniqueId(testOrgId),
      name: 'Test Organization',
      ownerId: testUserId1,
      members: [
        { userId: new UniqueId(testUserId1), role: OrganizationRole.OWNER },
        { userId: new UniqueId(testUserId2), role: OrganizationRole.ADMIN }
      ]
    });
    
    testTeam1 = MockEntityFactory.createTeam({
      id: new UniqueId(testTeamId1),
      name: 'Test Team 1',
      description: 'First test team',
      ownerId: testUserId1,
      organizationId: testOrgId,
      members: [
        { userId: new UniqueId(testUserId1), role: TeamRole.OWNER },
        { userId: new UniqueId(testUserId2), role: TeamRole.MEMBER }
      ]
    });
    
    testTeam2 = MockEntityFactory.createTeam({
      id: new UniqueId(testTeamId2),
      name: 'Test Team 2',
      description: 'Second test team',
      ownerId: testUserId2,
      organizationId: testOrgId,
      members: [
        { userId: new UniqueId(testUserId2), role: TeamRole.OWNER }
      ]
    });
    
    // Lägg till testdata i repositories
    mockUserRepository.save(testUser1);
    mockUserRepository.save(testUser2);
    mockUserRepository.save(testUser3);
    mockOrganizationRepository.save(testOrg);
    mockTeamRepository.save(testTeam1);
    mockTeamRepository.save(testTeam2);
    
    // Konfigurera mock-implementationer för context hooks
    (useOrganizationContext as jest.Mock).mockReturnValue({
      organizationRepository: mockOrganizationRepository,
      eventPublisher: mockEventPublisher
    });
    
    (useTeamContext as jest.Mock).mockReturnValue({
      teamRepository: mockTeamRepository,
      eventPublisher: mockEventPublisher
    });
    
    (useUserContext as jest.Mock).mockReturnValue({
      userRepository: mockUserRepository,
      eventPublisher: mockEventPublisher
    });
  });
  
  it('ska lägga till en användare i en organisation och reflektera i teams', async () => {
    // Arrange - Skapa hooks
    const { result: orgHookResult } = renderHook(() => useOrganizationWithStandardHook(), { wrapper });
    const { result: teamHookResult } = renderHook(() => useTeamWithStandardHook(), { wrapper });
    const { result: userHookResult } = renderHook(() => useUserWithStandardHook(), { wrapper });
    
    // Act - Lägg till en användare i organisationen
    let addMemberResult: any;
    await act(async () => {
      addMemberResult = await orgHookResult.current.addOrganizationMember({
        organizationId: testOrgId,
        userId: testUserId3,
        role: OrganizationRole.MEMBER
      });
    });
    
    // Assert - Kontrollera att medlemmen har lagts till i organisationen
    expect(addMemberResult.isOk()).toBe(true);
    
    // Hämta organisationen igen
    let org: Organization | null = null;
    await act(async () => {
      const orgResult = await orgHookResult.current.getOrganizationById(testOrgId);
      expect(orgResult.isOk()).toBe(true);
      org = orgResult.value;
    });
    
    expect(org).not.toBeNull();
    const member = org!.members.find(m => m.userId.toString() === testUserId3);
    expect(member).toBeDefined();
    expect(member!.role).toBe(OrganizationRole.MEMBER);
    
    // Nu låt oss lägga till användaren i ett team inom organisationen
    await act(async () => {
      const addTeamMemberResult = await teamHookResult.current.addTeamMember({
        teamId: testTeamId1,
        userId: testUserId3,
        role: TeamRole.MEMBER
      });
      expect(addTeamMemberResult.isOk()).toBe(true);
    });
    
    // Hämta teamet igen
    let team: Team | null = null;
    await act(async () => {
      const teamResult = await teamHookResult.current.getTeamById(testTeamId1);
      expect(teamResult.isOk()).toBe(true);
      team = teamResult.value;
    });
    
    expect(team).not.toBeNull();
    const teamMember = team!.members.find(m => m.userId.toString() === testUserId3);
    expect(teamMember).toBeDefined();
    expect(teamMember!.role).toBe(TeamRole.MEMBER);
    
    // Kontrollera att användaren har uppdaterats med teamId
    let user: User | null = null;
    await act(async () => {
      const userResult = await userHookResult.current.getUserById(testUserId3);
      expect(userResult.isOk()).toBe(true);
      user = userResult.value;
    });
    
    expect(user).not.toBeNull();
    expect(user!.teamIds).toContain(testTeamId1);
    
    // Kontrollera att events publicerades
    const publishedEvents = mockEventPublisher.getPublishedEvents();
    
    // Bör finnas minst ett organisation-relaterat event (OrganizationMemberJoinedEvent)
    const orgEvents = publishedEvents.filter(e => e.aggregateId === testOrgId);
    expect(orgEvents.length).toBeGreaterThan(0);
    
    // Bör finnas minst ett team-relaterat event (TeamMemberJoinedEvent)
    const teamEvents = publishedEvents.filter(e => e.aggregateId === testTeamId1);
    expect(teamEvents.length).toBeGreaterThan(0);
  });
  
  it('ska ta bort en användare från en organisation och reflektera i teams', async () => {
    // Arrange - Skapa hooks
    const { result: orgHookResult } = renderHook(() => useOrganizationWithStandardHook(), { wrapper });
    const { result: teamHookResult } = renderHook(() => useTeamWithStandardHook(), { wrapper });
    const { result: userHookResult } = renderHook(() => useUserWithStandardHook(), { wrapper });
    
    // Act - Ta bort en användare från organisationen
    let removeMemberResult: any;
    await act(async () => {
      removeMemberResult = await orgHookResult.current.removeOrganizationMember({
        organizationId: testOrgId,
        userId: testUserId2
      });
    });
    
    // Assert - Kontrollera att medlemmen har tagits bort från organisationen
    expect(removeMemberResult.isOk()).toBe(true);
    
    // Hämta organisationen igen
    let org: Organization | null = null;
    await act(async () => {
      const orgResult = await orgHookResult.current.getOrganizationById(testOrgId);
      expect(orgResult.isOk()).toBe(true);
      org = orgResult.value;
    });
    
    expect(org).not.toBeNull();
    const member = org!.members.find(m => m.userId.toString() === testUserId2);
    expect(member).toBeUndefined();
    
    // Kontrollera att användaren har tagits bort från alla team i organisationen
    let team1: Team | null = null;
    let team2: Team | null = null;
    await act(async () => {
      const team1Result = await teamHookResult.current.getTeamById(testTeamId1);
      const team2Result = await teamHookResult.current.getTeamById(testTeamId2);
      expect(team1Result.isOk()).toBe(true);
      expect(team2Result.isOk()).toBe(true);
      team1 = team1Result.value;
      team2 = team2Result.value;
    });
    
    expect(team1).not.toBeNull();
    expect(team2).not.toBeNull();
    
    // Användaren bör inte vara medlem i något av teamen
    const team1Member = team1!.members.find(m => m.userId.toString() === testUserId2);
    const team2Member = team2!.members.find(m => m.userId.toString() === testUserId2);
    expect(team1Member).toBeUndefined();
    expect(team2Member).toBeUndefined();
    
    // Kontrollera att användaren har uppdaterats utan teamIds
    let user: User | null = null;
    await act(async () => {
      const userResult = await userHookResult.current.getUserById(testUserId2);
      expect(userResult.isOk()).toBe(true);
      user = userResult.value;
    });
    
    expect(user).not.toBeNull();
    expect(user!.teamIds).not.toContain(testTeamId1);
    expect(user!.teamIds).not.toContain(testTeamId2);
    
    // Kontrollera att events publicerades
    const publishedEvents = mockEventPublisher.getPublishedEvents();
    
    // Bör finnas minst ett organisation-relaterat event (OrganizationMemberLeftEvent)
    const orgEvents = publishedEvents.filter(e => e.aggregateId === testOrgId);
    expect(orgEvents.length).toBeGreaterThan(0);
    
    // Bör finnas team-relaterade events (TeamMemberLeftEvent) för båda teamen
    const team1Events = publishedEvents.filter(e => e.aggregateId === testTeamId1);
    const team2Events = publishedEvents.filter(e => e.aggregateId === testTeamId2);
    expect(team1Events.length).toBeGreaterThan(0);
    expect(team2Events.length).toBeGreaterThan(0);
  });
  
  it('ska hantera behörigheter korrekt över organizations- och team-domäner', async () => {
    // Arrange - Skapa hooks
    const { result: orgHookResult } = renderHook(() => useOrganizationWithStandardHook(), { wrapper });
    const { result: teamHookResult } = renderHook(() => useTeamWithStandardHook(), { wrapper });
    
    // Lägg till en resurs med behörigheter i organisationen
    let resourceResult: any;
    await act(async () => {
      resourceResult = await orgHookResult.current.addOrganizationResource({
        organizationId: testOrgId,
        resourceId: 'resource-123',
        resourceType: 'DOCUMENT',
        name: 'Test Resource'
      });
    });
    
    expect(resourceResult.isOk()).toBe(true);
    
    // Lägg till en behörighet för ett team till resursen
    let permissionResult: any;
    await act(async () => {
      permissionResult = await orgHookResult.current.addResourcePermission({
        organizationId: testOrgId,
        resourceId: 'resource-123',
        subjectId: testTeamId1,
        subjectType: 'TEAM',
        permission: ResourcePermission.READ
      });
    });
    
    expect(permissionResult.isOk()).toBe(true);
    
    // Kontrollera att teamet har behörighet till resursen
    let hasPermission: any;
    await act(async () => {
      hasPermission = await orgHookResult.current.checkResourcePermission({
        organizationId: testOrgId,
        resourceId: 'resource-123',
        subjectId: testTeamId1,
        permission: ResourcePermission.READ
      });
    });
    
    expect(hasPermission.isOk()).toBe(true);
    expect(hasPermission.value).toBe(true);
    
    // Men ett annat team bör inte ha behörighet
    await act(async () => {
      hasPermission = await orgHookResult.current.checkResourcePermission({
        organizationId: testOrgId,
        resourceId: 'resource-123',
        subjectId: testTeamId2,
        permission: ResourcePermission.READ
      });
    });
    
    expect(hasPermission.isOk()).toBe(true);
    expect(hasPermission.value).toBe(false);
    
    // Nu kontrollera en medlems behörighet via teamet
    let userHasPermission: any;
    await act(async () => {
      userHasPermission = await orgHookResult.current.checkUserResourcePermission({
        organizationId: testOrgId,
        resourceId: 'resource-123',
        userId: testUserId1, // Medlem i team1
        permission: ResourcePermission.READ
      });
    });
    
    expect(userHasPermission.isOk()).toBe(true);
    expect(userHasPermission.value).toBe(true);
    
    // En användare som inte är medlem i teamet bör inte ha behörighet
    await act(async () => {
      userHasPermission = await orgHookResult.current.checkUserResourcePermission({
        organizationId: testOrgId,
        resourceId: 'resource-123',
        userId: testUserId3, // Inte medlem i något team
        permission: ResourcePermission.READ
      });
    });
    
    expect(userHasPermission.isOk()).toBe(true);
    expect(userHasPermission.value).toBe(false);
  });
  
  it('ska uppdatera cachen konsekvent mellan hooks', async () => {
    // Arrange - Skapa hooks
    const { result: orgHookResult } = renderHook(() => useOrganizationWithStandardHook(), { wrapper });
    const { result: teamHookResult } = renderHook(() => useTeamWithStandardHook(), { wrapper });
    
    // Spionera på repository-anrop
    const orgRepositorySpy = jest.spyOn(mockOrganizationRepository, 'findById');
    const teamRepositorySpy = jest.spyOn(mockTeamRepository, 'findById');
    
    // Act - Hämta organization
    await act(async () => {
      const orgResult = await orgHookResult.current.getOrganizationById(testOrgId);
      expect(orgResult.isOk()).toBe(true);
    });
    
    // Hämta team
    await act(async () => {
      const teamResult = await teamHookResult.current.getTeamById(testTeamId1);
      expect(teamResult.isOk()).toBe(true);
    });
    
    // Återställ spies
    orgRepositorySpy.mockClear();
    teamRepositorySpy.mockClear();
    
    // Hämta data igen, ska komma från cache
    await act(async () => {
      const orgResult = await orgHookResult.current.getOrganizationById(testOrgId);
      expect(orgResult.isOk()).toBe(true);
    });
    
    await act(async () => {
      const teamResult = await teamHookResult.current.getTeamById(testTeamId1);
      expect(teamResult.isOk()).toBe(true);
    });
    
    // Assert - Repository ska inte ha anropats igen
    expect(orgRepositorySpy).not.toHaveBeenCalled();
    expect(teamRepositorySpy).not.toHaveBeenCalled();
    
    // Nu gör vi en ändring i organisationen som bör invalidera båda cache
    await act(async () => {
      const updateResult = await orgHookResult.current.updateOrganization({
        organizationId: testOrgId,
        name: 'Updated Organization Name'
      });
      expect(updateResult.isOk()).toBe(true);
    });
    
    // Återställ spies igen
    orgRepositorySpy.mockClear();
    teamRepositorySpy.mockClear();
    
    // Hämta data igen, organization cache bör ha invaliderats
    await act(async () => {
      const orgResult = await orgHookResult.current.getOrganizationById(testOrgId);
      expect(orgResult.isOk()).toBe(true);
      
      // Kontrollera att namnet uppdaterades
      expect(orgResult.value.name).toBe('Updated Organization Name');
    });
    
    // Assert - Organisationsrepositoryt bör ha anropats igen
    expect(orgRepositorySpy).toHaveBeenCalled();
    
    // Men team-cachen bör inte ha påverkats
    orgRepositorySpy.mockClear();
    teamRepositorySpy.mockClear();
    
    await act(async () => {
      const teamResult = await teamHookResult.current.getTeamById(testTeamId1);
      expect(teamResult.isOk()).toBe(true);
    });
    
    // Assert - Teamrepositoryt bör inte ha anropats igen
    expect(teamRepositorySpy).not.toHaveBeenCalled();
  });
}); 