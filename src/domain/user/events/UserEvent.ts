import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { User } from '../entities/User';
import { UserProfile } from '../value-objects/UserProfile';
import { UserSettings } from '../entities/UserSettings';
import { Email } from '../value-objects/Email';

// Importera de nya standardiserade eventklasserna
import { UserCreatedEvent } from './UserCreatedEvent';
import { UserProfileUpdatedEvent } from './UserProfileUpdatedEvent';
import { UserSettingsUpdatedEvent } from './UserSettingsUpdatedEvent';
import { UserStatusChangedEvent } from './UserStatusChangedEvent';
import { UserTeamAddedEvent } from './UserTeamAddedEvent';
import { UserTeamRemovedEvent } from './UserTeamRemovedEvent';
import { UserRoleAddedEvent } from './UserRoleAddedEvent';
import { UserRoleRemovedEvent } from './UserRoleRemovedEvent';
import { UserActivatedEvent } from './UserActivatedEvent';
import { UserDeactivatedEvent } from './UserDeactivatedEvent';
import { UserNotificationSettingsChangedEvent } from './UserNotificationSettingsChangedEvent';
import { UserSecurityEventOccurredEvent } from './UserSecurityEventOccurredEvent';
import { UserEmailUpdatedEvent } from './UserEmailUpdatedEvent';

/**
 * UserEventData
 * 
 * Interface för gemensamma data för alla user events
 */
export interface UserEventData {
  userId: string;
  email?: string;
  name?: string;
  timestamp: Date;
}

/**
 * BaseUserEvent
 * 
 * Abstrakt basklass för alla användar-relaterade domänevents.
 * Implementerar IDomainEvent och tillhandahåller gemensam funktionalitet
 * för alla användarrelaterade events.
 */
export abstract class BaseUserEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly occurredAt: Date;
  public readonly eventType: string;
  public readonly aggregateId: string;
  public readonly data: UserEventData;

  constructor(eventType: string, user: User | UniqueId, additionalData: Record<string, any> = {}) {
    this.eventId = new UniqueId();
    this.occurredAt = new Date();
    this.eventType = eventType;
    
    // Om user är ett User-objekt, extrahera ID och grundläggande information
    if (user instanceof User) {
      this.aggregateId = user.id.toString();
      this.data = {
        userId: user.id.toString(),
        email: user.email.value,
        name: user.name,
        timestamp: this.occurredAt,
        ...additionalData
      };
    } else {
      // Om user är bara ett ID
      this.aggregateId = user.toString();
      this.data = {
        userId: user.toString(),
        timestamp: this.occurredAt,
        ...additionalData
      };
    }
  }
}

/**
 * @deprecated Använd standardiserade UserCreatedEvent istället
 * @see UserCreatedEvent
 */
export class UserCreated extends BaseUserEvent {
  constructor(
    user: User | UniqueId,
    email?: string,
    name?: string
  ) {
    const additionalData: Record<string, any> = {};
    
    // Lägg bara till dessa värden om de skickades in separat (och inte via User-objektet)
    if (email) additionalData['email'] = email;
    if (name) additionalData['name'] = name;
    
    super('UserCreated', user, additionalData);
  }
}

/**
 * @deprecated Använd standardiserade UserActivatedEvent istället
 * @see UserActivatedEvent
 */
export class UserActivated extends BaseUserEvent {
  public readonly activationReason: string;
  
  constructor(
    user: User | UniqueId,
    activationReason: string = ''
  ) {
    super('UserActivated', user, { activationReason });
    this.activationReason = activationReason;
  }
}

/**
 * @deprecated Använd standardiserade UserDeactivatedEvent istället
 * @see UserDeactivatedEvent
 */
export class UserDeactivated extends BaseUserEvent {
  public readonly deactivationReason: string;
  
  constructor(
    user: User | UniqueId,
    deactivationReason: string = ''
  ) {
    super('UserDeactivated', user, { deactivationReason });
    this.deactivationReason = deactivationReason;
  }
}

/**
 * @deprecated Använd standardiserade UserProfileUpdatedEvent istället
 * @see UserProfileUpdatedEvent
 */
export class UserProfileUpdated extends BaseUserEvent {
  constructor(
    user: User | UniqueId,
    profileData: Record<string, any>
  ) {
    super('UserProfileUpdated', user, { profileData });
  }
}

/**
 * @deprecated Använd standardiserade UserSettingsUpdatedEvent istället
 * @see UserSettingsUpdatedEvent
 */
export class UserSettingsUpdated extends BaseUserEvent {
  constructor(
    user: User | UniqueId,
    settingsData: Record<string, any>
  ) {
    super('UserSettingsUpdated', user, { settingsData });
  }
}

/**
 * @deprecated Använd standardiserade UserTeamAddedEvent istället
 * @see UserTeamAddedEvent
 */
export class UserTeamAdded extends BaseUserEvent {
  constructor(
    user: User | UniqueId,
    teamId: string
  ) {
    super('UserTeamAdded', user, { teamId });
  }
}

/**
 * @deprecated Använd standardiserade UserTeamRemovedEvent istället
 * @see UserTeamRemovedEvent
 */
export class UserTeamRemoved extends BaseUserEvent {
  constructor(
    user: User | UniqueId,
    teamId: string
  ) {
    super('UserTeamRemoved', user, { teamId });
  }
}

/**
 * @deprecated Använd standardiserade UserRoleAddedEvent istället
 * @see UserRoleAddedEvent
 */
export class UserRoleAdded extends BaseUserEvent {
  constructor(
    user: User | UniqueId,
    roleId: string
  ) {
    super('UserRoleAdded', user, { roleId });
  }
}

/**
 * @deprecated Använd standardiserade UserRoleRemovedEvent istället
 * @see UserRoleRemovedEvent
 */
export class UserRoleRemoved extends BaseUserEvent {
  constructor(
    user: User | UniqueId,
    roleId: string
  ) {
    super('UserRoleRemoved', user, { roleId });
  }
}

/**
 * @deprecated Använd standardiserade UserStatusChangedEvent istället
 * @see UserStatusChangedEvent
 */
export class UserStatusChanged extends BaseUserEvent {
  constructor(
    user: User | UniqueId,
    oldStatus: string,
    newStatus: string
  ) {
    super('UserStatusChanged', user, { oldStatus, newStatus });
  }
}

/**
 * UserTeamJoined
 * 
 * Event som publiceras när en användare går med i ett team (utifrån team-perspektivet)
 */
export class UserTeamJoined extends BaseUserEvent {
  constructor(
    user: User | UniqueId,
    teamId: string
  ) {
    super('UserTeamJoined', user, { teamId });
  }
}

/**
 * UserTeamLeft
 * 
 * Event som publiceras när en användare lämnar ett team (utifrån team-perspektivet)
 */
export class UserTeamLeft extends BaseUserEvent {
  constructor(
    user: User | UniqueId,
    teamId: string
  ) {
    super('UserTeamLeft', user, { teamId });
  }
}

/**
 * UserDeleted
 * 
 * Event som publiceras när en användare tas bort
 */
export class UserDeleted extends BaseUserEvent {
  constructor(
    user: User | UniqueId
  ) {
    super('UserDeleted', user);
  }
}

/**
 * @deprecated Använd standardiserade UserEmailUpdatedEvent istället
 * @see UserEmailUpdatedEvent
 */
export class UserEmailUpdated extends BaseUserEvent {
  constructor(
    user: User | UniqueId,
    oldEmail: string,
    newEmail: string
  ) {
    super('UserEmailUpdated', user, { oldEmail, newEmail });
  }
}

/**
 * UserPrivacySettingsChanged
 * 
 * Event som publiceras när en användares sekretessinställningar ändras
 */
export class UserPrivacySettingsChanged extends BaseUserEvent {
  constructor(
    user: User | UniqueId,
    privacy: Record<string, any>
  ) {
    super('UserPrivacySettingsChanged', user, { privacy });
  }
}

/**
 * @deprecated Använd standardiserade UserNotificationSettingsChangedEvent istället
 * @see UserNotificationSettingsChangedEvent
 */
export class UserNotificationSettingsChanged extends BaseUserEvent {
  constructor(
    user: User | UniqueId,
    notifications: Record<string, any>,
    oldSettings: Record<string, any>,
    newSettings: Record<string, any>
  ) {
    super('UserNotificationSettingsChanged', user, { 
      notifications, 
      oldSettings, 
      newSettings 
    });
  }
}

/**
 * @deprecated Använd standardiserade UserSecurityEventOccurredEvent istället
 * @see UserSecurityEventOccurredEvent
 */
export class UserSecurityEvent extends BaseUserEvent {
  constructor(
    user: User | UniqueId,
    securityEvent: string,
    metadata?: Record<string, any>
  ) {
    super('UserSecurityEvent', user, { 
      securityEvent, 
      metadata 
    });
  }
}

/**
 * UserStatisticsUpdated
 * 
 * Event som publiceras när användarstatistik uppdateras
 */
export class UserStatisticsUpdated extends BaseUserEvent {
  constructor(
    user: User | UniqueId,
    statistics: Record<string, any>
  ) {
    super('UserStatisticsUpdated', user, { statistics });
  }
}

/**
 * UserAchievementUnlocked
 * 
 * Event som publiceras när en användare låser upp en prestation
 */
export class UserAchievementUnlocked extends BaseUserEvent {
  constructor(
    user: User | UniqueId,
    achievement: Record<string, any>
  ) {
    super('UserAchievementUnlocked', user, { achievement });
  }
}

/**
 * UserTeamRoleChanged
 * 
 * Event som publiceras när en användares roll i ett team ändras
 */
export class UserTeamRoleChanged extends BaseUserEvent {
  constructor(
    user: User | UniqueId,
    teamId: UniqueId | string,
    role: string
  ) {
    super('UserTeamRoleChanged', user, { 
      teamId: teamId instanceof UniqueId ? teamId.toString() : teamId, 
      role 
    });
  }
}

/**
 * UserTeamInvited
 * 
 * Event som publiceras när en användare bjuds in till ett team
 */
export class UserTeamInvited extends BaseUserEvent {
  constructor(
    user: User | UniqueId,
    teamId: UniqueId | string,
    inviterId: UniqueId | string
  ) {
    super('UserTeamInvited', user, { 
      teamId: teamId instanceof UniqueId ? teamId.toString() : teamId,
      inviterId: inviterId instanceof UniqueId ? inviterId.toString() : inviterId
    });
  }
} 