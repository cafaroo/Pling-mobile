import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { TeamRole } from '../value-objects/TeamRole';

export class MemberJoined extends DomainEvent {
  constructor(
    public readonly teamId: UniqueId,
    public readonly userId: UniqueId,
    public readonly role: TeamRole
  ) {
    super({
      name: 'MemberJoined',
      payload: {
        teamId: teamId.toString(),
        userId: userId.toString(),
        role: role,
        timestamp: new Date()
      }
    });
  }
}

export class MemberLeft extends DomainEvent {
  constructor(
    public readonly teamId: UniqueId,
    public readonly userId: UniqueId
  ) {
    super({
      name: 'MemberLeft',
      payload: {
        teamId: teamId.toString(),
        userId: userId.toString(),
        timestamp: new Date()
      }
    });
  }
}

export class TeamMemberRoleChanged extends DomainEvent {
  constructor(
    public readonly teamId: UniqueId,
    public readonly userId: UniqueId,
    public readonly oldRole: TeamRole,
    public readonly newRole: TeamRole
  ) {
    super({
      name: 'TeamMemberRoleChanged',
      payload: {
        teamId: teamId.toString(),
        userId: userId.toString(),
        oldRole: oldRole,
        newRole: newRole,
        timestamp: new Date()
      }
    });
  }
}

export class TeamCreated extends DomainEvent {
  constructor(
    public readonly teamId: UniqueId,
    public readonly ownerId: UniqueId,
    public readonly name: string
  ) {
    super({
      name: 'TeamCreated',
      payload: {
        teamId: teamId.toString(),
        ownerId: ownerId.toString(),
        name: name,
        timestamp: new Date()
      }
    });
  }
}

export class TeamUpdated extends DomainEvent {
  constructor(
    public readonly teamId: UniqueId,
    public readonly name: string
  ) {
    super({
      name: 'TeamUpdated',
      payload: {
        teamId: teamId.toString(),
        name: name,
        timestamp: new Date()
      }
    });
  }
} 