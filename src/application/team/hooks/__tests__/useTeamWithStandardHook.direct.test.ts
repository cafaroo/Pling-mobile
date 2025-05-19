import { Result } from '@/shared/core/Result';
import { useTeamWithStandardHook } from '../useTeamWithStandardHook';
import { useTeamContext } from '../useTeamContext';
import { Team } from '@/domain/team/entities/Team';
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

jest.mock('../useTeamContext', () => ({
  useTeamContext: jest.fn(),
}));

/**
 * Förenklade "direkta" tester för useTeamWithStandardHook
 * I dessa tester anropar vi direkt mutateAsync för att undvika 
 * problem med React Query's livscykel och timing
 */
describe('useTeamWithStandardHook - Direct Tests', () => {
  // Mock data
  const mockTeam = { 
    id: 'team-123', 
    name: 'Test Team',
    ownerId: 'user-123',
    members: [
      { id: 'user-1', role: 'admin' }
    ]
  } as unknown as Team;

  // Mockade use cases
  const mockCreateTeamUseCase = {
    execute: jest.fn(),
  };

  const mockAddTeamMemberUseCase = {
    execute: jest.fn(),
  };

  // Återställ mockar innan varje test
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useTeamContext as jest.Mock).mockReturnValue({
      createTeamUseCase: mockCreateTeamUseCase,
      addTeamMemberUseCase: mockAddTeamMemberUseCase,
      // Andra use cases som krävs av hooken
      getTeamUseCase: { execute: jest.fn() },
      getTeamsForUserUseCase: { execute: jest.fn() },
      removeTeamMemberUseCase: { execute: jest.fn() },
      updateTeamMemberRoleUseCase: { execute: jest.fn() },
      getTeamStatisticsUseCase: { execute: jest.fn() },
    });

    // Ställ in förväntade returvärden
    mockCreateTeamUseCase.execute.mockResolvedValue(Result.ok(mockTeam));
    mockAddTeamMemberUseCase.execute.mockResolvedValue(Result.ok(undefined));
  });

  test('createTeam anropar use case med korrekta parametrar', async () => {
    // Rendera hook
    const { result } = renderHookWithQueryClient(() => {
      const { useCreateTeam } = useTeamWithStandardHook();
      return useCreateTeam();
    });

    // Förbered input data
    const createTeamInput = {
      name: 'Test Team',
      description: 'Ett testteam',
      ownerId: 'user-123'
    };

    // Anropa mutateAsync direkt
    await result.current.mutateAsync(createTeamInput);

    // Verifiera att use case anropades med rätt parametrar
    expect(mockCreateTeamUseCase.execute).toHaveBeenCalledWith(createTeamInput);
  });

  test('addTeamMember anropar use case med korrekta parametrar', async () => {
    // Rendera hook
    const { result } = renderHookWithQueryClient(() => {
      const { useAddTeamMember } = useTeamWithStandardHook();
      return useAddTeamMember();
    });

    // Förbered input data
    const addMemberInput = {
      teamId: 'team-123',
      userId: 'user-456',
      role: 'member'
    };

    // Anropa mutateAsync direkt
    await result.current.mutateAsync(addMemberInput);

    // Verifiera att use case anropades med rätt parametrar
    expect(mockAddTeamMemberUseCase.execute).toHaveBeenCalledWith(addMemberInput);
  });
}); 