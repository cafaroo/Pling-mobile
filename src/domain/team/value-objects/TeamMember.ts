import { ValueObject } from '../../../shared/core/ValueObject';
import { UniqueId } from '../../../shared/core/UniqueId';
import { Result, ok, err } from '../../../shared/core/Result';
import { TeamRole } from './TeamRole';

interface TeamMemberProps {
  userId: UniqueId;
  role: TeamRole;
  joinedAt: Date;
}

export class TeamMember extends ValueObject<TeamMemberProps> {
  private constructor(props: TeamMemberProps) {
    super(props);
  }

  get userId(): UniqueId {
    return this.props.userId;
  }

  get role(): TeamRole {
    return this.props.role;
  }

  get joinedAt(): Date {
    return new Date(this.props.joinedAt);
  }

  public static create(props: {
    userId: string | UniqueId;
    role: TeamRole;
    joinedAt: Date;
  }): Result<TeamMember, string> {
    try {
      const userId = props.userId instanceof UniqueId
        ? props.userId
        : new UniqueId(props.userId);

      return ok(new TeamMember({
        userId,
        role: props.role,
        joinedAt: props.joinedAt
      }));
    } catch (error) {
      return err(`Kunde inte skapa teammedlem: ${error.message}`);
    }
  }

  public equals(other: TeamMember): boolean {
    return this.props.userId.equals(other.props.userId);
  }

  public canInviteMembers(): boolean {
    return [TeamRole.OWNER, TeamRole.ADMIN].includes(this.props.role);
  }

  public canRemoveMembers(): boolean {
    return [TeamRole.OWNER, TeamRole.ADMIN].includes(this.props.role);
  }

  public canEditTeam(): boolean {
    return this.props.role === TeamRole.OWNER;
  }

  public canManageRoles(): boolean {
    return this.props.role === TeamRole.OWNER;
  }

  public toJSON() {
    return {
      userId: this.props.userId.toString(),
      role: this.props.role,
      joinedAt: this.props.joinedAt.toISOString()
    };
  }
} 