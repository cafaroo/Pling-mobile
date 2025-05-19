import { UniqueId } from '@/shared/core/UniqueId';
import { TeamRole, TeamRoleEnum } from './TeamRole';
import { ValueObject } from '@/shared/domain/ValueObject';
import { Result, ok, err } from '@/shared/core/Result';

interface TeamMemberProps {
  userId: UniqueId;
  role: TeamRole;
  joinedAt: Date;
  isApproved?: boolean;
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
  
  get isApproved(): boolean {
    return this.props.isApproved ?? true;
  }

  public static create(props: {
    userId: string | UniqueId;
    role: TeamRole | TeamRoleEnum | string | null | undefined;
    joinedAt?: Date;
    isApproved?: boolean;
  }): Result<TeamMember, string> {
    try {
      const userId = UniqueId.from(props.userId);
      
      // Hantera rollen baserat på olika indata-typer med bättre felhantering
      let role: TeamRole;
      
      // Specialhantering för null/undefined roller - använd MEMBER som standard
      if (props.role === null || props.role === undefined) {
        role = TeamRole.MEMBER;
      } 
      // Om role redan är ett TeamRole-objekt
      else if (props.role instanceof TeamRole) {
        role = props.role;
      } 
      // Konvertera till TeamRole om det är ett enum-värde eller sträng
      else {
        const roleResult = TeamRole.create(props.role);
        if (roleResult.isErr()) {
          return err(`Ogiltig roll: ${roleResult.error}`);
        }
        role = roleResult.value;
      }

      return ok(new TeamMember({
        userId,
        role,
        joinedAt: props.joinedAt || new Date(),
        isApproved: props.isApproved
      }));
    } catch (error) {
      return err(`Kunde inte skapa teammedlem: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public equals(other: TeamMember): boolean {
    return this.props.userId.equals(other.props.userId);
  }

  public canInviteMembers(): boolean {
    return this.props.role.equalsValue(TeamRoleEnum.OWNER) || this.props.role.equalsValue(TeamRoleEnum.ADMIN);
  }

  public canRemoveMembers(): boolean {
    return this.props.role.equalsValue(TeamRoleEnum.OWNER) || this.props.role.equalsValue(TeamRoleEnum.ADMIN);
  }

  public canEditTeam(): boolean {
    return this.props.role.equalsValue(TeamRoleEnum.OWNER);
  }

  public canManageRoles(): boolean {
    return this.props.role.equalsValue(TeamRoleEnum.OWNER);
  }

  public toJSON() {
    return {
      userId: this.props.userId.toString(),
      role: this.props.role.toString(),
      joinedAt: this.props.joinedAt.toISOString(),
      isApproved: this.isApproved
    };
  }
} 