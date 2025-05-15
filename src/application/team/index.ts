import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { TeamActivityRepository } from '@/domain/team/repositories/TeamActivityRepository';
import { CreateTeamUseCase } from './useCases/createTeam';
import { AddTeamMemberUseCase } from './useCases/addTeamMember';
import { RemoveTeamMemberUseCase } from './useCases/removeTeamMember';
import { UpdateTeamMemberRoleUseCase } from './useCases/updateTeamMemberRole';
import { InviteTeamMemberUseCase } from './useCases/inviteTeamMember';
import { GetTeamStatisticsUseCase } from './useCases/getTeamStatistics';
import { GetTeamActivitiesUseCase } from './useCases/getTeamActivities';

/**
 * Factory för att skapa Team-relaterade Use Cases
 */
export interface TeamUseCasesFactory {
  createCreateTeamUseCase(): CreateTeamUseCase;
  createAddTeamMemberUseCase(): AddTeamMemberUseCase;
  createRemoveTeamMemberUseCase(): RemoveTeamMemberUseCase;
  createUpdateTeamMemberRoleUseCase(): UpdateTeamMemberRoleUseCase;
  createInviteTeamMemberUseCase(): InviteTeamMemberUseCase;
  createGetTeamStatisticsUseCase(): GetTeamStatisticsUseCase;
  createGetTeamActivitiesUseCase(): GetTeamActivitiesUseCase;
  // Lägg till fler use cases här när de refaktoreras
}

/**
 * Skapar en factory för Team-relaterade Use Cases
 */
export const createTeamUseCasesFactory = (
  teamRepository: TeamRepository,
  userRepository: UserRepository,
  teamActivityRepository: TeamActivityRepository,
  eventPublisher: IDomainEventPublisher
): TeamUseCasesFactory => {
  return {
    createCreateTeamUseCase: () => new CreateTeamUseCase(teamRepository, eventPublisher),
    createAddTeamMemberUseCase: () => new AddTeamMemberUseCase(teamRepository, eventPublisher),
    createRemoveTeamMemberUseCase: () => new RemoveTeamMemberUseCase(teamRepository, eventPublisher),
    createUpdateTeamMemberRoleUseCase: () => new UpdateTeamMemberRoleUseCase(teamRepository, eventPublisher),
    createInviteTeamMemberUseCase: () => new InviteTeamMemberUseCase(teamRepository, userRepository, eventPublisher),
    createGetTeamStatisticsUseCase: () => new GetTeamStatisticsUseCase(teamRepository, teamActivityRepository),
    createGetTeamActivitiesUseCase: () => new GetTeamActivitiesUseCase(teamActivityRepository, teamRepository),
    // Lägg till fler use cases här när de refaktoreras
  };
};

// Re-exportera alla modeller och use cases för enkel import
export * from './useCases/createTeam';
export * from './useCases/addTeamMember';
export * from './useCases/removeTeamMember';
export * from './useCases/updateTeamMemberRole';
export * from './useCases/inviteTeamMember';
export * from './useCases/getTeamStatistics';
export * from './useCases/getTeamActivities';
// Lägg till fler exports här när de refaktoreras 