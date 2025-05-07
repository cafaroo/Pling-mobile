import { AggregateRoot } from '@/shared/domain/AggregateRoot';
import { UniqueId } from '@/shared/domain/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';
import { TeamMember } from './TeamMember';
import { TeamName } from '../value-objects/TeamName';
import { TeamDescription } from '../value-objects/TeamDescription';
import { TeamRole } from '../value-objects/TeamRole';
import { TeamError } from '../errors/TeamError';
import { Guard } from '@/shared/core/Guard';

interface TeamProps {
  id?: UniqueId;
  name: TeamName;
  description?: TeamDescription;
  ownerId: UniqueId;
  members: TeamMember[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class Team extends AggregateRoot {
  private readonly _name: TeamName;
  private readonly _description?: TeamDescription;
  private readonly _ownerId: UniqueId;
  private readonly _members: TeamMember[];
  private readonly _createdAt: Date;
  private readonly _updatedAt: Date;

  private constructor(props: TeamProps) {
    super(props.id);
    this._name = props.name;
    this._description = props.description;
    this._ownerId = props.ownerId;
    this._members = props.members;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  get name(): string { return this._name.value; }
  get description(): string | undefined { return this._description?.value; }
  get ownerId(): UniqueId { return this._ownerId; }
  get members(): TeamMember[] { return [...this._members]; }
  get createdAt(): Date { return new Date(this._createdAt); }
  get updatedAt(): Date { return new Date(this._updatedAt); }

  public static create(props: TeamProps): Result<Team, TeamError> {
    const guardResult = Guard.againstNullOrUndefined(props.ownerId, 'ownerId');
    if (!guardResult.succeeded) {
      return err(new TeamError.InvalidOwner());
    }

    // Validera att ägaren finns med som medlem
    const ownerMember = props.members.find(m => 
      m.userId.equals(props.ownerId) && m.role === TeamRole.OWNER
    );
    
    if (!ownerMember) {
      props.members.push(TeamMember.create({
        userId: props.ownerId,
        role: TeamRole.OWNER,
        joinedAt: props.createdAt || new Date()
      }).value as TeamMember);
    }

    return ok(new Team(props));
  }

  public addMember(member: TeamMember): Result<void, TeamError> {
    if (this.hasMember(member.userId)) {
      return err(new TeamError.MemberAlreadyExists());
    }

    if (member.role === TeamRole.OWNER && !member.userId.equals(this._ownerId)) {
      return err(new TeamError.OnlyOneOwnerAllowed());
    }

    this._members.push(member);
    return ok(undefined);
  }

  public updateMemberRole(userId: UniqueId, newRole: TeamRole): Result<void, TeamError> {
    const member = this._members.find(m => m.userId.equals(userId));
    if (!member) {
      return err(new TeamError.MemberNotFound());
    }

    if (member.role === TeamRole.OWNER) {
      return err(new TeamError.CannotChangeOwnerRole());
    }

    if (newRole === TeamRole.OWNER) {
      return err(new TeamError.OnlyOneOwnerAllowed());
    }

    const index = this._members.indexOf(member);
    this._members[index] = TeamMember.create({
      userId: member.userId,
      role: newRole,
      joinedAt: member.joinedAt
    }).value as TeamMember;

    return ok(undefined);
  }

  public removeMember(userId: UniqueId): Result<void, TeamError> {
    const member = this._members.find(m => m.userId.equals(userId));
    if (!member) {
      return err(new TeamError.MemberNotFound());
    }

    if (member.role === TeamRole.OWNER) {
      return err(new TeamError.CannotRemoveOwner());
    }

    this._members.splice(this._members.indexOf(member), 1);
    return ok(undefined);
  }

  private hasMember(userId: UniqueId): boolean {
    return this._members.some(m => m.userId.equals(userId));
  }

  public canManageMembers(userId: UniqueId): boolean {
    const member = this._members.find(m => m.userId.equals(userId));
    return member?.role === TeamRole.OWNER || member?.role === TeamRole.ADMIN;
  }

  public toJSON() {
    return {
      id: this.id.toString(),
      name: this.name,
      description: this.description,
      ownerId: this.ownerId.toString(),
      members: this.members.map(m => ({
        userId: m.userId.toString(),
        role: m.role,
        joinedAt: m.joinedAt.toISOString()
      })),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }
} 