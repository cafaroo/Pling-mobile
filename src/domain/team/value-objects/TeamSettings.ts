/**
 * TeamSettings representerar inställningar för ett team
 */

import { Result, ok, err } from '@/shared/core/Result';
import { ValueObject } from '@/shared/core/ValueObject';

// Notifikationsinställningar
export interface NotificationSettings {
  newMembers: boolean; // Notifiering när nya medlemmar går med i teamet
  memberLeft: boolean; // Notifiering när medlemmar lämnar teamet
  roleChanges: boolean; // Notifiering vid rollförändringar
  activityUpdates: boolean; // Notifiering om teamaktiviteter
}

// Kommunikationsinställningar
export interface CommunicationSettings {
  allowDirectMessages: boolean; // Tillåt direktmeddelanden mellan medlemmar
  allowMentions: boolean; // Tillåt omnämnanden i teamdiskussioner
}

// Behörighetsinställningar
export interface PermissionSettings {
  inviteMembers: boolean; // Vilka kan bjuda in nya medlemmar (true=alla, false=endast admin)
  removeMembers: boolean; // Vilka kan ta bort medlemmar (true=alla, false=endast admin)
  changeRoles: boolean; // Vilka kan ändra roller (true=alla, false=endast admin)
}

// Props för TeamSettings
export interface TeamSettingsProps {
  notificationSettings: NotificationSettings;
  communications: CommunicationSettings;
  permissions: PermissionSettings;
}

/**
 * TeamSettings värde-objekt
 */
export class TeamSettings extends ValueObject<TeamSettingsProps> {
  private constructor(props: TeamSettingsProps) {
    super(props);
  }

  // Getters
  get notificationSettings(): NotificationSettings {
    return this.props.notificationSettings;
  }

  get communications(): CommunicationSettings {
    return this.props.communications;
  }

  get permissions(): PermissionSettings {
    return this.props.permissions;
  }

  /**
   * Skapa nya teaminställningar
   */
  public static create(props?: Partial<TeamSettingsProps>): Result<TeamSettings, string> {
    // Standardvärden
    const defaultProps: TeamSettingsProps = {
      notificationSettings: {
        newMembers: true,
        memberLeft: true,
        roleChanges: true,
        activityUpdates: true
      },
      communications: {
        allowDirectMessages: true,
        allowMentions: true
      },
      permissions: {
        inviteMembers: false,
        removeMembers: false,
        changeRoles: false
      }
    };

    // Kombinera standardvärden med angivna props
    const actualProps: TeamSettingsProps = {
      notificationSettings: {
        ...defaultProps.notificationSettings,
        ...props?.notificationSettings
      },
      communications: {
        ...defaultProps.communications,
        ...props?.communications
      },
      permissions: {
        ...defaultProps.permissions,
        ...props?.permissions
      }
    };

    // Skapa och returnera värde-objektet
    return ok(new TeamSettings(actualProps));
  }

  /**
   * Uppdatera inställningar
   */
  public update(props: Partial<TeamSettingsProps>): Result<TeamSettings, string> {
    return TeamSettings.create({
      notificationSettings: props.notificationSettings 
        ? { ...this.props.notificationSettings, ...props.notificationSettings }
        : this.props.notificationSettings,
      communications: props.communications 
        ? { ...this.props.communications, ...props.communications }
        : this.props.communications,
      permissions: props.permissions 
        ? { ...this.props.permissions, ...props.permissions }
        : this.props.permissions
    });
  }

  /**
   * Konvertera till enkel DTO
   */
  public toDTO(): TeamSettingsProps {
    return {
      notificationSettings: { ...this.props.notificationSettings },
      communications: { ...this.props.communications },
      permissions: { ...this.props.permissions }
    };
  }
}

export default TeamSettings; 