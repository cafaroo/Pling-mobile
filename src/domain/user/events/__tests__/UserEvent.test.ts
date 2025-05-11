/**
 * @jest-environment node
 */

import { 
  UserEvent, 
  UserCreated, 
  UserActivated, 
  UserDeactivated,
  UserPrivacySettingsChanged,
  UserNotificationSettingsChanged,
  UserSecurityEvent
} from '../UserEvent';

// Manuellt skapa UniqueId istället för att importera
class UniqueId {
  constructor(public readonly id: string) {}

  toString(): string {
    return this.id;
  }

  equals(other: UniqueId): boolean {
    return this.id === other.id;
  }
}

// Mock för User
class User {
  id: UniqueId;
  profile: any;
  settings: any;
  
  constructor(id = 'test-user-id') {
    this.id = new UniqueId(id);
    this.profile = { 
      firstName: 'Test', 
      lastName: 'User',
      displayName: 'TestUser',
      bio: 'Test bio',
      location: 'Stockholm'
    };
    this.settings = {
      theme: 'light',
      language: 'sv',
      notifications: { email: true, push: true, inApp: true },
      privacy: { showProfile: true, showActivity: true }
    };
  }
  
  addTeam() {}
  addRole() {}
}

describe('UserEvent', () => {
  let user;
  
  beforeEach(() => {
    user = new User();
  });
  
  describe('UserCreated', () => {
    it('ska skapa händelse med korrekt struktur', () => {
      const event = new UserCreated(user);
      
      expect(event.eventName).toBe('user.created');
      expect(event.user).toBe(user);
      expect(event.aggregateId).toBe(user.id);
      expect(event.dateTimeOccurred).toBeInstanceOf(Date);
    });
  });
  
  describe('UserActivated', () => {
    it('ska sätta aktiveringsorsak korrekt', () => {
      const reason = 'email_verification';
      const event = new UserActivated(user, reason);
      
      expect(event.eventName).toBe('user.activated');
      expect(event.user).toBe(user);
      expect(event.activationReason).toBe(reason);
    });
  });
  
  describe('UserDeactivated', () => {
    it('ska sätta inaktiveringsorsak korrekt', () => {
      const reason = 'user_request';
      const event = new UserDeactivated(user, reason);
      
      expect(event.eventName).toBe('user.deactivated');
      expect(event.user).toBe(user);
      expect(event.deactivationReason).toBe(reason);
    });
  });
  
  describe('UserPrivacySettingsChanged', () => {
    it('ska hantera privacy-objekt korrekt', () => {
      const privacy = { showProfile: false, showActivity: false };
      const event = new UserPrivacySettingsChanged(user, privacy);
      
      expect(event.eventName).toBe('user.privacy_settings.changed');
      expect(event.user).toBe(user);
      expect(event.privacy).toBe(privacy);
    });
  });
  
  describe('UserNotificationSettingsChanged', () => {
    it('ska hantera notifications-objekt korrekt', () => {
      const notifications = { email: false, push: true };
      const oldSettings = { email: true, push: true };
      const newSettings = { email: false, push: true };
      
      const event = new UserNotificationSettingsChanged(
        user, 
        notifications,
        oldSettings,
        newSettings
      );
      
      expect(event.eventName).toBe('user.notification_settings.changed');
      expect(event.user).toBe(user);
      expect(event.notifications).toBe(notifications);
      expect(event.oldSettings).toBe(oldSettings);
      expect(event.newSettings).toBe(newSettings);
    });
  });
  
  describe('UserSecurityEvent', () => {
    it('ska hantera säkerhetshändelser med metadata', () => {
      const securityEvent = 'password_change';
      const metadata = { ip: '192.168.1.1', userAgent: 'Test Browser' };
      
      const event = new UserSecurityEvent(user, securityEvent, metadata);
      
      expect(event.eventName).toBe(`user.security.${securityEvent}`);
      expect(event.user).toBe(user);
      expect(event.securityEvent).toBe(securityEvent);
      expect(event.metadata).toBe(metadata);
    });
  });
}); 