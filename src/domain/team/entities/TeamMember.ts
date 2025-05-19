import { ValueObject } from '@/shared/domain/ValueObject';
import { UniqueId } from '@/shared/domain/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';
import { TeamRole, parseTeamRole } from '../value-objects/TeamRole';
import { TeamError } from '../errors/TeamError';

interface TeamMemberProps {
  userId: UniqueId;
  role: TeamRole | string;
  joinedAt: Date;
}

export class TeamMember extends ValueObject<TeamMemberProps> {
  private constructor(props: TeamMemberProps) {
    super(props);
  }

  get userId(): UniqueId {
    return this.props.userId;
  }

  get role(): TeamRole | string {
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
        return err(new TeamError.InvalidRole(String(props.role)));
      }
      
      // Använd det parsade TeamRole-objektet
      const normalizedProps = {
        ...props,
        role: roleResult.value
      };
      
      return ok(new TeamMember(normalizedProps));
    } catch (error) {
      return err(error as Error);
    }
  }

  public equals(other: TeamMember): boolean {
    return this.props.userId.equals(other.props.userId);
  }

  public canInviteMembers(): boolean {
    const roleValue = typeof this.props.role === 'string' 
      ? this.props.role.toLowerCase() 
      : this.props.role.value;
    return ['owner', 'admin'].includes(roleValue);
  }

  public canRemoveMembers(): boolean {
    const roleValue = typeof this.props.role === 'string' 
      ? this.props.role.toLowerCase() 
      : this.props.role.value;
    return ['owner', 'admin'].includes(roleValue);
  }

  public canEditTeam(): boolean {
    const roleValue = typeof this.props.role === 'string' 
      ? this.props.role.toLowerCase() 
      : this.props.role.value;
    return roleValue === 'owner';
  }

  public canManageRoles(): boolean {
    const roleValue = typeof this.props.role === 'string' 
      ? this.props.role.toLowerCase() 
      : this.props.role.value;
    return roleValue === 'owner';
  }
} 