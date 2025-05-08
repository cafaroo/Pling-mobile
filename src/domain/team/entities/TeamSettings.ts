import { Result, ok, err } from '@/shared/core/Result';

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
}

export class TeamSettings {
  private readonly props: TeamSettingsProps;

  private constructor(props: TeamSettingsProps) {
    this.props = props;
  }

  public static create(props: Partial<TeamSettingsProps> = {}): Result<TeamSettings, string> {
    const defaultSettings: TeamSettingsProps = {
      isPrivate: false,
      requiresApproval: false,
      maxMembers: 50,
      allowGuests: false,
      notificationSettings: {
        newMembers: true,
        memberLeft: true,
        roleChanges: true,
        activityUpdates: true
      }
    };

    if (props.maxMembers !== undefined && props.maxMembers < 2) {
      return err('Minsta antal medlemmar måste vara 2');
    }

    return ok(new TeamSettings({
      ...defaultSettings,
      ...props,
      notificationSettings: {
        ...defaultSettings.notificationSettings,
        ...props.notificationSettings
      }
    }));
  }

  public get isPrivate(): boolean {
    return this.props.isPrivate;
  }

  public get requiresApproval(): boolean {
    return this.props.requiresApproval;
  }

  public get maxMembers(): number | undefined {
    return this.props.maxMembers;
  }

  public get allowGuests(): boolean {
    return this.props.allowGuests;
  }

  public get notificationSettings() {
    return { ...this.props.notificationSettings };
  }

  public update(settings: Partial<TeamSettingsProps>): TeamSettings {
    if (settings.maxMembers !== undefined && settings.maxMembers < 2) {
      throw new Error('Minsta antal medlemmar måste vara 2');
    }

    return new TeamSettings({
      ...this.props,
      ...settings,
      notificationSettings: {
        ...this.props.notificationSettings,
        ...(settings.notificationSettings || {})
      }
    });
  }
} 