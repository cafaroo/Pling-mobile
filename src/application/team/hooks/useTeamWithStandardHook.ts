import { useCallback } from 'react';
import { Result } from '@/shared/core/Result';
import { 
  useStandardizedOperation, 
  useStandardizedRetryableOperation,
  StandardizedHookOperation 
} from '@/application/shared/hooks/useStandardizedHook';
import { HookErrorCode } from '@/application/shared/hooks/HookErrorTypes';
import { Team } from '@/domain/team/entities/Team';
import { useTeamContext } from './useTeamContext';
import { CreateTeamDTO } from '../dto/CreateTeamDTO';
import { AddTeamMemberDTO } from '../dto/AddTeamMemberDTO';
import { TeamMemberRoleDTO } from '../dto/TeamMemberRoleDTO';
import { createLogger } from '@/infrastructure/logger';

const logger = createLogger('useTeamWithStandardHook');

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
    async (params: CreateTeamDTO): Promise<Result<Team>> => {
      try {
        logger.info('Skapar nytt team', { name: params.name });
        return await createTeamUseCase.execute(params);
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
    async (params: { teamId: string }): Promise<Result<Team>> => {
      try {
        return await getTeamUseCase.execute(params);
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
    async (params: { userId?: string }): Promise<Result<Team[]>> => {
      try {
        return await getTeamsForUserUseCase.execute(params);
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
    async (params: AddTeamMemberDTO): Promise<Result<void>> => {
      try {
        return await addTeamMemberUseCase.execute(params);
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
    async (params: { teamId: string, memberId: string }): Promise<Result<void>> => {
      try {
        return await removeTeamMemberUseCase.execute(params);
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
    async (params: TeamMemberRoleDTO): Promise<Result<void>> => {
      try {
        return await updateTeamMemberRoleUseCase.execute(params);
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
    async (params: { teamId: string }): Promise<Result<any>> => {
      try {
        return await getTeamStatisticsUseCase.execute(params);
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

  // Använd useStandardizedOperation för att skapa standardiserade hook-operationer
  const createTeam = useStandardizedOperation(createTeamOperation);
  const getTeam = useStandardizedRetryableOperation(getTeamOperation, {
    maxRetries: 3,
    delayMs: 1000
  });
  const getTeamsForUser = useStandardizedOperation(getTeamsForUserOperation);
  const addTeamMember = useStandardizedOperation(addTeamMemberOperation);
  const removeTeamMember = useStandardizedOperation(removeTeamMemberOperation);
  const updateTeamMemberRole = useStandardizedOperation(updateTeamMemberRoleOperation);
  const getTeamStatistics = useStandardizedOperation(getTeamStatisticsOperation);

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
export type GetTeamOperation = StandardizedHookOperation<{ teamId: string }, Team> & { 
  retry: () => Promise<Result<Team> | null> 
}; 