import { BaseUserEvent } from './BaseUserEvent';
import { User } from '../entities/User';
import { UniqueId } from '@/shared/core/UniqueId';
import { UserProfile } from '../value-objects/UserProfile';

/**
 * UserProfileUpdatedEvent
 * 
 * Domänhändelse som publiceras när en användares profil har uppdaterats.
 * Innehåller information om de ändringar som gjorts i användarens profil.
 */
export class UserProfileUpdatedEvent extends BaseUserEvent {
  /**
   * Skapar en ny UserProfileUpdatedEvent
   * 
   * @param user - User-objekt eller ID för användaren
   * @param profile - Det uppdaterade profilobjektet, eller delar av det som uppdaterats
   */
  constructor(
    user: User | UniqueId,
    profile: UserProfile | Partial<UserProfile['props']>
  ) {
    const profileData = profile instanceof UserProfile 
      ? profile.props 
      : profile;
      
    super('UserProfileUpdatedEvent', user, {
      profile: profileData
    });
  }
} 