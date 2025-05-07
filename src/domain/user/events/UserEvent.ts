import { DomainEvent } from '@/shared/domain/DomainEvent';
import { UniqueId } from '@/shared/domain/UniqueId';
import { User } from '../entities/User';
import { UserProfile } from '../entities/UserProfile';
import { UserSettings } from '../entities/UserSettings';

export interface UserEventData {
  userId: string;
  occurredAt: Date;
}

export abstract class UserEvent implements DomainEvent {
  constructor(
    public readonly data: UserEventData
  ) {}

  abstract get name(): string;
}

export class UserCreated extends UserEvent {
  constructor(user: User) {
    super({
      userId: user.id.toString(),
      occurredAt: new Date()
    });
  }

  get name(): string {
    return 'user.created';
  }
}

export class UserProfileUpdated extends UserEvent {
  constructor(
    user: User,
    public readonly profile: UserProfile
  ) {
    super({
      userId: user.id.toString(),
      occurredAt: new Date()
    });
  }

  get name(): string {
    return 'user.profile.updated';
  }
}

export class UserSettingsUpdated extends UserEvent {
  constructor(
    user: User,
    public readonly settings: UserSettings
  ) {
    super({
      userId: user.id.toString(),
      occurredAt: new Date()
    });
  }

  get name(): string {
    return 'user.settings.updated';
  }
}

export class UserRoleAdded extends UserEvent {
  constructor(
    user: User,
    public readonly roleId: UniqueId
  ) {
    super({
      userId: user.id.toString(),
      occurredAt: new Date()
    });
  }

  get name(): string {
    return 'user.role.added';
  }
}

export class UserRoleRemoved extends UserEvent {
  constructor(
    user: User,
    public readonly roleId: UniqueId
  ) {
    super({
      userId: user.id.toString(),
      occurredAt: new Date()
    });
  }

  get name(): string {
    return 'user.role.removed';
  }
}

export class UserTeamJoined extends UserEvent {
  constructor(
    user: User,
    public readonly teamId: UniqueId
  ) {
    super({
      userId: user.id.toString(),
      occurredAt: new Date()
    });
  }

  get name(): string {
    return 'user.team.joined';
  }
}

export class UserTeamLeft extends UserEvent {
  constructor(
    user: User,
    public readonly teamId: UniqueId
  ) {
    super({
      userId: user.id.toString(),
      occurredAt: new Date()
    });
  }

  get name(): string {
    return 'user.team.left';
  }
}

export class UserStatusChanged extends UserEvent {
  constructor(
    user: User,
    public readonly oldStatus: string,
    public readonly newStatus: string
  ) {
    super({
      userId: user.id.toString(),
      occurredAt: new Date()
    });
  }

  get name(): string {
    return 'user.status.changed';
  }
}

// Nya händelser för användaraktivering och konto

export class UserActivated extends UserEvent {
  constructor(
    user: User,
    public readonly activationReason: string
  ) {
    super({
      userId: user.id.toString(),
      occurredAt: new Date()
    });
  }

  get name(): string {
    return 'user.account.activated';
  }
}

export class UserDeactivated extends UserEvent {
  constructor(
    user: User,
    public readonly deactivationReason: string
  ) {
    super({
      userId: user.id.toString(),
      occurredAt: new Date()
    });
  }

  get name(): string {
    return 'user.account.deactivated';
  }
}

export class UserDeleted extends UserEvent {
  constructor(
    user: User,
    public readonly deletionReason: string
  ) {
    super({
      userId: user.id.toString(),
      occurredAt: new Date()
    });
  }

  get name(): string {
    return 'user.account.deleted';
  }
}

// Händelser för privacy och säkerhet

export class UserPrivacySettingsChanged extends UserEvent {
  constructor(
    user: User,
    public readonly oldSettings: Record<string, any>,
    public readonly newSettings: Record<string, any>
  ) {
    super({
      userId: user.id.toString(),
      occurredAt: new Date()
    });
  }

  get name(): string {
    return 'user.privacy.updated';
  }
}

export class UserNotificationSettingsChanged extends UserEvent {
  constructor(
    user: User,
    public readonly oldSettings: Record<string, any>,
    public readonly newSettings: Record<string, any>
  ) {
    super({
      userId: user.id.toString(),
      occurredAt: new Date()
    });
  }

  get name(): string {
    return 'user.notifications.updated';
  }
}

export class UserSecurityEvent extends UserEvent {
  constructor(
    user: User,
    public readonly eventType: 'login' | 'logout' | 'password_changed' | 'security_alert',
    public readonly metadata: Record<string, any>
  ) {
    super({
      userId: user.id.toString(),
      occurredAt: new Date()
    });
  }

  get name(): string {
    return `user.security.${this.eventType}`;
  }
}

// Händelser för statistik och beteende

export class UserStatisticsUpdated extends UserEvent {
  constructor(
    user: User,
    public readonly statistics: Record<string, any>
  ) {
    super({
      userId: user.id.toString(),
      occurredAt: new Date()
    });
  }

  get name(): string {
    return 'user.statistics.updated';
  }
}

export class UserAchievementUnlocked extends UserEvent {
  constructor(
    user: User,
    public readonly achievementId: string,
    public readonly achievementName: string
  ) {
    super({
      userId: user.id.toString(),
      occurredAt: new Date()
    });
  }

  get name(): string {
    return 'user.achievement.unlocked';
  }
}

// Händelser för teamsrelaterade aktiviteter (utökade)

export class UserTeamRoleChanged extends UserEvent {
  constructor(
    user: User,
    public readonly teamId: string,
    public readonly oldRole: string,
    public readonly newRole: string
  ) {
    super({
      userId: user.id.toString(),
      occurredAt: new Date()
    });
  }

  get name(): string {
    return 'user.team.role_changed';
  }
}

export class UserTeamInvited extends UserEvent {
  constructor(
    user: User,
    public readonly teamId: string,
    public readonly invitedBy: string
  ) {
    super({
      userId: user.id.toString(),
      occurredAt: new Date()
    });
  }

  get name(): string {
    return 'user.team.invited';
  }
} 