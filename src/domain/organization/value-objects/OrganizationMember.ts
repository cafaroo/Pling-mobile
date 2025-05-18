import { ValueObject } from '@/shared/core/ValueObject';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';
import { OrganizationRole, OrganizationRoleEnum } from './OrganizationRole';
import { OrganizationPermission } from './OrganizationPermission';

interface OrganizationMemberProps {
  userId: UniqueId;
  role: OrganizationRole;
  joinedAt: Date;
}

export class OrganizationMember extends ValueObject<OrganizationMemberProps> {
  private constructor(props: OrganizationMemberProps) {
    super(props);
  }

  get userId(): UniqueId {
    return this.props.userId;
  }

  get role(): OrganizationRole {
    return this.props.role;
  }

  get joinedAt(): Date {
    return new Date(this.props.joinedAt);
  }

  public static create(props: {
    userId: string | UniqueId;
    role: OrganizationRole | OrganizationRoleEnum | string;
    joinedAt?: Date;
  }): Result<OrganizationMember, string> {
    try {
      const userId = props.userId instanceof UniqueId
        ? props.userId
        : new UniqueId(props.userId);

      // Hantera rollen baserat på olika indata-typer
      let role: OrganizationRole;
      if (props.role instanceof OrganizationRole) {
        // Om role redan är ett OrganizationRole-objekt
        role = props.role;
      } else {
        // Konvertera till OrganizationRole om det är ett enum-värde eller sträng
        const roleResult = OrganizationRole.create(props.role);
        if (roleResult.isErr()) {
          return err(`Ogiltig roll: ${roleResult.error}`);
        }
        role = roleResult.value;
      }

      return ok(new OrganizationMember({
        userId,
        role,
        joinedAt: props.joinedAt || new Date()
      }));
    } catch (error) {
      return err(`Kunde inte skapa organisationsmedlem: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public equals(other: OrganizationMember): boolean {
    return this.props.userId.equals(other.props.userId);
  }

  public canInviteMembers(): boolean {
    return this.props.role.equalsValue(OrganizationRoleEnum.OWNER) || 
           this.props.role.equalsValue(OrganizationRoleEnum.ADMIN);
  }

  public canRemoveMembers(): boolean {
    return this.props.role.equalsValue(OrganizationRoleEnum.OWNER) || 
           this.props.role.equalsValue(OrganizationRoleEnum.ADMIN);
  }

  public canEditOrganization(): boolean {
    return this.props.role.equalsValue(OrganizationRoleEnum.OWNER) || 
           this.props.role.equalsValue(OrganizationRoleEnum.ADMIN);
  }

  public canManageRoles(): boolean {
    return this.props.role.equalsValue(OrganizationRoleEnum.OWNER);
  }

  public canManageTeams(): boolean {
    return this.props.role.equalsValue(OrganizationRoleEnum.OWNER) || 
           this.props.role.equalsValue(OrganizationRoleEnum.ADMIN);
  }

  public hasPermission(permission: OrganizationPermission): boolean {
    switch (permission) {
      case OrganizationPermission.MANAGE_ORGANIZATION:
        return this.props.role.equalsValue(OrganizationRoleEnum.OWNER);
        
      case OrganizationPermission.MANAGE_MEMBERS:
      case OrganizationPermission.INVITE_MEMBERS:
      case OrganizationPermission.REMOVE_MEMBERS:
      case OrganizationPermission.EDIT_ORGANIZATION:
      case OrganizationPermission.MANAGE_TEAMS:
        return this.props.role.equalsValue(OrganizationRoleEnum.OWNER) || 
               this.props.role.equalsValue(OrganizationRoleEnum.ADMIN);
               
      case OrganizationPermission.MANAGE_ROLES:
        return this.props.role.equalsValue(OrganizationRoleEnum.OWNER);
        
      case OrganizationPermission.VIEW_ORGANIZATION:
        return this.props.role.equalsValue(OrganizationRoleEnum.OWNER) || 
               this.props.role.equalsValue(OrganizationRoleEnum.ADMIN) || 
               this.props.role.equalsValue(OrganizationRoleEnum.MEMBER);
               
      case OrganizationPermission.JOIN_ORGANIZATION:
        return this.props.role.equalsValue(OrganizationRoleEnum.INVITED);
        
      default:
        return false;
    }
  }

  public toJSON() {
    return {
      userId: this.props.userId.toString(),
      role: this.props.role.toString(),
      joinedAt: this.props.joinedAt.toISOString()
    };
  }
} 