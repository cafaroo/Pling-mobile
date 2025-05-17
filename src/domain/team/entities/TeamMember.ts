import { ValueObject } from '@/shared/domain/ValueObject';
import { UniqueId } from '@/shared/domain/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';
import { TeamRole, parseTeamRole } from '../value-objects/TeamRole';
import { TeamError } from '../errors/TeamError';

interface TeamMemberProps {
  userId: UniqueId;
  role: string;
  joinedAt: Date;
}

export class TeamMember extends ValueObject<TeamMemberProps> {
  private constructor(props: TeamMemberProps) {
    super(props);
  }

  get userId(): UniqueId {
    return this.props.userId;
  }

  get role(): string {
    return this.props.role;
  }

  get joinedAt(): Date {
    return new Date(this.props.joinedAt);
  }

  public static create(props: TeamMemberProps): Result<TeamMember, TeamError> {
    try {
      // Validera att rollen är giltig med parseTeamRole
      const roleResult = parseTeamRole(props.role);
      if (roleResult.isErr()) {
        return err(new TeamError.InvalidRole(props.role));
      }
      
      return ok(new TeamMember(props));
    } catch (error) {
      return err(error as Error);
    }
  }

  public equals(other: TeamMember): boolean {
    return this.props.userId.equals(other.props.userId);
  }

  public canInviteMembers(): boolean {
    return ['owner', 'admin'].includes(this.props.role);
  }

  public canRemoveMembers(): boolean {
    return ['owner', 'admin'].includes(this.props.role);
  }

  public canEditTeam(): boolean {
    return this.props.role === 'owner';
  }

  public canManageRoles(): boolean {
    return this.props.role === 'owner';
  }
} 