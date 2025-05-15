import { BaseUserEvent } from './BaseUserEvent';
import { User } from '../entities/User';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * UserSecurityEventOccurredEvent
 * 
 * Domänhändelse som publiceras när en säkerhetsrelaterad händelse har inträffat för en användare.
 * Innehåller information om användaren och den säkerhetsrelaterade händelsen.
 */
export class UserSecurityEventOccurredEvent extends BaseUserEvent {
  /**
   * Skapar en ny UserSecurityEventOccurredEvent
   * 
   * @param user - User-objekt eller ID för användaren
   * @param securityEvent - Typ av säkerhetshändelse (t.ex. "login_attempt", "password_changed")
   * @param metadata - Ytterligare information om säkerhetshändelsen (valfritt)
   */
  constructor(
    user: User | UniqueId,
    securityEvent: string,
    metadata?: Record<string, any>
  ) {
    super('UserSecurityEventOccurredEvent', user, {
      securityEvent,
      metadata
    });
  }
} 