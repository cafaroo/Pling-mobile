import { BaseUserEvent } from './BaseUserEvent';
import { User } from '../entities/User';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * UserNotificationSettingsChangedEvent
 * 
 * Domänhändelse som publiceras när en användares notifikationsinställningar har ändrats.
 * Innehåller information om användaren och de ändrade inställningarna.
 */
export class UserNotificationSettingsChangedEvent extends BaseUserEvent {
  /**
   * Skapar en ny UserNotificationSettingsChangedEvent
   * 
   * @param user - User-objekt eller ID för användaren
   * @param notifications - Aktuella notifikationsinställningar
   * @param oldSettings - Tidigare notifikationsinställningar
   * @param newSettings - Nya notifikationsinställningar
   */
  constructor(
    user: User | UniqueId,
    notifications: Record<string, any>,
    oldSettings: Record<string, any>,
    newSettings: Record<string, any>
  ) {
    super('UserNotificationSettingsChangedEvent', user, {
      notifications,
      oldSettings,
      newSettings
    });
  }
} 