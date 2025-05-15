import { UserSettings } from '../UserSettings';
import { Language } from '../../value-objects/Language';

describe('UserSettings', () => {
  describe('create', () => {
    it('ska skapa giltiga användarinställningar med standardvärden', () => {
      const result = UserSettings.create({});
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const settings = result.value;
        expect(settings.theme).toBe('system');
        expect(settings.language).toBe('sv');
        expect(settings.notifications).toEqual({
          email: true,
          push: true,
          inApp: true
        });
        expect(settings.privacy).toEqual({
          showProfile: true,
          showActivity: true,
          showTeams: true
        });
      }
    });

    it('ska skapa giltiga användarinställningar med anpassade värden', () => {
      const customSettings = {
        theme: 'dark',
        language: 'en',
        notifications: {
          email: false,
          push: false,
          inApp: false
        },
        privacy: {
          showProfile: false,
          showActivity: false,
          showTeams: false
        }
      };

      const result = UserSettings.create(customSettings);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const settings = result.value;
        expect(settings.theme).toBe('dark');
        expect(settings.language).toBe('en');
        expect(settings.notifications).toEqual({
          email: false,
          push: false,
          inApp: false
        });
        expect(settings.privacy).toEqual({
          showProfile: false,
          showActivity: false,
          showTeams: false
        });
      }
    });

    it('ska validera tema', () => {
      const result = UserSettings.create({ theme: 'invalid' as any });
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe('Ogiltigt tema');
      }
    });

    it('ska validera språk', () => {
      const result = UserSettings.create({ language: 'xyz' });
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe('Ogiltigt språk');
      }
    });
  });

  describe('update', () => {
    it('ska uppdatera inställningar', () => {
      const settings = UserSettings.create({});
      expect(settings.isOk()).toBe(true);
      
      if (settings.isOk()) {
        const newSettings = {
          theme: 'dark',
          language: 'en',
          notifications: {
            email: false,
            push: false,
            inApp: false
          },
          privacy: {
            showProfile: false,
            showActivity: false,
            showTeams: false
          }
        };
        
        const result = settings.value.update(newSettings);
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const updatedSettings = result.value;
          expect(updatedSettings.theme).toBe('dark');
          expect(updatedSettings.language).toBe('en');
          expect(updatedSettings.notifications.email).toBe(false);
          expect(updatedSettings.privacy.showProfile).toBe(false);
        }
      }
    });

    it('ska uppdatera tema', () => {
      const settings = UserSettings.create({});
      expect(settings.isOk()).toBe(true);
      
      if (settings.isOk()) {
        const result = settings.value.update({ theme: 'dark' });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.theme).toBe('dark');
        }
      }
    });

    it('ska uppdatera språk', () => {
      const settings = UserSettings.create({});
      expect(settings.isOk()).toBe(true);
      
      if (settings.isOk()) {
        const result = settings.value.update({ language: 'en' });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.language).toBe('en');
        }
      }
    });

    it('ska uppdatera notifikationsinställningar', () => {
      const settings = UserSettings.create({});
      expect(settings.isOk()).toBe(true);
      
      if (settings.isOk()) {
        const newNotifications = {
          email: false,
          push: false,
          inApp: false
        };
        
        const result = settings.value.update({ notifications: newNotifications });
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.notifications).toEqual(newNotifications);
        }
      }
    });

    it('ska uppdatera sekretessinställningar', () => {
      const settings = UserSettings.create({});
      expect(settings.isOk()).toBe(true);
      
      if (settings.isOk()) {
        const newPrivacy = {
          showProfile: false,
          showActivity: false,
          showTeams: false
        };
        
        const result = settings.value.update({ privacy: newPrivacy });
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.privacy).toEqual(newPrivacy);
        }
      }
    });
  });
}); 