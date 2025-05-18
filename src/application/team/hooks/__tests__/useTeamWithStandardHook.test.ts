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

// Hjälpfunktion för att vänta
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
      // Arrangera - använd simulerad fördröjning för att mer likna verkligt beteende
      mockCreateTeamUseCase.execute.mockImplementation(async () => {
        await sleep(50); // Låtsas att det tar lite tid
        return Result.ok(mockTeam);
      });
      
      // Agera
      const { result, waitForNextUpdate } = renderHook(() => useTeamWithStandardHook());
      
      // Kontrollera initial state
      expect(result.current.createTeam.status).toBe('idle');
      
      let operationPromise;
      act(() => {
        operationPromise = result.current.createTeam.execute({ 
          name: 'Test Team', 
          description: 'A test team' 
        });
      });
      
      // Kontrollera loading state innan första uppdateringen
      expect(result.current.createTeam.status).toBe('loading');
      
      // Vänta på att den första asynkrona uppdateringen slutförs
      await waitForNextUpdate();
      
      // Extra väntan för att säkerställa att alla uppdateringar är klara
      await act(async () => {
        await sleep(100);
      });
      
      // Nu bör status vara success
      expect(result.current.createTeam.status).toBe('success');
      expect(result.current.createTeam.data).toEqual(mockTeam);
      expect(result.current.createTeam.error).toBeNull();
      
      // Kontrollera att logger.info anropades korrekt
      expect(createLogger('useTeamWithStandardHook').info).toHaveBeenCalledWith(
        'Skapar nytt team', 
        expect.objectContaining({ name: 'Test Team' })
      );
      
      // Verifiera att operationPromise är en Promise som resolvas med förväntat värde
      await expect(operationPromise).resolves.toEqual(mockTeam);
    });
    
    it('ska hantera misslyckade skapandeoperationer korrekt', async () => {
      // Arrangera
      const mockError = new Error('Validation failed');
      const failResult = Result.fail({
        message: 'Kunde inte skapa team',
        statusCode: 422,
        originalError: mockError
      });
      
      mockCreateTeamUseCase.execute.mockImplementation(async () => {
        await sleep(50); // Simulerad fördröjning
        return failResult;
      });
      
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
      
      // Extra väntan för att säkerställa att alla uppdateringar är klara
      await act(async () => {
        await sleep(100);
      });
      
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
      
      // Extra väntan för att säkerställa att alla uppdateringar är klara
      await act(async () => {
        await sleep(50); // Kort väntan eftersom fel hanteras omedelbart
      });
      
      // Verifiera
      expect(result.current.createTeam.status).toBe('error');
      expect(result.current.createTeam.error?.originalError).toBe(thrownError);
      expect(createLogger('useTeamWithStandardHook').error).toHaveBeenCalled();
    });
  });
  
  describe('getTeam', () => {
    it('ska hantera lyckade hämtningar korrekt', async () => {
      // Arrangera
      mockGetTeamUseCase.execute.mockImplementation(async () => {
        await sleep(50); // Simulerad fördröjning
        return Result.ok(mockTeam);
      });
      
      // Agera
      const { result, waitForNextUpdate } = renderHook(() => useTeamWithStandardHook());
      
      // Kontrollera initial state
      expect(result.current.getTeam.status).toBe('idle');
      
      act(() => {
        result.current.getTeam.execute({ teamId: 'team-123' });
      });
      
      // Kontrollera loading state
      expect(result.current.getTeam.status).toBe('loading');
      
      // Vänta på att operationen slutförs
      await waitForNextUpdate();
      
      // Extra väntan för att säkerställa att alla uppdateringar är klara
      await act(async () => {
        await sleep(100);
      });
      
      // Verifiera
      expect(result.current.getTeam.status).toBe('success');
      expect(result.current.getTeam.data).toEqual(mockTeam);
    });
    
    it('ska kunna utföra återförsök för nätverksfel', async () => {
      // Arrangera - första anropet misslyckas, andra lyckas
      mockGetTeamUseCase.execute
        .mockImplementationOnce(async () => {
          await sleep(50); // Simulerad fördröjning
          return Result.fail({
            message: 'Nätverksfel',
            statusCode: 500,
            originalError: new Error('Network error')
          });
        })
        .mockImplementationOnce(async () => {
          await sleep(50); // Simulerad fördröjning
          return Result.ok(mockTeam);
        });
      
      // Agera
      const { result, waitForNextUpdate } = renderHook(() => useTeamWithStandardHook());
      
      const params = { teamId: 'team-123' };
      act(() => {
        result.current.getTeam.execute(params);
      });
      
      // Vänta på att första anropet slutförs
      await waitForNextUpdate();
      
      // Extra väntan för att säkerställa att alla uppdateringar är klara
      await act(async () => {
        await sleep(100);
      });
      
      // Verifiera att första anropet misslyckades
      expect(result.current.getTeam.status).toBe('error');
      expect(result.current.getTeam.error?.code).toBe(HookErrorCode.SERVER_ERROR);
      expect(result.current.getTeam.error?.retryable).toBe(true);
      
      // Nu ska vi göra ett nytt försök och säkerställa att vi återgår till loading state
      await act(async () => {
        result.current.getTeam.retry();
        // Kort paus för att låta statusuppdateringen ske
        await sleep(10);
      });
      
      // Nu ska vi vara i loading state igen
      expect(result.current.getTeam.status).toBe('loading');
      
      // Vänta på att återförsöket slutförs
      await waitForNextUpdate();
      
      // Extra väntan för att säkerställa att alla uppdateringar är klara
      await act(async () => {
        await sleep(100);
      });
      
      // Verifiera att återförsöket lyckades
      expect(result.current.getTeam.status).toBe('success');
      expect(result.current.getTeam.data).toEqual(mockTeam);
      expect(mockGetTeamUseCase.execute).toHaveBeenCalledTimes(2);
      expect(mockGetTeamUseCase.execute).toHaveBeenNthCalledWith(2, params);
    });
  });
  
  describe('getTeamsForUser', () => {
    it('ska hantera lyckade hämtningar av användarens team', async () => {
      // Arrangera
      mockGetTeamsForUserUseCase.execute.mockImplementation(async () => {
        await sleep(50); // Simulerad fördröjning
        return Result.ok(mockTeams);
      });
      
      // Agera
      const { result, waitForNextUpdate } = renderHook(() => useTeamWithStandardHook());
      
      act(() => {
        result.current.getTeamsForUser.execute({ userId: 'user-123' });
      });
      
      // Vänta på att operationen slutförs
      await waitForNextUpdate();
      
      // Extra väntan för att säkerställa att alla uppdateringar är klara
      await act(async () => {
        await sleep(100);
      });
      
      // Verifiera
      expect(result.current.getTeamsForUser.status).toBe('success');
      expect(result.current.getTeamsForUser.data).toEqual(mockTeams);
      expect(result.current.getTeamsForUser.data.length).toBe(2);
    });
  });
}); 