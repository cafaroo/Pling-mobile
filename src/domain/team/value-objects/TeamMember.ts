import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { TeamRole } from './TeamRole';

export interface TeamMemberProps {
  userId: UniqueId;
  role: TeamRole;
  joinedAt: Date;
}

export class TeamMember {
  private constructor(private readonly props: TeamMemberProps) {}

  get userId(): UniqueId {
    return this.props.userId;
  }

  get role(): TeamRole {
    return this.props.role;
  }

  get joinedAt(): Date {
    return new Date(this.props.joinedAt);
  }

  public static create(props: TeamMemberProps): Result<TeamMember, string> {
    try {
      // Validera userId
      if (!props.userId) {
        return err('UserId måste anges');
      }

      // Validera role
      if (!Object.values(TeamRole).includes(props.role)) {
        return err(`Ogiltig roll: ${props.role}`);
      }

      // Validera joinedAt
      if (!(props.joinedAt instanceof Date) || isNaN(props.joinedAt.getTime())) {
        return err('Ogiltigt anslutningsdatum');
      }

      return ok(new TeamMember(props));
    } catch (error) {
      return err(`Kunde inte skapa teammedlem: ${error.message}`);
    }
  }

  public equals(other: TeamMember): boolean {
    return this.props.userId.toString() === other.props.userId.toString();
  }

  public hasRole(role: TeamRole): boolean {
    return this.props.role === role;
  }

  public toJSON() {
    return {
      userId: this.props.userId.toString(),
      role: this.props.role,
      joinedAt: this.props.joinedAt.toISOString()
    };
  }
} 