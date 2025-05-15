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
import { CreateTeamActivityUseCase } from './useCases/createTeamActivity';

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
  createCreateTeamActivityUseCase(): CreateTeamActivityUseCase;
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
    createCreateTeamActivityUseCase: () => new CreateTeamActivityUseCase(teamActivityRepository, teamRepository, eventPublisher),
    // Lägg till fler use cases här när de refaktoreras
  };
};

// Event Handlers
export * from './eventHandlers/TeamEventHandlerFactory';

// Exportera individuella handlers
export * from './eventHandlers/BaseEventHandler';
export * from './eventHandlers/TeamCreatedHandler';
export * from './eventHandlers/MemberJoinedHandler';

// Exportera tidigare funktionalitet:
// Use Cases
export * from './useCases/createTeam/CreateTeamUseCase';
export * from './useCases/addTeamMember/AddTeamMemberUseCase';
export * from './useCases/removeTeamMember/RemoveTeamMemberUseCase';
export * from './useCases/updateTeamMemberRole/UpdateTeamMemberRoleUseCase';
export * from './useCases/inviteTeamMember/InviteTeamMemberUseCase';
export * from './useCases/getTeamStatistics/GetTeamStatisticsUseCase';
export * from './useCases/getTeamActivities/GetTeamActivitiesUseCase';
export * from './useCases/createTeamActivity/CreateTeamActivityUseCase';
export * from './useCases/createTeamMessage/CreateTeamMessageUseCase';
export * from './useCases/createThreadReply/CreateThreadReplyUseCase';

// DTOs
export * from './dto/TeamDTO';
export * from './dto/TeamMemberDTO';
export * from './dto/TeamStatisticsDTO';
export * from './dto/TeamActivityDTO';
export * from './dto/TeamMessageDTO';

// Hooks (kommer att implementeras senare)

// Re-exportera alla modeller och use cases för enkel import
export * from './useCases/createTeam';
export * from './useCases/addTeamMember';
export * from './useCases/removeTeamMember';
export * from './useCases/updateTeamMemberRole';
export * from './useCases/inviteTeamMember';
export * from './useCases/getTeamStatistics';
export * from './useCases/getTeamActivities';
export * from './useCases/createTeamActivity';
// Lägg till fler exports här när de refaktoreras 