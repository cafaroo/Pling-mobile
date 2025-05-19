import { Result } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { useOrganizationWithStandardHook } from '../useOrganizationWithStandardHook';
import { useOrganizationContext } from '../useOrganizationContext';
import { Organization } from '@/domain/organization/entities/Organization';
import { renderHookWithQueryClient } from '@/test-utils/helpers/ReactQueryTestHelper';

// Mocka beroenden
jest.mock('@/infrastructure/logger', () => ({
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

jest.mock('../useOrganizationContext', () => ({
  useOrganizationContext: jest.fn(),
}));

// Mocka Organization.create statisk metod
jest.mock('@/domain/organization/entities/Organization', () => {
  const originalModule = jest.requireActual('@/domain/organization/entities/Organization');
  return {
    ...originalModule,
    Organization: {
      ...originalModule.Organization,
      create: jest.fn()
    }
  };
});

/**
 * Förenklade "direkta" tester för useOrganizationWithStandardHook
 * I dessa tester anropar vi direkt mutateAsync för att undvika 
 * problem med React Query's livscykel och timing
 */
describe('useOrganizationWithStandardHook - Direct Tests', () => {
  // Mock data
  const mockOrganization = { 
    id: new UniqueId('org-123'), 
    name: 'Test Organization',
    ownerId: 'user-123',
    getDomainEvents: jest.fn().mockReturnValue([]),
    updateName: jest.fn(),
    updateSettings: jest.fn(),
  } as unknown as Organization;

  // Mockade repository-metoder
  const mockOrganizationRepository = {
    findById: jest.fn(),
    findByName: jest.fn(),
    findByUserId: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    exists: jest.fn(),
    getTeams: jest.fn(),
    addTeam: jest.fn(),
    removeTeam: jest.fn()
  };

  // Mock eventPublisher
  const mockEventPublisher = {
    publish: jest.fn(),
    registerHandler: jest.fn(),
    clearHandlers: jest.fn()
  };

  // Mock organisationService
  const mockOrganizationService = {
    addMember: jest.fn(),
    removeMember: jest.fn(),
    getMembers: jest.fn(),
    getMemberRole: jest.fn(),
    updateMemberRole: jest.fn()
  };

  // Återställ mockar innan varje test
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useOrganizationContext as jest.Mock).mockReturnValue({
      organizationRepository: mockOrganizationRepository,
      organizationService: mockOrganizationService,
      eventPublisher: mockEventPublisher
    });

    // Ställ in förväntade returvärden
    mockOrganizationRepository.findById.mockResolvedValue(Result.ok(mockOrganization));
    mockOrganizationRepository.save.mockResolvedValue(Result.ok(undefined));
    mockOrganizationRepository.addTeam.mockResolvedValue(Result.ok(undefined));
    mockOrganizationRepository.removeTeam.mockResolvedValue(Result.ok(undefined));
    
    // Mocka Organization.create
    (Organization.create as jest.Mock).mockResolvedValue(Result.ok(mockOrganization));
  });

  test('useCreateOrganization anropar korrekt med rätt parametrar', async () => {
    // Rendera hook
    const { result } = renderHookWithQueryClient(() => {
      const { useCreateOrganization } = useOrganizationWithStandardHook();
      return useCreateOrganization();
    });

    // Förbered input data
    const createOrgInput = {
      name: 'New Test Organization',
      ownerId: 'user-123'
    };

    // Anropa mutateAsync direkt
    await result.current.mutateAsync(createOrgInput);

    // Verifiera att create anropades med rätt parametrar
    expect(Organization.create).toHaveBeenCalledWith(createOrgInput);
    // Verifiera att save anropades med organsationen från create
    expect(mockOrganizationRepository.save).toHaveBeenCalled();
  });

  test('useUpdateOrganization anropar repository med korrekta parametrar', async () => {
    // Rendera hook
    const { result } = renderHookWithQueryClient(() => {
      const { useUpdateOrganization } = useOrganizationWithStandardHook();
      return useUpdateOrganization();
    });

    // Förbered input data
    const updateOrgInput = {
      organizationId: 'org-123',
      name: 'Updated Org Name',
      settings: { newSetting: true }
    };

    // Anropa mutateAsync direkt
    await result.current.mutateAsync(updateOrgInput);

    // Verifiera att findById anropades med rätt ID
    expect(mockOrganizationRepository.findById).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'org-123' })
    );
    
    // Verifiera att updateName och updateSettings anropades med rätt parametrar
    expect(mockOrganization.updateName).toHaveBeenCalledWith('Updated Org Name');
    expect(mockOrganization.updateSettings).toHaveBeenCalledWith({ newSetting: true });
    
    // Verifiera att save anropades med den uppdaterade organisationen
    expect(mockOrganizationRepository.save).toHaveBeenCalledWith(mockOrganization);
  });

  test('useAddTeamToOrganization anropar repository med korrekta parametrar', async () => {
    // Rendera hook
    const { result } = renderHookWithQueryClient(() => {
      const { useAddTeamToOrganization } = useOrganizationWithStandardHook();
      return useAddTeamToOrganization();
    });

    // Förbered input data
    const addTeamInput = {
      organizationId: 'org-123',
      teamId: 'team-456'
    };

    // Anropa mutateAsync direkt
    await result.current.mutateAsync(addTeamInput);

    // Verifiera att addTeam anropades med rätt parametrar
    expect(mockOrganizationRepository.addTeam).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'org-123' }),
      expect.objectContaining({ value: 'team-456' })
    );
  });

  test('useRemoveTeamFromOrganization anropar repository med korrekta parametrar', async () => {
    // Rendera hook
    const { result } = renderHookWithQueryClient(() => {
      const { useRemoveTeamFromOrganization } = useOrganizationWithStandardHook();
      return useRemoveTeamFromOrganization();
    });

    // Förbered input data
    const removeTeamInput = {
      organizationId: 'org-123',
      teamId: 'team-456'
    };

    // Anropa mutateAsync direkt
    await result.current.mutateAsync(removeTeamInput);

    // Verifiera att removeTeam anropades med rätt parametrar
    expect(mockOrganizationRepository.removeTeam).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'org-123' }),
      expect.objectContaining({ value: 'team-456' })
    );
  });
}); 