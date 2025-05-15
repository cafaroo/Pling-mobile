import { BaseUserEvent } from './BaseUserEvent';
import { User } from '../entities/User';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * UserTeamRemovedEvent
 * 
 * Domänhändelse som publiceras när en användare har tagits bort från ett team.
 * Innehåller information om användaren och teamet.
 */
export class UserTeamRemovedEvent extends BaseUserEvent {
  /**
   * Skapar en ny UserTeamRemovedEvent
   * 
   * @param user - User-objekt eller ID för användaren
   * @param teamId - ID för teamet som användaren togs bort från
   */
  constructor(
    user: User | UniqueId,
    teamId: string | UniqueId
  ) {
    super('UserTeamRemovedEvent', user, {
      teamId: teamId instanceof UniqueId ? teamId.toString() : teamId
    });
  }
} 