import { BaseUserEvent } from './BaseUserEvent';
import { User } from '../entities/User';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * UserActivatedEvent
 * 
 * Domänhändelse som publiceras när en användare har aktiverats.
 * Innehåller information om användaren och orsaken till aktivering.
 */
export class UserActivatedEvent extends BaseUserEvent {
  /**
   * Skapar en ny UserActivatedEvent
   * 
   * @param user - User-objekt eller ID för användaren
   * @param activationReason - Orsak till aktivering (valfritt)
   */
  constructor(
    user: User | UniqueId,
    activationReason: string = ''
  ) {
    super('UserActivatedEvent', user, {
      activationReason
    });
  }
} 