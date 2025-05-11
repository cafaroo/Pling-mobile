/**
 * @jest-environment node
 */

import { EventBus } from '@/shared/core/EventBus';
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

// Mocka EventBus för att testa händelsehantering
class MockEventBus implements EventBus {
  private events: any[] = [];
  private subscribers: Map<string, Array<(event: any) => void>> = new Map();

  async publish(eventName: string, event: any): Promise<void> {
    this.events.push({ eventName, event });
    
    // Hämta alla prenumeranter för händelsetypen och anropa dem
    const handlersForEvent = this.subscribers.get(eventName) || [];
    
    for (const handler of handlersForEvent) {
      await handler(event);
    }
  }

  subscribe(eventName: string, callback: (event: any) => void): { unsubscribe: () => void } {
    if (!this.subscribers.has(eventName)) {
      this.subscribers.set(eventName, []);
    }

    const handlers = this.subscribers.get(eventName)!;
    handlers.push(callback);

    return {
      unsubscribe: () => {
        const index = handlers.indexOf(callback);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  getPublishedEvents(): any[] {
    return [...this.events];
  }
  
  clearEvents(): void {
    this.events = [];
  }
}

// Testsvit för användar-domänhändelser
describe('UserEventHandling - Integrationstest', () => {
  // Testfixtures
  let eventBus: MockEventBus;
  let user: User;
  
  beforeEach(() => {
    // Återställ domänobjekt och händelsebus inför varje test
    eventBus = new MockEventBus();
    user = new User();
  });
  
  describe('Användarlivscykel', () => {
    it('ska publicera UserCreated när användaren skapas', async () => {
      // Skapa händelse och publicera
      const event = new UserCreated(user);
      await eventBus.publish(event.eventName, event);
      
      // Verifiera att händelsen publicerades korrekt
      const publishedEvents = eventBus.getPublishedEvents();
      expect(publishedEvents.length).toBe(1);
      expect(publishedEvents[0].eventName).toBe('user.created');
      expect(publishedEvents[0].event.user).toBe(user);
    });
    
    it('ska publicera UserActivated när användaren aktiveras', async () => {
      // Skapa händelse och publicera
      const event = new UserActivated(user, 'email_verification');
      await eventBus.publish(event.eventName, event);
      
      // Verifiera att händelsen publicerades korrekt
      const publishedEvents = eventBus.getPublishedEvents();
      expect(publishedEvents.length).toBe(1);
      expect(publishedEvents[0].eventName).toBe('user.activated');
      expect(publishedEvents[0].event.user).toBe(user);
      expect(publishedEvents[0].event.activationReason).toBe('email_verification');
    });
    
    it('ska publicera UserDeactivated när användaren inaktiveras', async () => {
      // Skapa händelse och publicera
      const event = new UserDeactivated(user, 'user_request');
      await eventBus.publish(event.eventName, event);
      
      // Verifiera att händelsen publicerades korrekt
      const publishedEvents = eventBus.getPublishedEvents();
      expect(publishedEvents.length).toBe(1);
      expect(publishedEvents[0].eventName).toBe('user.deactivated');
      expect(publishedEvents[0].event.user).toBe(user);
      expect(publishedEvents[0].event.deactivationReason).toBe('user_request');
    });
  });
  
  describe('Privacy och säkerhet', () => {
    it('ska publicera UserPrivacySettingsChanged när privacyinställningar ändras', async () => {
      // Skapa privacyinställningar
      const privacy = { showProfile: false, showActivity: false };
      
      // Skapa och publicera händelse
      const event = new UserPrivacySettingsChanged(user, privacy);
      await eventBus.publish(event.eventName, event);
      
      // Verifiera
      const publishedEvents = eventBus.getPublishedEvents();
      expect(publishedEvents.length).toBe(1);
      expect(publishedEvents[0].eventName).toBe('user.privacy_settings.changed');
      expect(publishedEvents[0].event.privacy).toBe(privacy);
    });
    
    it('ska publicera UserNotificationSettingsChanged när notifikationsinställningar ändras', async () => {
      // Skapa notifikationsinställningar
      const notifications = { email: true, push: true };
      const oldSettings = { email: false, push: false };
      const newSettings = { email: true, push: true };
      
      // Skapa och publicera händelse
      const event = new UserNotificationSettingsChanged(user, notifications, oldSettings, newSettings);
      await eventBus.publish(event.eventName, event);
      
      // Verifiera
      const publishedEvents = eventBus.getPublishedEvents();
      expect(publishedEvents.length).toBe(1);
      expect(publishedEvents[0].eventName).toBe('user.notification_settings.changed');
      expect(publishedEvents[0].event.notifications).toBe(notifications);
      expect(publishedEvents[0].event.oldSettings).toBe(oldSettings);
      expect(publishedEvents[0].event.newSettings).toBe(newSettings);
    });
    
    it('ska publicera UserSecurityEvent vid säkerhetsrelaterade händelser', async () => {
      // Skapa säkerhetshändelse
      const securityEvent = 'login_attempt';
      const metadata = { ip: '192.168.1.1', success: true };
      
      // Skapa och publicera händelse
      const event = new UserSecurityEvent(user, securityEvent, metadata);
      await eventBus.publish(event.eventName, event);
      
      // Verifiera
      const publishedEvents = eventBus.getPublishedEvents();
      expect(publishedEvents.length).toBe(1);
      expect(publishedEvents[0].eventName).toBe('user.security.login_attempt');
      expect(publishedEvents[0].event.metadata).toBe(metadata);
    });
  });
  
  describe('Händelseprenumeration', () => {
    it('ska låta prenumeranter få händelser', async () => {
      // Skapa en händelse
      const event = new UserCreated(user);
      
      // Skapa en mock-callback
      const mockCallback = jest.fn();
      
      // Prenumerera på händelsen
      eventBus.subscribe('user.created', mockCallback);
      
      // Publicera händelsen
      await eventBus.publish(event.eventName, event);
      
      // Verifiera att callbacken anropades
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(event);
    });
    
    it('ska stödja flera prenumerationer på olika händelser', async () => {
      // Skapa mock-callbacks
      const createdCallback = jest.fn();
      const activatedCallback = jest.fn();
      
      // Prenumerera på händelserna
      eventBus.subscribe('user.created', createdCallback);
      eventBus.subscribe('user.activated', activatedCallback);
      
      // Publicera olika händelser
      await eventBus.publish('user.created', new UserCreated(user));
      await eventBus.publish('user.activated', new UserActivated(user));
      
      // Verifiera att callbackarna anropades korrekt
      expect(createdCallback).toHaveBeenCalledTimes(1);
      expect(activatedCallback).toHaveBeenCalledTimes(1);
    });
  });
}); 