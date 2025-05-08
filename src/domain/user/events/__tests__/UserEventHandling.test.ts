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

describe('UserEventHandling - Integrationstest', () => {
  // Skapa testbara varianter av domänentiteter
  let user: any;
  let eventBus: EventBus;
  let capturedEvents: any[] = [];
  
  // Skapa testfixtures och återställ eventBus
  beforeEach(() => {
    // Återställ händelselistan
    capturedEvents = [];
    
    // Skapa en färsk EventBus för varje test
    eventBus = new EventBus();
    
    // Prenumerera på alla användarhändelser och samla in dem
    eventBus.subscribe('UserCreated', (event) => {
      capturedEvents.push(event);
    });
    eventBus.subscribe('UserProfileUpdated', (event) => {
      capturedEvents.push(event);
    });
    eventBus.subscribe('UserSettingsUpdated', (event) => {
      capturedEvents.push(event);
    });
    eventBus.subscribe('UserTeamJoined', (event) => {
      capturedEvents.push(event);
    });
    eventBus.subscribe('UserRoleAdded', (event) => {
      capturedEvents.push(event);
    });
    eventBus.subscribe('UserStatusChanged', (event) => {
      capturedEvents.push(event);
    });
    
    // Prenumerera på nya händelser
    eventBus.subscribe('UserActivated', (event) => {
      capturedEvents.push(event);
    });
    eventBus.subscribe('UserDeactivated', (event) => {
      capturedEvents.push(event);
    });
    eventBus.subscribe('UserDeleted', (event) => {
      capturedEvents.push(event);
    });
    eventBus.subscribe('UserPrivacySettingsChanged', (event) => {
      capturedEvents.push(event);
    });
    eventBus.subscribe('UserNotificationSettingsChanged', (event) => {
      capturedEvents.push(event);
    });
    eventBus.subscribe('UserSecurityEvent', (event) => {
      capturedEvents.push(event);
    });
    eventBus.subscribe('UserStatisticsUpdated', (event) => {
      capturedEvents.push(event);
    });
    eventBus.subscribe('UserAchievementUnlocked', (event) => {
      capturedEvents.push(event);
    });
    eventBus.subscribe('UserTeamRoleChanged', (event) => {
      capturedEvents.push(event);
    });
    eventBus.subscribe('UserTeamInvited', (event) => {
      capturedEvents.push(event);
    });
    
    // Skapa testanvändare
    user = createTestUser().getValue();
    // Lägg till ett id-fält om det saknas, för att matcha User-entitetsstrukturen
    if (!user.id) {
      user.id = { toString: () => 'test-user-id' };
    }
  });
  
  describe('Användarlivscykel', () => {
    it('ska publicera UserCreated när användaren skapas', async () => {
      // Rensa alla tidigare händelser
      capturedEvents = [];
      
      // Publicera UserCreated-händelse
      const createdEvent = new UserCreated(user);
      await eventBus.publish(createdEvent);
      
      // Använd error-helpers för att validera händelsen
      expectEventPublished(
        capturedEvents,
        UserCreated,
        event => true, // Acceptera alla händelser av rätt typ
        'user creation event'
      );
      
      // Validera att händelsen har rätt fält
      expectObjectFields(
        capturedEvents[0].data,
        ['userId', 'occurredAt'],
        'event data structure'
      );
    });
    
    it('ska publicera UserActivated när användaren aktiveras', async () => {
      // Rensa alla tidigare händelser
      capturedEvents = [];
      
      const activatedEvent = new UserActivated(user, 'email_verification');
      await eventBus.publish(activatedEvent);
      
      // Validera händelsen
      expectEventPublished(
        capturedEvents,
        UserActivated,
        event => event.activationReason === 'email_verification',
        'activation event'
      );
    });
    
    it('ska publicera UserDeactivated när användaren inaktiveras', async () => {
      // Rensa alla tidigare händelser
      capturedEvents = [];
      
      const deactivatedEvent = new UserDeactivated(user, 'admin_action');
      await eventBus.publish(deactivatedEvent);
      
      // Validera händelsen
      expectEventPublished(
        capturedEvents,
        UserDeactivated,
        event => event.deactivationReason === 'admin_action',
        'deactivation event'
      );
    });
  });
  
  describe('Team och rollhantering', () => {
    it('ska publicera UserTeamJoined när användaren går med i team', async () => {
      // Rensa alla tidigare händelser
      capturedEvents = [];
      
      const teamId = 'test-team-id';
      const joinedEvent = new UserTeamJoined(user, teamId);
      await eventBus.publish(joinedEvent);
      
      // Validera händelsen
      expectEventPublished(
        capturedEvents,
        UserTeamJoined,
        event => true,
        'team joined event'
      );
    });
    
    it('ska publicera UserRoleAdded när användaren tilldelas en roll', async () => {
      // Rensa alla tidigare händelser
      capturedEvents = [];
      
      const roleId = 'test-role-id';
      const roleAddedEvent = new UserRoleAdded(user, roleId);
      await eventBus.publish(roleAddedEvent);
      
      // Validera händelsen
      expectEventPublished(
        capturedEvents,
        UserRoleAdded,
        event => true,
        'role added event'
      );
    });
    
    it('ska publicera UserTeamRoleChanged när användarens roll i team ändras', async () => {
      // Rensa alla tidigare händelser
      capturedEvents = [];
      
      const teamId = 'test-team-id';
      const oldRoleId = 'member';
      const newRoleId = 'admin';
      const roleChangedEvent = new UserTeamRoleChanged(
        user,
        teamId,
        oldRoleId,
        newRoleId
      );
      await eventBus.publish(roleChangedEvent);
      
      // Validera händelsen
      expectEventPublished(
        capturedEvents,
        UserTeamRoleChanged,
        event => true,
        'role changed event'
      );
    });
  });
  
  describe('Privacy och säkerhet', () => {
    it('ska publicera UserPrivacySettingsChanged när privacyinställningar ändras', async () => {
      // Rensa alla tidigare händelser
      capturedEvents = [];
      
      const settingsChangedEvent = new UserPrivacySettingsChanged(
        user,
        { profileVisibility: 'private' }
      );
      await eventBus.publish(settingsChangedEvent);
      
      // Validera händelsen
      expectEventPublished(
        capturedEvents,
        UserPrivacySettingsChanged,
        event => true,
        'privacy settings event'
      );
    });
    
    it('ska publicera UserNotificationSettingsChanged när notifikationsinställningar ändras', async () => {
      // Rensa alla tidigare händelser
      capturedEvents = [];
      
      const notificationEvent = new UserNotificationSettingsChanged(
        user,
        { email: false, push: true }
      );
      await eventBus.publish(notificationEvent);
      
      // Validera händelsen
      expectEventPublished(
        capturedEvents,
        UserNotificationSettingsChanged,
        event => true,
        'notification settings event'
      );
    });
    
    it('ska publicera UserSecurityEvent vid säkerhetsrelaterade händelser', async () => {
      // Rensa alla tidigare händelser
      capturedEvents = [];
      
      const securityEvent = new UserSecurityEvent(
        user,
        'password_reset',
        { ip: '192.168.1.1' }
      );
      await eventBus.publish(securityEvent);
      
      // Validera händelsen
      expectEventPublished(
        capturedEvents,
        UserSecurityEvent,
        event => true,
        'security event'
      );
    });
  });
  
  describe('Statistik och beteende', () => {
    it('ska publicera UserStatisticsUpdated när användarstatistik uppdateras', async () => {
      // Rensa alla tidigare händelser
      capturedEvents = [];
      
      const statsEvent = new UserStatisticsUpdated(
        user,
        { loginCount: 10, lastSeen: new Date() }
      );
      await eventBus.publish(statsEvent);
      
      // Validera händelsen
      expectEventPublished(
        capturedEvents,
        UserStatisticsUpdated,
        event => true,
        'statistics event'
      );
    });
    
    it('ska publicera UserAchievementUnlocked när användaren låser upp en prestation', async () => {
      // Rensa alla tidigare händelser
      capturedEvents = [];
      
      const achievementEvent = new UserAchievementUnlocked(
        user,
        'profile_completed',
        { points: 50 }
      );
      await eventBus.publish(achievementEvent);
      
      // Validera händelsen
      expectEventPublished(
        capturedEvents,
        UserAchievementUnlocked,
        event => event.achievementId === 'profile_completed',
        'achievement event'
      );
    });
  });
  
  describe('Händelseprenumeration', () => {
    it('ska låta prenumeranter få händelser', async () => {
      // Rensa alla tidigare händelser
      capturedEvents = [];
      
      // Lägg till en specifik prenumerant
      let receivedEvent = null;
      eventBus.subscribe('UserCreated', (event) => {
        receivedEvent = event;
      });
      
      // Publicera en händelse
      await eventBus.publish(new UserCreated(user));
      
      // Verifiera att prenumeranten fick händelsen
      expect(receivedEvent).not.toBeNull();
      expect(receivedEvent).toBeInstanceOf(UserCreated);
    });
    
    it('ska stödja flera prenumerationer på olika händelser', async () => {
      // Rensa alla tidigare händelser
      capturedEvents = [];
      
      // Skapa en array för att samla in flera händelser
      const receivedEvents: any[] = [];
      
      // Prenumerera på flera olika händelser
      eventBus.subscribe('UserCreated', (event) => {
        receivedEvents.push(event);
      });
      
      eventBus.subscribe('UserActivated', (event) => {
        receivedEvents.push(event);
      });
      
      // Publicera händelser
      await eventBus.publish(new UserCreated(user));
      await eventBus.publish(new UserActivated(user, 'test'));
      
      // Verifiera att båda händelserna togs emot
      expect(receivedEvents.length).toBe(2);
      expect(receivedEvents[0]).toBeInstanceOf(UserCreated);
      expect(receivedEvents[1]).toBeInstanceOf(UserActivated);
    });
  });
}); 