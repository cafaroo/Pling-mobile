import { DomainEvent } from '@/shared/domain/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { User } from '../entities/User';
import { UserProfile } from '../entities/UserProfile';
import { UserSettings } from '../entities/UserSettings';

export interface UserEventData {
  userId: string;
  occurredAt: Date;
}

export abstract class UserEvent implements DomainEvent {
  public readonly dateTimeOccurred: Date;
  public readonly aggregateId: UniqueId;
  public readonly user: User;

  constructor(user: User) {
    this.dateTimeOccurred = new Date();
    this.aggregateId = user.id;
    this.user = user;
  }

  abstract get eventName(): string;
  
  get name(): string {
    return this.eventName;
  }
  
  get data(): UserEventData {
    return {
      userId: this.user.id.toString(),
      occurredAt: this.dateTimeOccurred
    };
  }
}

export class UserCreated extends UserEvent {
  constructor(user: User) {
    super(user);
  }

  get eventName(): string {
    return 'user.created';
  }
}

export class UserProfileUpdated extends UserEvent {
  public readonly profile: UserProfile;

  constructor(user: User) {
    super(user);
    this.profile = user.profile;
  }

  get eventName(): string {
    return 'user.profile.updated';
  }
}

export class UserSettingsUpdated extends UserEvent {
  public readonly settings: UserSettings;

  constructor(user: User) {
    super(user);
    this.settings = user.settings;
  }

  get eventName(): string {
    return 'user.settings.updated';
  }
}

export class UserRoleAdded extends UserEvent {
  constructor(
    user: User,
    public readonly roleId: UniqueId
  ) {
    super(user);
  }

  get eventName(): string {
    return 'user.role.added';
  }
}

export class UserRoleRemoved extends UserEvent {
  constructor(
    user: User,
    public readonly roleId: UniqueId
  ) {
    super(user);
  }

  get eventName(): string {
    return 'user.role.removed';
  }
}

export class UserTeamJoined extends UserEvent {
  constructor(
    user: User,
    public readonly teamId: UniqueId
  ) {
    super(user);
  }

  get eventName(): string {
    return 'user.team.joined';
  }
}

export class UserTeamLeft extends UserEvent {
  constructor(
    user: User,
    public readonly teamId: UniqueId
  ) {
    super(user);
  }

  get eventName(): string {
    return 'user.team.left';
  }
}

export class UserStatusChanged extends UserEvent {
  constructor(
    user: User,
    public readonly oldStatus: string,
    public readonly newStatus: string
  ) {
    super(user);
  }

  get eventName(): string {
    return 'user.status.changed';
  }
}

// Nya händelser för användaraktivering och konto

export class UserActivated extends UserEvent {
  public readonly activationReason: string;

  constructor(user: User, activationReason: string = '') {
    super(user);
    this.activationReason = activationReason;
  }

  get eventName(): string {
    return 'user.activated';
  }
  
  get name(): string {
    return 'user.account.activated';
  }
  
  get data(): UserEventData {
    return {
      userId: this.user.id.toString(),
      occurredAt: this.dateTimeOccurred
    };
  }
}

export class UserDeactivated extends UserEvent {
  public readonly deactivationReason: string;

  constructor(user: User, deactivationReason: string = '') {
    super(user);
    this.deactivationReason = deactivationReason;
  }

  get eventName(): string {
    return 'user.deactivated';
  }
  
  get name(): string {
    return 'user.account.deactivated';
  }
  
  get data(): UserEventData {
    return {
      userId: this.user.id.toString(),
      occurredAt: this.dateTimeOccurred
    };
  }
}

export class UserDeleted extends UserEvent {
  constructor(user: User) {
    super(user);
  }

  get eventName(): string {
    return 'user.deleted';
  }
}

// Händelser för privacy och säkerhet

export class UserPrivacySettingsChanged extends UserEvent {
  public readonly privacy: Record<string, any>;

  constructor(user: User, privacy: Record<string, any>) {
    super(user);
    this.privacy = privacy;
  }

  get eventName(): string {
    return 'user.privacy_settings.changed';
  }
}

export class UserNotificationSettingsChanged extends UserEvent {
  public readonly notifications: Record<string, any>;
  public readonly oldSettings: Record<string, any>;
  public readonly newSettings: Record<string, any>;

  constructor(
    user: User, 
    notifications: Record<string, any>,
    oldSettings: Record<string, any>,
    newSettings: Record<string, any>
  ) {
    super(user);
    this.notifications = notifications;
    this.oldSettings = oldSettings;
    this.newSettings = newSettings;
  }

  get eventName(): string {
    return 'user.notification_settings.changed';
  }
}

export class UserSecurityEvent extends UserEvent {
  public readonly securityEvent: string;
  public readonly metadata?: Record<string, any>;
  public readonly eventType: string;

  constructor(
    user: User, 
    securityEvent: string, 
    metadata?: Record<string, any>
  ) {
    super(user);
    this.securityEvent = securityEvent;
    this.eventType = securityEvent;
    this.metadata = metadata;
  }

  get eventName(): string {
    return `user.security.${this.securityEvent}`;
  }
}

// Händelser för statistik och beteende

export class UserStatisticsUpdated extends UserEvent {
  public readonly statistics: Record<string, any>;

  constructor(user: User, statistics: Record<string, any>) {
    super(user);
    this.statistics = statistics;
  }

  get eventName(): string {
    return 'user.statistics.updated';
  }
}

export class UserAchievementUnlocked extends UserEvent {
  public readonly achievement: Record<string, any>;

  constructor(user: User, achievement: Record<string, any>) {
    super(user);
    this.achievement = achievement;
  }

  get eventName(): string {
    return 'user.achievement.unlocked';
  }
}

// Händelser för teamsrelaterade aktiviteter (utökade)

export class UserTeamRoleChanged extends UserEvent {
  public readonly teamId: UniqueId;
  public readonly role: string;

  constructor(user: User, teamId: UniqueId, role: string) {
    super(user);
    this.teamId = teamId;
    this.role = role;
  }

  get eventName(): string {
    return 'user.team.role_changed';
  }
}

export class UserTeamInvited extends UserEvent {
  public readonly teamId: UniqueId;
  public readonly inviterId: UniqueId;

  constructor(user: User, teamId: UniqueId, inviterId: UniqueId) {
    super(user);
    this.teamId = teamId;
    this.inviterId = inviterId;
  }

  get eventName(): string {
    return 'user.team.invited';
  }
} 