import { ValueObject } from '@/shared/core/ValueObject';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';
import { OrganizationRole } from './OrganizationRole';
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
    role: OrganizationRole;
    joinedAt: Date;
  }): Result<OrganizationMember, string> {
    try {
      const userId = props.userId instanceof UniqueId
        ? props.userId
        : new UniqueId(props.userId);

      return ok(new OrganizationMember({
        userId,
        role: props.role,
        joinedAt: props.joinedAt
      }));
    } catch (error) {
      return err(`Kunde inte skapa organisationsmedlem: ${error.message}`);
    }
  }

  public equals(other: OrganizationMember): boolean {
    return this.props.userId.equals(other.props.userId);
  }

  public canInviteMembers(): boolean {
    return [OrganizationRole.OWNER, OrganizationRole.ADMIN].includes(this.props.role);
  }

  public canRemoveMembers(): boolean {
    return [OrganizationRole.OWNER, OrganizationRole.ADMIN].includes(this.props.role);
  }

  public canEditOrganization(): boolean {
    return [OrganizationRole.OWNER, OrganizationRole.ADMIN].includes(this.props.role);
  }

  public canManageRoles(): boolean {
    return this.props.role === OrganizationRole.OWNER;
  }

  public canManageTeams(): boolean {
    return [OrganizationRole.OWNER, OrganizationRole.ADMIN].includes(this.props.role);
  }

  public hasPermission(permission: OrganizationPermission): boolean {
    switch (permission) {
      case OrganizationPermission.MANAGE_ORGANIZATION:
        return this.props.role === OrganizationRole.OWNER;
      case OrganizationPermission.MANAGE_MEMBERS:
      case OrganizationPermission.INVITE_MEMBERS:
      case OrganizationPermission.REMOVE_MEMBERS:
      case OrganizationPermission.EDIT_ORGANIZATION:
      case OrganizationPermission.MANAGE_TEAMS:
        return [OrganizationRole.OWNER, OrganizationRole.ADMIN].includes(this.props.role);
      case OrganizationPermission.MANAGE_ROLES:
        return this.props.role === OrganizationRole.OWNER;
      case OrganizationPermission.VIEW_ORGANIZATION:
        return [OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.MEMBER].includes(this.props.role);
      case OrganizationPermission.JOIN_ORGANIZATION:
        return this.props.role === OrganizationRole.INVITED;
      default:
        return false;
    }
  }

  public toJSON() {
    return {
      userId: this.props.userId.toString(),
      role: this.props.role,
      joinedAt: this.props.joinedAt.toISOString()
    };
  }
} 