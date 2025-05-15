import { BaseUserEvent } from './BaseUserEvent';
import { User } from '../entities/User';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * UserDeactivatedEvent
 * 
 * Domänhändelse som publiceras när en användare har inaktiverats.
 * Innehåller information om användaren och orsaken till inaktivering.
 */
export class UserDeactivatedEvent extends BaseUserEvent {
  /**
   * Skapar en ny UserDeactivatedEvent
   * 
   * @param user - User-objekt eller ID för användaren
   * @param deactivationReason - Orsak till inaktivering (valfritt)
   */
  constructor(
    user: User | UniqueId,
    deactivationReason: string = ''
  ) {
    super('UserDeactivatedEvent', user, {
      deactivationReason
    });
  }
} 