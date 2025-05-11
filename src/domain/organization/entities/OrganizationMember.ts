import { Entity } from '@/shared/core/Entity';
import { UniqueId } from '@/shared/core/UniqueId';
import { OrganizationRole } from '../value-objects/OrganizationRole';
import { OrganizationPermission } from '../value-objects/OrganizationPermission';
import { Result, ok, err } from '@/shared/core/Result';

export interface OrganizationMemberProps {
  userId: UniqueId;
  role: OrganizationRole;
  joinedAt: Date;
}

export type OrganizationMemberCreateDTO = {
  userId: string | UniqueId;
  role: OrganizationRole;
  joinedAt?: Date;
};

export class OrganizationMember extends Entity<OrganizationMemberProps> {
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
    return this.props.joinedAt;
  }

  // Kontrollera om medlemmen har en specifik behörighet
  public hasPermission(permission: OrganizationPermission): boolean {
    // Implementera behörighetslogik baserat på roll
    // Admin har alla behörigheter
    if (this.role === OrganizationRole.ADMIN || this.role === OrganizationRole.OWNER) {
      return true;
    }

    // Medlemmar har endast vissa behörigheter
    if (this.role === OrganizationRole.MEMBER) {
      switch (permission) {
        case OrganizationPermission.VIEW_ORGANIZATION:
        case OrganizationPermission.VIEW_MEMBERS:
        case OrganizationPermission.VIEW_TEAMS:
          return true;
        default:
          return false;
      }
    }

    return false;
  }

  // Skapa en ny medlem
  public static create(dto: OrganizationMemberCreateDTO): Result<OrganizationMember, string> {
    try {
      const userId = dto.userId instanceof UniqueId 
        ? dto.userId 
        : new UniqueId(dto.userId);

      // Validera roll
      if (!Object.values(OrganizationRole).includes(dto.role)) {
        return err('Ogiltig roll för organisationsmedlem');
      }

      return ok(new OrganizationMember({
        userId,
        role: dto.role,
        joinedAt: dto.joinedAt || new Date()
      }));
    } catch (error) {
      return err(`Kunde inte skapa organisationsmedlem: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 