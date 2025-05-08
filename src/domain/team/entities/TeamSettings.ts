import { Result, ok, err } from '@/shared/core/Result';

export type TeamVisibility = 'public' | 'private' | 'unlisted';
export type JoinPolicy = 'open' | 'invite_only' | 'approval';

export interface NotificationPreferences {
  memberJoined: boolean;
  memberLeft: boolean;
  roleChanged: boolean;
  activityCreated?: boolean;
  activityCompleted?: boolean;
  messageReceived?: boolean;
}

export interface TeamSettingsProps {
  visibility: TeamVisibility;
  joinPolicy: JoinPolicy;
  memberLimit: number;
  notificationPreferences: NotificationPreferences;
  customFields: Record<string, unknown>;
}

export class TeamSettings {
  private constructor(private props: TeamSettingsProps) {}

  get visibility(): TeamVisibility {
    return this.props.visibility;
  }

  get joinPolicy(): JoinPolicy {
    return this.props.joinPolicy;
  }

  get memberLimit(): number {
    return this.props.memberLimit;
  }

  get notificationPreferences(): NotificationPreferences {
    return { ...this.props.notificationPreferences };
  }

  get customFields(): Record<string, unknown> {
    return { ...this.props.customFields };
  }

  public static create(props: TeamSettingsProps): Result<TeamSettings, string> {
    try {
      // Validera memberLimit
      if (props.memberLimit < 1) {
        return err('Medlemsgräns måste vara minst 1');
      }

      if (props.memberLimit > 1000) {
        return err('Medlemsgräns får inte överstiga 1000');
      }

      // Validera visibility
      if (!['public', 'private', 'unlisted'].includes(props.visibility)) {
        return err('Ogiltig synlighetsinställning');
      }

      // Validera joinPolicy
      if (!['open', 'invite_only', 'approval'].includes(props.joinPolicy)) {
        return err('Ogiltig policy för anslutning');
      }

      // Standardvärden för notifieringspreferenser
      const notificationPreferences = {
        memberJoined: true,
        memberLeft: true,
        roleChanged: true,
        activityCreated: props.notificationPreferences?.activityCreated ?? true,
        activityCompleted: props.notificationPreferences?.activityCompleted ?? true,
        messageReceived: props.notificationPreferences?.messageReceived ?? true,
        ...props.notificationPreferences
      };

      return ok(new TeamSettings({
        ...props,
        notificationPreferences
      }));
    } catch (error) {
      return err(`Kunde inte skapa teaminställningar: ${error.message}`);
    }
  }

  // Uppdatera inställningar
  public update(patch: Partial<TeamSettingsProps>): TeamSettings {
    const updatedProps = {
      visibility: patch.visibility || this.props.visibility,
      joinPolicy: patch.joinPolicy || this.props.joinPolicy,
      memberLimit: patch.memberLimit !== undefined ? patch.memberLimit : this.props.memberLimit,
      notificationPreferences: {
        ...this.props.notificationPreferences,
        ...(patch.notificationPreferences || {})
      },
      customFields: {
        ...this.props.customFields,
        ...(patch.customFields || {})
      }
    };

    // Validera och skapa nya inställningar
    const result = TeamSettings.create(updatedProps);
    if (result.isErr()) {
      // Om uppdateringen är ogiltig, behåll de nuvarande inställningarna
      console.error(`Ogiltiga inställningar: ${result.error}`);
      return this;
    }

    return result.getValue();
  }

  public toJSON() {
    return {
      visibility: this.visibility,
      joinPolicy: this.joinPolicy,
      memberLimit: this.memberLimit,
      notificationPreferences: this.notificationPreferences,
      customFields: this.customFields
    };
  }
} 