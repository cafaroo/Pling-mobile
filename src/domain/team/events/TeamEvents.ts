import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { TeamRole } from '../value-objects/TeamRole';

/**
 * BasTeamEvent
 * Abstrakt basklass för alla team-relaterade domänevents
 */
abstract class BaseTeamEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly occurredAt: Date;
  public readonly eventType: string;
  public readonly aggregateId: string;

  constructor(eventType: string, teamId: UniqueId) {
    this.eventId = new UniqueId();
    this.occurredAt = new Date();
    this.eventType = eventType;
    this.aggregateId = teamId.toString();
  }
}

export class MemberJoined extends BaseTeamEvent {
  constructor(
    public readonly teamId: UniqueId,
    public readonly userId: UniqueId,
    public readonly role: TeamRole
  ) {
    super('MemberJoined', teamId);
  }
}

export class MemberLeft extends BaseTeamEvent {
  constructor(
    public readonly teamId: UniqueId,
    public readonly userId: UniqueId
  ) {
    super('MemberLeft', teamId);
  }
}

export class TeamMemberRoleChanged extends BaseTeamEvent {
  constructor(
    public readonly teamId: UniqueId,
    public readonly userId: UniqueId,
    public readonly oldRole: TeamRole,
    public readonly newRole: TeamRole
  ) {
    super('TeamMemberRoleChanged', teamId);
  }
}

export class TeamCreated extends BaseTeamEvent {
  constructor(
    public readonly teamId: UniqueId,
    public readonly ownerId: UniqueId,
    public readonly name: string
  ) {
    super('TeamCreated', teamId);
  }
}

export class TeamUpdated extends BaseTeamEvent {
  constructor(
    public readonly teamId: UniqueId,
    public readonly name: string
  ) {
    super('TeamUpdated', teamId);
  }
} 