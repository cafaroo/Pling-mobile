import { BaseUserEvent } from './BaseUserEvent';
import { User } from '../entities/User';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * UserStatusChangedEvent
 * 
 * Domänhändelse som publiceras när en användares status har ändrats.
 * Innehåller information om användarens tidigare och nya status.
 */
export class UserStatusChangedEvent extends BaseUserEvent {
  /**
   * Skapar en ny UserStatusChangedEvent
   * 
   * @param user - User-objekt eller ID för användaren
   * @param oldStatus - Användarens tidigare status
   * @param newStatus - Användarens nya status
   */
  constructor(
    user: User | UniqueId,
    oldStatus: 'pending' | 'active' | 'inactive' | 'blocked',
    newStatus: 'pending' | 'active' | 'inactive' | 'blocked'
  ) {
    super('UserStatusChangedEvent', user, {
      oldStatus,
      newStatus
    });
  }
} 