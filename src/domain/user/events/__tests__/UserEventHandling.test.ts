/**
 * Avancerade tester för användarhändelser (UserEvent) och EventBus integration
 * 
 * Detta test demonstrerar:
 * 1. Hur domänhändelser skapas av användare-entiteter
 * 2. Hur EventBus hanterar prenumerationer på händelser
 * 3. Hur händelser kan valideras och testas med error-helpers.ts
 */

import { UniqueId } from '@/shared/domain/UniqueId';
import { User } from '../../entities/User';
import { UserProfile } from '../../entities/UserProfile';
import { UserSettings } from '../../entities/UserSettings';
import { Email } from '../../value-objects/Email';
import { 
  UserCreated,
  UserProfileUpdated,
  UserSettingsUpdated,
  UserTeamJoined,
  UserRoleAdded,
  UserStatusChanged,
  UserActivated,
  UserDeactivated,
  UserDeleted,
  UserPrivacySettingsChanged,
  UserNotificationSettingsChanged,
  UserSecurityEvent,
  UserStatisticsUpdated,
  UserAchievementUnlocked,
  UserTeamRoleChanged,
  UserTeamInvited
} from '../UserEvent';
import { EventBus } from '@/shared/core/EventBus';
import { 
  expectEventPublished,
  expectObjectFields,
  expectResultOk 
} from '@/test-utils/error-helpers';
import { ok } from '@/shared/core/Result';
import { createTestUser, createTestUserProfile, createTestUserSettings } from '@/test-utils/mocks/UserTestData';

// Mocka EventBus för att testa händelsehantering
class MockEventBus implements EventBus {
  private events: any[] = [];
  private subscribers: Map<string, Array<(event: any) => void>> = new Map();

  async publish(event: any): Promise<void> {
    this.events.push(event);
    
    // Hämta alla prenumeranter för händelsetypen och anropa dem
    const eventName = event.eventName || event.name;
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
    
    // Skapa testanvändare
    user = createTestUser();
    // Lägg till ett id-fält om det saknas, för att matcha User-entitetsstrukturen
    if (!user.id) {
      user.id = { toString: () => 'test-user-id' };
    }
  });
  
  describe('Användarlivscykel', () => {
    it('ska publicera UserCreated när användaren skapas', async () => {
      // Skapa händelse och publicera
      const event = new UserCreated(user);
      await eventBus.publish(event);
      
      // Verifiera att händelsen publicerades korrekt
      const publishedEvents = eventBus.getPublishedEvents();
      expect(publishedEvents.length).toBe(1);
      expect(publishedEvents[0].eventName).toBe('user.created');
      expect(publishedEvents[0].user).toBe(user);
    });
    
    it('ska publicera UserActivated när användaren aktiveras', async () => {
      // Skapa händelse och publicera
      const event = new UserActivated(user);
      await eventBus.publish(event);
      
      // Verifiera att händelsen publicerades korrekt
      const publishedEvents = eventBus.getPublishedEvents();
      expect(publishedEvents.length).toBe(1);
      expect(publishedEvents[0].eventName).toBe('user.activated');
      expect(publishedEvents[0].user).toBe(user);
    });
    
    it('ska publicera UserDeactivated när användaren inaktiveras', async () => {
      // Skapa händelse och publicera
      const event = new UserDeactivated(user, 'test_deactivation');
      await eventBus.publish(event);
      
      // Verifiera att händelsen publicerades korrekt
      const publishedEvents = eventBus.getPublishedEvents();
      expect(publishedEvents.length).toBe(1);
      expect(publishedEvents[0].eventName).toBe('user.deactivated');
      expect(publishedEvents[0].user).toBe(user);
      expect(publishedEvents[0].deactivationReason).toBe('test_deactivation');
    });
  });
  
  describe('Team och rollhantering', () => {
    it('ska publicera UserTeamJoined när användaren går med i team', async () => {
      // Skapa en teamid
      const teamId = new UniqueId('test-team-id');
      
      // Anropa domänmetoden
      user.addTeam(teamId.toString());
      
      // Skapa och publicera händelse
      const event = new UserTeamJoined(user, teamId);
      await eventBus.publish(event);
      
      // Verifiera att händelsen publicerades korrekt
      const publishedEvents = eventBus.getPublishedEvents();
      expect(publishedEvents.length).toBe(1);
      expect(publishedEvents[0].eventName).toBe('user.team.joined');
      expect(publishedEvents[0].teamId).toBe(teamId);
    });
    
    it('ska publicera UserRoleAdded när användaren tilldelas en roll', async () => {
      // Skapa en rollid
      const roleId = new UniqueId('test-role-id');
      
      // Anropa domänmetoden
      user.addRole(roleId.toString());
      
      // Skapa och publicera händelse
      const event = new UserRoleAdded(user, roleId);
      await eventBus.publish(event);
      
      // Verifiera
      const publishedEvents = eventBus.getPublishedEvents();
      expect(publishedEvents.length).toBe(1);
      expect(publishedEvents[0].eventName).toBe('user.role.added');
      expect(publishedEvents[0].roleId).toBe(roleId);
    });
    
    it('ska publicera UserTeamRoleChanged när användarens roll i team ändras', async () => {
      // Skapa en teamid
      const teamId = new UniqueId('test-team-id');
      const role = 'admin';
      
      // Skapa och publicera händelse
      const event = new UserTeamRoleChanged(user, teamId, role);
      await eventBus.publish(event);
      
      // Verifiera
      const publishedEvents = eventBus.getPublishedEvents();
      expect(publishedEvents.length).toBe(1);
      expect(publishedEvents[0].eventName).toBe('user.team.role_changed');
      expect(publishedEvents[0].role).toBe(role);
    });
  });
  
  describe('Privacy och säkerhet', () => {
    it('ska publicera UserPrivacySettingsChanged när privacyinställningar ändras', async () => {
      // Skapa privacyinställningar
      const privacy = { showProfile: true, showActivity: false };
      
      // Skapa och publicera händelse
      const event = new UserPrivacySettingsChanged(user, privacy);
      await eventBus.publish(event);
      
      // Verifiera
      const publishedEvents = eventBus.getPublishedEvents();
      expect(publishedEvents.length).toBe(1);
      expect(publishedEvents[0].eventName).toBe('user.privacy_settings.changed');
      expect(publishedEvents[0].privacy).toBe(privacy);
    });
    
    it('ska publicera UserNotificationSettingsChanged när notifikationsinställningar ändras', async () => {
      // Skapa notifikationsinställningar
      const notifications = { email: true, push: true };
      
      // Skapa och publicera händelse
      const event = new UserNotificationSettingsChanged(user, notifications);
      await eventBus.publish(event);
      
      // Verifiera
      const publishedEvents = eventBus.getPublishedEvents();
      expect(publishedEvents.length).toBe(1);
      expect(publishedEvents[0].eventName).toBe('user.notification_settings.changed');
      expect(publishedEvents[0].notifications).toBe(notifications);
    });
    
    it('ska publicera UserSecurityEvent vid säkerhetsrelaterade händelser', async () => {
      // Skapa säkerhetshändelse
      const securityEvent = 'login_attempt';
      const metadata = { ip: '192.168.1.1', success: true };
      
      // Skapa och publicera händelse
      const event = new UserSecurityEvent(user, securityEvent, metadata);
      await eventBus.publish(event);
      
      // Verifiera
      const publishedEvents = eventBus.getPublishedEvents();
      expect(publishedEvents.length).toBe(1);
      expect(publishedEvents[0].eventName).toBe('user.security.login_attempt');
      expect(publishedEvents[0].metadata).toBe(metadata);
    });
  });
  
  describe('Statistik och beteende', () => {
    it('ska publicera UserStatisticsUpdated när användarstatistik uppdateras', async () => {
      // Skapa statistik
      const stats = { logins: 5, actionsCompleted: 10 };
      
      // Skapa och publicera händelse
      const event = new UserStatisticsUpdated(user, stats);
      await eventBus.publish(event);
      
      // Verifiera
      const publishedEvents = eventBus.getPublishedEvents();
      expect(publishedEvents.length).toBe(1);
      expect(publishedEvents[0].eventName).toBe('user.statistics.updated');
      expect(publishedEvents[0].statistics).toBe(stats);
    });
    
    it('ska publicera UserAchievementUnlocked när användaren låser upp en prestation', async () => {
      // Skapa prestation
      const achievement = { id: 'first_login', name: 'First Login', points: 10 };
      
      // Skapa och publicera händelse
      const event = new UserAchievementUnlocked(user, achievement);
      await eventBus.publish(event);
      
      // Verifiera
      const publishedEvents = eventBus.getPublishedEvents();
      expect(publishedEvents.length).toBe(1);
      expect(publishedEvents[0].eventName).toBe('user.achievement.unlocked');
      expect(publishedEvents[0].achievement).toBe(achievement);
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
      await eventBus.publish(event);
      
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
      await eventBus.publish(new UserCreated(user));
      await eventBus.publish(new UserActivated(user));
      
      // Verifiera att callbackarna anropades korrekt
      expect(createdCallback).toHaveBeenCalledTimes(1);
      expect(activatedCallback).toHaveBeenCalledTimes(1);
    });
  });
}); 