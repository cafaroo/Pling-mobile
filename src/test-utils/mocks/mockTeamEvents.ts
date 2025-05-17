/**
 * Mock-versioner av Team-event för testning
 */
import { UniqueId } from '@/shared/core/UniqueId';
import { TeamRole } from '@/domain/team/value-objects/TeamRole';
import { Team } from '@/domain/team/entities/Team';

/**
 * Mock-version av TeamMemberJoinedEvent
 */
export class TeamMemberJoinedEvent {
  public readonly eventType: string = 'TeamMemberJoinedEvent';
  public readonly dateTimeOccurred: Date;
  public readonly teamId: UniqueId;
  public readonly userId: UniqueId;
  public readonly role: TeamRole | string;

  constructor(
    team: Team | { id: UniqueId },
    userId: UniqueId,
    role: TeamRole | string
  ) {
    this.dateTimeOccurred = new Date();
    this.teamId = team.id;
    this.userId = userId;
    this.role = role;
  }

  get aggregateId(): string {
    return this.teamId.toString();
  }
}

/**
 * Mock-version av TeamMemberLeftEvent
 */
export class TeamMemberLeftEvent {
  public readonly eventType: string = 'TeamMemberLeftEvent';
  public readonly dateTimeOccurred: Date;
  public readonly teamId: UniqueId;
  public readonly userId: UniqueId;

  constructor(
    team: Team | { id: UniqueId },
    userId: UniqueId
  ) {
    this.dateTimeOccurred = new Date();
    this.teamId = team.id;
    this.userId = userId;
  }

  get aggregateId(): string {
    return this.teamId.toString();
  }
}

/**
 * Mock-version av TeamMemberRoleChangedEvent
 */
export class TeamMemberRoleChangedEvent {
  public readonly eventType: string = 'TeamMemberRoleChangedEvent';
  public readonly dateTimeOccurred: Date;
  public readonly teamId: UniqueId;
  public readonly userId: UniqueId;
  public readonly oldRole: TeamRole | string;
  public readonly newRole: TeamRole | string;

  constructor(
    team: Team | { id: UniqueId },
    userId: UniqueId,
    oldRole: TeamRole | string,
    newRole: TeamRole | string
  ) {
    this.dateTimeOccurred = new Date();
    this.teamId = team.id;
    this.userId = userId;
    this.oldRole = oldRole;
    this.newRole = newRole;
  }

  get aggregateId(): string {
    return this.teamId.toString();
  }
}

/**
 * Mock-version av TeamUpdatedEvent
 */
export class TeamUpdatedEvent {
  public readonly eventType: string = 'TeamUpdatedEvent';
  public readonly dateTimeOccurred: Date;
  public readonly teamId: UniqueId;
  public readonly name: string;

  constructor(
    teamId: UniqueId,
    name: string
  ) {
    this.dateTimeOccurred = new Date();
    this.teamId = teamId;
    this.name = name;
  }

  get aggregateId(): string {
    return this.teamId.toString();
  }

  get payload() {
    return {
      name: this.name
    };
  }
} 