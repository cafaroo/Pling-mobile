import { useCallback } from 'react';
import { Result } from '@/shared/core/Result';
import { 
  useStandardizedOperation, 
  useStandardizedRetryableOperation,
  StandardizedHookOperation,
  StandardizedRetryableHookOperation,
  ProgressInfo,
  StandardizedOperationConfig
} from '@/application/shared/hooks/useStandardizedHook';
import { 
  HookErrorCode, 
  ErrorContext,
  createEnhancedHookError 
} from '@/application/shared/hooks/HookErrorTypes';
import { Team } from '@/domain/team/entities/Team';
import { useTeamContext } from './useTeamContext';
import { CreateTeamDTO } from '../dto/CreateTeamDTO';
import { AddTeamMemberDTO } from '../dto/AddTeamMemberDTO';
import { TeamMemberRoleDTO } from '../dto/TeamMemberRoleDTO';
import { createLogger } from '@/infrastructure/logger';

const logger = createLogger('useTeamWithStandardHook');

/**
 * Skapar en standard felkontext för team-relaterade operationer
 */
const createTeamErrorContext = (operation: string, details?: Record<string, any>): ErrorContext => ({
  domain: 'team',
  operation,
  details,
  timestamp: new Date()
});

/**
 * Hook för att hantera team-operationer med standardiserad felhantering
 * @returns Ett objekt med standardiserade team-operationer
 */
export function useTeamWithStandardHook() {
  const { 
    createTeamUseCase, 
    getTeamUseCase,
    getTeamsForUserUseCase,
    addTeamMemberUseCase,
    removeTeamMemberUseCase,
    updateTeamMemberRoleUseCase,
    getTeamStatisticsUseCase
  } = useTeamContext();

  // Operation för att skapa ett team med standardiserad felhantering
  const createTeamOperation = useCallback(
    async (params: CreateTeamDTO, updateProgress?: (progress: ProgressInfo) => void): Promise<Result<Team>> => {
      try {
        logger.info('Skapar nytt team', { name: params.name });
        
        // Simulera stegvist laddningsframsteg
        updateProgress?.({ percent: 10, message: 'Validerar teamuppgifter...' });
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulerar validering
        
        updateProgress?.({ percent: 30, message: 'Skapar team...' });
        const result = await createTeamUseCase.execute(params);
        
        if (result.isSuccess()) {
          updateProgress?.({ percent: 80, message: 'Uppdaterar användarbehörigheter...' });
          await new Promise(resolve => setTimeout(resolve, 200)); // Simulerar ytterligare steg
          
          updateProgress?.({ percent: 100, message: 'Klart!' });
        }
        
        return result;
      } catch (error) {
        logger.error('Fel vid skapande av team', { error, params });
        return Result.fail({
          message: 'Kunde inte skapa team',
          originalError: error
        });
      }
    },
    [createTeamUseCase]
  );

  // Operation för att hämta ett team med standardiserad felhantering och återförsök
  const getTeamOperation = useCallback(
    async (params: { teamId: string }, updateProgress?: (progress: ProgressInfo) => void): Promise<Result<Team>> => {
      try {
        updateProgress?.({ indeterminate: true, message: 'Hämtar team...' });
        const result = await getTeamUseCase.execute(params);
        updateProgress?.({ percent: 100, message: 'Team hämtat' });
        return result;
      } catch (error) {
        logger.error('Fel vid hämtning av team', { error, teamId: params.teamId });
        return Result.fail({
          message: 'Kunde inte hämta team',
          originalError: error
        });
      }
    },
    [getTeamUseCase]
  );

  // Operation för att hämta alla team för en användare
  const getTeamsForUserOperation = useCallback(
    async (params: { userId?: string }, updateProgress?: (progress: ProgressInfo) => void): Promise<Result<Team[]>> => {
      try {
        updateProgress?.({ indeterminate: true, message: 'Hämtar användarens team...' });
        const result = await getTeamsForUserUseCase.execute(params);
        updateProgress?.({ percent: 100, message: 'Team hämtade' });
        return result;
      } catch (error) {
        logger.error('Fel vid hämtning av användarens team', { error, userId: params.userId });
        return Result.fail({
          message: 'Kunde inte hämta team för användaren',
          originalError: error
        });
      }
    },
    [getTeamsForUserUseCase]
  );

  // Operation för att lägga till en teammedlem med standardiserad felhantering
  const addTeamMemberOperation = useCallback(
    async (params: AddTeamMemberDTO, updateProgress?: (progress: ProgressInfo) => void): Promise<Result<void>> => {
      try {
        updateProgress?.({ percent: 20, message: 'Validerar medlem...' });
        await new Promise(resolve => setTimeout(resolve, 200));
        
        updateProgress?.({ percent: 50, message: 'Lägger till medlem...' });
        const result = await addTeamMemberUseCase.execute(params);
        
        if (result.isSuccess()) {
          updateProgress?.({ percent: 80, message: 'Uppdaterar teamstatistik...' });
          await new Promise(resolve => setTimeout(resolve, 200));
          
          updateProgress?.({ percent: 100, message: 'Medlem tillagd!' });
        }
        
        return result;
      } catch (error) {
        logger.error('Fel vid tillägg av teammedlem', { error, params });
        return Result.fail({
          message: 'Kunde inte lägga till teammedlem',
          originalError: error
        });
      }
    },
    [addTeamMemberUseCase]
  );

  // Operation för att ta bort en teammedlem med standardiserad felhantering
  const removeTeamMemberOperation = useCallback(
    async (params: { teamId: string, memberId: string }, updateProgress?: (progress: ProgressInfo) => void): Promise<Result<void>> => {
      try {
        updateProgress?.({ percent: 30, message: 'Tar bort medlem...' });
        const result = await removeTeamMemberUseCase.execute(params);
        updateProgress?.({ percent: 100, message: 'Medlem borttagen' });
        return result;
      } catch (error) {
        logger.error('Fel vid borttagning av teammedlem', { error, params });
        return Result.fail({
          message: 'Kunde inte ta bort teammedlem',
          originalError: error
        });
      }
    },
    [removeTeamMemberUseCase]
  );

  // Operation för att uppdatera en teammedlems roll med standardiserad felhantering
  const updateTeamMemberRoleOperation = useCallback(
    async (params: TeamMemberRoleDTO, updateProgress?: (progress: ProgressInfo) => void): Promise<Result<void>> => {
      try {
        updateProgress?.({ percent: 40, message: 'Uppdaterar roll...' });
        const result = await updateTeamMemberRoleUseCase.execute(params);
        updateProgress?.({ percent: 100, message: 'Roll uppdaterad' });
        return result;
      } catch (error) {
        logger.error('Fel vid uppdatering av teammedlemsroll', { error, params });
        return Result.fail({
          message: 'Kunde inte uppdatera teammedlems roll',
          originalError: error
        });
      }
    },
    [updateTeamMemberRoleUseCase]
  );

  // Operation för att hämta teamstatistik med standardiserad felhantering
  const getTeamStatisticsOperation = useCallback(
    async (params: { teamId: string }, updateProgress?: (progress: ProgressInfo) => void): Promise<Result<any>> => {
      try {
        updateProgress?.({ indeterminate: true, message: 'Hämtar statistik...' });
        const result = await getTeamStatisticsUseCase.execute(params);
        updateProgress?.({ percent: 100, message: 'Statistik hämtad' });
        return result;
      } catch (error) {
        logger.error('Fel vid hämtning av teamstatistik', { error, teamId: params.teamId });
        return Result.fail({
          message: 'Kunde inte hämta teamstatistik',
          originalError: error
        });
      }
    },
    [getTeamStatisticsUseCase]
  );

  // Konfigurera kontextobjekt för hook-operationer
  const createTeamConfig: StandardizedOperationConfig = {
    context: createTeamErrorContext('createTeam'),
    optimistic: false // Inte lämpligt för att skapa nya resurser
  };
  
  const getTeamConfig: StandardizedOperationConfig = {
    context: createTeamErrorContext('getTeam')
  };
  
  const addTeamMemberConfig: StandardizedOperationConfig = {
    context: createTeamErrorContext('addTeamMember'),
    optimistic: true // Kan använda optimistisk uppdatering eftersom UI kan visa den tillagda medlemmen direkt
  };
  
  const removeTeamMemberConfig: StandardizedOperationConfig = {
    context: createTeamErrorContext('removeTeamMember'),
    optimistic: true // Kan använda optimistisk uppdatering
  };

  // Använd useStandardizedOperation med förbättrad konfiguration
  const createTeam = useStandardizedOperation(createTeamOperation, createTeamConfig);
  
  const getTeam = useStandardizedRetryableOperation(
    getTeamOperation, 
    {
      maxRetries: 3,
      delayMs: 1000,
      backoffFactor: 1.5,
      maxDelayMs: 10000,
      retryStrategy: (error) => [
        HookErrorCode.NETWORK_ERROR,
        HookErrorCode.TIMEOUT_ERROR,
        HookErrorCode.API_ERROR
      ].includes(error.code)
    },
    getTeamConfig
  );
  
  const getTeamsForUser = useStandardizedOperation(
    getTeamsForUserOperation, 
    { context: createTeamErrorContext('getTeamsForUser') }
  );
  
  const addTeamMember = useStandardizedOperation(
    addTeamMemberOperation, 
    addTeamMemberConfig
  );
  
  const removeTeamMember = useStandardizedOperation(
    removeTeamMemberOperation, 
    removeTeamMemberConfig
  );
  
  const updateTeamMemberRole = useStandardizedOperation(
    updateTeamMemberRoleOperation, 
    { 
      context: createTeamErrorContext('updateTeamMemberRole'),
      optimistic: true
    }
  );
  
  const getTeamStatistics = useStandardizedRetryableOperation(
    getTeamStatisticsOperation,
    {
      maxRetries: 2,
      delayMs: 800
    },
    { context: createTeamErrorContext('getTeamStatistics') }
  );

  return {
    // Grundläggande team-operationer
    createTeam,
    getTeam,
    getTeamsForUser,
    
    // Medlemshantering
    addTeamMember,
    removeTeamMember,
    updateTeamMemberRole,
    
    // Statistik
    getTeamStatistics,
  };
}

// Typexport för att förenkla användning i komponenter
export type UseTeamWithStandardHookResult = ReturnType<typeof useTeamWithStandardHook>;

// Typdefinitioner för operationer som underlättar användning
export type CreateTeamOperation = StandardizedHookOperation<CreateTeamDTO, Team>;
export type GetTeamOperation = StandardizedRetryableHookOperation<{ teamId: string }, Team>; 