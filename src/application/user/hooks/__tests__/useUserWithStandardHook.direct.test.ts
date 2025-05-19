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

/**
 * Förenklade "direkta" tester för useUserWithStandardHook
 * I dessa tester anropar vi direkt mutateAsync för att undvika 
 * problem med React Query's livscykel och timing
 */
describe('useUserWithStandardHook - Direct Tests', () => {
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
    mockUserRepository.updateProfile.mockResolvedValue(Result.ok(mockUser));
    mockUserRepository.updateSettings.mockResolvedValue(Result.ok(undefined));
    mockUserRepository.activateUser.mockResolvedValue(Result.ok(undefined));
    mockUserRepository.deactivateUser.mockResolvedValue(Result.ok(undefined));
  });

  test('updateUserProfile anropar repository med korrekta parametrar', async () => {
    // Rendera hook
    const { result } = renderHookWithQueryClient(() => {
      const { useUpdateUserProfile } = useUserWithStandardHook();
      return useUpdateUserProfile();
    });

    // Förbered input data
    const updateProfileInput = {
      userId: 'user-123',
      firstName: 'Nytt',
      lastName: 'Namn'
    };

    // Anropa mutateAsync direkt
    await result.current.mutateAsync(updateProfileInput);

    // Verifiera att repository-metoden anropades med rätt parametrar
    expect(mockUserRepository.updateProfile).toHaveBeenCalledWith(
      'user-123',
      expect.objectContaining({
        firstName: 'Nytt',
        lastName: 'Namn'
      })
    );
  });

  test('updateUserSettings anropar repository med korrekta parametrar', async () => {
    // Rendera hook
    const { result } = renderHookWithQueryClient(() => {
      const { useUpdateUserSettings } = useUserWithStandardHook();
      return useUpdateUserSettings();
    });

    // Förbered input data
    const updateSettingsInput = {
      userId: 'user-123',
      theme: 'dark',
      notificationsEnabled: false
    };

    // Anropa mutateAsync direkt
    await result.current.mutateAsync(updateSettingsInput);

    // Verifiera att repository-metoden anropades med rätt parametrar
    expect(mockUserRepository.updateSettings).toHaveBeenCalledWith(
      'user-123',
      expect.objectContaining({
        theme: 'dark',
        notificationsEnabled: false
      })
    );
  });

  test('activateUser anropar repository med korrekta parametrar', async () => {
    // Rendera hook
    const { result } = renderHookWithQueryClient(() => {
      const { useActivateUser } = useUserWithStandardHook();
      return useActivateUser();
    });

    // Förbered input data
    const activateUserInput = {
      userId: 'user-123'
    };

    // Anropa mutateAsync direkt
    await result.current.mutateAsync(activateUserInput);

    // Verifiera att repository-metoden anropades med rätt parametrar
    expect(mockUserRepository.activateUser).toHaveBeenCalledWith('user-123');
  });

  test('deactivateUser anropar repository med korrekta parametrar', async () => {
    // Rendera hook
    const { result } = renderHookWithQueryClient(() => {
      const { useDeactivateUser } = useUserWithStandardHook();
      return useDeactivateUser();
    });

    // Förbered input data
    const deactivateUserInput = {
      userId: 'user-123',
      reason: 'Användaren begärde inaktivering'
    };

    // Anropa mutateAsync direkt
    await result.current.mutateAsync(deactivateUserInput);

    // Verifiera att repository-metoden anropades med rätt parametrar
    expect(mockUserRepository.deactivateUser).toHaveBeenCalledWith(
      'user-123',
      'Användaren begärde inaktivering'
    );
  });
}); 