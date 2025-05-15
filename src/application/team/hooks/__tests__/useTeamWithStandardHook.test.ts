import { renderHook, act } from '@testing-library/react-hooks';
import { Result } from '@/shared/core/Result';
import { useTeamWithStandardHook } from '../useTeamWithStandardHook';
import { useTeamContext } from '../useTeamContext';
import { HookErrorCode } from '@/application/shared/hooks/HookErrorTypes';
import { Team } from '@/domain/team/entities/Team';
import { createLogger } from '@/infrastructure/logger';

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

describe('useTeamWithStandardHook', () => {
  // Skapa mockad team-data
  const mockTeam = { id: 'team-123', name: 'Test Team' } as Team;
  const mockTeams = [mockTeam, { id: 'team-456', name: 'Another Team' }] as Team[];
  
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
  
  // Återställ alla mockar före varje test
  beforeEach(() => {
    jest.clearAllMocks();
    
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
  
  describe('createTeam', () => {
    it('ska hantera lyckade skapandeoperationer korrekt', async () => {
      // Arrangera
      mockCreateTeamUseCase.execute.mockResolvedValue(Result.ok(mockTeam));
      
      // Agera
      const { result, waitForNextUpdate } = renderHook(() => useTeamWithStandardHook());
      
      let operationResult;
      act(() => {
        operationResult = result.current.createTeam.execute({ 
          name: 'Test Team', 
          description: 'A test team' 
        });
      });
      
      // Vänta på att operationen slutförs
      await waitForNextUpdate();
      
      // Verifiera
      expect(result.current.createTeam.status).toBe('success');
      expect(result.current.createTeam.data).toEqual(mockTeam);
      expect(result.current.createTeam.error).toBeNull();
      
      // Kontrollera att logger.info anropades korrekt
      expect(createLogger('useTeamWithStandardHook').info).toHaveBeenCalledWith(
        'Skapar nytt team', 
        expect.objectContaining({ name: 'Test Team' })
      );
    });
    
    it('ska hantera misslyckade skapandeoperationer korrekt', async () => {
      // Arrangera
      const mockError = new Error('Validation failed');
      mockCreateTeamUseCase.execute.mockResolvedValue(
        Result.fail({
          message: 'Kunde inte skapa team',
          statusCode: 422,
          originalError: mockError
        })
      );
      
      // Agera
      const { result, waitForNextUpdate } = renderHook(() => useTeamWithStandardHook());
      
      act(() => {
        result.current.createTeam.execute({ 
          name: '', // Tomt namn orsakar valideringsfel
          description: 'A test team' 
        });
      });
      
      // Vänta på att operationen slutförs
      await waitForNextUpdate();
      
      // Verifiera
      expect(result.current.createTeam.status).toBe('error');
      expect(result.current.createTeam.isError).toBe(true);
      expect(result.current.createTeam.data).toBeNull();
      expect(result.current.createTeam.error).not.toBeNull();
      expect(result.current.createTeam.error?.code).toBe(HookErrorCode.VALIDATION_ERROR);
    });
    
    it('ska hantera kastade fel korrekt', async () => {
      // Arrangera
      const thrownError = new Error('Network error');
      mockCreateTeamUseCase.execute.mockImplementation(() => {
        throw thrownError;
      });
      
      // Agera
      const { result, waitForNextUpdate } = renderHook(() => useTeamWithStandardHook());
      
      act(() => {
        result.current.createTeam.execute({ 
          name: 'Test Team', 
          description: 'A test team' 
        });
      });
      
      // Vänta på att operationen slutförs
      await waitForNextUpdate();
      
      // Verifiera
      expect(result.current.createTeam.status).toBe('error');
      expect(result.current.createTeam.error?.originalError).toBe(thrownError);
      expect(createLogger('useTeamWithStandardHook').error).toHaveBeenCalled();
    });
  });
  
  describe('getTeam', () => {
    it('ska hantera lyckade hämtningar korrekt', async () => {
      // Arrangera
      mockGetTeamUseCase.execute.mockResolvedValue(Result.ok(mockTeam));
      
      // Agera
      const { result, waitForNextUpdate } = renderHook(() => useTeamWithStandardHook());
      
      act(() => {
        result.current.getTeam.execute({ teamId: 'team-123' });
      });
      
      // Vänta på att operationen slutförs
      await waitForNextUpdate();
      
      // Verifiera
      expect(result.current.getTeam.status).toBe('success');
      expect(result.current.getTeam.data).toEqual(mockTeam);
    });
    
    it('ska kunna utföra återförsök för nätverksfel', async () => {
      jest.useFakeTimers();
      
      // Arrangera - första anropet misslyckas, andra lyckas
      mockGetTeamUseCase.execute
        .mockResolvedValueOnce(Result.fail({
          message: 'Nätverksfel',
          statusCode: 500,
          originalError: new Error('Network error')
        }))
        .mockResolvedValueOnce(Result.ok(mockTeam));
      
      // Agera
      const { result, waitForNextUpdate } = renderHook(() => useTeamWithStandardHook());
      
      const params = { teamId: 'team-123' };
      act(() => {
        result.current.getTeam.execute(params);
      });
      
      // Vänta på att första anropet slutförs
      await waitForNextUpdate();
      
      // Verifiera att första anropet misslyckades
      expect(result.current.getTeam.status).toBe('error');
      expect(result.current.getTeam.error?.code).toBe(HookErrorCode.SERVER_ERROR);
      expect(result.current.getTeam.error?.retryable).toBe(true);
      
      // Utför återförsök
      act(() => {
        result.current.getTeam.retry();
      });
      
      // Flytta fram tidtagningen
      act(() => {
        jest.advanceTimersByTime(1000); // 1 sekund delay
      });
      
      // Vänta på att återförsöket slutförs
      await waitForNextUpdate();
      
      // Verifiera att återförsöket lyckades
      expect(result.current.getTeam.status).toBe('success');
      expect(result.current.getTeam.data).toEqual(mockTeam);
      expect(mockGetTeamUseCase.execute).toHaveBeenCalledTimes(2);
      expect(mockGetTeamUseCase.execute).toHaveBeenCalledWith(params);
      
      jest.useRealTimers();
    });
  });
  
  describe('getTeamsForUser', () => {
    it('ska hantera lyckade hämtningar av användarens team', async () => {
      // Arrangera
      mockGetTeamsForUserUseCase.execute.mockResolvedValue(Result.ok(mockTeams));
      
      // Agera
      const { result, waitForNextUpdate } = renderHook(() => useTeamWithStandardHook());
      
      act(() => {
        result.current.getTeamsForUser.execute({ userId: 'user-123' });
      });
      
      // Vänta på att operationen slutförs
      await waitForNextUpdate();
      
      // Verifiera
      expect(result.current.getTeamsForUser.status).toBe('success');
      expect(result.current.getTeamsForUser.data).toEqual(mockTeams);
      expect(result.current.getTeamsForUser.data?.length).toBe(2);
    });
  });
  
  // Ytterligare tester för andra operationer skulle följa samma mönster
  // För koncishet inkluderas inte alla operationer i testfilen
}); 