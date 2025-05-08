import { Result, ok, err } from '@/shared/core/Result';
import { Language } from '../value-objects/Language';

export type Theme = 'light' | 'dark' | 'system';
export type NotificationFrequency = 'instant' | 'daily' | 'weekly' | 'never';
export type ProfileVisibility = 'public' | 'private' | 'friends';

export interface UserSettingsProps {
  language: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  privacy: {
    showProfile: boolean;
    showActivity: boolean;
    showTeams: boolean;
  };
}

export class UserSettings {
  private readonly props: UserSettingsProps;

  private constructor(props: UserSettingsProps) {
    this.props = props;
  }

  public static create(props: Partial<UserSettingsProps> = {}): Result<UserSettings, string> {
    const defaultSettings: UserSettingsProps = {
      language: 'sv',
      theme: 'system',
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

    if (props.language && !['sv', 'en'].includes(props.language)) {
      return err('Ogiltigt språk');
    }

    if (props.theme && !['light', 'dark', 'system'].includes(props.theme)) {
      return err('Ogiltigt tema');
    }

    return ok(new UserSettings({
      ...defaultSettings,
      ...props,
      notifications: {
        ...defaultSettings.notifications,
        ...(props.notifications || {})
      },
      privacy: {
        ...defaultSettings.privacy,
        ...(props.privacy || {})
      }
    }));
  }

  public get language(): string {
    return this.props.language;
  }

  public get theme(): 'light' | 'dark' | 'system' {
    return this.props.theme;
  }

  public get notifications() {
    return { ...this.props.notifications };
  }

  public get privacy() {
    return { ...this.props.privacy };
  }

  public update(settings: Partial<UserSettingsProps>): Result<UserSettings, string> {
    if (settings.language && !['sv', 'en'].includes(settings.language)) {
      return err('Ogiltigt språk');
    }

    if (settings.theme && !['light', 'dark', 'system'].includes(settings.theme)) {
      return err('Ogiltigt tema');
    }

    return ok(new UserSettings({
      ...this.props,
      ...settings,
      notifications: {
        ...this.props.notifications,
        ...(settings.notifications || {})
      },
      privacy: {
        ...this.props.privacy,
        ...(settings.privacy || {})
      }
    }));
  }
} 