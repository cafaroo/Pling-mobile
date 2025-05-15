import { Result, ok, err } from '@/shared/core/Result';
import { ValueObject } from '@/shared/domain/ValueObject';

/**
 * TeamSettingsProps - egenskaper för TeamSettings värde-objekt
 */
export interface TeamSettingsProps {
  isPrivate: boolean;
  requiresApproval: boolean;
  maxMembers?: number;
  allowGuests: boolean;
  notificationSettings: {
    newMembers: boolean;
    memberLeft: boolean;
    roleChanges: boolean;
    activityUpdates: boolean;
  };
  communications?: {
    enableChat: boolean;
    enableForums: boolean;
    moderationLevel: 'none' | 'basic' | 'strict';
  };
  permissions?: {
    restrictFileSharing: boolean;
    allowExternalLinks: boolean;
    requireApprovalForPosts: boolean;
  };
}

/**
 * TeamSettings
 * 
 * Värde-objekt som representerar inställningar för ett team.
 * Detta är ett immutable värde-objekt som följer DDD-principer.
 */
export class TeamSettings extends ValueObject<TeamSettingsProps> {
  private static readonly MIN_MEMBERS = 2;
  private static readonly MAX_MEMBERS_LIMIT = 1000;
  private static readonly MODERATION_LEVELS = ['none', 'basic', 'strict'];
  
  private constructor(props: TeamSettingsProps) {
    super(props);
  }

  /**
   * Skapar TeamSettings med grundläggande validering
   * 
   * @param props Teaminställningar att skapa (partiell)
   * @returns Result med TeamSettings eller felmeddelande
   */
  public static create(props: Partial<TeamSettingsProps> = {}): Result<TeamSettings, string> {
    // Validera maxMembers om det anges
    if (props.maxMembers !== undefined) {
      if (props.maxMembers < this.MIN_MEMBERS) {
        return err(`Minsta antal medlemmar måste vara ${this.MIN_MEMBERS}`);
      }
      
      if (props.maxMembers > this.MAX_MEMBERS_LIMIT) {
        return err(`Största antal medlemmar kan inte överstiga ${this.MAX_MEMBERS_LIMIT}`);
      }
    }
    
    // Validera moderationLevel om det anges
    if (props.communications?.moderationLevel && 
        !this.MODERATION_LEVELS.includes(props.communications.moderationLevel)) {
      return err(`Ogiltig moderationsnivå. Stöder: ${this.MODERATION_LEVELS.join(', ')}`);
    }

    // Kombinera med standardinställningar
    const defaultSettings = TeamSettings.getDefaultProps();
    
    const settingsProps: TeamSettingsProps = {
      ...defaultSettings,
      ...props,
      notificationSettings: {
        ...defaultSettings.notificationSettings,
        ...(props.notificationSettings || {})
      },
      communications: {
        ...defaultSettings.communications,
        ...(props.communications || {})
      },
      permissions: {
        ...defaultSettings.permissions,
        ...(props.permissions || {})
      }
    };

    return ok(new TeamSettings(settingsProps));
  }

  /**
   * Skapar TeamSettings med standardinställningar
   * 
   * @returns TeamSettings med standardvärden
   */
  public static createDefault(): TeamSettings {
    return new TeamSettings(TeamSettings.getDefaultProps());
  }

  /**
   * Returnerar standardinställningar som ett objekt
   * 
   * @returns Standardinställningar
   */
  private static getDefaultProps(): TeamSettingsProps {
    return {
      isPrivate: false,
      requiresApproval: false,
      maxMembers: 50,
      allowGuests: false,
      notificationSettings: {
        newMembers: true,
        memberLeft: true,
        roleChanges: true,
        activityUpdates: true
      },
      communications: {
        enableChat: true,
        enableForums: false,
        moderationLevel: 'basic'
      },
      permissions: {
        restrictFileSharing: false,
        allowExternalLinks: true,
        requireApprovalForPosts: false
      }
    };
  }

  /**
   * Uppdaterar inställningarna med nya värden och returnerar en ny instans
   * 
   * @param settings Partiella inställningar att uppdatera
   * @returns Result med uppdaterade TeamSettings eller felmeddelande
   */
  public update(settings: Partial<TeamSettingsProps>): Result<TeamSettings, string> {
    return TeamSettings.create({
      ...this.props,
      ...settings,
      notificationSettings: settings.notificationSettings 
        ? { ...this.props.notificationSettings, ...settings.notificationSettings }
        : this.props.notificationSettings,
      communications: settings.communications
        ? { ...this.props.communications, ...settings.communications }
        : this.props.communications,
      permissions: settings.permissions
        ? { ...this.props.permissions, ...settings.permissions }
        : this.props.permissions
    });
  }

  /**
   * Uppdaterar bara notifikationsinställningar
   * 
   * @param notificationSettings Nya notifikationsinställningar
   * @returns Result med uppdaterade TeamSettings eller felmeddelande
   */
  public updateNotifications(notificationSettings: Partial<TeamSettingsProps['notificationSettings']>): Result<TeamSettings, string> {
    return this.update({ 
      notificationSettings 
    });
  }

  /**
   * Uppdaterar bara kommunikationsinställningar
   * 
   * @param communications Nya kommunikationsinställningar
   * @returns Result med uppdaterade TeamSettings eller felmeddelande
   */
  public updateCommunications(communications: Partial<TeamSettingsProps['communications']>): Result<TeamSettings, string> {
    return this.update({
      communications
    });
  }

  /**
   * Uppdaterar bara behörighetsinställningar
   * 
   * @param permissions Nya behörighetsinställningar
   * @returns Result med uppdaterade TeamSettings eller felmeddelande
   */
  public updatePermissions(permissions: Partial<TeamSettingsProps['permissions']>): Result<TeamSettings, string> {
    return this.update({
      permissions
    });
  }

  /**
   * Konverterar inställningarna till ett rent JavaScript-objekt
   * 
   * @returns Kopia av inställningarna som ett objekt
   */
  public toDTO(): TeamSettingsProps {
    return this.toValue();
  }
} 