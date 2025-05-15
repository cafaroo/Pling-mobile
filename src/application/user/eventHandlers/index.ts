/**
 * Exporterar alla user-relaterade event handlers
 * 
 * Detta index används för att registrera alla handlers genom
 * att importera denna fil och anropa registerUserEventHandlers()
 */

import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { OrganizationRepository } from '@/domain/organization/repositories/OrganizationRepository';
import { UserCreatedHandler } from './UserCreatedHandler';
import { UserProfileUpdatedHandler } from './UserProfileUpdatedHandler';
import { UserTeamJoinedHandler } from './UserTeamJoinedHandler';
import { UserStatusChangedHandler } from './UserStatusChangedHandler';
import { UserEventHandlerFactory } from './UserEventHandlerFactory';

// Re-exportera alla handlers
export { UserCreatedHandler } from './UserCreatedHandler';
export { UserProfileUpdatedHandler } from './UserProfileUpdatedHandler';
export { UserTeamJoinedHandler } from './UserTeamJoinedHandler';
export { UserStatusChangedHandler } from './UserStatusChangedHandler';
export { UserEventHandlerFactory } from './UserEventHandlerFactory';

/**
 * Registrerar alla user event handlers
 * 
 * @param eventPublisher IDomainEventPublisher för att publicera och lyssna på events
 * @param userRepository Repository för att hämta och spara användardata
 * @param teamRepository Repository för att hantera teamdata
 * @param organizationRepository Repository för att hantera organisationsdata
 * @returns UserEventHandlerFactory-instans för att kunna ta bort handlers vid behov
 */
export const registerUserEventHandlers = (
  eventPublisher: IDomainEventPublisher,
  userRepository: UserRepository,
  teamRepository: TeamRepository,
  organizationRepository: OrganizationRepository
): UserEventHandlerFactory => {
  const factory = new UserEventHandlerFactory(
    eventPublisher,
    userRepository,
    teamRepository,
    organizationRepository
  );
  
  factory.registerHandlers();
  
  return factory;
}; 