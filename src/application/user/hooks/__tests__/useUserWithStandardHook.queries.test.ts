import { Result } from '@/shared/core/Result';
import { useUserWithStandardHook } from '../useUserWithStandardHook';
import { useUserContext } from '../useUserContext';
import { User } from '@/domain/user/entities/User';
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

jest.mock('../useUserContext', () => ({
  useUserContext: jest.fn(),
}));

describe('useUserWithStandardHook - Queries', () => {
  // Mock data
  const mockUser = { 
    id: 'user-123', 
    profile: {
      firstName: 'Test',
      lastName: 'Användare',
      email: 'test@exempel.se',
      phoneNumber: '0701234567',
      avatarUrl: 'https://example.com/avatar.jpg',
    },
    settings: {
      theme: 'light',
      language: 'sv',
      notificationsEnabled: true,
      privacySettings: {}
    },
    status: 'active'
  } as unknown as User;

  // Mockade repository-metoder
  const mockUserRepository = {
    findById: jest.fn(),
    getCurrentUser: jest.fn(),
    updateProfile: jest.fn(),
    updateSettings: jest.fn(),
    activateUser: jest.fn(),
    deactivateUser: jest.fn()
  };

  // Mock eventPublisher
  const mockEventPublisher = {
    publish: jest.fn()
  };

  // Återställ mockar innan varje test
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useUserContext as jest.Mock).mockReturnValue({
      userRepository: mockUserRepository,
      eventPublisher: mockEventPublisher
    });

    // Ställ in förväntade returvärden
    mockUserRepository.findById.mockResolvedValue(Result.ok(mockUser));
    mockUserRepository.getCurrentUser.mockResolvedValue(Result.ok(mockUser));
  });

  test('useGetUser hämtar användare med ID', async () => {
    // Rendera hooken
    const { result, waitFor } = renderHookWithQueryClient(() => {
      const { useGetUser } = useUserWithStandardHook();
      return useGetUser('user-123');
    });

    // Vänta på att data har laddats
    await waitFor(() => !result.current.isLoading);

    // Verifiera resultatet
    expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
    expect(result.current.data).toEqual(mockUser);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  test('useGetUser returnerar null när userId är undefined', async () => {
    // Rendera hooken med undefined userId
    const { result, waitFor } = renderHookWithQueryClient(() => {
      const { useGetUser } = useUserWithStandardHook();
      return useGetUser(undefined);
    });

    // Vänta på att query är inaktiv
    await waitFor(() => !result.current.isLoading);

    // Verifiera att findById inte anropades
    expect(mockUserRepository.findById).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
  });

  test('useGetCurrentUser hämtar inloggad användare', async () => {
    // Rendera hooken
    const { result, waitFor } = renderHookWithQueryClient(() => {
      const { useGetCurrentUser } = useUserWithStandardHook();
      return useGetCurrentUser();
    });

    // Vänta på att data har laddats
    await waitFor(() => !result.current.isLoading);

    // Verifiera resultatet
    expect(mockUserRepository.getCurrentUser).toHaveBeenCalled();
    expect(result.current.data).toEqual(mockUser);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  test('useGetUser hanterar fel korrekt', async () => {
    // Sätt upp repository att returnera ett fel
    mockUserRepository.findById.mockResolvedValue(
      Result.fail('Användaren hittades inte')
    );

    // Rendera hooken
    const { result, waitFor } = renderHookWithQueryClient(() => {
      const { useGetUser } = useUserWithStandardHook();
      return useGetUser('user-not-found');
    });

    // Vänta på att laddningen slutförs med error
    await waitFor(() => !result.current.isLoading);

    // Verifiera felresultat
    expect(mockUserRepository.findById).toHaveBeenCalledWith('user-not-found');
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeDefined();
  });

  test('useGetCurrentUser hanterar fel korrekt', async () => {
    // Sätt upp repository att returnera ett fel
    mockUserRepository.getCurrentUser.mockResolvedValue(
      Result.fail('Ingen inloggad användare')
    );

    // Rendera hooken
    const { result, waitFor } = renderHookWithQueryClient(() => {
      const { useGetCurrentUser } = useUserWithStandardHook();
      return useGetCurrentUser();
    });

    // Vänta på att laddningen slutförs med error
    await waitFor(() => !result.current.isLoading);

    // Verifiera felresultat
    expect(mockUserRepository.getCurrentUser).toHaveBeenCalled();
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeDefined();
  });
}); 