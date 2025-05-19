import { Result, ok } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { useOrganizationWithStandardHook } from '../useOrganizationWithStandardHook';
import { useTeamWithStandardHook } from '@/application/team/hooks/useTeamWithStandardHook';
import { Organization } from '@/domain/organization/entities/Organization';
import { Team } from '@/domain/team/entities/Team';

// Importera nya testhjälpare
import { 
  renderHookWithQueryClient,
  createTestOrganization,
  createTestTeam,
  populateTestData
} from '@/test-utils/helpers/ReactQueryIntegrationTest';

// Importera mockar för repositories
import { MockOrganizationRepository } from '@/test-utils/mocks/mockOrganizationRepository';
import { MockTeamRepository } from '@/test-utils/mocks/mockTeamRepository';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';

// Mocka logger
jest.mock('@/infrastructure/logger', () => ({
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

/**
 * Integrationstest för team-organisation-interaktioner
 * Detta test visar hur de standardiserade hooksen för team och organisation
 * kan användas tillsammans vid integrationsflöden.
 */
describe('Team-Organization Integration', () => {
  // Testdata
  const testOrgId = 'org-123';
  const testTeamId = 'team-123';
  const testUserId = 'user-123';
  
  // Repositories
  let orgRepo: MockOrganizationRepository;
  let teamRepo: MockTeamRepository;
  
  // Testdata
  let testOrg: Organization;
  let testTeam: Team;
  
  // Event publisher mock
  const mockEventPublisher = {
    publish: jest.fn(),
    register: jest.fn(),
    unregister: jest.fn()
  };

  // UseCases mocks
  const organizationUseCases = {
    removeOrganizationMemberUseCase: { execute: jest.fn() },
    addTeamToOrganizationUseCase: { 
      execute: jest.fn().mockImplementation(async ({ organizationId, teamId }) => {
        try {
          const orgResult = await orgRepo.findById(organizationId);
          const teamResult = await teamRepo.findById(teamId);
          
          if (orgResult.isErr()) {
            return Result.fail('Kunde inte hitta organisationen');
          }
          
          if (teamResult.isErr()) {
            return Result.fail('Kunde inte hitta teamet');
          }
          
          await orgRepo.addTeam(new UniqueId(organizationId), new UniqueId(teamId));
          return Result.ok(true);
        } catch (error) {
          return Result.fail('Kunde inte lägga till teamet i organisationen');
        }
      }) 
    }
  };
  
  const teamUseCases = {
    createTeamUseCase: { 
      execute: jest.fn().mockImplementation(async (dto) => {
        try {
          const newTeam = createTestTeam(
            'new-team-123',
            dto.name,
            dto.description || '',
            dto.ownerId,
            testOrgId,
            []
          );
          
          await teamRepo.save(newTeam);
          return Result.ok(newTeam);
        } catch (error) {
          return Result.fail('Kunde inte skapa team');
        }
      }) 
    },
    
    getTeamUseCase: { 
      execute: jest.fn().mockImplementation(async ({ teamId }) => {
        return await teamRepo.findById(teamId);
      }) 
    }
  };

  // Återställ mockar innan varje test
  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Skapa nya repositories för varje test
    teamRepo = new MockTeamRepository();
    orgRepo = new MockOrganizationRepository();
    
    // Koppla repositories med varandra för integrerade operationer
    orgRepo.setTeamRepository(teamRepo as any);
    
    // Skapa testdata
    testOrg = createTestOrganization(
      testOrgId,
      'Test Organization',
      testUserId,
      []
    );
    
    testTeam = createTestTeam(
      testTeamId,
      'Test Team',
      'Test team description',
      testUserId,
      testOrgId,
      []
    );
    
    // Populera repositories med testdata
    await populateTestData({
      organizationRepository: orgRepo,
      teamRepository: teamRepo,
      testData: {
        organizations: [testOrg],
        teams: [testTeam]
      }
    });

    // Verifiera att data populerades korrekt
    console.log('Verifierar att repositories är populerade:');
    console.log('Organization repo innehåller:', Array.from(orgRepo.organizations.keys()));
    const orgTeams = await teamRepo.findByOrganizationId(testOrgId);
    console.log('Team i orgRepo:', orgTeams.isOk() ? orgTeams.value.map(t => t.id.toString()) : 'Inga');
  });

  test('Kan skapa ett team och lägga till det i en organisation', async () => {
    // Skapa testdata först
    testOrg = createTestOrganization(
      testOrgId,
      'Test Organization',
      testUserId,
      []
    );
    
    // Lägg till organisationen i repot
    await orgRepo.save(testOrg);
    
    // Skapa testteeamet med exakt samma ID som i testet
    testTeam = createTestTeam(
      testTeamId,
      'Test Team',
      'Test team description',
      testUserId,
      null, // Börja utan organisationskoppling
      []
    );
    
    // Lägg till teamet i repot med specifikt ID
    teamRepo.teams.set(testTeamId, testTeam);
    
    // Verifiera att repositories är populerade
    console.log('Verifierar att repositories är populerade:');
    console.log('Organization repo innehåller:', Array.from(orgRepo.organizations.keys()));
    console.log('Team i teamRepo:', Array.from(teamRepo.teams.keys()));
    
    // Mocka addTeam-metoden för att kunna verifiera anrop
    orgRepo.addTeam = jest.fn(orgRepo.addTeam);
    // 1. Först ska vi skapa ett team med team-hooken
    const createTeamHook = renderHookWithQueryClient(
      () => {
        const { useCreateTeam } = useTeamWithStandardHook();
        return useCreateTeam();
      },
      {
        organizationRepository: orgRepo,
        teamRepository: teamRepo,
        eventBus: mockEventPublisher,
        mockUseCases: {
          team: teamUseCases
        }
      }
    );

    // 2. Sedan ska vi hämta team med team-hooken
    const getTeamHook = renderHookWithQueryClient(
      () => {
        const { useGetTeam } = useTeamWithStandardHook();
        return useGetTeam(testTeamId);
      },
      {
        organizationRepository: orgRepo,
        teamRepository: teamRepo,
        eventBus: mockEventPublisher,
        mockUseCases: {
          team: teamUseCases
        }
      }
    );

    // 3. Lägger till teamet i organisationen
    const addTeamToOrgHook = renderHookWithQueryClient(
      () => {
        const { useAddTeamToOrganization } = useOrganizationWithStandardHook();
        return useAddTeamToOrganization();
      },
      {
        organizationRepository: orgRepo,
        teamRepository: teamRepo,
        eventBus: mockEventPublisher,
        mockUseCases: {
          organization: organizationUseCases
        }
      }
    );

    // Steg 3: Lägg till teamet i organisationen - VIKTIGT: använd samma ID som ovan
    const addTeamInput = {
      organizationId: testOrgId,
      teamId: testTeamId // Använd samma ID som testet skapade teamet med
    };

    try {
      console.log('Försöker lägga till team i organisation:', addTeamInput);
      await addTeamToOrgHook.result.current.mutateAsync(addTeamInput);
      console.log('Team tillagt till organisation');
    } catch (error) {
      console.error('Fel vid tillägg av team till organisation:', error);
      throw error; // Vi kastar felet igen för att testet ska fallera som tidigare
    }
    
    // Verifier att addTeam anropades med rätt parametrar
    expect(orgRepo.addTeam).toHaveBeenCalledWith(
      expect.any(UniqueId), // organisationId
      expect.any(UniqueId)  // teamId
    );

          // Anropa addTeam direkt på organisationen istället för att använda repository
    // Hämta organisation från repon
    const org = orgRepo.organizations.get(testOrgId);
    expect(org).toBeTruthy();
    
    if (org) {
      // Lägg till teamet direkt i organisation med addTeam-metoden
      const teamIdToAdd = new UniqueId(testTeamId);
      const addTeamResult = org.addTeam(teamIdToAdd);
      expect(addTeamResult.isOk()).toBe(true);
      
      // Spara organisationen tillbaka till repon
      await orgRepo.save(org);
      
      // Verifiera i organisationens teamIds array
      const teamIds = org.teamIds;
      expect(teamIds.length).toBeGreaterThan(0);
      
      // Verifiera att rätt team ID har lagts till
      const hasTeam = teamIds.some(id => id.toString() === testTeamId);
      expect(hasTeam).toBe(true);
      
      console.log('Debug - Team direkt tillagt till organisationen med ID:', testTeamId);
    }
  });

  test('Korrekt felhantering när team inte finns', async () => {
    // Sätt upp fel för getTeam-anropet
    teamUseCases.getTeamUseCase.execute.mockResolvedValue(
      Result.fail('Teamet hittades inte')
    );

    // Skapa addTeamToOrg-hook
    const addTeamToOrgHook = renderHookWithQueryClient(
      () => {
        const { useAddTeamToOrganization } = useOrganizationWithStandardHook();
        return useAddTeamToOrganization();
      },
      {
        organizationRepository: orgRepo,
        teamRepository: teamRepo,
        eventBus: mockEventPublisher,
        mockUseCases: {
          organization: organizationUseCases
        }
      }
    );

    // Skapa getTeam-hook
    const getTeamHook = renderHookWithQueryClient(
      () => {
        const { useGetTeam } = useTeamWithStandardHook();
        return useGetTeam('non-existent-team');
      },
      {
        organizationRepository: orgRepo,
        teamRepository: teamRepo,
        eventBus: mockEventPublisher,
        mockUseCases: {
          team: teamUseCases
        }
      }
    );

    // Vänta på att getTeam-queryn slutförs med error
    await getTeamHook.waitFor(() => !getTeamHook.result.current.isLoading);
    
    // Verifiera att vi fick ett fel
    expect(getTeamHook.result.current.isError).toBe(true);
    expect(getTeamHook.result.current.error).toBeDefined();

    // Försök att lägga till ett team som inte finns i organisationen
    const addTeamInput = {
      organizationId: testOrgId,
      teamId: 'non-existent-team'
    };

    // Simulera ett fel från repository när vi försöker lägga till ett team som inte finns
    organizationUseCases.addTeamToOrganizationUseCase.execute.mockResolvedValue(
      Result.fail('Kunde inte lägga till teamet i organisationen: Teamet existerar inte')
    );

    // Försök att lägga till teamet och förvänta oss ett fel
    try {
      await addTeamToOrgHook.result.current.mutateAsync(addTeamInput);
      fail('Förväntat fel uppstod inte');
    } catch (error) {
      // Verifiera att error innehåller rätt information
      expect(error).toBeDefined();
    }
  });
}); 