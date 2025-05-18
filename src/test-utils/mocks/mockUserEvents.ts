/**
 * Mock-implementation av User-händelser för testning
 * 
 * Dessa klasser är designade för att vara kompatibla med testerna som förväntar sig
 * både äldre händelsestrukturer (t.ex. med 'name' istället för 'eventType') och nyare
 * händelsestrukturer.
 */

import { UniqueId } from '@/shared/core/UniqueId';
import { User } from '@/domain/user/entities/User';
import { UserProfile } from '@/domain/user/value-objects/UserProfile';
import { UserSettings } from '@/domain/user/entities/UserSettings';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';

/**
 * Base class för alla mock-user events
 */
export class BaseMockUserEvent implements IDomainEvent {
  public readonly aggregateId: string;
  public readonly eventId: UniqueId;
  public readonly dateTimeOccurred: Date;
  public readonly occurredAt: Date; // Krävs av IDomainEvent
  public readonly eventType: string = 'BaseMockUserEvent'; // Standardvärde som överrids av subklasser

  constructor(userId: string | UniqueId) {
    this.aggregateId = userId instanceof UniqueId ? userId.toString() : userId;
    this.eventId = new UniqueId();
    this.dateTimeOccurred = new Date();
    this.occurredAt = this.dateTimeOccurred; // Samma som dateTimeOccurred för bakåtkompatibilitet
  }

  public getEventData() {
    // Denna metod överlagras av subklasser för att returnera eventets data
    return {};
  }
}

/**
 * User skapades
 */
export class UserCreatedEvent extends BaseMockUserEvent {
  public readonly eventType = 'UserCreatedEvent';
  public readonly data: {
    userId: string;
    email: string;
    name: string;
    createdAt: string;
  };

  // Direkta properties för testning
  public readonly userId: UniqueId;
  public readonly email: string;
  public readonly displayName: string;

  constructor(props: {
    userId: string | UniqueId;
    email: string;
    name: string;
  }) {
    super(props.userId);
    
    this.userId = props.userId instanceof UniqueId ? props.userId : new UniqueId(props.userId);
    this.email = props.email;
    this.displayName = props.name;
    
    this.data = {
      userId: this.userId.toString(),
      email: this.email,
      name: props.name,
      createdAt: new Date().toISOString()
    };
  }

  public getEventData() {
    return this.data;
  }
  
  // Getters för test-kompatibilitet
  get payload() {
    return this.data;
  }
  
  get name() {
    return this.data.name;
  }
}

/**
 * Bakåtkompatibel version av UserCreatedEvent för testers
 * 
 * Denna klass ger stöd för äldre testmetodik som tar userId, email och name som separata parametrar
 * istället för som ett props-objekt.
 */
export class MockUserCreatedEvent extends UserCreatedEvent {
  constructor(
    userId: { id: string | UniqueId } | string | UniqueId,
    email: string,
    name: string
  ) {
    // Hantera olika former av userId (objekt med id-egenskap, UniqueId eller string)
    let userIdValue: string | UniqueId;
    
    if (typeof userId === 'object' && 'id' in userId) {
      userIdValue = userId.id;
    } else {
      userIdValue = userId;
    }
    
    super({
      userId: userIdValue,
      email,
      name
    });
  }

  // Överrida name property från UserCreatedEvent med en konstant
  // för test-kompatibilitet med äldre kod som använder 'name' som eventtyp
  override get name(): string {
    return 'UserCreated';
  }
}

/**
 * User aktiverades
 */
export class UserActivatedEvent extends BaseMockUserEvent {
  public readonly eventType = 'UserActivatedEvent';
  public readonly data: {
    userId: string;
    activationReason: string;
    activatedAt: string;
  };
  
  // Direkta properties för testning
  public readonly userId: UniqueId;
  public readonly activationReason: string;

  constructor(
    userId: string | UniqueId,
    activationReason: string = ''
  ) {
    super(userId);
    
    this.userId = userId instanceof UniqueId ? userId : new UniqueId(userId);
    this.activationReason = activationReason;
    
    this.data = {
      userId: this.userId.toString(),
      activationReason: this.activationReason,
      activatedAt: new Date().toISOString()
    };
  }

  public getEventData() {
    return this.data;
  }
  
  // Getters för test-kompatibilitet
  get payload() {
    return this.data;
  }
}

/**
 * Bakåtkompatibel version av UserActivatedEvent för tester
 * 
 * Denna klass ger stöd för äldre testmetodik som tar mockUser och reason som separata parametrar
 * istället för userId och activationReason.
 */
export class MockUserActivatedEvent extends UserActivatedEvent {
  constructor(
    mockUser: { id: string | UniqueId } | string | UniqueId,
    reason: string = ''
  ) {
    // Hantera olika former av userId (objekt med id-egenskap, UniqueId eller string)
    let userIdValue: string | UniqueId;
    
    if (typeof mockUser === 'object' && 'id' in mockUser) {
      userIdValue = mockUser.id;
    } else {
      userIdValue = mockUser;
    }
    
    super(userIdValue, reason);
  }
  
  // Tillägg för äldre testformat som kollar efter 'name' istället för 'eventType'
  get name() {
    return 'user.account.activated';
  }
}

/**
 * User deaktiverades
 */
export class UserDeactivatedEvent extends BaseMockUserEvent {
  public readonly eventType = 'UserDeactivatedEvent';
  public readonly data: {
    userId: string;
    deactivationReason: string;
    deactivatedAt: string;
  };
  
  // Direkta properties för testning
  public readonly userId: UniqueId;
  public readonly deactivationReason: string;

  constructor(
    userId: string | UniqueId,
    deactivationReason: string = ''
  ) {
    super(userId);
    
    this.userId = userId instanceof UniqueId ? userId : new UniqueId(userId);
    this.deactivationReason = deactivationReason;
    
    this.data = {
      userId: this.userId.toString(),
      deactivationReason: this.deactivationReason,
      deactivatedAt: new Date().toISOString()
    };
  }

  public getEventData() {
    return this.data;
  }
  
  // Getters för test-kompatibilitet
  get payload() {
    return this.data;
  }
}

/**
 * User-profil uppdaterades
 */
export class UserProfileUpdatedEvent extends BaseMockUserEvent {
  public readonly eventType = 'UserProfileUpdatedEvent';
  public readonly data: {
    userId: string;
    profile: any;
    updatedAt: string;
  };

  // Direkta properties för testning
  public readonly userId: UniqueId;
  public readonly profile: any;

  constructor(
    userId: string | UniqueId,
    profile: any
  ) {
    super(userId);
    
    this.userId = userId instanceof UniqueId ? userId : new UniqueId(userId);
    this.profile = profile;
    
    this.data = {
      userId: this.userId.toString(),
      profile: this.profile,
      updatedAt: new Date().toISOString()
    };
  }

  // Tillägg för äldre testformat som kollar efter 'name' istället för 'eventType'
  get name() {
    return 'user.profile.updated';
  }
}

/**
 * Bakåtkompatibel version av UserProfileUpdatedEvent för tester
 */
export class MockUserProfileUpdatedEvent extends UserProfileUpdatedEvent {
  constructor(
    userId: { id: string | UniqueId } | string | UniqueId,
    profile: any
  ) {
    // Hantera olika former av userId (objekt med id-egenskap, UniqueId eller string)
    let userIdValue: string | UniqueId;
    
    if (typeof userId === 'object' && 'id' in userId) {
      userIdValue = userId.id;
    } else {
      userIdValue = userId;
    }
    
    super(userIdValue, profile);
  }
}

/**
 * User-inställningar uppdaterades
 */
export class UserSettingsUpdatedEvent extends BaseMockUserEvent {
  public readonly eventType = 'UserSettingsUpdatedEvent';
  public readonly data: {
    userId: string;
    settings: Record<string, any>;
    updatedAt: string;
  };
  
  // Direkta properties för testning
  public readonly userId: UniqueId;
  public readonly settings: Record<string, any>;

  constructor(
    userId: string | UniqueId,
    settings: Record<string, any>
  ) {
    super(userId);
    
    this.userId = userId instanceof UniqueId ? userId : new UniqueId(userId);
    this.settings = settings;
    
    this.data = {
      userId: this.userId.toString(),
      settings: this.settings,
      updatedAt: new Date().toISOString()
    };
  }

  public getEventData() {
    return this.data;
  }
  
  // Getters för test-kompatibilitet
  get payload() {
    return this.data;
  }
}

/**
 * User tilldelades ett team
 */
export class UserTeamAddedEvent extends BaseMockUserEvent {
  public readonly eventType = 'UserTeamAddedEvent';
  public readonly data: {
    userId: string;
    teamId: string;
    addedAt: string;
  };
  
  // Direkta properties för testning
  public readonly userId: UniqueId;
  public readonly teamId: UniqueId;

  constructor(
    userId: string | UniqueId,
    teamId: string | UniqueId
  ) {
    super(userId);
    
    this.userId = userId instanceof UniqueId ? userId : new UniqueId(userId);
    this.teamId = teamId instanceof UniqueId ? teamId : new UniqueId(teamId);
    
    this.data = {
      userId: this.userId.toString(),
      teamId: this.teamId.toString(),
      addedAt: new Date().toISOString()
    };
  }

  public getEventData() {
    return this.data;
  }
  
  // Getters för test-kompatibilitet
  get payload() {
    return this.data;
  }
}

/**
 * User togs bort från ett team
 */
export class UserTeamRemovedEvent extends BaseMockUserEvent {
  public readonly eventType = 'UserTeamRemovedEvent';
  public readonly data: {
    userId: string;
    teamId: string;
    removedAt: string;
  };
  
  // Direkta properties för testning
  public readonly userId: UniqueId;
  public readonly teamId: UniqueId;

  constructor(
    userId: string | UniqueId,
    teamId: string | UniqueId
  ) {
    super(userId);
    
    this.userId = userId instanceof UniqueId ? userId : new UniqueId(userId);
    this.teamId = teamId instanceof UniqueId ? teamId : new UniqueId(teamId);
    
    this.data = {
      userId: this.userId.toString(),
      teamId: this.teamId.toString(),
      removedAt: new Date().toISOString()
    };
  }

  public getEventData() {
    return this.data;
  }
  
  // Getters för test-kompatibilitet
  get payload() {
    return this.data;
  }
}

/**
 * User tilldelades en roll
 */
export class UserRoleAddedEvent extends BaseMockUserEvent {
  public readonly eventType = 'UserRoleAddedEvent';
  public readonly data: {
    userId: string;
    roleId: string;
    addedAt: string;
  };
  
  // Direkta properties för testning
  public readonly userId: UniqueId;
  public readonly roleId: string;

  constructor(
    userId: string | UniqueId,
    roleId: string
  ) {
    super(userId);
    
    this.userId = userId instanceof UniqueId ? userId : new UniqueId(userId);
    this.roleId = roleId;
    
    this.data = {
      userId: this.userId.toString(),
      roleId: this.roleId,
      addedAt: new Date().toISOString()
    };
  }

  public getEventData() {
    return this.data;
  }
  
  // Getters för test-kompatibilitet
  get payload() {
    return this.data;
  }
}

/**
 * User förlorade en roll
 */
export class UserRoleRemovedEvent extends BaseMockUserEvent {
  public readonly eventType = 'UserRoleRemovedEvent';
  public readonly data: {
    userId: string;
    roleId: string;
    removedAt: string;
  };
  
  // Direkta properties för testning
  public readonly userId: UniqueId;
  public readonly roleId: string;

  constructor(
    userId: string | UniqueId,
    roleId: string
  ) {
    super(userId);
    
    this.userId = userId instanceof UniqueId ? userId : new UniqueId(userId);
    this.roleId = roleId;
    
    this.data = {
      userId: this.userId.toString(),
      roleId: this.roleId,
      removedAt: new Date().toISOString()
    };
  }

  public getEventData() {
    return this.data;
  }
  
  // Getters för test-kompatibilitet
  get payload() {
    return this.data;
  }
}

/**
 * Users status ändrades
 */
export class UserStatusChangedEvent extends BaseMockUserEvent {
  public readonly eventType = 'UserStatusChangedEvent';
  public readonly data: {
    userId: string;
    oldStatus: string;
    newStatus: string;
    changedAt: string;
  };
  
  // Direkta properties för testning
  public readonly userId: UniqueId;
  public readonly oldStatus: string;
  public readonly newStatus: string;

  constructor(
    userId: string | UniqueId,
    oldStatus: string,
    newStatus: string
  ) {
    super(userId);
    
    this.userId = userId instanceof UniqueId ? userId : new UniqueId(userId);
    this.oldStatus = oldStatus;
    this.newStatus = newStatus;
    
    this.data = {
      userId: this.userId.toString(),
      oldStatus: this.oldStatus,
      newStatus: this.newStatus,
      changedAt: new Date().toISOString()
    };
  }

  public getEventData() {
    return this.data;
  }
  
  // Getters för test-kompatibilitet
  get payload() {
    return this.data;
  }
}

/**
 * User bytte e-postadress
 */
export class UserEmailUpdatedEvent extends BaseMockUserEvent {
  public readonly eventType = 'UserEmailUpdatedEvent';
  public readonly data: {
    userId: string;
    oldEmail: string;
    newEmail: string;
    updatedAt: string;
  };
  
  // Direkta properties för testning
  public readonly userId: UniqueId;
  public readonly oldEmail: string;
  public readonly newEmail: string;

  constructor(
    userId: string | UniqueId,
    oldEmail: string,
    newEmail: string
  ) {
    super(userId);
    
    this.userId = userId instanceof UniqueId ? userId : new UniqueId(userId);
    this.oldEmail = oldEmail;
    this.newEmail = newEmail;
    
    this.data = {
      userId: this.userId.toString(),
      oldEmail: this.oldEmail,
      newEmail: this.newEmail,
      updatedAt: new Date().toISOString()
    };
  }

  public getEventData() {
    return this.data;
  }
  
  // Getters för test-kompatibilitet
  get payload() {
    return this.data;
  }
} 