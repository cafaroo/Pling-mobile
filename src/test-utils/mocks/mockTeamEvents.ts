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

  constructor(props: {
    teamId: string | UniqueId;
    name: string;
    ownerId: string | UniqueId;
    createdAt: Date;
  }) {
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

/**
 * Team uppdaterades
 */
export class TeamUpdatedEvent extends BaseMockTeamEvent {
  public readonly eventType = 'TeamUpdatedEvent';
  public readonly data: {
    teamId: string;
    name: string;
    updatedAt: string;
  };
  
  // Direkta properties för testning
  public readonly teamId: UniqueId;
  public readonly name: string;

  constructor(teamId: string | UniqueId, name: string) {
    super(teamId);
    
    this.teamId = teamId instanceof UniqueId ? teamId : new UniqueId(teamId);
    this.name = name;
    
    this.data = {
      teamId: this.teamId.toString(),
      name: this.name,
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

  constructor(
    teamId: string | UniqueId,
    userId: string | UniqueId,
    role: string
  ) {
    super(teamId);
    
    this.teamId = teamId instanceof UniqueId ? teamId : new UniqueId(teamId);
    this.userId = userId instanceof UniqueId ? userId : new UniqueId(userId);
    this.role = role;
    
    this.data = {
      teamId: this.teamId.toString(),
      userId: this.userId.toString(),
      role: this.role,
      joinedAt: new Date().toISOString()
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

  constructor(teamId: string | UniqueId, userId: string | UniqueId) {
    super(teamId);
    
    this.teamId = teamId instanceof UniqueId ? teamId : new UniqueId(teamId);
    this.userId = userId instanceof UniqueId ? userId : new UniqueId(userId);
    
    this.data = {
      teamId: this.teamId.toString(),
      userId: this.userId.toString(),
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

  constructor(
    teamId: string | UniqueId,
    userId: string | UniqueId,
    oldRole: string,
    newRole: string
  ) {
    super(teamId);
    
    this.teamId = teamId instanceof UniqueId ? teamId : new UniqueId(teamId);
    this.userId = userId instanceof UniqueId ? userId : new UniqueId(userId);
    this.oldRole = oldRole;
    this.newRole = newRole;
    
    this.data = {
      teamId: this.teamId.toString(),
      userId: this.userId.toString(),
      oldRole: this.oldRole,
      newRole: this.newRole,
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

  constructor(
    teamId: string | UniqueId,
    inviteeEmail: string,
    senderId: string | UniqueId
  ) {
    super(teamId);
    
    this.teamId = teamId instanceof UniqueId ? teamId : new UniqueId(teamId);
    this.inviteeEmail = inviteeEmail;
    this.senderId = senderId instanceof UniqueId ? senderId : new UniqueId(senderId);
    
    this.data = {
      teamId: this.teamId.toString(),
      inviteeEmail: this.inviteeEmail,
      senderId: this.senderId.toString(),
      sentAt: new Date().toISOString()
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

  constructor(
    teamId: string | UniqueId,
    inviteeEmail: string,
    inviteeId: string | UniqueId
  ) {
    super(teamId);
    
    this.teamId = teamId instanceof UniqueId ? teamId : new UniqueId(teamId);
    this.inviteeEmail = inviteeEmail;
    this.inviteeId = inviteeId instanceof UniqueId ? inviteeId : new UniqueId(inviteeId);
    
    this.data = {
      teamId: this.teamId.toString(),
      inviteeEmail: this.inviteeEmail,
      inviteeId: this.inviteeId.toString(),
      acceptedAt: new Date().toISOString()
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

  constructor(
    teamId: string | UniqueId,
    inviteeEmail: string
  ) {
    super(teamId);
    
    this.teamId = teamId instanceof UniqueId ? teamId : new UniqueId(teamId);
    this.inviteeEmail = inviteeEmail;
    
    this.data = {
      teamId: this.teamId.toString(),
      inviteeEmail: this.inviteeEmail,
      declinedAt: new Date().toISOString()
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
