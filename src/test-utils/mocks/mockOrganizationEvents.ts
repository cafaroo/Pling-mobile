/**
 * Mock-implementationer av Organization-relaterade events för testning
 */
import { UniqueId } from '@/shared/core/UniqueId';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';
import { OrganizationRole } from '@/domain/organization/value-objects/OrganizationRole';

/**
 * Base class för alla mock-organization events
 */
export class BaseMockOrganizationEvent implements IDomainEvent {
  public readonly aggregateId: string;
  public readonly eventId: UniqueId;
  public readonly dateTimeOccurred: Date;
  public readonly occurredAt: Date; // Krävs av IDomainEvent
  public readonly eventType: string = 'BaseMockOrganizationEvent'; // Standardvärde som överrids av subklasser

  constructor(organizationId: string | UniqueId) {
    this.aggregateId = organizationId instanceof UniqueId ? organizationId.toString() : organizationId;
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
 * Organization skapades
 */
export class OrganizationCreatedEvent extends BaseMockOrganizationEvent {
  public readonly eventType = 'OrganizationCreatedEvent';
  public readonly data: {
    organizationId: string;
    name: string;
    ownerId: string;
    createdAt: string;
  };

  // Direkta properties för testning
  public readonly organizationId: UniqueId;
  public readonly name: string;
  public readonly ownerId: UniqueId;

  constructor(props: {
    organizationId: string | UniqueId;
    name: string;
    ownerId: string | UniqueId;
    createdAt: Date;
  }) {
    super(props.organizationId);
    
    this.organizationId = props.organizationId instanceof UniqueId ? props.organizationId : new UniqueId(props.organizationId);
    this.name = props.name;
    this.ownerId = props.ownerId instanceof UniqueId ? props.ownerId : new UniqueId(props.ownerId);
    
    this.data = {
      organizationId: this.organizationId.toString(),
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
 * Organization uppdaterades
 */
export class OrganizationUpdatedEvent extends BaseMockOrganizationEvent {
  public readonly eventType = 'OrganizationUpdatedEvent';
  public readonly data: {
    organizationId: string;
    name: string;
    updatedAt: string;
  };
  
  // Direkta properties för testning
  public readonly organizationId: UniqueId;
  public readonly name: string;

  constructor(organizationId: string | UniqueId, name: string) {
    super(organizationId);
    
    this.organizationId = organizationId instanceof UniqueId ? organizationId : new UniqueId(organizationId);
    this.name = name;
    
    this.data = {
      organizationId: this.organizationId.toString(),
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
 * Medlem anslöt till organization
 */
export class OrganizationMemberJoinedEvent extends BaseMockOrganizationEvent {
  public readonly eventType = 'OrganizationMemberJoinedEvent';
  public readonly data: {
    organizationId: string;
    userId: string;
    role: string;
    joinedAt: string;
  };
  
  // Direkta properties för testning
  public readonly organizationId: UniqueId;
  public readonly userId: UniqueId;
  public readonly role: string;

  constructor(
    organizationId: string | UniqueId,
    userId: string | UniqueId,
    role: string | OrganizationRole
  ) {
    super(organizationId);
    
    this.organizationId = organizationId instanceof UniqueId ? organizationId : new UniqueId(organizationId);
    this.userId = userId instanceof UniqueId ? userId : new UniqueId(userId);
    this.role = role instanceof OrganizationRole ? role.toString() : role;
    
    this.data = {
      organizationId: this.organizationId.toString(),
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
 * Medlem lämnade organization
 */
export class OrganizationMemberLeftEvent extends BaseMockOrganizationEvent {
  public readonly eventType = 'OrganizationMemberLeftEvent';
  public readonly data: {
    organizationId: string;
    userId: string;
    removedAt: string;
  };
  
  // Direkta properties för testning
  public readonly organizationId: UniqueId;
  public readonly userId: UniqueId;

  constructor(organizationId: string | UniqueId, userId: string | UniqueId) {
    super(organizationId);
    
    this.organizationId = organizationId instanceof UniqueId ? organizationId : new UniqueId(organizationId);
    this.userId = userId instanceof UniqueId ? userId : new UniqueId(userId);
    
    this.data = {
      organizationId: this.organizationId.toString(),
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
export class OrganizationMemberRoleChangedEvent extends BaseMockOrganizationEvent {
  public readonly eventType = 'OrganizationMemberRoleChangedEvent';
  public readonly data: {
    organizationId: string;
    userId: string;
    oldRole: string;
    newRole: string;
    changedAt: string;
  };
  
  // Direkta properties för testning
  public readonly organizationId: UniqueId;
  public readonly userId: UniqueId;
  public readonly oldRole: string;
  public readonly newRole: string;

  constructor(
    organizationId: string | UniqueId,
    userId: string | UniqueId,
    oldRole: string | OrganizationRole,
    newRole: string | OrganizationRole
  ) {
    super(organizationId);
    
    this.organizationId = organizationId instanceof UniqueId ? organizationId : new UniqueId(organizationId);
    this.userId = userId instanceof UniqueId ? userId : new UniqueId(userId);
    this.oldRole = oldRole instanceof OrganizationRole ? oldRole.toString() : oldRole;
    this.newRole = newRole instanceof OrganizationRole ? newRole.toString() : newRole;
    
    this.data = {
      organizationId: this.organizationId.toString(),
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
 * Team lades till i organization
 */
export class TeamAddedToOrganizationEvent extends BaseMockOrganizationEvent {
  public readonly eventType = 'TeamAddedToOrganizationEvent';
  public readonly data: {
    organizationId: string;
    teamId: string;
    addedAt: string;
  };
  
  // Direkta properties för testning
  public readonly organizationId: UniqueId;
  public readonly teamId: UniqueId;

  constructor(
    organizationId: string | UniqueId,
    teamId: string | UniqueId
  ) {
    super(organizationId);
    
    this.organizationId = organizationId instanceof UniqueId ? organizationId : new UniqueId(organizationId);
    this.teamId = teamId instanceof UniqueId ? teamId : new UniqueId(teamId);
    
    this.data = {
      organizationId: this.organizationId.toString(),
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
 * Team togs bort från organization
 */
export class TeamRemovedFromOrganizationEvent extends BaseMockOrganizationEvent {
  public readonly eventType = 'TeamRemovedFromOrganizationEvent';
  public readonly data: {
    organizationId: string;
    teamId: string;
    removedAt: string;
  };
  
  // Direkta properties för testning
  public readonly organizationId: UniqueId;
  public readonly teamId: UniqueId;

  constructor(
    organizationId: string | UniqueId,
    teamId: string | UniqueId
  ) {
    super(organizationId);
    
    this.organizationId = organizationId instanceof UniqueId ? organizationId : new UniqueId(organizationId);
    this.teamId = teamId instanceof UniqueId ? teamId : new UniqueId(teamId);
    
    this.data = {
      organizationId: this.organizationId.toString(),
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
 * Organization-inbjudan skickades
 */
export class OrganizationInvitationSentEvent extends BaseMockOrganizationEvent {
  public readonly eventType = 'OrganizationInvitationSentEvent';
  public readonly data: {
    organizationId: string;
    inviteeEmail: string;
    senderId: string;
    sentAt: string;
  };
  
  // Direkta properties för testning
  public readonly organizationId: UniqueId;
  public readonly inviteeEmail: string;
  public readonly senderId: UniqueId;

  constructor(
    organizationId: string | UniqueId,
    inviteeEmail: string,
    senderId: string | UniqueId
  ) {
    super(organizationId);
    
    this.organizationId = organizationId instanceof UniqueId ? organizationId : new UniqueId(organizationId);
    this.inviteeEmail = inviteeEmail;
    this.senderId = senderId instanceof UniqueId ? senderId : new UniqueId(senderId);
    
    this.data = {
      organizationId: this.organizationId.toString(),
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
 * Organization-inbjudan accepterades
 */
export class OrganizationInvitationAcceptedEvent extends BaseMockOrganizationEvent {
  public readonly eventType = 'OrganizationInvitationAcceptedEvent';
  public readonly data: {
    organizationId: string;
    inviteeEmail: string;
    inviteeId: string;
    acceptedAt: string;
  };
  
  // Direkta properties för testning
  public readonly organizationId: UniqueId;
  public readonly inviteeEmail: string;
  public readonly inviteeId: UniqueId;

  constructor(
    organizationId: string | UniqueId,
    inviteeEmail: string,
    inviteeId: string | UniqueId
  ) {
    super(organizationId);
    
    this.organizationId = organizationId instanceof UniqueId ? organizationId : new UniqueId(organizationId);
    this.inviteeEmail = inviteeEmail;
    this.inviteeId = inviteeId instanceof UniqueId ? inviteeId : new UniqueId(inviteeId);
    
    this.data = {
      organizationId: this.organizationId.toString(),
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
 * Organization-inbjudan avböjdes
 */
export class OrganizationInvitationDeclinedEvent extends BaseMockOrganizationEvent {
  public readonly eventType = 'OrganizationInvitationDeclinedEvent';
  public readonly data: {
    organizationId: string;
    inviteeEmail: string;
    declinedAt: string;
  };
  
  // Direkta properties för testning
  public readonly organizationId: UniqueId;
  public readonly inviteeEmail: string;

  constructor(
    organizationId: string | UniqueId,
    inviteeEmail: string
  ) {
    super(organizationId);
    
    this.organizationId = organizationId instanceof UniqueId ? organizationId : new UniqueId(organizationId);
    this.inviteeEmail = inviteeEmail;
    
    this.data = {
      organizationId: this.organizationId.toString(),
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