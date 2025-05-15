import { BaseUserEvent } from './BaseUserEvent';
import { User } from '../entities/User';
import { UniqueId } from '@/shared/core/UniqueId';
import { UserSettings } from '../entities/UserSettings';

/**
 * UserSettingsUpdatedEvent
 * 
 * Domänhändelse som publiceras när en användares inställningar har uppdaterats.
 * Innehåller information om användarens nya inställningar.
 */
export class UserSettingsUpdatedEvent extends BaseUserEvent {
  /**
   * Skapar en ny UserSettingsUpdatedEvent
   * 
   * @param user - User-objekt eller ID för användaren
   * @param settings - De uppdaterade inställningarna
   */
  constructor(
    user: User | UniqueId,
    settings: UserSettings
  ) {
    super('UserSettingsUpdatedEvent', user, {
      settings: typeof settings === 'object' ? settings : undefined
    });
  }
} 