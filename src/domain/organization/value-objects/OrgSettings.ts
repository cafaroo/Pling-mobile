import { ValueObject } from '@/shared/core/ValueObject';
import { Result, ok, err } from '@/shared/core/Result';

export interface NotificationSettings {
  newMembers: boolean;
  memberLeft: boolean;
  roleChanges: boolean;
  activityUpdates: boolean;
}

export interface OrgSettingsProps {
  isPrivate: boolean;
  requiresApproval: boolean;
  maxMembers: number | null;
  allowGuests: boolean;
  notificationSettings: NotificationSettings;
  description: string;
  logoUrl: string;
  name?: string;
  resourceLimits?: Record<string, number>;
}

export class OrgSettings extends ValueObject<OrgSettingsProps> {
  private constructor(props: OrgSettingsProps) {
    super(props);
  }

  get isPrivate(): boolean {
    return this.props.isPrivate;
  }

  get requiresApproval(): boolean {
    return this.props.requiresApproval;
  }

  get maxMembers(): number | null {
    return this.props.maxMembers;
  }

  set maxMembers(value: number | null) {
    this.props.maxMembers = value;
  }

  get allowGuests(): boolean {
    return this.props.allowGuests;
  }

  get notificationSettings(): NotificationSettings {
    return { ...this.props.notificationSettings };
  }

  get description(): string {
    return this.props.description || '';
  }

  set description(value: string) {
    this.props.description = value;
  }

  get logoUrl(): string {
    return this.props.logoUrl || '';
  }

  set logoUrl(value: string) {
    this.props.logoUrl = value;
  }

  get name(): string | undefined {
    return this.props.name;
  }

  set name(value: string | undefined) {
    this.props.name = value;
  }

  get resourceLimits(): Record<string, number> | undefined {
    return this.props.resourceLimits ? {...this.props.resourceLimits} : undefined;
  }

  set resourceLimits(value: Record<string, number> | undefined) {
    this.props.resourceLimits = value ? {...value} : undefined;
  }

  public static create(props: Partial<OrgSettingsProps> = {}): Result<OrgSettings, string> {
    try {
      // Standardvärden för organisationsinställningar
      const defaultSettings: OrgSettingsProps = {
        isPrivate: true,
        requiresApproval: true,
        maxMembers: 100,
        allowGuests: false,
        notificationSettings: {
          newMembers: true,
          memberLeft: true,
          roleChanges: true,
          activityUpdates: true
        },
        description: '',
        logoUrl: '',
        resourceLimits: {}
      };

      // Kombinera standardinställningar med angivna inställningar
      const settings: OrgSettingsProps = {
        ...defaultSettings,
        ...props,
        notificationSettings: {
          ...defaultSettings.notificationSettings,
          ...(props.notificationSettings || {})
        }
      };

      // Validera inställningar
      if (settings.maxMembers !== null && settings.maxMembers < 1) {
        return err('Maxgränsen för medlemmar måste vara minst 1');
      }

      return ok(new OrgSettings(settings));
    } catch (error) {
      return err(`Kunde inte skapa organisationsinställningar: ${error.message}`);
    }
  }

  public update(updateProps: Partial<OrgSettingsProps>): OrgSettings {
    const updatedProps: OrgSettingsProps = {
      ...this.props,
      ...updateProps,
      notificationSettings: {
        ...this.props.notificationSettings,
        ...(updateProps.notificationSettings || {})
      }
    };

    // Använd create för att validera
    const result = OrgSettings.create(updatedProps);
    if (result.isErr()) {
      throw new Error(result.error);
    }

    return result.value;
  }

  public toJSON() {
    return {
      isPrivate: this.props.isPrivate,
      requiresApproval: this.props.requiresApproval,
      maxMembers: this.props.maxMembers,
      allowGuests: this.props.allowGuests,
      notificationSettings: { ...this.props.notificationSettings },
      description: this.props.description,
      logoUrl: this.props.logoUrl,
      name: this.props.name,
      resourceLimits: this.props.resourceLimits
    };
  }
} 