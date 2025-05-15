/**
 * Exporterar alla teamrelaterade event handlers
 * 
 * Detta index används för att registrera alla handlers genom
 * att importera denna fil och anropa registerTeamEventHandlers()
 */

import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';
import { TeamCreatedHandler } from './TeamCreatedHandler';
import { MemberJoinedHandler } from './MemberJoinedHandler';
import { MemberLeftHandler } from './MemberLeftHandler';
import { TeamMemberRoleChangedHandler } from './TeamMemberRoleChangedHandler';
import { TeamMessageCreatedHandler } from './TeamMessageCreatedHandler';

/**
 * Registrerar alla teamrelaterade domäneventhanterare hos eventpublisher
 * @param publisher DomainEventPublisher instans
 */
export function registerTeamEventHandlers(publisher: IDomainEventPublisher): void {
  // Grundläggande team events
  const teamCreatedHandler = new TeamCreatedHandler();
  const memberJoinedHandler = new MemberJoinedHandler();
  const memberLeftHandler = new MemberLeftHandler();
  const teamMemberRoleChangedHandler = new TeamMemberRoleChangedHandler();
  
  // Kommunikations-relaterade events
  const teamMessageCreatedHandler = new TeamMessageCreatedHandler();
  
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