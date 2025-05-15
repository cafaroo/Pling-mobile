import { BaseUserEvent } from './BaseUserEvent';
import { User } from '../entities/User';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * UserCreatedEvent
 * 
 * Domänhändelse som publiceras när en ny användare har skapats.
 * Innehåller grundläggande information om den nya användaren.
 */
export class UserCreatedEvent extends BaseUserEvent {
  /**
   * Skapar en ny UserCreatedEvent
   * 
   * @param user - User-objekt eller ID för den nya användaren
   * @param email - Användarens email (om bara ID skickades in)
   */
  constructor(
    user: User | UniqueId,
    email?: string
  ) {
    const additionalData: Record<string, any> = {};
    
    // Om email angetts explicit (och user är ett ID), lägg till det i eventdata
    if (email) {
      additionalData.email = email;
    }
    
    super('UserCreatedEvent', user, additionalData);
  }
} 