import { UserSettings } from '../UserSettings';
import { Language } from '../../value-objects/Language';

describe('UserSettings', () => {
  describe('create', () => {
    it('ska skapa giltiga användarinställningar med standardvärden', () => {
      const result = UserSettings.create({});
      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const settings = result.value;
        expect(settings.props.theme).toBe('system');
        expect(settings.props.language).toBe('sv');
        expect(settings.props.notifications).toEqual({
          email: true,
          push: true,
          inApp: true
        });
        expect(settings.props.privacy).toEqual({
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
          push: true,
          inApp: false
        },
        privacy: {
          showProfile: false,
          showActivity: true,
          showTeams: false
        }
      };

      const result = UserSettings.create(customSettings);
      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const settings = result.value;
        expect(settings.props.theme).toBe('dark');
        expect(settings.props.language).toBe('en');
        expect(settings.props.notifications).toEqual({
          email: false,
          push: true,
          inApp: false
        });
        expect(settings.props.privacy).toEqual({
          showProfile: false,
          showActivity: true,
          showTeams: false
        });
      }
    });

    it('ska validera tema', () => {
      const result = UserSettings.create({
        theme: 'invalidTheme' as any
      });
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain('Ogiltigt tema');
      }
    });

    it('ska validera språk', () => {
      const result = UserSettings.create({
        language: 'invalidLanguage' as any
      });
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain('Ogiltigt språk');
      }
    });
  });

  describe('update', () => {
    it('ska uppdatera inställningar', () => {
      // Skapa ursprungsinställningar
      const originalSettings = UserSettings.create({
        theme: 'light',
        language: 'sv',
        notifications: {
          email: true,
          push: true,
          inApp: true
        },
        privacy: {
          showProfile: true,
          showActivity: true,
          showTeams: true
        }
      });
      
      expect(originalSettings.isOk()).toBe(true);
      
      if (originalSettings.isOk()) {
        // Uppdatera inställningarna
        const result = originalSettings.value.update({
          theme: 'dark',
          language: 'en',
          notifications: {
            email: false
          },
          privacy: {
            showProfile: false
          }
        });
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const updatedSettings = result.value;
          expect(updatedSettings.props.theme).toBe('dark');
          expect(updatedSettings.props.language).toBe('en');
          expect(updatedSettings.props.notifications.email).toBe(false);
          expect(updatedSettings.props.privacy.showProfile).toBe(false);
        }
      }
    });

    it('ska uppdatera tema', () => {
      const originalResult = UserSettings.create({});
      expect(originalResult.isOk()).toBe(true);
      
      if (originalResult.isOk()) {
        const result = originalResult.value.update({ theme: 'dark' });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.props.theme).toBe('dark');
        }
      }
    });

    it('ska uppdatera språk', () => {
      const originalResult = UserSettings.create({});
      expect(originalResult.isOk()).toBe(true);
      
      if (originalResult.isOk()) {
        const result = originalResult.value.update({ language: 'en' });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.props.language).toBe('en');
        }
      }
    });

    it('ska uppdatera notifikationsinställningar', () => {
      const originalResult = UserSettings.create({});
      expect(originalResult.isOk()).toBe(true);
      
      if (originalResult.isOk()) {
        const newNotifications = {
          email: false,
          push: false,
          inApp: false
        };
        
        const result = originalResult.value.update({ notifications: newNotifications });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.props.notifications).toEqual(newNotifications);
        }
      }
    });

    it('ska uppdatera sekretessinställningar', () => {
      const originalResult = UserSettings.create({});
      expect(originalResult.isOk()).toBe(true);
      
      if (originalResult.isOk()) {
        const newPrivacy = {
          showProfile: false,
          showActivity: false,
          showTeams: false
        };
        
        const result = originalResult.value.update({ privacy: newPrivacy });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.props.privacy).toEqual(newPrivacy);
        }
      }
    });
  });
}); 