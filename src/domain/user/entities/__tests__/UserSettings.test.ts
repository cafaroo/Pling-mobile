import { UserSettings } from '../UserSettings';
import { Language } from '../../value-objects/Language';

describe('UserSettings', () => {
  describe('create', () => {
    it('ska skapa giltiga användarinställningar med standardvärden', () => {
      const result = UserSettings.create({});
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const settings = result.getValue();
        expect(settings.theme).toBe('light');
        expect(settings.language).toBe('sv');
        expect(settings.notifications).toEqual({
          enabled: true,
          frequency: 'daily',
          emailEnabled: true,
          pushEnabled: true
        });
        expect(settings.privacy).toEqual({
          profileVisibility: 'public',
          showOnlineStatus: true,
          showLastSeen: true
        });
      }
    });

    it('ska skapa giltiga användarinställningar med anpassade värden', () => {
      const customSettings = {
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
      };

      const result = UserSettings.create(customSettings);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const settings = result.getValue();
        expect(settings.theme).toBe('dark');
        expect(settings.language).toBe('en');
        expect(settings.notifications).toEqual({
          enabled: false,
          frequency: 'weekly',
          emailEnabled: false,
          pushEnabled: false
        });
        expect(settings.privacy).toEqual({
          profileVisibility: 'private',
          showOnlineStatus: false,
          showLastSeen: false
        });
      }
    });

    it('ska validera tema', () => {
      const result = UserSettings.create({ theme: 'invalid' });
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.getError()).toBe('Ogiltigt tema');
      }
    });

    it('ska validera språk', () => {
      const result = UserSettings.create({ language: 'xyz' });
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.getError()).toBe('Ogiltigt språk');
      }
    });

    it('ska validera notifikationsfrekvens', () => {
      const result = UserSettings.create({
        notifications: { frequency: 'invalid' }
      });
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.getError()).toBe('Ogiltig notifikationsfrekvens');
      }
    });

    it('ska validera profilsynlighet', () => {
      const result = UserSettings.create({
        privacy: { profileVisibility: 'invalid' }
      });
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.getError()).toBe('Ogiltig profilsynlighet');
      }
    });
  });

  describe('updateTheme', () => {
    it('ska uppdatera tema', () => {
      const settings = UserSettings.create({});
      expect(settings.isOk()).toBe(true);
      if (settings.isOk()) {
        const result = settings.getValue().updateTheme('dark');
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.getValue().theme).toBe('dark');
        }
      }
    });
  });

  describe('updateLanguage', () => {
    it('ska uppdatera språk', () => {
      const settings = UserSettings.create({});
      expect(settings.isOk()).toBe(true);
      if (settings.isOk()) {
        const result = settings.getValue().updateLanguage('en');
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.getValue().language).toBe('en');
        }
      }
    });
  });

  describe('updateNotifications', () => {
    it('ska uppdatera notifikationsinställningar', () => {
      const settings = UserSettings.create({});
      expect(settings.isOk()).toBe(true);
      if (settings.isOk()) {
        const newNotifications = {
          enabled: false,
          frequency: 'weekly',
          emailEnabled: false,
          pushEnabled: false
        };
        
        const result = settings.getValue().updateNotifications(newNotifications);
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.getValue().notifications).toEqual(newNotifications);
        }
      }
    });
  });

  describe('updatePrivacy', () => {
    it('ska uppdatera sekretessinställningar', () => {
      const settings = UserSettings.create({});
      expect(settings.isOk()).toBe(true);
      if (settings.isOk()) {
        const newPrivacy = {
          profileVisibility: 'private',
          showOnlineStatus: false,
          showLastSeen: false
        };
        
        const result = settings.getValue().updatePrivacy(newPrivacy);
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.getValue().privacy).toEqual(newPrivacy);
        }
      }
    });
  });
}); 