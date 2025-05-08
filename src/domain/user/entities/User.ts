import { Entity, EntityProps } from '@/shared/core/Entity';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';
import { UserSettings } from './UserSettings';
import { UserProfile } from './UserProfile';
import { UserRole } from '../value-objects/UserRole';
import { Email } from '../value-objects/Email';
import { PhoneNumber } from '../value-objects/PhoneNumber';

interface UserProps extends EntityProps {
  email: string;
  name: string;
  settings: UserSettings;
  profile?: UserProfile;
  teamIds: string[];
  roleIds?: string[];
  status?: 'pending' | 'active' | 'inactive' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}

export class User extends Entity<UserProps> {
  private constructor(props: UserProps) {
    super(props);
  }

  public static async create(props: Omit<Partial<UserProps>, 'id' | 'createdAt' | 'updatedAt'> & {
    email: string;
    name: string;
    settings: UserSettings;
  }): Promise<Result<User, string>> {
    try {
      if (!props.email || !props.email.includes('@')) {
        return err('Ogiltig e-postadress');
      }

      if (!props.name || props.name.trim().length < 2) {
        return err('Namnet måste vara minst 2 tecken');
      }

      return ok(new User({
        id: new UniqueId(),
        email: props.email,
        name: props.name,
        settings: props.settings,
        profile: props.profile,
        teamIds: props.teamIds || [],
        roleIds: props.roleIds || [],
        status: props.status || 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }));
    } catch (error) {
      return err(`Kunde inte skapa användare: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public get email(): string {
    return this.props.email;
  }

  public get name(): string {
    return this.props.name;
  }

  public get settings(): UserSettings {
    return this.props.settings;
  }

  public get profile(): UserProfile | undefined {
    return this.props.profile;
  }

  public get teamIds(): string[] {
    return [...this.props.teamIds];
  }

  public get roleIds(): string[] {
    return [...(this.props.roleIds || [])];
  }

  public get status(): string {
    return this.props.status || 'pending';
  }

  public updateSettings(settings: UserSettings): Result<void, string> {
    this.props.settings = settings;
    this.props.updatedAt = new Date();
    return ok(undefined);
  }

  public updateProfile(profile: UserProfile): Result<void, string> {
    this.props.profile = profile;
    this.props.updatedAt = new Date();
    return ok(undefined);
  }

  public addTeam(teamId: string): Result<void, string> {
    if (this.props.teamIds.includes(teamId)) {
      return err('Användaren är redan medlem i teamet');
    }
    this.props.teamIds.push(teamId);
    this.props.updatedAt = new Date();
    return ok(undefined);
  }

  public removeTeam(teamId: string): Result<void, string> {
    const index = this.props.teamIds.indexOf(teamId);
    if (index === -1) {
      return err('Användaren är inte medlem i teamet');
    }
    this.props.teamIds.splice(index, 1);
    this.props.updatedAt = new Date();
    return ok(undefined);
  }

  public addRole(roleId: string): Result<void, string> {
    if (!this.props.roleIds) {
      this.props.roleIds = [];
    }
    if (this.props.roleIds.includes(roleId)) {
      return err('Användaren har redan denna roll');
    }
    this.props.roleIds.push(roleId);
    this.props.updatedAt = new Date();
    return ok(undefined);
  }

  public removeRole(roleId: string): Result<void, string> {
    if (!this.props.roleIds) {
      return err('Användaren har inga roller');
    }
    const index = this.props.roleIds.indexOf(roleId);
    if (index === -1) {
      return err('Användaren har inte denna roll');
    }
    this.props.roleIds.splice(index, 1);
    this.props.updatedAt = new Date();
    return ok(undefined);
  }

  public updateStatus(newStatus: 'pending' | 'active' | 'inactive' | 'blocked'): Result<void, string> {
    this.props.status = newStatus;
    this.props.updatedAt = new Date();
    return ok(undefined);
  }
} 