import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { OrganizationRole } from '../value-objects/OrganizationRole';
import { IDomainEvent } from '@/shared/domain/IDomainEvent';

/**
 * @deprecated Använd standardiserade OrganizationCreatedEvent istället
 * @see OrganizationCreatedEvent
 */
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

/**
 * @deprecated Använd standardiserade OrganizationUpdatedEvent istället
 * @see OrganizationUpdatedEvent
 */
export class OrganizationUpdated implements IDomainEvent {
  constructor(
    public readonly organizationId: UniqueId,
    public readonly name: string
  ) {}
}

/**
 * @deprecated Använd standardiserade OrganizationMemberJoinedEvent istället
 * @see OrganizationMemberJoinedEvent
 */
export class MemberJoinedOrganization implements IDomainEvent {
  constructor(
    public readonly organizationId: UniqueId,
    public readonly userId: UniqueId,
    public readonly role: OrganizationRole
  ) {}
}

/**
 * @deprecated Använd standardiserade OrganizationMemberLeftEvent istället
 * @see OrganizationMemberLeftEvent
 */
export class MemberLeftOrganization implements IDomainEvent {
  constructor(
    public readonly organizationId: UniqueId,
    public readonly userId: UniqueId
  ) {}
}

/**
 * @deprecated Använd standardiserade OrganizationMemberInvitedEvent istället
 * @see OrganizationMemberInvitedEvent
 */
export class MemberInvitedToOrganization implements IDomainEvent {
  constructor(
    public readonly organizationId: UniqueId,
    public readonly userId: UniqueId,
    public readonly invitedBy: UniqueId
  ) {}
}

/**
 * @deprecated Använd standardiserade OrganizationInvitationAcceptedEvent istället
 * @see OrganizationInvitationAcceptedEvent
 */
export class OrganizationInvitationAccepted implements IDomainEvent {
  constructor(
    public readonly organizationId: UniqueId,
    public readonly invitationId: UniqueId,
    public readonly userId: UniqueId
  ) {}
}

/**
 * @deprecated Använd standardiserade OrganizationInvitationDeclinedEvent istället
 * @see OrganizationInvitationDeclinedEvent
 */
export class OrganizationInvitationDeclined implements IDomainEvent {
  constructor(
    public readonly organizationId: UniqueId,
    public readonly invitationId: UniqueId,
    public readonly userId: UniqueId
  ) {}
}

/**
 * @deprecated Använd standardiserade OrganizationMemberRoleChangedEvent istället
 * @see OrganizationMemberRoleChangedEvent
 */
export class OrganizationMemberRoleChanged implements IDomainEvent {
  constructor(
    public readonly organizationId: UniqueId,
    public readonly userId: UniqueId,
    public readonly oldRole: OrganizationRole,
    public readonly newRole: OrganizationRole
  ) {}
}

/**
 * @deprecated Använd standardiserade TeamAddedToOrganizationEvent istället
 * @see TeamAddedToOrganizationEvent
 */
export class TeamAddedToOrganization implements IDomainEvent {
  constructor(
    public readonly organizationId: UniqueId,
    public readonly teamId: UniqueId
  ) {}
}

/**
 * @deprecated Använd standardiserade TeamRemovedFromOrganizationEvent istället
 * @see TeamRemovedFromOrganizationEvent
 */
export class TeamRemovedFromOrganization implements IDomainEvent {
  constructor(
    public readonly organizationId: UniqueId,
    public readonly teamId: UniqueId
  ) {}
} 