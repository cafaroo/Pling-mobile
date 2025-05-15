import { BaseUserEvent } from './BaseUserEvent';
import { User } from '../entities/User';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * UserTeamAddedEvent
 * 
 * Domänhändelse som publiceras när en användare har lagts till i ett team.
 * Innehåller information om användaren och teamet.
 */
export class UserTeamAddedEvent extends BaseUserEvent {
  /**
   * Skapar en ny UserTeamAddedEvent
   * 
   * @param user - User-objekt eller ID för användaren
   * @param teamId - ID för teamet som användaren lades till i
   */
  constructor(
    user: User | UniqueId,
    teamId: string | UniqueId
  ) {
    super('UserTeamAddedEvent', user, {
      teamId: teamId instanceof UniqueId ? teamId.toString() : teamId
    });
  }
} 