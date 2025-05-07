import { Result } from '@/shared/core/Result';
import { Language } from '../value-objects/Language';

export type Theme = 'light' | 'dark' | 'system';
export type NotificationFrequency = 'instant' | 'daily' | 'weekly' | 'never';
export type ProfileVisibility = 'public' | 'private' | 'friends';

export interface UserSettingsProps {
  theme?: Theme;
  language?: string;
  notifications?: {
    enabled: boolean;
    frequency: NotificationFrequency;
    emailEnabled: boolean;
    pushEnabled: boolean;
  };
  privacy?: {
    profileVisibility: ProfileVisibility;
    showOnlineStatus: boolean;
    showLastSeen: boolean;
  };
}

export class UserSettings {
  private static readonly DEFAULT_SETTINGS: Required<UserSettingsProps> = {
    theme: 'light',
    language: 'sv',
    notifications: {
      enabled: true,
      frequency: 'daily',
      emailEnabled: true,
      pushEnabled: true,
    },
    privacy: {
      profileVisibility: 'public',
      showOnlineStatus: true,
      showLastSeen: true,
    }
  };

  private constructor(private readonly props: Required<UserSettingsProps>) {}

  public static create(settings: UserSettingsProps): Result<UserSettings> {
    const mergedSettings = {
      ...UserSettings.DEFAULT_SETTINGS,
      ...settings
    };

    // Validera tema
    if (!UserSettings.isValidTheme(mergedSettings.theme)) {
      return Result.err('Ogiltigt tema');
    }

    // Validera språk
    const languageResult = Language.create(mergedSettings.language);
    if (languageResult.isErr()) {
      return Result.err('Ogiltigt språk');
    }

    // Validera notifikationsfrekvens
    if (!UserSettings.isValidNotificationFrequency(mergedSettings.notifications.frequency)) {
      return Result.err('Ogiltig notifikationsfrekvens');
    }

    // Validera profilsynlighet
    if (!UserSettings.isValidProfileVisibility(mergedSettings.privacy.profileVisibility)) {
      return Result.err('Ogiltig profilsynlighet');
    }

    return Result.ok(new UserSettings(mergedSettings));
  }

  private static isValidTheme(theme: string): theme is Theme {
    return ['light', 'dark', 'system'].includes(theme);
  }

  private static isValidNotificationFrequency(frequency: string): frequency is NotificationFrequency {
    return ['instant', 'daily', 'weekly', 'never'].includes(frequency);
  }

  private static isValidProfileVisibility(visibility: string): visibility is ProfileVisibility {
    return ['public', 'private', 'friends'].includes(visibility);
  }

  public get theme(): Theme {
    return this.props.theme;
  }

  public get language(): string {
    return this.props.language;
  }

  public get notifications() {
    return { ...this.props.notifications };
  }

  public get privacy() {
    return { ...this.props.privacy };
  }

  public updateTheme(theme: Theme): Result<UserSettings> {
    return UserSettings.create({
      ...this.props,
      theme
    });
  }

  public updateLanguage(language: string): Result<UserSettings> {
    return UserSettings.create({
      ...this.props,
      language
    });
  }

  public updateNotifications(notifications: Partial<typeof UserSettings.DEFAULT_SETTINGS.notifications>): Result<UserSettings> {
    return UserSettings.create({
      ...this.props,
      notifications: {
        ...this.props.notifications,
        ...notifications
      }
    });
  }

  public updatePrivacy(privacy: Partial<typeof UserSettings.DEFAULT_SETTINGS.privacy>): Result<UserSettings> {
    return UserSettings.create({
      ...this.props,
      privacy: {
        ...this.props.privacy,
        ...privacy
      }
    });
  }
} 