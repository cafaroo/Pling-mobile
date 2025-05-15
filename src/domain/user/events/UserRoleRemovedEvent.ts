import { BaseUserEvent } from './BaseUserEvent';
import { User } from '../entities/User';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * UserRoleRemovedEvent
 * 
 * Domänhändelse som publiceras när en roll har tagits bort från en användare.
 * Innehåller information om användaren och rollen.
 */
export class UserRoleRemovedEvent extends BaseUserEvent {
  /**
   * Skapar en ny UserRoleRemovedEvent
   * 
   * @param user - User-objekt eller ID för användaren
   * @param roleId - ID för rollen som togs bort
   */
  constructor(
    user: User | UniqueId,
    roleId: string | UniqueId
  ) {
    super('UserRoleRemovedEvent', user, {
      roleId: roleId instanceof UniqueId ? roleId.toString() : roleId
    });
  }
} 