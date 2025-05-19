import { act, renderHook } from '@testing-library/react-hooks';
import { Result } from '@/shared/core/Result';
import { useTeamWithStandardHook } from '../useTeamWithStandardHook';
import { useTeamContext } from '../useTeamContext';
import { HookErrorCode } from '@/application/shared/hooks/HookErrorTypes';
import { Team } from '@/domain/team/entities/Team';
import { createLogger } from '@/infrastructure/logger';
import { 
  createTestQueryClient, 
  renderHookWithQueryClient
} from '@/test-utils/helpers/ReactQueryTestHelper';
import { QueryClient } from '@tanstack/react-query';

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

// Hjälpfunktion för att vänta
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Hjälpfunktion för att tömma alla väntande promises
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe('useTeamWithStandardHook', () => {
  // Skapa mockad team-data
  const mockTeam = { 
    id: 'team-123', 
    name: 'Test Team',
    members: [
      { id: 'user-1', name: 'User 1', role: 'admin' },
      { id: 'user-2', name: 'User 2', role: 'member' }
    ]
  } as unknown as Team;
  
  const mockTeams = [
    mockTeam, 
    { id: 'team-456', name: 'Another Team', members: [] }
  ] as unknown as Team[];
  
  // Mockade use cases
  const mockCreateTeamUseCase = {
    execute: jest.fn(),
  };
  
  const mockGetTeamUseCase = {
    execute: jest.fn(),
  };
  
  const mockGetTeamsForUserUseCase = {
    execute: jest.fn(),
  };
  
  const mockAddTeamMemberUseCase = {
    execute: jest.fn(),
  };
  
  const mockRemoveTeamMemberUseCase = {
    execute: jest.fn(),
  };
  
  const mockUpdateTeamMemberRoleUseCase = {
    execute: jest.fn(),
  };
  
  const mockGetTeamStatisticsUseCase = {
    execute: jest.fn(),
  };

  // QueryClient för testning
  let queryClient: QueryClient;
  
  // Återställ alla mockar före varje test
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = createTestQueryClient();
    
    // Konfigurera mockad useTeamContext
    (useTeamContext as jest.Mock).mockReturnValue({
      createTeamUseCase: mockCreateTeamUseCase,
      getTeamUseCase: mockGetTeamUseCase,
      getTeamsForUserUseCase: mockGetTeamsForUserUseCase,
      addTeamMemberUseCase: mockAddTeamMemberUseCase,
      removeTeamMemberUseCase: mockRemoveTeamMemberUseCase,
      updateTeamMemberRoleUseCase: mockUpdateTeamMemberRoleUseCase,
      getTeamStatisticsUseCase: mockGetTeamStatisticsUseCase,
    });
  });
  
  describe('useGetTeam', () => {
    it('ska hantera lyckade hämtningar korrekt', async () => {
      // Arrangera - använd synkron mock
      mockGetTeamUseCase.execute.mockReturnValue(Result.ok(mockTeam));
      
      // Agera
      const { result, waitFor } = renderHookWithQueryClient(() => {
        const { useGetTeam } = useTeamWithStandardHook();
        return useGetTeam('team-123');
      });
      
      // Kontrollera initial loading state
      expect(result.current.status).toBe('loading');
      
      // Vänta på att operationen slutförs
      await waitFor(() => result.current.status === 'success');
      
      // Verifiera
      expect(result.current.data).toEqual(mockTeam);
      expect(mockGetTeamUseCase.execute).toHaveBeenCalledWith({ teamId: 'team-123' });
    });
    
    it('ska hantera misslyckade hämtningar korrekt', async () => {
      // Arrangera
      const mockError = new Error('Server error');
      mockGetTeamUseCase.execute.mockReturnValue(
        Result.fail({
          message: 'Kunde inte hämta team',
          statusCode: 500,
          originalError: mockError
        })
      );
      
      // Agera
      const { result, waitFor } = renderHookWithQueryClient(() => {
        const { useGetTeam } = useTeamWithStandardHook();
        return useGetTeam('team-123');
      });
      
      // Vänta på att operationen slutförs
      await waitFor(() => result.current.status === 'error');
      
      // Verifiera
      expect(result.current.error).toBeDefined();
      expect(result.current.error?.code).toBe(HookErrorCode.API_ERROR);
    });
    
    it('ska inte anropa API när teamId är undefined', async () => {
      // Agera
      const { result } = renderHookWithQueryClient(() => {
        const { useGetTeam } = useTeamWithStandardHook();
        return useGetTeam(undefined);
      });
      
      // Slutför eventuella promises
      await act(async () => {
        await flushPromises();
      });
      
      // Verifiera
      expect(mockGetTeamUseCase.execute).not.toHaveBeenCalled();
    });
  });
  
  describe('useGetTeamsForUser', () => {
    it('ska hämta teams för en specifik användare', async () => {
      // Arrangera
      mockGetTeamsForUserUseCase.execute.mockReturnValue(Result.ok(mockTeams));
      
      // Agera
      const { result, waitFor } = renderHookWithQueryClient(() => {
        const { useGetTeamsForUser } = useTeamWithStandardHook();
        return useGetTeamsForUser('user-123');
      });
      
      // Vänta på att operationen slutförs
      await waitFor(() => result.current.status === 'success');
      
      // Verifiera
      expect(result.current.data).toEqual(mockTeams);
      expect(mockGetTeamsForUserUseCase.execute).toHaveBeenCalledWith({ userId: 'user-123' });
    });
  });
  
  describe('useCreateTeam', () => {
    it('ska hantera lyckade skapandeoperationer korrekt', async () => {
      // Arrangera
      mockCreateTeamUseCase.execute.mockImplementation(() => {
        return Result.ok(mockTeam);
      });
      
      // Agera
      const { result, waitFor } = renderHookWithQueryClient(() => {
        const { useCreateTeam } = useTeamWithStandardHook();
        return useCreateTeam();
      });
      
      // Förbered test-parametrarna
      const testParams = { 
        name: 'Test Team', 
        description: 'A test team',
        ownerId: 'owner-id'
      };
      
      // Utför mutation synkront (i en act-block)
      act(() => {
        result.current.mutate(testParams);
      });
      
      // Verifiera att mocken anropades med rätt parametrar
      expect(mockCreateTeamUseCase.execute).toHaveBeenCalledWith(testParams);
      
      // Vänta på att status ändras till success
      await waitFor(() => result.current.status === 'success');
      
      // Verifiera slutstatus
      expect(result.current.data).toEqual(mockTeam);
      
      // Verifiera att logger.info anropades korrekt
      expect(createLogger('useTeamWithStandardHook').info).toHaveBeenCalledWith(
        'Skapar nytt team', 
        expect.objectContaining({ name: 'Test Team' })
      );
    });
    
    it('ska hantera misslyckade skapandeoperationer korrekt', async () => {
      // Arrangera
      const mockError = new Error('Validation failed');
      mockCreateTeamUseCase.execute.mockImplementation(() => {
        return Result.fail({
          message: 'Kunde inte skapa team',
          statusCode: 422,
          originalError: mockError
        });
      });
      
      // Agera
      const { result, waitFor } = renderHookWithQueryClient(() => {
        const { useCreateTeam } = useTeamWithStandardHook();
        return useCreateTeam();
      });
      
      // Utför mutation synkront
      act(() => {
        result.current.mutate({ 
          name: '', // Tomt namn orsakar valideringsfel
          description: 'A test team',
          ownerId: 'owner-id' 
        });
      });
      
      // Vänta på att status ändras till error
      await waitFor(() => result.current.status === 'error');
      
      // Verifiera
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeDefined();
      expect(result.current.error?.code).toBe(HookErrorCode.VALIDATION_ERROR);
    });
  });
  
  describe('useAddTeamMember', () => {
    it('ska lägga till medlem och hantera optimistisk uppdatering', async () => {
      // Arrangera
      mockAddTeamMemberUseCase.execute.mockImplementation(() => {
        return Result.ok(undefined);
      });
      
      const initialTeam = { 
        ...mockTeam, 
        members: [{ id: 'user-1', role: 'admin' }] 
      };
      
      // Agera
      const { result, waitFor } = renderHookWithQueryClient(() => {
        const { useAddTeamMember } = useTeamWithStandardHook();
        return useAddTeamMember();
      }, { 
        initialQueryData: { 
          'team,team-123': initialTeam 
        } 
      });
      
      // Förbered test-parametrarna
      const testParams = { 
        teamId: 'team-123', 
        userId: 'user-2',
        role: 'member'
      };
      
      // Utför mutation synkront
      act(() => {
        result.current.mutate(testParams);
      });
      
      // Verifiera att mockAddTeamMemberUseCase.execute anropades med rätt parametrar
      expect(mockAddTeamMemberUseCase.execute).toHaveBeenCalledWith(testParams);
      
      // Vänta på att operation slutförs
      await waitFor(() => result.current.status === 'success');
      
      // Verifiera slutresultat
      expect(result.current.status).toBe('success');
    });
    
    it('ska hantera fel vid tillägg av teammedlem', async () => {
      // Arrangera
      mockAddTeamMemberUseCase.execute.mockImplementation(() => {
        return Result.fail({
          message: 'Användaren tillhör redan teamet',
          statusCode: 400
        });
      });
      
      // Agera
      const { result, waitFor } = renderHookWithQueryClient(() => {
        const { useAddTeamMember } = useTeamWithStandardHook();
        return useAddTeamMember();
      });
      
      // Utför mutation synkront
      act(() => {
        result.current.mutate({ 
          teamId: 'team-123', 
          userId: 'user-1', // Användare som redan är medlem
          role: 'member'
        });
      });
      
      // Vänta på att status ändras till error
      await waitFor(() => result.current.status === 'error');
      
      // Verifiera
      expect(result.current.error).toBeDefined();
      expect(result.current.error?.code).toBe(HookErrorCode.VALIDATION_ERROR);
    });
  });
  
  describe('useRemoveTeamMember', () => {
    it('ska ta bort medlem från ett team', async () => {
      // Arrangera
      mockRemoveTeamMemberUseCase.execute.mockImplementation(() => {
        return Result.ok(undefined);
      });
      
      // Agera
      const { result, waitFor } = renderHookWithQueryClient(() => {
        const { useRemoveTeamMember } = useTeamWithStandardHook();
        return useRemoveTeamMember();
      });
      
      // Förbered test-parametrarna
      const testParams = { 
        teamId: 'team-123', 
        memberId: 'user-1'
      };
      
      // Utför mutation synkront
      act(() => {
        result.current.mutate(testParams);
      });
      
      // Verifiera att mocken anropades korrekt
      expect(mockRemoveTeamMemberUseCase.execute).toHaveBeenCalledWith(testParams);
      
      // Vänta på att status ändras till success
      await waitFor(() => result.current.status === 'success');
      
      // Verifiera
      expect(result.current.status).toBe('success');
    });
  });
  
  describe('useUpdateTeamMemberRole', () => {
    it('ska uppdatera en medlems roll i teamet', async () => {
      // Arrangera
      mockUpdateTeamMemberRoleUseCase.execute.mockImplementation(() => {
        return Result.ok(undefined);
      });
      
      // Agera
      const { result, waitFor } = renderHookWithQueryClient(() => {
        const { useUpdateTeamMemberRole } = useTeamWithStandardHook();
        return useUpdateTeamMemberRole();
      });
      
      // Förbered test-parametrarna
      const testParams = { 
        teamId: 'team-123', 
        memberId: 'user-1',
        role: 'admin'
      };
      
      // Utför mutation synkront
      act(() => {
        result.current.mutate(testParams);
      });
      
      // Verifiera att mocken anropades korrekt
      expect(mockUpdateTeamMemberRoleUseCase.execute).toHaveBeenCalledWith(testParams);
      
      // Vänta på att status ändras till success
      await waitFor(() => result.current.status === 'success');
      
      // Verifiera
      expect(result.current.status).toBe('success');
    });
  });
}); 