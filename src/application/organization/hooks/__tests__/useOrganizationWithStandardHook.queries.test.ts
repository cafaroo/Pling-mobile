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

describe('useOrganizationWithStandardHook - Queries', () => {
  // Mock data
  const mockOrganization = { 
    id: new UniqueId('org-123'), 
    name: 'Test Organization',
    ownerId: 'user-123',
    getDomainEvents: jest.fn().mockReturnValue([]),
  } as unknown as Organization;

  const mockOrganizations = [
    { 
      id: new UniqueId('org-123'), 
      name: 'First Organization',
      ownerId: 'user-123'
    },
    { 
      id: new UniqueId('org-456'), 
      name: 'Second Organization',
      ownerId: 'user-123'
    }
  ] as unknown as Organization[];

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
    mockOrganizationRepository.findByName.mockResolvedValue(Result.ok(mockOrganization));
    mockOrganizationRepository.findByUserId.mockResolvedValue(Result.ok(mockOrganizations));
  });

  test('useOrganizationById hämtar organisation med ID', async () => {
    // Rendera hooken
    const { result, waitFor } = renderHookWithQueryClient(() => {
      const { useOrganizationById } = useOrganizationWithStandardHook();
      return useOrganizationById('org-123');
    });

    // Vänta på att data har laddats
    await waitFor(() => !result.current.isLoading);

    // Verifiera resultatet
    expect(mockOrganizationRepository.findById).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'org-123' })
    );
    expect(result.current.data).toEqual(mockOrganization);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  test('useOrganizationById returnerar null när organizationId är undefined', async () => {
    // Rendera hooken med undefined organizationId
    const { result, waitFor } = renderHookWithQueryClient(() => {
      const { useOrganizationById } = useOrganizationWithStandardHook();
      return useOrganizationById(undefined);
    });

    // Vänta på att query är inaktiv
    await waitFor(() => !result.current.isLoading);

    // Verifiera att findById inte anropades
    expect(mockOrganizationRepository.findById).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
  });

  test('useOrganizationByName hämtar organisation med namn', async () => {
    // Rendera hooken
    const { result, waitFor } = renderHookWithQueryClient(() => {
      const { useOrganizationByName } = useOrganizationWithStandardHook();
      return useOrganizationByName('Test Organization');
    });

    // Vänta på att data har laddats
    await waitFor(() => !result.current.isLoading);

    // Verifiera resultatet
    expect(mockOrganizationRepository.findByName).toHaveBeenCalledWith('Test Organization');
    expect(result.current.data).toEqual(mockOrganization);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  test('useUserOrganizations hämtar organisationer för användare', async () => {
    // Rendera hooken
    const { result, waitFor } = renderHookWithQueryClient(() => {
      const { useUserOrganizations } = useOrganizationWithStandardHook();
      return useUserOrganizations('user-123');
    });

    // Vänta på att data har laddats
    await waitFor(() => !result.current.isLoading);

    // Verifiera resultatet
    expect(mockOrganizationRepository.findByUserId).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'user-123' })
    );
    expect(result.current.data).toEqual(mockOrganizations);
    expect(result.current.data).toHaveLength(2);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  test('useOrganizationById hanterar fel korrekt', async () => {
    // Sätt upp repository att returnera ett fel
    mockOrganizationRepository.findById.mockResolvedValue(
      Result.fail('Organisationen hittades inte')
    );

    // Rendera hooken
    const { result, waitFor } = renderHookWithQueryClient(() => {
      const { useOrganizationById } = useOrganizationWithStandardHook();
      return useOrganizationById('org-not-found');
    });

    // Vänta på att laddningen slutförs med error
    await waitFor(() => !result.current.isLoading);

    // Verifiera felresultat
    expect(mockOrganizationRepository.findById).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'org-not-found' })
    );
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeDefined();
  });

  test('useUserOrganizations returnerar tom array när userId är undefined', async () => {
    // Rendera hooken med undefined userId
    const { result, waitFor } = renderHookWithQueryClient(() => {
      const { useUserOrganizations } = useOrganizationWithStandardHook();
      return useUserOrganizations(undefined);
    });

    // Vänta på att query är inaktiv
    await waitFor(() => !result.current.isLoading);

    // Verifiera att findByUserId inte anropades
    expect(mockOrganizationRepository.findByUserId).not.toHaveBeenCalled();
    expect(result.current.data).toEqual([]);
  });
}); 