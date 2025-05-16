import { TestKit, MockRepositoryFactory, MockServiceFactory, MockEntityFactory } from '../../../../test-utils';
import { CreateTeamUseCase } from '../CreateTeamUseCase';
import { CreateTeamDTO } from '../dto/CreateTeamDTO';
import { TeamCreatedEvent } from '../../../../domain/team/events/TeamCreatedEvent';

describe('CreateTeamUseCase (Standardized Tests)', () => {
  beforeEach(() => {
    // Förbered eventlyssnare för varje test
    TestKit.aggregate.setupTest();
  });

  afterEach(() => {
    // Rensa eventlyssnare efter varje test
    TestKit.aggregate.teardownTest();
  });

  it('should create a team successfully', async () => {
    // Skapa mockrepositorier
    const mockUserRepository = MockRepositoryFactory.createMockUserRepository([
      MockEntityFactory.createMockUser({ id: 'user-123', name: 'Test User' }).value
    ]);
    
    const mockTeamRepository = MockRepositoryFactory.createMockTeamRepository();
    
    const mockOrganizationRepository = MockRepositoryFactory.createMockOrganizationRepository([
      MockEntityFactory.createMockOrganization({ id: 'org-123', name: 'Test Organization' }).value
    ]);
    
    // Skapa mock för FeatureFlagService
    const mockFeatureFlagService = MockServiceFactory.createMockFeatureFlagService({
      maxTeamsPerOrganization: 10
    });
    
    // Skapa use case med mockar
    const createTeamUseCase = new CreateTeamUseCase(
      mockTeamRepository,
      mockUserRepository,
      mockOrganizationRepository,
      mockFeatureFlagService
    );
    
    // Skapa DTO för teamet som ska skapas
    const dto: CreateTeamDTO = {
      name: 'New Test Team',
      description: 'A test team created by use case',
      ownerId: 'user-123',
      organizationId: 'org-123'
    };
    
    // Anropa use case
    const result = await createTeamUseCase.execute(dto);
    
    // Verifiera resultat
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.name).toBe('New Test Team');
      expect(result.value.ownerId).toBe('user-123');
    }
    
    // Verifiera att teamet sparats i repositoryt
    const allTeams = await mockTeamRepository.findAll();
    expect(allTeams.isOk()).toBe(true);
    if (allTeams.isOk()) {
      expect(allTeams.value.length).toBe(1);
      expect(allTeams.value[0].name).toBe('New Test Team');
    }
  });

  it('should fail if organization has reached max teams', async () => {
    // Skapa mockrepositorier
    const mockUserRepository = MockRepositoryFactory.createMockUserRepository();
    
    const mockTeamRepository = MockRepositoryFactory.createMockTeamRepository();
    
    const mockOrganizationRepository = MockRepositoryFactory.createMockOrganizationRepository([
      MockEntityFactory.createMockOrganization({
        id: 'org-123',
        name: 'Test Organization',
        teamIds: ['team-1', 'team-2', 'team-3']
      }).value
    ]);
    
    // Skapa mock för FeatureFlagService som begränsar till 3 team
    const mockFeatureFlagService = MockServiceFactory.createMockFeatureFlagService({
      maxTeamsPerOrganization: 3
    });
    
    // Skapa use case med mockar
    const createTeamUseCase = new CreateTeamUseCase(
      mockTeamRepository,
      mockUserRepository,
      mockOrganizationRepository,
      mockFeatureFlagService
    );
    
    // Skapa DTO för teamet som ska skapas
    const dto: CreateTeamDTO = {
      name: 'New Test Team',
      description: 'A test team created by use case',
      ownerId: 'user-123',
      organizationId: 'org-123'
    };
    
    // Anropa use case
    const result = await createTeamUseCase.execute(dto);
    
    // Verifiera att resultatet är ett fel
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toContain('maximum');
    }
    
    // Verifiera att inget team sparats i repositoryt
    const allTeams = await mockTeamRepository.findAll();
    expect(allTeams.isOk()).toBe(true);
    if (allTeams.isOk()) {
      expect(allTeams.value.length).toBe(0);
    }
  });

  it('should fail if user does not exist', async () => {
    // Skapa mockrepositorier där userRepository alltid misslyckas
    const mockUserRepository = MockRepositoryFactory.createErrorRepository('User not found');
    
    const mockTeamRepository = MockRepositoryFactory.createMockTeamRepository();
    
    const mockOrganizationRepository = MockRepositoryFactory.createMockOrganizationRepository();
    
    // Skapa mock för FeatureFlagService
    const mockFeatureFlagService = MockServiceFactory.createMockFeatureFlagService();
    
    // Skapa use case med mockar
    const createTeamUseCase = new CreateTeamUseCase(
      mockTeamRepository,
      mockUserRepository,
      mockOrganizationRepository,
      mockFeatureFlagService
    );
    
    // Skapa DTO för teamet som ska skapas
    const dto: CreateTeamDTO = {
      name: 'New Test Team',
      description: 'A test team created by use case',
      ownerId: 'user-123',
      organizationId: 'org-123'
    };
    
    // Anropa use case
    const result = await createTeamUseCase.execute(dto);
    
    // Verifiera att resultatet är ett fel
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toContain('User not found');
    }
  });

  it('should create a team and trigger events', async () => {
    // Skapa mockrepositorier
    const mockUserRepository = MockRepositoryFactory.createMockUserRepository([
      MockEntityFactory.createMockUser({ id: 'user-123', name: 'Test User' }).value
    ]);
    
    const mockTeamRepository = MockRepositoryFactory.createMockTeamRepository();
    
    const mockOrganizationRepository = MockRepositoryFactory.createMockOrganizationRepository([
      MockEntityFactory.createMockOrganization({ id: 'org-123', name: 'Test Organization' }).value
    ]);
    
    // Skapa mock för FeatureFlagService
    const mockFeatureFlagService = MockServiceFactory.createMockFeatureFlagService();
    
    // Skapa use case med mockar
    const createTeamUseCase = new CreateTeamUseCase(
      mockTeamRepository,
      mockUserRepository,
      mockOrganizationRepository,
      mockFeatureFlagService
    );
    
    // Skapa DTO för teamet som ska skapas
    const dto: CreateTeamDTO = {
      name: 'New Test Team',
      description: 'A test team created by use case',
      ownerId: 'user-123',
      organizationId: 'org-123'
    };
    
    // Anropa use case
    await createTeamUseCase.execute(dto);
    
    // Verifiera att event har publicerats
    const events = TestKit.events.getEvents();
    expect(events.length).toBeGreaterThan(0);
    
    // Verifiera att TeamCreatedEvent publicerades
    const teamCreatedEvent = TestKit.events.findEvent(TeamCreatedEvent);
    expect(teamCreatedEvent).toBeDefined();
    if (teamCreatedEvent) {
      expect(teamCreatedEvent.name).toBe('New Test Team');
      expect(teamCreatedEvent.ownerId).toBe('user-123');
      expect(teamCreatedEvent.organizationId).toBe('org-123');
    }
  });
}); 