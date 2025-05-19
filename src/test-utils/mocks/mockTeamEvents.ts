/**
 * Mock-implementationer av Team-relaterade events för testning
 */
import { UniqueId } from '@/shared/core/UniqueId';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';

/**
 * Base class för alla mock-team events
 */
export class BaseMockTeamEvent implements IDomainEvent {
  public readonly aggregateId: string;
  public readonly eventId: UniqueId;
  public readonly dateTimeOccurred: Date;
  public readonly occurredAt: Date; // Krävs av IDomainEvent
  public readonly eventType: string = 'BaseMockTeamEvent'; // Standardvärde som överrids av subklasser

  constructor(teamId: string | UniqueId) {
    this.aggregateId = teamId instanceof UniqueId ? teamId.toString() : teamId;
    this.eventId = new UniqueId();
    this.dateTimeOccurred = new Date();
    this.occurredAt = this.dateTimeOccurred; // Samma som dateTimeOccurred för bakåtkompatibilitet
  }

  public getEventData() {
    // Denna metod överlagras av subklasser för att returnera eventets data
    return {};
  }
}

export interface TeamCreatedEventProps {
  teamId: string | UniqueId;
  name: string;
  ownerId: string | UniqueId;
  createdAt: Date;
}

/**
 * Team skapades
 */
export class TeamCreatedEvent extends BaseMockTeamEvent {
  public readonly eventType = 'TeamCreatedEvent';
  public readonly data: {
    teamId: string;
    name: string;
    ownerId: string;
    createdAt: string;
  };

  // Direkta properties för testning
  public readonly teamId: UniqueId;
  public readonly name: string;
  public readonly ownerId: UniqueId;

  constructor(props: TeamCreatedEventProps) {
    super(props.teamId);
    
    this.teamId = props.teamId instanceof UniqueId ? props.teamId : new UniqueId(props.teamId);
    this.name = props.name;
    this.ownerId = props.ownerId instanceof UniqueId ? props.ownerId : new UniqueId(props.ownerId);
    
    this.data = {
      teamId: this.teamId.toString(),
      name: this.name,
      ownerId: this.ownerId.toString(),
      createdAt: props.createdAt.toISOString()
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

export interface TeamUpdatedEventProps {
  teamId: string | UniqueId;
  name: string;
  description?: string;
  updatedAt: Date;
}

/**
 * Team uppdaterades
 */
export class TeamUpdatedEvent extends BaseMockTeamEvent {
  public readonly eventType = 'TeamUpdatedEvent';
  public readonly data: {
    teamId: string;
    name: string;
    description?: string;
    updatedAt: string;
  };
  
  // Direkta properties för testning
  public readonly teamId: UniqueId;
  public readonly name: string;
  public readonly description?: string;

  constructor(props: TeamUpdatedEventProps) {
    super(props.teamId);
    
    this.teamId = props.teamId instanceof UniqueId ? props.teamId : new UniqueId(props.teamId);
    this.name = props.name;
    this.description = props.description;
    
    this.data = {
      teamId: this.teamId.toString(),
      name: this.name,
      description: this.description,
      updatedAt: props.updatedAt.toISOString()
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

export interface TeamMemberJoinedEventProps {
  teamId: string | UniqueId;
  userId: string | UniqueId;
  role: string;
  joinedAt?: Date;
}

/**
 * Medlem anslöt till team
 */
export class TeamMemberJoinedEvent extends BaseMockTeamEvent {
  public readonly eventType = 'TeamMemberJoinedEvent';
  public readonly data: {
    teamId: string;
    userId: string;
    role: string;
    joinedAt: string;
  };
  
  // Direkta properties för testning
  public readonly teamId: UniqueId;
  public readonly userId: UniqueId;
  public readonly role: string;
  public readonly joinedAt: string;

  constructor(props: TeamMemberJoinedEventProps) {
    super(props.teamId);
    
    this.teamId = props.teamId instanceof UniqueId ? props.teamId : new UniqueId(props.teamId);
    this.userId = props.userId instanceof UniqueId ? props.userId : new UniqueId(props.userId);
    this.role = props.role;
    
    const joinedAt = props.joinedAt || new Date();
    this.joinedAt = joinedAt.toISOString();
    
    this.data = {
      teamId: this.teamId.toString(),
      userId: this.userId.toString(),
      role: this.role,
      joinedAt: this.joinedAt
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

export interface TeamMemberLeftEventProps {
  teamId: string | UniqueId;
  userId: string | UniqueId;
  removedAt?: Date;
}

/**
 * Medlem lämnade team
 */
export class TeamMemberLeftEvent extends BaseMockTeamEvent {
  public readonly eventType = 'TeamMemberLeftEvent';
  public readonly data: {
    teamId: string;
    userId: string;
    removedAt: string;
  };
  
  // Direkta properties för testning
  public readonly teamId: UniqueId;
  public readonly userId: UniqueId;
  public readonly removedAt: string;

  constructor(props: TeamMemberLeftEventProps) {
    super(props.teamId);
    
    this.teamId = props.teamId instanceof UniqueId ? props.teamId : new UniqueId(props.teamId);
    this.userId = props.userId instanceof UniqueId ? props.userId : new UniqueId(props.userId);
    
    const removedAt = props.removedAt || new Date();
    this.removedAt = removedAt.toISOString();
    
    this.data = {
      teamId: this.teamId.toString(),
      userId: this.userId.toString(),
      removedAt: this.removedAt
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

export interface TeamMemberRoleChangedEventProps {
  teamId: string | UniqueId;
  userId: string | UniqueId;
  oldRole: string;
  newRole: string;
  changedAt?: Date;
}

/**
 * Medlems roll ändrades
 */
export class TeamMemberRoleChangedEvent extends BaseMockTeamEvent {
  public readonly eventType = 'TeamMemberRoleChangedEvent';
  public readonly data: {
    teamId: string;
    userId: string;
    oldRole: string;
    newRole: string;
    changedAt: string;
  };
  
  // Direkta properties för testning
  public readonly teamId: UniqueId;
  public readonly userId: UniqueId;
  public readonly oldRole: string;
  public readonly newRole: string;
  public readonly changedAt: string;

  constructor(props: TeamMemberRoleChangedEventProps) {
    super(props.teamId);
    
    this.teamId = props.teamId instanceof UniqueId ? props.teamId : new UniqueId(props.teamId);
    this.userId = props.userId instanceof UniqueId ? props.userId : new UniqueId(props.userId);
    this.oldRole = props.oldRole;
    this.newRole = props.newRole;
    
    const changedAt = props.changedAt || new Date();
    this.changedAt = changedAt.toISOString();
    
    this.data = {
      teamId: this.teamId.toString(),
      userId: this.userId.toString(),
      oldRole: this.oldRole,
      newRole: this.newRole,
      changedAt: this.changedAt
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

export interface TeamInvitationSentEventProps {
  teamId: string | UniqueId;
  inviteeEmail: string;
  senderId: string | UniqueId;
  sentAt?: Date;
}

/**
 * Team-inbjudan skickades
 */
export class TeamInvitationSentEvent extends BaseMockTeamEvent {
  public readonly eventType = 'TeamInvitationSentEvent';
  public readonly data: {
    teamId: string;
    inviteeEmail: string;
    senderId: string;
    sentAt: string;
  };
  
  // Direkta properties för testning
  public readonly teamId: UniqueId;
  public readonly inviteeEmail: string;
  public readonly senderId: UniqueId;
  public readonly sentAt: string;

  constructor(props: TeamInvitationSentEventProps) {
    super(props.teamId);
    
    this.teamId = props.teamId instanceof UniqueId ? props.teamId : new UniqueId(props.teamId);
    this.inviteeEmail = props.inviteeEmail;
    this.senderId = props.senderId instanceof UniqueId ? props.senderId : new UniqueId(props.senderId);
    
    const sentAt = props.sentAt || new Date();
    this.sentAt = sentAt.toISOString();
    
    this.data = {
      teamId: this.teamId.toString(),
      inviteeEmail: this.inviteeEmail,
      senderId: this.senderId.toString(),
      sentAt: this.sentAt
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

export interface TeamInvitationAcceptedEventProps {
  teamId: string | UniqueId;
  inviteeEmail: string;
  inviteeId: string | UniqueId;
  acceptedAt?: Date;
}

/**
 * Team-inbjudan accepterades
 */
export class TeamInvitationAcceptedEvent extends BaseMockTeamEvent {
  public readonly eventType = 'TeamInvitationAcceptedEvent';
  public readonly data: {
    teamId: string;
    inviteeEmail: string;
    inviteeId: string;
    acceptedAt: string;
  };
  
  // Direkta properties för testning
  public readonly teamId: UniqueId;
  public readonly inviteeEmail: string;
  public readonly inviteeId: UniqueId;
  public readonly acceptedAt: string;

  constructor(props: TeamInvitationAcceptedEventProps) {
    super(props.teamId);
    
    this.teamId = props.teamId instanceof UniqueId ? props.teamId : new UniqueId(props.teamId);
    this.inviteeEmail = props.inviteeEmail;
    this.inviteeId = props.inviteeId instanceof UniqueId ? props.inviteeId : new UniqueId(props.inviteeId);
    
    const acceptedAt = props.acceptedAt || new Date();
    this.acceptedAt = acceptedAt.toISOString();
    
    this.data = {
      teamId: this.teamId.toString(),
      inviteeEmail: this.inviteeEmail,
      inviteeId: this.inviteeId.toString(),
      acceptedAt: this.acceptedAt
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

export interface TeamInvitationDeclinedEventProps {
  teamId: string | UniqueId;
  inviteeEmail: string;
  declinedAt?: Date;
}

/**
 * Team-inbjudan avböjdes
 */
export class TeamInvitationDeclinedEvent extends BaseMockTeamEvent {
  public readonly eventType = 'TeamInvitationDeclinedEvent';
  public readonly data: {
    teamId: string;
    inviteeEmail: string;
    declinedAt: string;
  };
  
  // Direkta properties för testning
  public readonly teamId: UniqueId;
  public readonly inviteeEmail: string;
  public readonly declinedAt: string;

  constructor(props: TeamInvitationDeclinedEventProps) {
    super(props.teamId);
    
    this.teamId = props.teamId instanceof UniqueId ? props.teamId : new UniqueId(props.teamId);
    this.inviteeEmail = props.inviteeEmail;
    
    const declinedAt = props.declinedAt || new Date();
    this.declinedAt = declinedAt.toISOString();
    
    this.data = {
      teamId: this.teamId.toString(),
      inviteeEmail: this.inviteeEmail,
      declinedAt: this.declinedAt
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
