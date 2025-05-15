/**
 * Exporterar alla teamrelaterade event handlers
 * 
 * Detta index används för att registrera alla handlers genom
 * att importera denna fil och anropa registerTeamEventHandlers()
 */

import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { TeamCreatedHandler } from './TeamCreatedHandler';
import { MemberJoinedHandler } from './MemberJoinedHandler';
import { MemberLeftHandler } from './MemberLeftHandler';
import { TeamMemberRoleChangedHandler } from './TeamMemberRoleChangedHandler';
import { TeamMessageCreatedHandler } from './TeamMessageCreatedHandler';

/**
 * Registrerar alla teamrelaterade domäneventhanterare hos eventpublisher
 * @param publisher DomainEventPublisher instans
 * @param teamRepository TeamRepository instans
 * @param userRepository UserRepository instans
 */
export function registerTeamEventHandlers(
  publisher: IDomainEventPublisher,
  teamRepository: TeamRepository,
  userRepository: UserRepository
): void {
  // Grundläggande team events
  const teamCreatedHandler = new TeamCreatedHandler(teamRepository, userRepository);
  const memberJoinedHandler = new MemberJoinedHandler(teamRepository, userRepository);
  const memberLeftHandler = new MemberLeftHandler(teamRepository, userRepository);
  const teamMemberRoleChangedHandler = new TeamMemberRoleChangedHandler(teamRepository, userRepository);
  
  // Kommunikations-relaterade events
  const teamMessageCreatedHandler = new TeamMessageCreatedHandler(teamRepository);
  
  // Registrera alla handlers hos publisher
  publisher.register('TeamCreated', teamCreatedHandler);
  publisher.register('MemberJoined', memberJoinedHandler);
  publisher.register('MemberLeft', memberLeftHandler);
  publisher.register('TeamMemberRoleChanged', teamMemberRoleChangedHandler);
  publisher.register('TeamMessageCreated', teamMessageCreatedHandler);
}

// Exportera alla handlers för enkel åtkomst
export {
  TeamCreatedHandler,
  MemberJoinedHandler,
  MemberLeftHandler,
  TeamMemberRoleChangedHandler,
  TeamMessageCreatedHandler
}; 