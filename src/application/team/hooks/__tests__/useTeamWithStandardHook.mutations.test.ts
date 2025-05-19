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

// Förenklade tester för mutations
describe('useTeamWithStandardHook - Mutations', () => {
  // Mock data
  const mockTeam = { 
    id: 'team-123', 
    name: 'Test Team',
    ownerId: 'user-123',
    members: [
      { id: 'user-1', role: 'admin' }
    ]
  } as unknown as Team;

  // Mockade use cases för mutations
  const mockCreateTeamUseCase = {
    execute: jest.fn(),
  };

  const mockAddTeamMemberUseCase = {
    execute: jest.fn(),
  };

  const mockRemoveTeamMemberUseCase = {
    execute: jest.fn(),
  };

  // Återställ och konfigurera mockar före varje test
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useTeamContext as jest.Mock).mockReturnValue({
      // Mutations - fokus för dessa tester
      createTeamUseCase: mockCreateTeamUseCase,
      addTeamMemberUseCase: mockAddTeamMemberUseCase,
      removeTeamMemberUseCase: mockRemoveTeamMemberUseCase,
      
      // Andra use cases som inte är i fokus för dessa tester
      getTeamUseCase: { execute: jest.fn() },
      getTeamsForUserUseCase: { execute: jest.fn() },
      updateTeamMemberRoleUseCase: { execute: jest.fn() },
      getTeamStatisticsUseCase: { execute: jest.fn() },
    });

    // Förbereder mock-svar
    mockCreateTeamUseCase.execute.mockImplementation(() => {
      return Result.ok(mockTeam);
    });
    
    mockAddTeamMemberUseCase.execute.mockImplementation(() => {
      return Result.ok(undefined);
    });
    
    mockRemoveTeamMemberUseCase.execute.mockImplementation(() => {
      return Result.ok(undefined);
    });
  });

  test('Kan skapa ett nytt team', async () => {
    // Rendera hooken
    const { result, waitFor } = renderHookWithQueryClient(() => {
      const { useCreateTeam } = useTeamWithStandardHook();
      return useCreateTeam();
    });

    // Input för att skapa team
    const createTeamInput = {
      name: 'Test Team',
      description: 'Ett testteam',
      ownerId: 'user-123'
    };

    // Kör mutationen (inom act för att hantera React-livscykeln korrekt)
    act(() => {
      result.current.mutate(createTeamInput);
    });

    // Verifiera att use case anropades korrekt
    expect(mockCreateTeamUseCase.execute).toHaveBeenCalledWith(createTeamInput);
    
    // Vänta tills mutationen slutförts
    await waitFor(() => !result.current.isLoading);
    
    // Verifiera resultat
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data).toEqual(mockTeam);
  });

  test('Kan lägga till medlem i team', async () => {
    // Rendera hooken
    const { result, waitFor } = renderHookWithQueryClient(() => {
      const { useAddTeamMember } = useTeamWithStandardHook();
      return useAddTeamMember();
    });

    // Input för att lägga till medlem
    const addMemberInput = {
      teamId: 'team-123',
      userId: 'user-456',
      role: 'member'
    };

    // Kör mutationen
    act(() => {
      result.current.mutate(addMemberInput);
    });

    // Verifiera att use case anropades korrekt
    expect(mockAddTeamMemberUseCase.execute).toHaveBeenCalledWith(addMemberInput);
    
    // Vänta tills mutationen slutförts
    await waitFor(() => !result.current.isLoading);
    
    // Verifiera resultat
    expect(result.current.isSuccess).toBe(true);
  });

  test('Kan ta bort medlem från team', async () => {
    // Rendera hooken
    const { result, waitFor } = renderHookWithQueryClient(() => {
      const { useRemoveTeamMember } = useTeamWithStandardHook();
      return useRemoveTeamMember();
    });

    // Input för att ta bort medlem
    const removeMemberInput = {
      teamId: 'team-123',
      memberId: 'user-1'
    };

    // Kör mutationen
    act(() => {
      result.current.mutate(removeMemberInput);
    });

    // Verifiera att use case anropades korrekt
    expect(mockRemoveTeamMemberUseCase.execute).toHaveBeenCalledWith(removeMemberInput);
    
    // Vänta tills mutationen slutförts
    await waitFor(() => !result.current.isLoading);
    
    // Verifiera resultat
    expect(result.current.isSuccess).toBe(true);
  });
}); 