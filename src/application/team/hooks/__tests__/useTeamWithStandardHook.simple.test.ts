import { act } from '@testing-library/react-hooks';
import { Result } from '@/shared/core/Result';
import { useTeamWithStandardHook } from '../useTeamWithStandardHook';
import { useTeamContext } from '../useTeamContext';
import { Team } from '@/domain/team/entities/Team';
import { createTestQueryClient, renderHookWithQueryClient } from '@/test-utils/helpers/ReactQueryTestHelper';

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

// Förenklade tester för grundläggande funktionalitet
describe('useTeamWithStandardHook - grundläggande funktionalitet', () => {
  // Mock data
  const mockTeam = { 
    id: 'team-123', 
    name: 'Test Team',
    members: [
      { id: 'user-1', role: 'admin' }
    ]
  } as unknown as Team;

  // Mockade use cases
  const mockGetTeamUseCase = {
    execute: jest.fn(),
  };

  const mockGetTeamsForUserUseCase = {
    execute: jest.fn(),
  };

  // Återställ och konfigurera mockar före varje test
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useTeamContext as jest.Mock).mockReturnValue({
      getTeamUseCase: mockGetTeamUseCase,
      getTeamsForUserUseCase: mockGetTeamsForUserUseCase,
      // Lägger bara till de mest nödvändiga use cases
      createTeamUseCase: { execute: jest.fn() },
      addTeamMemberUseCase: { execute: jest.fn() },
      removeTeamMemberUseCase: { execute: jest.fn() },
      updateTeamMemberRoleUseCase: { execute: jest.fn() },
      getTeamStatisticsUseCase: { execute: jest.fn() },
    });

    // Förenkla mockarna för att returnera synkrona resultat
    mockGetTeamUseCase.execute.mockReturnValue(Result.ok(mockTeam));
    mockGetTeamsForUserUseCase.execute.mockReturnValue(Result.ok([mockTeam]));
  });

  test('Kan hämta team med ID', async () => {
    // Rendera hooken
    const { result, waitFor } = renderHookWithQueryClient(() => {
      const { useGetTeam } = useTeamWithStandardHook();
      return useGetTeam('team-123');
    });

    // Vänta på att data har laddats
    await waitFor(() => !result.current.isLoading);

    // Verifiera
    expect(mockGetTeamUseCase.execute).toHaveBeenCalledWith({ teamId: 'team-123' });
    expect(result.current.data).toEqual(mockTeam);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  test('Kan hämta teams för användare', async () => {
    // Rendera hooken
    const { result, waitFor } = renderHookWithQueryClient(() => {
      const { useGetTeamsForUser } = useTeamWithStandardHook();
      return useGetTeamsForUser('user-123');
    });

    // Vänta på att data har laddats
    await waitFor(() => !result.current.isLoading);

    // Verifiera
    expect(mockGetTeamsForUserUseCase.execute).toHaveBeenCalledWith({ userId: 'user-123' });
    expect(result.current.data).toEqual([mockTeam]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });
}); 