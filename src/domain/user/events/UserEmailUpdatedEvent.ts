import { BaseUserEvent } from './BaseUserEvent';
import { User } from '../entities/User';
import { UniqueId } from '@/shared/core/UniqueId';
import { Email } from '../value-objects/Email';

/**
 * UserEmailUpdatedEvent
 * 
 * Domänhändelse som publiceras när en användares e-postadress har uppdaterats.
 * Innehåller information om användarens tidigare och nya e-postadress.
 */
export class UserEmailUpdatedEvent extends BaseUserEvent {
  /**
   * Skapar en ny UserEmailUpdatedEvent
   * 
   * @param user - User-objekt eller ID för användaren
   * @param oldEmail - Användarens tidigare e-postadress
   * @param newEmail - Användarens nya e-postadress
   */
  constructor(
    user: User | UniqueId,
    oldEmail: string | Email,
    newEmail: string | Email
  ) {
    const oldEmailValue = typeof oldEmail === 'string' ? oldEmail : oldEmail.value;
    const newEmailValue = typeof newEmail === 'string' ? newEmail : newEmail.value;
    
    super('UserEmailUpdatedEvent', user, {
      oldEmail: oldEmailValue,
      newEmail: newEmailValue
    });
  }
} 