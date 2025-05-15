import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { User } from '../entities/User';
import { UserProfile } from '../entities/UserProfile';
import { UserSettings } from '../entities/UserSettings';

/**
 * BaseUserEvent
 * 
 * Abstrakt basklass för alla användar-relaterade domänevents
 */
export abstract class BaseUserEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly occurredAt: Date;
  public readonly eventType: string;
  public readonly aggregateId: string;

  constructor(eventType: string, userId: UniqueId) {
    this.eventId = new UniqueId();
    this.occurredAt = new Date();
    this.eventType = eventType;
    this.aggregateId = userId.toString();
  }
}

export class UserCreated extends BaseUserEvent {
  constructor(
    public readonly userId: UniqueId,
    public readonly email: string,
    public readonly name: string
  ) {
    super('UserCreated', userId);
  }
}

export class UserActivated extends BaseUserEvent {
  constructor(
    public readonly userId: UniqueId,
    public readonly activationReason: string = ''
  ) {
    super('UserActivated', userId);
  }
}

export class UserDeactivated extends BaseUserEvent {
  constructor(
    public readonly userId: UniqueId,
    public readonly deactivationReason: string = ''
  ) {
    super('UserDeactivated', userId);
  }
}

export class UserProfileUpdated extends BaseUserEvent {
  constructor(
    public readonly userId: UniqueId,
    public readonly profileData: Record<string, any>
  ) {
    super('UserProfileUpdated', userId);
  }
}

export class UserSettingsUpdated extends BaseUserEvent {
  constructor(
    public readonly userId: UniqueId,
    public readonly settingsData: Record<string, any>
  ) {
    super('UserSettingsUpdated', userId);
  }
}

export class UserTeamAdded extends BaseUserEvent {
  constructor(
    public readonly userId: UniqueId,
    public readonly teamId: string
  ) {
    super('UserTeamAdded', userId);
  }
}

export class UserTeamRemoved extends BaseUserEvent {
  constructor(
    public readonly userId: UniqueId,
    public readonly teamId: string
  ) {
    super('UserTeamRemoved', userId);
  }
}

export class UserRoleAdded extends BaseUserEvent {
  constructor(
    public readonly userId: UniqueId,
    public readonly roleId: string
  ) {
    super('UserRoleAdded', userId);
  }
}

export class UserRoleRemoved extends BaseUserEvent {
  constructor(
    public readonly userId: UniqueId,
    public readonly roleId: string
  ) {
    super('UserRoleRemoved', userId);
  }
}

export class UserStatusChanged extends BaseUserEvent {
  constructor(
    public readonly userId: UniqueId,
    public readonly oldStatus: string,
    public readonly newStatus: string
  ) {
    super('UserStatusChanged', userId);
  }
}

export class UserTeamJoined extends BaseUserEvent {
  constructor(
    public readonly userId: UniqueId,
    public readonly teamId: string
  ) {
    super('UserTeamJoined', userId);
  }
}

export class UserTeamLeft extends BaseUserEvent {
  constructor(
    public readonly userId: UniqueId,
    public readonly teamId: string
  ) {
    super('UserTeamLeft', userId);
  }
}

export class UserDeleted extends BaseUserEvent {
  constructor(
    public readonly userId: UniqueId
  ) {
    super('UserDeleted', userId);
  }
}

export class UserPrivacySettingsChanged extends BaseUserEvent {
  constructor(
    public readonly userId: UniqueId,
    public readonly privacy: Record<string, any>
  ) {
    super('UserPrivacySettingsChanged', userId);
  }
}

export class UserNotificationSettingsChanged extends BaseUserEvent {
  constructor(
    public readonly userId: UniqueId,
    public readonly notifications: Record<string, any>,
    public readonly oldSettings: Record<string, any>,
    public readonly newSettings: Record<string, any>
  ) {
    super('UserNotificationSettingsChanged', userId);
  }
}

export class UserSecurityEvent extends BaseUserEvent {
  constructor(
    public readonly userId: UniqueId,
    public readonly securityEvent: string,
    public readonly metadata?: Record<string, any>
  ) {
    super('UserSecurityEvent', userId);
  }
}

export class UserStatisticsUpdated extends BaseUserEvent {
  constructor(
    public readonly userId: UniqueId,
    public readonly statistics: Record<string, any>
  ) {
    super('UserStatisticsUpdated', userId);
  }
}

export class UserAchievementUnlocked extends BaseUserEvent {
  constructor(
    public readonly userId: UniqueId,
    public readonly achievement: Record<string, any>
  ) {
    super('UserAchievementUnlocked', userId);
  }
}

export class UserTeamRoleChanged extends BaseUserEvent {
  constructor(
    public readonly userId: UniqueId,
    public readonly teamId: UniqueId,
    public readonly role: string
  ) {
    super('UserTeamRoleChanged', userId);
  }
}

export class UserTeamInvited extends BaseUserEvent {
  constructor(
    public readonly userId: UniqueId,
    public readonly teamId: UniqueId,
    public readonly inviterId: UniqueId
  ) {
    super('UserTeamInvited', userId);
  }
} 