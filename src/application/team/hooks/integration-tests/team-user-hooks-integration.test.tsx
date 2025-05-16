/**
 * Integrationstester för team och user hooks
 * 
 * Dessa tester fokuserar på hur team-relaterade och användarrelaterade hooks
 * interagerar med varandra och med domänlagret. Till skillnad från enhetstester
 * för individuella hooks, testar detta flödet genom flera hooks och repositories.
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Result } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';

// Team hooks
import { useTeamWithStandardHook } from '@/application/team/hooks/useTeamWithStandardHook';
import { useTeamContext } from '@/application/team/hooks/useTeamContext';

// User hooks
import { useUserWithStandardHook } from '@/application/user/hooks/useUserWithStandardHook';
import { useUserContext } from '@/application/user/hooks/useUserContext';

// Domain entities
import { Team } from '@/domain/team/entities/Team';
import { User } from '@/domain/user/entities/User';
import { TeamMember } from '@/domain/team/entities/TeamMember';
import { TeamRole } from '@/domain/team/value-objects/TeamRole';
import { Email } from '@/domain/user/value-objects/Email';
import { UserProfile } from '@/domain/user/value-objects/UserProfile';
import { UserSettings } from '@/domain/user/value-objects/UserSettings';

// Mock implementations
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
jest.mock('@/application/team/hooks/useTeamContext');
jest.mock('@/application/user/hooks/useUserContext');

describe('Team och User Hooks Integration', () => {
  let mockTeamRepository: MockTeamRepository;
  let mockUserRepository: MockUserRepository;
  let mockEventPublisher: MockDomainEventPublisher;
  let wrapper: React.FC<{children: React.ReactNode}>;
  
  // Testdata
  const testUserId = 'user-123';
  const testTeamId = 'team-456';
  let testUser: User;
  let testTeam: Team;
  
  beforeEach(() => {
    // Återställ mocks
    jest.clearAllMocks();
    
    // Skapa mockade repositories och event publisher
    mockTeamRepository = new MockTeamRepository();
    mockUserRepository = new MockUserRepository();
    mockEventPublisher = new MockDomainEventPublisher();
    
    // Skapa wrapper
    wrapper = createTestWrapper();
    
    // Skapa testdata
    testUser = MockEntityFactory.createUser({
      id: new UniqueId(testUserId),
      email: Email.create('test@example.com').value,
      profile: UserProfile.create({
        firstName: 'Test',
        lastName: 'User',
        displayName: 'TestUser'
      }).value,
      settings: UserSettings.create({
        theme: 'light',
        language: 'sv'
      }).value,
      teamIds: []
    });
    
    testTeam = MockEntityFactory.createTeam({
      id: new UniqueId(testTeamId),
      name: 'Test Team',
      description: 'Test Team Description',
      ownerId: testUserId,
      members: []
    });
    
    // Lägg till användaren och teamet i repositories
    mockUserRepository.save(testUser);
    mockTeamRepository.save(testTeam);
    
    // Konfigurera mock-implementationer för context hooks
    (useTeamContext as jest.Mock).mockReturnValue({
      teamRepository: mockTeamRepository,
      eventPublisher: mockEventPublisher
    });
    
    (useUserContext as jest.Mock).mockReturnValue({
      userRepository: mockUserRepository,
      eventPublisher: mockEventPublisher
    });
  });
  
  it('ska lägga till en användare i ett team och uppdatera användarens teamlista', async () => {
    // Arrange - Skapa hooks
    const { result: teamHookResult } = renderHook(() => useTeamWithStandardHook(), { wrapper });
    const { result: userHookResult } = renderHook(() => useUserWithStandardHook(), { wrapper });
    
    // Act - Lägg till användaren i teamet
    let addMemberResult: any;
    await act(async () => {
      addMemberResult = await teamHookResult.current.addTeamMember({
        teamId: testTeamId,
        userId: testUserId,
        role: TeamRole.MEMBER
      });
    });
    
    // Assert - Kontrollera att medlemmen har lagts till i teamet
    expect(addMemberResult.isOk()).toBe(true);
    
    // Hämta teamet igen
    let team: Team | null = null;
    await act(async () => {
      const teamResult = await teamHookResult.current.getTeamById(testTeamId);
      expect(teamResult.isOk()).toBe(true);
      team = teamResult.value;
    });
    
    expect(team).not.toBeNull();
    expect(team!.members.length).toBe(1);
    expect(team!.members[0].userId.toString()).toBe(testUserId);
    expect(team!.members[0].role).toBe(TeamRole.MEMBER);
    
    // Hämta användaren och kontrollera att teamId har lagts till
    let user: User | null = null;
    await act(async () => {
      const userResult = await userHookResult.current.getUserById(testUserId);
      expect(userResult.isOk()).toBe(true);
      user = userResult.value;
    });
    
    expect(user).not.toBeNull();
    expect(user!.teamIds).toContain(testTeamId);
    
    // Kontrollera att events publicerades
    const publishedEvents = mockEventPublisher.getPublishedEvents();
    expect(publishedEvents.length).toBeGreaterThan(0);
    
    // Bör finnas minst ett team-relaterat event (TeamMemberJoinedEvent)
    const teamEvents = publishedEvents.filter(e => e.aggregateId === testTeamId);
    expect(teamEvents.length).toBeGreaterThan(0);
  });
  
  it('ska hantera borttagning av användare från team korrekt', async () => {
    // Arrange - Skapa en användare som redan är medlem i teamet
    await act(async () => {
      const addMemberResult = await mockTeamRepository.addMember(
        new UniqueId(testTeamId),
        new UniqueId(testUserId),
        TeamRole.MEMBER
      );
      expect(addMemberResult.isOk()).toBe(true);
      
      // Uppdatera även användaren med teamet
      testUser.addTeam(new UniqueId(testTeamId));
      await mockUserRepository.save(testUser);
    });
    
    // Verifiera att användaren är medlem i teamet
    let initialTeam = await mockTeamRepository.findById(new UniqueId(testTeamId));
    expect(initialTeam.isOk()).toBe(true);
    expect(initialTeam.value.members.length).toBe(1);
    
    // Skapa hooks
    const { result: teamHookResult } = renderHook(() => useTeamWithStandardHook(), { wrapper });
    const { result: userHookResult } = renderHook(() => useUserWithStandardHook(), { wrapper });
    
    // Act - Ta bort användaren från teamet
    let removeMemberResult: any;
    await act(async () => {
      removeMemberResult = await teamHookResult.current.removeTeamMember({
        teamId: testTeamId,
        userId: testUserId
      });
    });
    
    // Assert - Kontrollera att medlemmen har tagits bort från teamet
    expect(removeMemberResult.isOk()).toBe(true);
    
    // Hämta teamet igen
    let team: Team | null = null;
    await act(async () => {
      const teamResult = await teamHookResult.current.getTeamById(testTeamId);
      expect(teamResult.isOk()).toBe(true);
      team = teamResult.value;
    });
    
    expect(team).not.toBeNull();
    expect(team!.members.length).toBe(0);
    
    // Hämta användaren och kontrollera att teamId har tagits bort
    let user: User | null = null;
    await act(async () => {
      const userResult = await userHookResult.current.getUserById(testUserId);
      expect(userResult.isOk()).toBe(true);
      user = userResult.value;
    });
    
    expect(user).not.toBeNull();
    expect(user!.teamIds).not.toContain(testTeamId);
    
    // Kontrollera att events publicerades
    const publishedEvents = mockEventPublisher.getPublishedEvents();
    
    // Bör finnas minst ett team-relaterat event (TeamMemberLeftEvent)
    const teamEvents = publishedEvents.filter(e => e.aggregateId === testTeamId);
    expect(teamEvents.length).toBeGreaterThan(0);
  });
  
  it('ska cachea data korrekt mellan olika hooks', async () => {
    // Arrange - Skapa hooks
    const { result: teamHookResult } = renderHook(() => useTeamWithStandardHook(), { wrapper });
    const { result: userHookResult } = renderHook(() => useUserWithStandardHook(), { wrapper });
    
    // Act - Hämta data med den första hooken
    await act(async () => {
      const teamResult = await teamHookResult.current.getTeamById(testTeamId);
      expect(teamResult.isOk()).toBe(true);
    });
    
    // Spionera på repository-anrop
    const teamRepositorySpy = jest.spyOn(mockTeamRepository, 'findById');
    const userRepositorySpy = jest.spyOn(mockUserRepository, 'findById');
    
    // Hämta samma data igen, ska komma från cache
    await act(async () => {
      const teamResult = await teamHookResult.current.getTeamById(testTeamId);
      expect(teamResult.isOk()).toBe(true);
    });
    
    // Assert - Repository ska inte ha anropats igen
    expect(teamRepositorySpy).not.toHaveBeenCalled();
    
    // Uppdatera teamet via användar-hooken (ändrar användarens relation till teamet)
    await act(async () => {
      await userHookResult.current.updateUserTeams({
        userId: testUserId,
        teamIds: [testTeamId]
      });
    });
    
    // Nu ska cachen ha invaliderats och repository-anrop ska ske igen
    teamRepositorySpy.mockClear();
    await act(async () => {
      const teamResult = await teamHookResult.current.getTeamById(testTeamId);
      expect(teamResult.isOk()).toBe(true);
    });
    
    // Assert - Repository ska ha anropats igen efter cache-invalidering
    expect(teamRepositorySpy).toHaveBeenCalled();
  });
  
  it('ska hantera felfall korrekt över hooks', async () => {
    // Arrange - Skapa en situation där repository kastar fel
    const errorMessage = 'Repository error';
    mockTeamRepository.findById = jest.fn().mockImplementation(() => {
      return Result.err(new Error(errorMessage));
    });
    
    // Skapa hooks
    const { result: teamHookResult } = renderHook(() => useTeamWithStandardHook(), { wrapper });
    
    // Act - Försök hämta team
    let teamResult: any;
    await act(async () => {
      teamResult = await teamHookResult.current.getTeamById(testTeamId);
    });
    
    // Assert - Felhantering
    expect(teamResult.isErr()).toBe(true);
    expect(teamResult.error.message).toContain(errorMessage);
    
    // Kontrollera att hooks exponerar felet korrekt
    // Eftersom vi använder useStandardizedOperation bör felstatus exponeras
    const { result: hookWithStatusResult } = renderHook(
      () => teamHookResult.current.useGetTeamById(testTeamId),
      { wrapper }
    );
    
    // Vänta på att hook-operationen slutförs
    await waitFor(() => {
      expect(hookWithStatusResult.current.isError).toBe(true);
    });
    
    expect(hookWithStatusResult.current.error).toBeDefined();
    expect(hookWithStatusResult.current.error!.message).toContain(errorMessage);
  });
}); 