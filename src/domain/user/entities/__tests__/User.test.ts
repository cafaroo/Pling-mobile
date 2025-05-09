import { User } from '../User';
import { UserSettings } from '../UserSettings';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result } from '@/shared/core/Result';
import { UserProfile } from '../UserProfile';

describe('User', () => {
  let validSettings: UserSettings;
  let validProfile: UserProfile;
  
  beforeEach(async () => {
    const settingsResult = await UserSettings.create({
      theme: 'light',
      language: 'sv',
      notifications: {
        enabled: true,
        frequency: 'daily',
        emailEnabled: true,
        pushEnabled: true
      },
      privacy: {
        profileVisibility: 'public',
        showOnlineStatus: true,
        showLastSeen: true
      }
    });
    validSettings = settingsResult.value;

    const profileResult = await UserProfile.create({
      firstName: 'Test',
      lastName: 'User',
      contact: {
        email: 'test@example.com'
      }
    });
    validProfile = profileResult.value;
  });

  describe('create', () => {
    it('ska skapa en giltig användare med korrekta värden', async () => {
      const result = await User.create({
        email: 'test@example.com',
        name: 'Test User',
        settings: validSettings,
        profile: validProfile,
        teamIds: []
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const user = result.value;
        expect(user.email).toBe('test@example.com');
        expect(user.name).toBe('Test User');
        expect(user.settings).toBe(validSettings);
        expect(user.profile).toBe(validProfile);
        expect(user.teamIds).toEqual([]);
      }
    });

    it('ska returnera fel för ogiltig e-postadress', async () => {
      const result = await User.create({
        email: 'invalid-email',
        name: 'Test User',
        settings: validSettings,
        teamIds: []
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe('Ogiltig e-postadress');
      }
    });

    it('ska returnera fel för för kort namn', async () => {
      const result = await User.create({
        email: 'test@example.com',
        name: 'T',
        settings: validSettings,
        teamIds: []
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe('Namnet måste vara minst 2 tecken');
      }
    });
  });

  describe('updateSettings', () => {
    it('ska uppdatera användarinställningar', async () => {
      const userResult = await User.create({
        email: 'test@example.com',
        name: 'Test User',
        settings: validSettings,
        teamIds: []
      });

      expect(userResult.isOk()).toBe(true);
      if (userResult.isOk()) {
        const user = userResult.value;
        const newSettingsResult = await UserSettings.create({
          theme: 'dark',
          language: 'en',
          notifications: {
            enabled: false,
            frequency: 'weekly',
            emailEnabled: false,
            pushEnabled: false
          },
          privacy: {
            profileVisibility: 'private',
            showOnlineStatus: false,
            showLastSeen: false
          }
        });

        expect(newSettingsResult.isOk()).toBe(true);
        if (newSettingsResult.isOk()) {
          const updateResult = user.updateSettings(newSettingsResult.value);
          expect(updateResult.isOk()).toBe(true);
          expect(user.settings).toBe(newSettingsResult.value);
        }
      }
    });
  });

  describe('team management', () => {
    let user: User;

    beforeEach(async () => {
      const userResult = await User.create({
        email: 'test@example.com',
        name: 'Test User',
        settings: validSettings,
        teamIds: []
      });

      expect(userResult.isOk()).toBe(true);
      if (userResult.isOk()) {
        user = userResult.value;
      }
    });

    it('ska lägga till ett team', () => {
      const teamId = 'test-team-1';
      const result = user.addTeam(teamId);
      
      expect(result.isOk()).toBe(true);
      expect(user.teamIds).toContain(teamId);
    });

    it('ska inte lägga till samma team två gånger', () => {
      const teamId = 'test-team-1';
      const firstAdd = user.addTeam(teamId);
      expect(firstAdd.isOk()).toBe(true);
      
      const secondAdd = user.addTeam(teamId);
      expect(secondAdd.isErr()).toBe(true);
      if (secondAdd.isErr()) {
        expect(secondAdd.error).toBe('Användaren är redan medlem i teamet');
      }
    });

    it('ska ta bort ett team', () => {
      const teamId = 'test-team-1';
      const addResult = user.addTeam(teamId);
      expect(addResult.isOk()).toBe(true);
      
      const removeResult = user.removeTeam(teamId);
      expect(removeResult.isOk()).toBe(true);
      expect(user.teamIds).not.toContain(teamId);
    });

    it('ska returnera fel vid borttagning av icke-existerande team', () => {
      const result = user.removeTeam('non-existent-team');
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe('Användaren är inte medlem i teamet');
      }
    });
  });
}); 