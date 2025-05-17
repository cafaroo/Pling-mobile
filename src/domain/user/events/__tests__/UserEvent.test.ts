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
  private readonly id: string;

  constructor(id?: string) {
    this.id = id || 'default-id';
  }

  toString(): string {
    return this.id;
  }

  equals(other: UniqueId): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return this.toString() === other.toString();
  }
}

// Mock för User
class User {
  id: UniqueId;
  profile: any;
  settings: any;
  name: string = "TestUser";
  email: { value: string } = { value: "test@example.com" };
  
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
      
      expect(event.eventType).toBe('UserCreated');
      expect(event.data.userId).toBeDefined();
      expect(event.aggregateId).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.eventId).toBeDefined();
    });
  });
  
  describe('UserActivated', () => {
    it('ska sätta aktiveringsorsak korrekt', () => {
      const reason = 'email_verification';
      const event = new UserActivated(user, reason);
      
      expect(event.eventType).toBe('UserActivated');
      expect(event.data.userId).toBeDefined();
      expect(event.data.activationReason).toBe(reason);
      expect(event.activationReason).toBe(reason); // För bakåtkompatibilitet
    });
  });
  
  describe('UserDeactivated', () => {
    it('ska sätta inaktiveringsorsak korrekt', () => {
      const reason = 'user_request';
      const event = new UserDeactivated(user, reason);
      
      expect(event.eventType).toBe('UserDeactivated');
      expect(event.data.userId).toBeDefined();
      expect(event.data.deactivationReason).toBe(reason);
      expect(event.deactivationReason).toBe(reason); // För bakåtkompatibilitet
    });
  });
  
  describe('UserPrivacySettingsChanged', () => {
    it('ska hantera privacy-objekt korrekt', () => {
      const privacy = { showProfile: false, showActivity: false };
      const event = new UserPrivacySettingsChanged(user, privacy);
      
      expect(event.eventType).toBe('UserPrivacySettingsChanged');
      expect(event.data.userId).toBeDefined();
      expect(event.data.privacy).toBe(privacy);
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
      
      expect(event.eventType).toBe('UserNotificationSettingsChanged');
      expect(event.data.userId).toBeDefined();
      expect(event.data.notifications).toBe(notifications);
      expect(event.data.oldSettings).toBe(oldSettings);
      expect(event.data.newSettings).toBe(newSettings);
    });
  });
  
  describe('UserSecurityEvent', () => {
    it('ska hantera säkerhetshändelser med metadata', () => {
      const securityEvent = 'password_change';
      const metadata = { ip: '192.168.1.1', userAgent: 'Test Browser' };
      
      const event = new UserSecurityEvent(user, securityEvent, metadata);
      
      expect(event.eventType).toBe('UserSecurityEvent');
      expect(event.data.userId).toBeDefined();
      expect(event.data.securityEvent).toBe(securityEvent);
      expect(event.data.metadata).toBe(metadata);
    });
  });
}); 