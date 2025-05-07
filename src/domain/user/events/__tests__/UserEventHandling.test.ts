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

describe('UserEventHandling - Integrationstest', () => {
  // Skapa testbara varianter av domänentiteter
  let user: User;
  let eventBus: EventBus;
  let capturedEvents: any[] = [];
  
  // Mock-implementation av User för testning
  const createTestUser = () => {
    const emailResult = Email.create('test@example.com');
    const profileResult = UserProfile.create({
      firstName: 'Test',
      lastName: 'User',
      displayName: 'TestUser',
      bio: 'Test bio',
      location: 'Stockholm'
    });
    const settingsResult = UserSettings.create({
      theme: 'light',
      language: 'sv',
      notifications: {
        email: true,
        push: true
      },
      privacy: {
        profileVisibility: 'friends'
      }
    });
    
    // Använd error-helpers för att verifiera att domänobjekt skapas korrekt
    const email = expectResultOk(emailResult, 'email creation');
    const profile = expectResultOk(profileResult, 'profile creation');
    const settings = expectResultOk(settingsResult, 'settings creation');
    
    const userResult = User.create({
      id: new UniqueId('test-user-id'),
      email,
      profile,
      settings,
      teamIds: [],
      roleIds: [],
      status: 'active'
    });
    
    // Använd error-helpers för verifiering
    return expectResultOk(userResult, 'user creation');
  };
  
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
    user = createTestUser();
  });
  
  describe('Användarlivscykel', () => {
    it('ska publicera UserCreated när användaren skapas', async () => {
      // Publicera UserCreated-händelse
      const createdEvent = new UserCreated(user);
      await eventBus.publish(createdEvent);
      
      // Använd error-helpers för att validera händelsen
      expectEventPublished(
        capturedEvents,
        UserCreated,
        event => event.data.userId === 'test-user-id',
        'user creation event'
      );
      
      // Validera att händelsen har rätt fält
      expectObjectFields(
        capturedEvents[0].data,
        ['userId', 'occurredAt'],
        'event data structure'
      );
    });
    
    it('ska publicera UserProfileUpdated när profilen uppdateras', async () => {
      // Simulera profiluppdatering
      const updatedProfile = expectResultOk(
        UserProfile.create({
          firstName: 'Updated',
          lastName: 'User',
          displayName: 'UpdatedUser',
          bio: 'Updated bio',
          location: 'Göteborg'
        }),
        'updated profile creation'
      );
      
      // Simulera användarfall som uppdaterar profil
      const updateResult = ok(user);
      // Normalt skulle vi kalla user.updateProfile, men vi simulerar resultatet
      
      // Publicera händelse
      const profileUpdatedEvent = new UserProfileUpdated(
        updateResult.value,
        updatedProfile
      );
      await eventBus.publish(profileUpdatedEvent);
      
      // Validera händelsen
      expectEventPublished(
        capturedEvents,
        UserProfileUpdated,
        event => event.profile.location === 'Göteborg',
        'profile update event'
      );
    });
    
    it('ska publicera UserSettingsUpdated när inställningar uppdateras', async () => {
      // Simulera inställningsuppdatering
      const updatedSettings = expectResultOk(
        UserSettings.create({
          theme: 'dark',
          language: 'en',
          notifications: {
            email: false,
            push: true
          },
          privacy: {
            profileVisibility: 'public'
          }
        }),
        'updated settings creation'
      );
      
      // Simulera användarfall som uppdaterar inställningar
      const updateResult = ok(user);
      
      // Publicera händelse
      const settingsUpdatedEvent = new UserSettingsUpdated(
        updateResult.value,
        updatedSettings
      );
      await eventBus.publish(settingsUpdatedEvent);
      
      // Validera händelsen
      expectEventPublished(
        capturedEvents,
        UserSettingsUpdated,
        event => event.settings.theme === 'dark',
        'settings update event'
      );
    });
    
    it('ska publicera UserActivated när användaren aktiveras', async () => {
      const activatedEvent = new UserActivated(user, 'email_verification');
      await eventBus.publish(activatedEvent);
      
      // Validera händelsen
      expectEventPublished(
        capturedEvents,
        UserActivated,
        event => event.activationReason === 'email_verification',
        'user activation event'
      );
    });
    
    it('ska publicera UserDeactivated när användaren inaktiveras', async () => {
      const deactivatedEvent = new UserDeactivated(user, 'user_request');
      await eventBus.publish(deactivatedEvent);
      
      // Validera händelsen
      expectEventPublished(
        capturedEvents,
        UserDeactivated,
        event => event.deactivationReason === 'user_request',
        'user deactivation event'
      );
    });
  });
  
  describe('Team och rollhantering', () => {
    it('ska publicera UserTeamJoined när användaren går med i team', async () => {
      // Publicera TeamJoined-händelse
      const teamId = new UniqueId('test-team-id');
      const teamJoinedEvent = new UserTeamJoined(user, teamId);
      await eventBus.publish(teamJoinedEvent);
      
      // Validera händelsen
      expectEventPublished(
        capturedEvents,
        UserTeamJoined,
        event => 
          event.data.userId === 'test-user-id' && 
          event.teamId.toString() === 'test-team-id',
        'team joined event'
      );
    });
    
    it('ska publicera UserRoleAdded när användaren tilldelas en roll', async () => {
      // Publicera RoleAdded-händelse
      const roleId = new UniqueId('admin-role');
      const roleAddedEvent = new UserRoleAdded(user, roleId);
      await eventBus.publish(roleAddedEvent);
      
      // Validera händelsen
      expectEventPublished(
        capturedEvents,
        UserRoleAdded,
        event => event.roleId.toString() === 'admin-role',
        'role added event'
      );
    });
    
    it('ska publicera UserTeamRoleChanged när användarens roll i team ändras', async () => {
      const teamId = new UniqueId('test-team-id');
      const roleChangedEvent = new UserTeamRoleChanged(
        user,
        teamId,
        'member',
        'admin'
      );
      await eventBus.publish(roleChangedEvent);
      
      // Validera händelsen
      expectEventPublished(
        capturedEvents,
        UserTeamRoleChanged,
        event => 
          event.teamId.toString() === 'test-team-id' && 
          event.oldRole === 'member' && 
          event.newRole === 'admin',
        'team role changed event'
      );
    });
    
    it('ska publicera UserTeamInvited när användaren bjuds in till team', async () => {
      const teamId = new UniqueId('test-team-id');
      const inviterId = new UniqueId('inviter-id');
      const invitedEvent = new UserTeamInvited(
        user,
        teamId,
        inviterId
      );
      await eventBus.publish(invitedEvent);
      
      // Validera händelsen
      expectEventPublished(
        capturedEvents,
        UserTeamInvited,
        event => 
          event.teamId.toString() === 'test-team-id' && 
          event.inviterId.toString() === 'inviter-id',
        'team invited event'
      );
    });
  });
  
  describe('Privacy och säkerhet', () => {
    it('ska publicera UserPrivacySettingsChanged när privacyinställningar ändras', async () => {
      const oldSettings = { profileVisibility: 'friends' };
      const newSettings = { profileVisibility: 'public' };
      
      const privacyEvent = new UserPrivacySettingsChanged(
        user,
        oldSettings,
        newSettings
      );
      await eventBus.publish(privacyEvent);
      
      // Validera händelsen
      expectEventPublished(
        capturedEvents,
        UserPrivacySettingsChanged,
        event => 
          event.oldSettings.profileVisibility === 'friends' && 
          event.newSettings.profileVisibility === 'public',
        'privacy settings changed event'
      );
    });
    
    it('ska publicera UserNotificationSettingsChanged när notifikationsinställningar ändras', async () => {
      const oldSettings = { email: true, push: true };
      const newSettings = { email: false, push: true };
      
      const notificationsEvent = new UserNotificationSettingsChanged(
        user,
        oldSettings,
        newSettings
      );
      await eventBus.publish(notificationsEvent);
      
      // Validera händelsen
      expectEventPublished(
        capturedEvents,
        UserNotificationSettingsChanged,
        event => 
          event.oldSettings.email === true && 
          event.newSettings.email === false,
        'notification settings changed event'
      );
    });
    
    it('ska publicera UserSecurityEvent vid säkerhetsrelaterade händelser', async () => {
      const metadata = { ip: '192.168.1.1', device: 'mobile' };
      
      const securityEvent = new UserSecurityEvent(
        user,
        'login',
        metadata
      );
      await eventBus.publish(securityEvent);
      
      // Validera händelsen
      expectEventPublished(
        capturedEvents,
        UserSecurityEvent,
        event => 
          event.eventType === 'login' && 
          event.metadata.ip === '192.168.1.1',
        'security event'
      );
    });
  });
  
  describe('Statistik och beteende', () => {
    it('ska publicera UserStatisticsUpdated när användarstatistik uppdateras', async () => {
      const stats = { 
        teamCount: 5, 
        tasksCompleted: 42, 
        activityScore: 98 
      };
      
      const statsEvent = new UserStatisticsUpdated(user, stats);
      await eventBus.publish(statsEvent);
      
      // Validera händelsen
      expectEventPublished(
        capturedEvents,
        UserStatisticsUpdated,
        event => event.statistics.activityScore === 98,
        'statistics updated event'
      );
    });
    
    it('ska publicera UserAchievementUnlocked när användaren låser upp en prestation', async () => {
      const achievementEvent = new UserAchievementUnlocked(
        user,
        'team-player-2023',
        'Team Player 2023'
      );
      await eventBus.publish(achievementEvent);
      
      // Validera händelsen
      expectEventPublished(
        capturedEvents,
        UserAchievementUnlocked,
        event => 
          event.achievementId === 'team-player-2023' && 
          event.achievementName === 'Team Player 2023',
        'achievement unlocked event'
      );
    });
  });
  
  describe('Flera händelser i följd', () => {
    it('ska hantera en sekvens av händelser korrekt', async () => {
      // Simulera en serie händelser för en användarlivscykel
      
      // 1. Användare skapas
      await eventBus.publish(new UserCreated(user));
      
      // 2. Uppdatera profil
      const updatedProfile = expectResultOk(
        UserProfile.create({
          firstName: 'Updated',
          lastName: 'User',
          displayName: 'UpdatedUser',
          bio: 'Updated bio',
          location: 'Göteborg'
        }),
        'updated profile creation'
      );
      await eventBus.publish(new UserProfileUpdated(user, updatedProfile));
      
      // 3. Gå med i team
      const teamId = new UniqueId('test-team-id');
      await eventBus.publish(new UserTeamJoined(user, teamId));
      
      // 4. Ändra status
      await eventBus.publish(new UserStatusChanged(user, 'active', 'premium'));
      
      // Verifiera att alla händelser har publicerats i rätt ordning
      expect(capturedEvents.length).toBe(4);
      expect(capturedEvents[0]).toBeInstanceOf(UserCreated);
      expect(capturedEvents[1]).toBeInstanceOf(UserProfileUpdated);
      expect(capturedEvents[2]).toBeInstanceOf(UserTeamJoined);
      expect(capturedEvents[3]).toBeInstanceOf(UserStatusChanged);
      
      // Verifiera detaljer i sista händelsen
      const statusEvent = capturedEvents[3] as UserStatusChanged;
      expect(statusEvent.oldStatus).toBe('active');
      expect(statusEvent.newStatus).toBe('premium');
    });
    
    it('ska hantera en komplex sekvens av säkerhets- och kontohändelser', async () => {
      // 1. Användaren loggar in
      await eventBus.publish(new UserSecurityEvent(
        user,
        'login',
        { ip: '192.168.1.1', device: 'mobile' }
      ));
      
      // 2. Användaren aktiveras
      await eventBus.publish(new UserActivated(
        user,
        'email_verification'
      ));
      
      // 3. Användaren uppdaterar privacyinställningar
      await eventBus.publish(new UserPrivacySettingsChanged(
        user,
        { profileVisibility: 'friends' },
        { profileVisibility: 'public' }
      ));
      
      // 4. Användaren uppnår en prestation
      await eventBus.publish(new UserAchievementUnlocked(
        user,
        'first-login',
        'First Login'
      ));
      
      // Verifiera att alla händelser har publicerats i rätt ordning
      expect(capturedEvents.length).toBe(4);
      expect(capturedEvents[0]).toBeInstanceOf(UserSecurityEvent);
      expect(capturedEvents[1]).toBeInstanceOf(UserActivated);
      expect(capturedEvents[2]).toBeInstanceOf(UserPrivacySettingsChanged);
      expect(capturedEvents[3]).toBeInstanceOf(UserAchievementUnlocked);
    });
  });
  
  describe('Händelseprenumeration', () => {
    it('ska låta prenumeranter få händelser', async () => {
      let teamJoinedCallCount = 0;
      let lastTeamId: string | null = null;
      
      // Prenumerera på specifik händelse med custom callback
      const unsubscribe = eventBus.subscribe('UserTeamJoined', (event: UserTeamJoined) => {
        teamJoinedCallCount++;
        lastTeamId = event.teamId.toString();
      });
      
      // Publicera team-händelsen
      const teamId = new UniqueId('test-team-id');
      await eventBus.publish(new UserTeamJoined(user, teamId));
      
      // Verifiera att callbacken anropades
      expect(teamJoinedCallCount).toBe(1);
      expect(lastTeamId).toBe('test-team-id');
      
      // Avsluta prenumerationen
      unsubscribe();
      
      // Publicera en till händelse
      const anotherTeamId = new UniqueId('another-team-id');
      await eventBus.publish(new UserTeamJoined(user, anotherTeamId));
      
      // Verifiera att callbacken inte anropades igen efter unsubscribe
      expect(teamJoinedCallCount).toBe(1);
      expect(lastTeamId).toBe('test-team-id');
    });
    
    it('ska stödja flera prenumerationer på olika händelser', async () => {
      let securityEventCount = 0;
      let privacyEventCount = 0;
      
      // Prenumerera på flera händelser med separata callbacks
      const unsubscribeSecurity = eventBus.subscribe('UserSecurityEvent', () => {
        securityEventCount++;
      });
      
      const unsubscribePrivacy = eventBus.subscribe('UserPrivacySettingsChanged', () => {
        privacyEventCount++;
      });
      
      // Publicera säkerhetshändelse
      await eventBus.publish(new UserSecurityEvent(
        user,
        'login',
        { ip: '192.168.1.1' }
      ));
      
      // Publicera privacy-händelse
      await eventBus.publish(new UserPrivacySettingsChanged(
        user,
        { profileVisibility: 'friends' },
        { profileVisibility: 'public' }
      ));
      
      // Verifiera att båda callbacks anropades
      expect(securityEventCount).toBe(1);
      expect(privacyEventCount).toBe(1);
      
      // Avsluta en prenumeration
      unsubscribeSecurity();
      
      // Publicera fler händelser
      await eventBus.publish(new UserSecurityEvent(
        user,
        'logout',
        { ip: '192.168.1.1' }
      ));
      
      await eventBus.publish(new UserPrivacySettingsChanged(
        user,
        { profileVisibility: 'public' },
        { profileVisibility: 'private' }
      ));
      
      // Verifiera att bara privacy-callbacken anropades igen
      expect(securityEventCount).toBe(1); // Oförändrad
      expect(privacyEventCount).toBe(2); // Ökad
    });
  });
}); 