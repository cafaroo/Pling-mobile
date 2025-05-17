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
  name: string = 'TestUser';
  email: { value: string } = { value: 'test@example.com' };
  
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

  async publish(eventType: string, event: any): Promise<void> {
    this.events.push({ eventType, event });
    
    // Hämta alla prenumeranter för händelsetypen och anropa dem
    const handlersForEvent = this.subscribers.get(eventType) || [];
    
    for (const handler of handlersForEvent) {
      await handler(event);
    }
  }

  subscribe(eventType: string, callback: (event: any) => void): { unsubscribe: () => void } {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }

    const handlers = this.subscribers.get(eventType)!;
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
      await eventBus.publish(event.eventType, event);
      
      // Verifiera att händelsen publicerades korrekt
      const publishedEvents = eventBus.getPublishedEvents();
      expect(publishedEvents.length).toBe(1);
      expect(publishedEvents[0].eventType).toBe('UserCreated');
      expect(publishedEvents[0].event.data.userId).toBeDefined();
    });
    
    it('ska publicera UserActivated när användaren aktiveras', async () => {
      // Skapa händelse och publicera
      const event = new UserActivated(user, 'email_verification');
      await eventBus.publish(event.eventType, event);
      
      // Verifiera att händelsen publicerades korrekt
      const publishedEvents = eventBus.getPublishedEvents();
      expect(publishedEvents.length).toBe(1);
      expect(publishedEvents[0].eventType).toBe('UserActivated');
      expect(publishedEvents[0].event.data.userId).toBeDefined();
      expect(publishedEvents[0].event.data.activationReason).toBe('email_verification');
    });
    
    it('ska publicera UserDeactivated när användaren inaktiveras', async () => {
      // Skapa händelse och publicera
      const event = new UserDeactivated(user, 'user_request');
      await eventBus.publish(event.eventType, event);
      
      // Verifiera att händelsen publicerades korrekt
      const publishedEvents = eventBus.getPublishedEvents();
      expect(publishedEvents.length).toBe(1);
      expect(publishedEvents[0].eventType).toBe('UserDeactivated');
      expect(publishedEvents[0].event.data.userId).toBeDefined();
      expect(publishedEvents[0].event.data.deactivationReason).toBe('user_request');
    });
  });
  
  describe('Privacy och säkerhet', () => {
    it('ska publicera UserPrivacySettingsChanged när privacyinställningar ändras', async () => {
      // Skapa privacyinställningar
      const privacy = { showProfile: false, showActivity: false };
      
      // Skapa och publicera händelse
      const event = new UserPrivacySettingsChanged(user, privacy);
      await eventBus.publish(event.eventType, event);
      
      // Verifiera
      const publishedEvents = eventBus.getPublishedEvents();
      expect(publishedEvents.length).toBe(1);
      expect(publishedEvents[0].eventType).toBe('UserPrivacySettingsChanged');
      expect(publishedEvents[0].event.data.userId).toBeDefined();
      expect(publishedEvents[0].event.data.privacy).toBe(privacy);
    });
    
    it('ska publicera UserNotificationSettingsChanged när notifikationsinställningar ändras', async () => {
      // Skapa notifikationsinställningar
      const notifications = { email: true, push: true };
      const oldSettings = { email: false, push: false };
      const newSettings = { email: true, push: true };
      
      // Skapa och publicera händelse
      const event = new UserNotificationSettingsChanged(user, notifications, oldSettings, newSettings);
      await eventBus.publish(event.eventType, event);
      
      // Verifiera
      const publishedEvents = eventBus.getPublishedEvents();
      expect(publishedEvents.length).toBe(1);
      expect(publishedEvents[0].eventType).toBe('UserNotificationSettingsChanged');
      expect(publishedEvents[0].event.data.userId).toBeDefined();
      expect(publishedEvents[0].event.data.notifications).toBe(notifications);
      expect(publishedEvents[0].event.data.oldSettings).toBe(oldSettings);
      expect(publishedEvents[0].event.data.newSettings).toBe(newSettings);
    });
    
    it('ska publicera UserSecurityEvent vid säkerhetsrelaterade händelser', async () => {
      // Skapa säkerhetshändelse
      const securityEvent = 'login_attempt';
      const metadata = { ip: '192.168.1.1', success: true };
      
      // Skapa och publicera händelse
      const event = new UserSecurityEvent(user, securityEvent, metadata);
      await eventBus.publish(event.eventType, event);
      
      // Verifiera
      const publishedEvents = eventBus.getPublishedEvents();
      expect(publishedEvents.length).toBe(1);
      expect(publishedEvents[0].eventType).toBe('UserSecurityEvent');
      expect(publishedEvents[0].event.data.userId).toBeDefined();
      expect(publishedEvents[0].event.data.securityEvent).toBe(securityEvent);
      expect(publishedEvents[0].event.data.metadata).toBe(metadata);
    });
  });
  
  describe('Händelseprenumeration', () => {
    it('ska låta prenumeranter få händelser', async () => {
      // Skapa en händelse
      const event = new UserCreated(user);
      
      // Skapa en mock-callback
      const mockCallback = jest.fn();
      
      // Prenumerera på händelsen
      eventBus.subscribe('UserCreated', mockCallback);
      
      // Publicera händelsen
      await eventBus.publish(event.eventType, event);
      
      // Verifiera att callbacken anropades
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(event);
    });
    
    it('ska stödja flera prenumerationer på olika händelser', async () => {
      // Skapa mock-callbacks
      const createdCallback = jest.fn();
      const activatedCallback = jest.fn();
      
      // Prenumerera på händelserna
      eventBus.subscribe('UserCreated', createdCallback);
      eventBus.subscribe('UserActivated', activatedCallback);
      
      // Publicera olika händelser
      await eventBus.publish('UserCreated', new UserCreated(user));
      await eventBus.publish('UserActivated', new UserActivated(user));
      
      // Verifiera att callbackarna anropades korrekt
      expect(createdCallback).toHaveBeenCalledTimes(1);
      expect(activatedCallback).toHaveBeenCalledTimes(1);
    });
  });
}); 