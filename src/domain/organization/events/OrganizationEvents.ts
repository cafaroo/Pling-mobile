import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { OrganizationRole } from '../value-objects/OrganizationRole';

export class OrganizationCreated extends DomainEvent {
  constructor(
    public readonly organizationId: UniqueId,
    public readonly ownerId: UniqueId,
    public readonly name: string
  ) {
    super({
      name: 'OrganizationCreated',
      payload: {
        organizationId: organizationId.toString(),
        ownerId: ownerId.toString(),
        name: name,
        timestamp: new Date()
      }
    });
  }
}

export class OrganizationUpdated extends DomainEvent {
  constructor(
    public readonly organizationId: UniqueId,
    public readonly name: string
  ) {
    super({
      name: 'OrganizationUpdated',
      payload: {
        organizationId: organizationId.toString(),
        name: name,
        timestamp: new Date()
      }
    });
  }
}

export class MemberJoinedOrganization extends DomainEvent {
  constructor(
    public readonly organizationId: UniqueId,
    public readonly userId: UniqueId,
    public readonly role: OrganizationRole
  ) {
    super({
      name: 'MemberJoinedOrganization',
      payload: {
        organizationId: organizationId.toString(),
        userId: userId.toString(),
        role: role,
        timestamp: new Date().toISOString()
      }
    });
    
    // Utlös händelsen
    this.dispatch();
  }
}

export class MemberLeftOrganization extends DomainEvent {
  constructor(
    public readonly organizationId: UniqueId,
    public readonly userId: UniqueId
  ) {
    super({
      name: 'MemberLeftOrganization',
      payload: {
        organizationId: organizationId.toString(),
        userId: userId.toString(),
        timestamp: new Date().toISOString()
      }
    });
    
    // Utlös händelsen
    this.dispatch();
  }
}

/**
 * Händelse som utlöses när en medlemsinbjudan skapas
 */
export class MemberInvitedToOrganization extends DomainEvent {
  constructor(
    public readonly organizationId: UniqueId,
    public readonly userId: UniqueId,
    public readonly invitedBy: UniqueId
  ) {
    super({
      name: 'MemberInvitedToOrganization',
      payload: {
        organizationId: organizationId.toString(),
        userId: userId.toString(),
        invitedBy: invitedBy.toString(),
        timestamp: new Date().toISOString()
      }
    });
    
    // Utlös händelsen
    this.dispatch();
  }
}

/**
 * Händelse som utlöses när en inbjudan accepteras
 */
export class OrganizationInvitationAccepted extends DomainEvent {
  constructor(
    public readonly organizationId: UniqueId,
    public readonly invitationId: UniqueId,
    public readonly userId: UniqueId
  ) {
    super({
      name: 'OrganizationInvitationAccepted',
      payload: {
        organizationId: organizationId.toString(),
        invitationId: invitationId.toString(),
        userId: userId.toString(),
        timestamp: new Date().toISOString()
      }
    });
    
    // Utlös händelsen
    this.dispatch();
  }
}

/**
 * Händelse som utlöses när en inbjudan avböjs
 */
export class OrganizationInvitationDeclined extends DomainEvent {
  constructor(
    public readonly organizationId: UniqueId,
    public readonly invitationId: UniqueId,
    public readonly userId: UniqueId
  ) {
    super({
      name: 'OrganizationInvitationDeclined',
      payload: {
        organizationId: organizationId.toString(),
        invitationId: invitationId.toString(),
        userId: userId.toString(),
        timestamp: new Date().toISOString()
      }
    });
    
    // Utlös händelsen
    this.dispatch();
  }
}

export class OrganizationMemberRoleChanged extends DomainEvent {
  constructor(
    public readonly organizationId: UniqueId,
    public readonly userId: UniqueId,
    public readonly oldRole: OrganizationRole,
    public readonly newRole: OrganizationRole
  ) {
    super({
      name: 'OrganizationMemberRoleChanged',
      payload: {
        organizationId: organizationId.toString(),
        userId: userId.toString(),
        oldRole: oldRole,
        newRole: newRole,
        timestamp: new Date().toISOString()
      }
    });
    
    // Utlös händelsen
    this.dispatch();
  }
}

export class TeamAddedToOrganization extends DomainEvent {
  constructor(
    public readonly organizationId: UniqueId,
    public readonly teamId: UniqueId
  ) {
    super({
      name: 'TeamAddedToOrganization',
      payload: {
        organizationId: organizationId.toString(),
        teamId: teamId.toString(),
        timestamp: new Date().toISOString()
      }
    });
    
    // Utlös händelsen
    this.dispatch();
  }
}

export class TeamRemovedFromOrganization extends DomainEvent {
  constructor(
    public readonly organizationId: UniqueId,
    public readonly teamId: UniqueId
  ) {
    super({
      name: 'TeamRemovedFromOrganization',
      payload: {
        organizationId: organizationId.toString(),
        teamId: teamId.toString(),
        timestamp: new Date().toISOString()
      }
    });
    
    // Utlös händelsen
    this.dispatch();
  }
} 