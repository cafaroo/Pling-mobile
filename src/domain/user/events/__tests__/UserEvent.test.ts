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
import { createTestUser, createTestUserProfile, createTestUserSettings } from '@/test-utils/mocks/UserTestData';

describe('UserEvent', () => {
  let user;
  
  // Skapa testfixtures
  beforeEach(() => {
    user = createTestUser();
  });
  
  describe('Basklassomhändelser', () => {
    it('ska skapa UserCreated-händelse med rätt egenskaper', () => {
      const event = new UserCreated(user);
      
      expect(event.eventName).toBe('user.created');
      expect(event.dateTimeOccurred).toBeDefined();
      expect(event.user).toBe(user);
      expect(event.aggregateId).toBe(user.id);
    });
    
    it('ska skapa UserProfileUpdated-händelse med rätt egenskaper', () => {
      const event = new UserProfileUpdated(user);
      
      expect(event.eventName).toBe('user.profile.updated');
      expect(event.dateTimeOccurred).toBeDefined();
      expect(event.user).toBe(user);
      expect(event.profile).toBe(user.profile);
      expect(event.aggregateId).toBe(user.id);
    });
    
    it('ska skapa UserSettingsUpdated-händelse med rätt egenskaper', () => {
      const event = new UserSettingsUpdated(user);
      
      expect(event.eventName).toBe('user.settings.updated');
      expect(event.dateTimeOccurred).toBeDefined();
      expect(event.user).toBe(user);
      expect(event.settings).toBe(user.settings);
      expect(event.aggregateId).toBe(user.id);
    });
  });
  
  describe('Kontohändelser', () => {
    it('ska skapa UserActivated-händelse med rätt egenskaper', () => {
      const event = new UserActivated(user);
      
      expect(event.eventName).toBe('user.activated');
      expect(event.dateTimeOccurred).toBeDefined();
      expect(event.user).toBe(user);
      expect(event.aggregateId).toBe(user.id);
    });
    
    it('ska skapa UserDeactivated-händelse med rätt egenskaper', () => {
      const deactivationReason = 'test_reason';
      const event = new UserDeactivated(user, deactivationReason);
      
      expect(event.eventName).toBe('user.deactivated');
      expect(event.dateTimeOccurred).toBeDefined();
      expect(event.user).toBe(user);
      expect(event.aggregateId).toBe(user.id);
      expect(event.deactivationReason).toBe(deactivationReason);
      expect(event.name).toBe('user.account.deactivated');
      expect(event.data).toBeDefined();
      expect(event.data.userId).toBe(user.id.toString());
    });
    
    it('ska skapa UserDeleted-händelse med rätt egenskaper', () => {
      const event = new UserDeleted(user);
      
      expect(event.eventName).toBe('user.deleted');
      expect(event.dateTimeOccurred).toBeDefined();
      expect(event.user).toBe(user);
      expect(event.aggregateId).toBe(user.id);
    });
  });
  
  describe('Privacy- och säkerhetshändelser', () => {
    it('ska skapa UserPrivacySettingsChanged-händelse med rätt egenskaper', () => {
      const privacy = { showProfile: true, showActivity: false };
      const event = new UserPrivacySettingsChanged(user, privacy);
      
      expect(event.eventName).toBe('user.privacy_settings.changed');
      expect(event.dateTimeOccurred).toBeDefined();
      expect(event.user).toBe(user);
      expect(event.privacy).toBe(privacy);
      expect(event.aggregateId).toBe(user.id);
    });
    
    it('ska skapa UserNotificationSettingsChanged-händelse med rätt egenskaper', () => {
      const notifications = { email: true, push: false };
      const event = new UserNotificationSettingsChanged(user, notifications);
      
      expect(event.eventName).toBe('user.notification_settings.changed');
      expect(event.dateTimeOccurred).toBeDefined();
      expect(event.user).toBe(user);
      expect(event.notifications).toBe(notifications);
      expect(event.aggregateId).toBe(user.id);
    });
    
    it('ska skapa UserSecurityEvent-händelse med rätt egenskaper', () => {
      const securityEvent = 'password_changed';
      const metadata = { ip: '127.0.0.1', userAgent: 'Test Browser' };
      const event = new UserSecurityEvent(user, securityEvent, metadata);
      
      expect(event.eventName).toBe('user.security.password_changed');
      expect(event.dateTimeOccurred).toBeDefined();
      expect(event.user).toBe(user);
      expect(event.securityEvent).toBe(securityEvent);
      expect(event.metadata).toBe(metadata);
      expect(event.aggregateId).toBe(user.id);
    });
    
    it('ska skapa UserSecurityEvent med dynamiskt händelsenamn', () => {
      const securityEvent = 'login_attempt';
      const event = new UserSecurityEvent(user, securityEvent);
      
      expect(event.eventName).toBe('user.security.login_attempt');
    });
  });
  
  describe('Statistik- och beteendehändelser', () => {
    it('ska skapa UserStatisticsUpdated-händelse med rätt egenskaper', () => {
      const stats = { logins: 5, lastActive: new Date() };
      const event = new UserStatisticsUpdated(user, stats);
      
      expect(event.eventName).toBe('user.statistics.updated');
      expect(event.dateTimeOccurred).toBeDefined();
      expect(event.user).toBe(user);
      expect(event.statistics).toBe(stats);
      expect(event.aggregateId).toBe(user.id);
    });
    
    it('ska skapa UserAchievementUnlocked-händelse med rätt egenskaper', () => {
      const achievement = { id: 'first_login', name: 'First Login', points: 10 };
      const event = new UserAchievementUnlocked(user, achievement);
      
      expect(event.eventName).toBe('user.achievement.unlocked');
      expect(event.dateTimeOccurred).toBeDefined();
      expect(event.user).toBe(user);
      expect(event.achievement).toBe(achievement);
      expect(event.aggregateId).toBe(user.id);
    });
  });
  
  describe('Teamrelaterade händelser', () => {
    it('ska skapa UserTeamRoleChanged-händelse med rätt egenskaper', () => {
      const teamId = new UniqueId();
      const role = 'admin';
      const event = new UserTeamRoleChanged(user, teamId, role);
      
      expect(event.eventName).toBe('user.team.role_changed');
      expect(event.dateTimeOccurred).toBeDefined();
      expect(event.user).toBe(user);
      expect(event.teamId).toBe(teamId);
      expect(event.role).toBe(role);
      expect(event.aggregateId).toBe(user.id);
    });
    
    it('ska skapa UserTeamInvited-händelse med rätt egenskaper', () => {
      const teamId = new UniqueId();
      const inviterId = new UniqueId();
      const event = new UserTeamInvited(user, teamId, inviterId);
      
      expect(event.eventName).toBe('user.team.invited');
      expect(event.dateTimeOccurred).toBeDefined();
      expect(event.user).toBe(user);
      expect(event.teamId).toBe(teamId);
      expect(event.inviterId).toBe(inviterId);
      expect(event.aggregateId).toBe(user.id);
    });
  });
}); 