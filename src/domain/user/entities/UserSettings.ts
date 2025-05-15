import { Result, ok, err } from '@/shared/core/Result';
import { ValueObject } from '@/shared/domain/ValueObject';
import { Language } from '../value-objects/Language';

/**
 * Typer för användarinställningar
 */
export type Theme = 'light' | 'dark' | 'system';
export type NotificationFrequency = 'instant' | 'daily' | 'weekly' | 'never';
export type ProfileVisibility = 'public' | 'private' | 'friends';

/**
 * UserSettingsProps - egenskaper för UserSettings värde-objekt
 */
export interface UserSettingsProps {
  language: string;
  theme: Theme;
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
    frequency?: NotificationFrequency;
  };
  privacy: {
    showProfile: boolean;
    showActivity: boolean;
    showTeams: boolean;
    profileVisibility?: ProfileVisibility;
  };
}

/**
 * UserSettings
 * 
 * Värde-objekt som representerar användarinställningar med validering och funktioner
 * för att uppdatera inställningar på ett kontrollerat sätt.
 */
export class UserSettings extends ValueObject<UserSettingsProps> {
  private static readonly SUPPORTED_LANGUAGES = ['sv', 'en', 'no', 'da', 'fi'];
  private static readonly SUPPORTED_THEMES: Theme[] = ['light', 'dark', 'system'];
  
  private constructor(props: UserSettingsProps) {
    super(props);
  }

  /**
   * Skapar UserSettings med grundläggande validering
   * 
   * @param props Användarinställningar att skapa (partiell)
   * @returns Result med UserSettings eller felmeddelande
   */
  public static create(props: Partial<UserSettingsProps> = {}): Result<UserSettings, string> {
    // Validera språk om det anges
    if (props.language && !this.SUPPORTED_LANGUAGES.includes(props.language)) {
      return err(`Ogiltigt språk. Stöder: ${this.SUPPORTED_LANGUAGES.join(', ')}`);
    }

    // Validera tema om det anges
    if (props.theme && !this.SUPPORTED_THEMES.includes(props.theme)) {
      return err(`Ogiltigt tema. Stöder: ${this.SUPPORTED_THEMES.join(', ')}`);
    }

    // Validera notifikationsfrekvens om den anges
    if (props.notifications?.frequency && 
        !['instant', 'daily', 'weekly', 'never'].includes(props.notifications.frequency)) {
      return err('Ogiltig notifikationsfrekvens. Stöder: instant, daily, weekly, never');
    }

    // Validera profilsynlighet om den anges
    if (props.privacy?.profileVisibility && 
        !['public', 'private', 'friends'].includes(props.privacy.profileVisibility)) {
      return err('Ogiltig profilsynlighet. Stöder: public, private, friends');
    }

    // Kombinera med standardinställningar
    const defaultSettings = UserSettings.getDefaultProps();
    
    const settingsProps: UserSettingsProps = {
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
    };

    return ok(new UserSettings(settingsProps));
  }

  /**
   * Skapar UserSettings med standardinställningar
   * 
   * @returns UserSettings med standardvärden
   */
  public static createDefault(): UserSettings {
    return new UserSettings(UserSettings.getDefaultProps());
  }

  /**
   * Returnerar standardinställningar som ett objekt
   * 
   * @returns Standardinställningar
   */
  private static getDefaultProps(): UserSettingsProps {
    return {
      language: 'sv',
      theme: 'system',
      notifications: {
        email: true,
        push: true,
        inApp: true,
        frequency: 'daily'
      },
      privacy: {
        showProfile: true,
        showActivity: true,
        showTeams: true,
        profileVisibility: 'friends'
      }
    };
  }

  /**
   * Skapar en ny instans av UserSettings med uppdaterade värden
   * 
   * @param settings Partiella inställningar att uppdatera
   * @returns Result med uppdaterade UserSettings eller felmeddelande
   */
  public update(settings: Partial<UserSettingsProps>): Result<UserSettings, string> {
    return UserSettings.create({
      ...this.props,
      ...settings,
      notifications: settings.notifications 
        ? { ...this.props.notifications, ...settings.notifications }
        : this.props.notifications,
      privacy: settings.privacy
        ? { ...this.props.privacy, ...settings.privacy }
        : this.props.privacy
    });
  }

  /**
   * Uppdaterar endast språkinställning
   * 
   * @param language Nytt språk
   * @returns Result med uppdaterade UserSettings eller felmeddelande
   */
  public updateLanguage(language: string): Result<UserSettings, string> {
    return this.update({ language });
  }

  /**
   * Uppdaterar endast temainställning
   * 
   * @param theme Nytt tema
   * @returns Result med uppdaterade UserSettings eller felmeddelande
   */
  public updateTheme(theme: Theme): Result<UserSettings, string> {
    return this.update({ theme });
  }

  /**
   * Uppdaterar endast notifikationsinställningar
   * 
   * @param notifications Nya notifikationsinställningar
   * @returns Result med uppdaterade UserSettings eller felmeddelande
   */
  public updateNotifications(notifications: Partial<UserSettingsProps['notifications']>): Result<UserSettings, string> {
    return this.update({ notifications });
  }

  /**
   * Uppdaterar endast sekretessinställningar
   * 
   * @param privacy Nya sekretessinställningar
   * @returns Result med uppdaterade UserSettings eller felmeddelande
   */
  public updatePrivacy(privacy: Partial<UserSettingsProps['privacy']>): Result<UserSettings, string> {
    return this.update({ privacy });
  }

  /**
   * Konverterar inställningarna till ett rent JavaScript-objekt
   * 
   * @returns Kopia av inställningarna som ett objekt
   */
  public toDTO(): UserSettingsProps {
    return this.toValue();
  }
} 