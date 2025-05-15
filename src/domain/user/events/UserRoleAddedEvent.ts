import { BaseUserEvent } from './BaseUserEvent';
import { User } from '../entities/User';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * UserRoleAddedEvent
 * 
 * Domänhändelse som publiceras när en roll har lagts till för en användare.
 * Innehåller information om användaren och rollen.
 */
export class UserRoleAddedEvent extends BaseUserEvent {
  /**
   * Skapar en ny UserRoleAddedEvent
   * 
   * @param user - User-objekt eller ID för användaren
   * @param roleId - ID för rollen som lades till
   */
  constructor(
    user: User | UniqueId,
    roleId: string | UniqueId
  ) {
    super('UserRoleAddedEvent', user, {
      roleId: roleId instanceof UniqueId ? roleId.toString() : roleId
    });
  }
} 