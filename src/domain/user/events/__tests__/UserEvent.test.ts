import { User } from '../../entities/User';
import { UserProfile } from '../../entities/UserProfile';
import { UserSettings } from '../../entities/UserSettings';
import { Email } from '../../value-objects/Email';
import { UniqueId } from '@/shared/domain/UniqueId';
import {
  UserCreated,
  UserProfileUpdated,
  UserSettingsUpdated,
  UserRoleAdded,
  UserRoleRemoved,
  UserTeamJoined,
  UserTeamLeft,
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
import { expectResultOk } from '@/test-utils/error-helpers';

describe('UserEvent', () => {
  // Skapa testbara varianter av domänentiteter
  let user: User;
  
  // Återanvändbar funktion för att skapa en testanvändare
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
    
    return expectResultOk(userResult, 'user creation');
  };
  
  // Skapa testfixtures
  beforeEach(() => {
    user = createTestUser();
  });
  
  describe('Basklassomhändelser', () => {
    it('ska skapa UserCreated-händelse med rätt egenskaper', () => {
      const event = new UserCreated(user);
      
      expect(event.name).toBe('user.created');
      expect(event.data.userId).toBe('test-user-id');
      expect(event.data.occurredAt).toBeInstanceOf(Date);
    });
    
    it('ska skapa UserProfileUpdated-händelse med rätt egenskaper', () => {
      const event = new UserProfileUpdated(user, user.profile);
      
      expect(event.name).toBe('user.profile.updated');
      expect(event.data.userId).toBe('test-user-id');
      expect(event.data.occurredAt).toBeInstanceOf(Date);
      expect(event.profile).toBe(user.profile);
    });
    
    it('ska skapa UserSettingsUpdated-händelse med rätt egenskaper', () => {
      const event = new UserSettingsUpdated(user, user.settings);
      
      expect(event.name).toBe('user.settings.updated');
      expect(event.data.userId).toBe('test-user-id');
      expect(event.data.occurredAt).toBeInstanceOf(Date);
      expect(event.settings).toBe(user.settings);
    });
  });
  
  describe('Kontohändelser', () => {
    it('ska skapa UserActivated-händelse med rätt egenskaper', () => {
      const event = new UserActivated(user, 'email_verification');
      
      expect(event.name).toBe('user.account.activated');
      expect(event.data.userId).toBe('test-user-id');
      expect(event.activationReason).toBe('email_verification');
    });
    
    it('ska skapa UserDeactivated-händelse med rätt egenskaper', () => {
      const event = new UserDeactivated(user, 'user_request');
      
      expect(event.name).toBe('user.account.deactivated');
      expect(event.data.userId).toBe('test-user-id');
      expect(event.deactivationReason).toBe('user_request');
    });
    
    it('ska skapa UserDeleted-händelse med rätt egenskaper', () => {
      const event = new UserDeleted(user, 'gdpr_request');
      
      expect(event.name).toBe('user.account.deleted');
      expect(event.data.userId).toBe('test-user-id');
      expect(event.deletionReason).toBe('gdpr_request');
    });
  });
  
  describe('Privacy- och säkerhetshändelser', () => {
    it('ska skapa UserPrivacySettingsChanged-händelse med rätt egenskaper', () => {
      const oldSettings = { profileVisibility: 'friends' };
      const newSettings = { profileVisibility: 'public' };
      
      const event = new UserPrivacySettingsChanged(user, oldSettings, newSettings);
      
      expect(event.name).toBe('user.privacy.changed');
      expect(event.data.userId).toBe('test-user-id');
      expect(event.oldSettings).toEqual(oldSettings);
      expect(event.newSettings).toEqual(newSettings);
    });
    
    it('ska skapa UserNotificationSettingsChanged-händelse med rätt egenskaper', () => {
      const oldSettings = { email: true, push: true };
      const newSettings = { email: false, push: true };
      
      const event = new UserNotificationSettingsChanged(user, oldSettings, newSettings);
      
      expect(event.name).toBe('user.notifications.changed');
      expect(event.data.userId).toBe('test-user-id');
      expect(event.oldSettings).toEqual(oldSettings);
      expect(event.newSettings).toEqual(newSettings);
    });
    
    it('ska skapa UserSecurityEvent-händelse med rätt egenskaper', () => {
      const metadata = { ip: '192.168.1.1', device: 'mobile' };
      
      const event = new UserSecurityEvent(user, 'login', metadata);
      
      expect(event.name).toBe('user.security.login');
      expect(event.data.userId).toBe('test-user-id');
      expect(event.eventType).toBe('login');
      expect(event.metadata).toEqual(metadata);
    });
    
    it('ska skapa UserSecurityEvent med dynamiskt händelsenamn', () => {
      const loginEvent = new UserSecurityEvent(user, 'login', {});
      const logoutEvent = new UserSecurityEvent(user, 'logout', {});
      
      expect(loginEvent.name).toBe('user.security.login');
      expect(logoutEvent.name).toBe('user.security.logout');
    });
  });
  
  describe('Statistik- och beteendehändelser', () => {
    it('ska skapa UserStatisticsUpdated-händelse med rätt egenskaper', () => {
      const stats = { 
        teamCount: 5, 
        tasksCompleted: 42, 
        activityScore: 98 
      };
      
      const event = new UserStatisticsUpdated(user, stats);
      
      expect(event.name).toBe('user.statistics.updated');
      expect(event.data.userId).toBe('test-user-id');
      expect(event.statistics).toEqual(stats);
    });
    
    it('ska skapa UserAchievementUnlocked-händelse med rätt egenskaper', () => {
      const event = new UserAchievementUnlocked(
        user, 
        'team-player-2023', 
        'Team Player 2023'
      );
      
      expect(event.name).toBe('user.achievement.unlocked');
      expect(event.data.userId).toBe('test-user-id');
      expect(event.achievementId).toBe('team-player-2023');
      expect(event.achievementName).toBe('Team Player 2023');
    });
  });
  
  describe('Teamrelaterade händelser', () => {
    it('ska skapa UserTeamRoleChanged-händelse med rätt egenskaper', () => {
      const teamId = new UniqueId('test-team-id');
      
      const event = new UserTeamRoleChanged(
        user,
        teamId,
        'member',
        'admin'
      );
      
      expect(event.name).toBe('user.team.role_changed');
      expect(event.data.userId).toBe('test-user-id');
      expect(event.teamId).toBe(teamId);
      expect(event.oldRole).toBe('member');
      expect(event.newRole).toBe('admin');
    });
    
    it('ska skapa UserTeamInvited-händelse med rätt egenskaper', () => {
      const teamId = new UniqueId('test-team-id');
      const inviterId = new UniqueId('inviter-id');
      
      const event = new UserTeamInvited(
        user,
        teamId,
        inviterId
      );
      
      expect(event.name).toBe('user.team.invited');
      expect(event.data.userId).toBe('test-user-id');
      expect(event.teamId).toBe(teamId);
      expect(event.inviterId).toBe(inviterId);
    });
  });
}); 
}); 