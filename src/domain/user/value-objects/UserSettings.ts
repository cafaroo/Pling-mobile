/**
 * UserSettings representerar användarinställningar i systemet
 */

import { Result, ok, err } from '@/shared/core/Result';

// Tillåtna temavärden
export type Theme = 'light' | 'dark' | 'system';

// Tillåtna språkvärden
export type Language = 'sv' | 'en' | 'no' | 'da' | 'fi';

// Notifikationsinställningar
export interface NotificationSettings {
  email: boolean;
  push: boolean;
  inApp: boolean;
}

// Sekretessinställningar
export interface PrivacySettings {
  showProfile: boolean;
  showActivity: boolean;
  showTeams: boolean;
}

// Props för UserSettings
export interface UserSettingsProps {
  theme: Theme;
  language: Language;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

/**
 * UserSettings värde-objekt
 */
export class UserSettings {
  private readonly props: UserSettingsProps;

  private constructor(props: UserSettingsProps) {
    this.props = props;
  }

  // Getters
  get theme(): Theme {
    return this.props.theme;
  }

  get language(): Language {
    return this.props.language;
  }

  get notifications(): NotificationSettings {
    return this.props.notifications;
  }

  get privacy(): PrivacySettings {
    return this.props.privacy;
  }

  /**
   * Skapa nya användarinställningar
   */
  public static create(props?: Partial<UserSettingsProps>): Result<UserSettings, string> {
    // Standardvärden
    const defaultProps: UserSettingsProps = {
      theme: 'system',
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
    };

    // Kombinera standardvärden med angivna props
    const actualProps = { ...defaultProps, ...props };

    // Validera tema
    if (actualProps.theme && !['light', 'dark', 'system'].includes(actualProps.theme)) {
      return err('Ogiltigt tema. Stöder: light, dark, system');
    }

    // Validera språk
    if (actualProps.language && !['sv', 'en', 'no', 'da', 'fi'].includes(actualProps.language)) {
      return err('Ogiltigt språk. Stöder: sv, en, no, da, fi');
    }

    // Skapa och returnera värde-objektet
    return ok(new UserSettings(actualProps));
  }

  /**
   * Uppdatera inställningar
   */
  public update(props: Partial<UserSettingsProps>): Result<UserSettings, string> {
    return UserSettings.create({
      ...this.props,
      ...props,
      notifications: props.notifications 
        ? { ...this.props.notifications, ...props.notifications }
        : this.props.notifications,
      privacy: props.privacy 
        ? { ...this.props.privacy, ...props.privacy }
        : this.props.privacy
    });
  }

  /**
   * Konvertera till enkel DTO
   */
  public toDTO(): UserSettingsProps {
    return {
      theme: this.props.theme,
      language: this.props.language,
      notifications: { ...this.props.notifications },
      privacy: { ...this.props.privacy }
    };
  }
}

export default UserSettings; 