import { ValueObject } from '@/shared/domain/ValueObject';
import { TeamPermission } from './TeamPermission';
import { TeamRole } from './TeamRole';

/**
 * Value object för rollbaserade behörigheter i team-domänen
 */
export class TeamRolePermission extends ValueObject<{
  role: string;
  permissions: string[];
}> {
  private _roleDisplay: string;
  private _description: string;

  private constructor(
    role: string,
    permissions: string[],
    roleDisplay: string,
    description: string
  ) {
    super({ role, permissions });
    this._roleDisplay = roleDisplay;
    this._description = description;
  }

  get role(): string {
    return this.props.role;
  }

  get permissions(): string[] {
    return this.props.permissions;
  }

  get permissionObjects(): TeamPermission[] {
    return this.permissions.map(permName => TeamPermission.create(permName));
  }

  get displayName(): string {
    return this._roleDisplay;
  }

  get description(): string {
    return this._description;
  }

  /**
   * Kontrollera om denna roll har en specifik behörighet
   */
  public hasPermission(permission: string | TeamPermission): boolean {
    const permissionName = typeof permission === 'string' 
      ? permission 
      : permission.name;
    
    return this.permissions.includes(permissionName);
  }

  /**
   * Skapa en rollbehörighet
   */
  public static create(
    role: string,
    permissions: string[],
    displayName?: string,
    description?: string
  ): TeamRolePermission {
    if (!TeamRole.isValidRole(role)) {
      throw new Error(`Ogiltig teamroll: ${role}`);
    }

    // Validera alla behörigheter
    permissions.forEach(permName => {
      try {
        TeamPermission.create(permName);
      } catch (error) {
        throw new Error(`Ogiltig behörighet för roll: ${permName}`);
      }
    });

    const roleDisplayNames: Record<string, string> = {
      [TeamRole.OWNER]: 'Ägare',
      [TeamRole.ADMIN]: 'Administratör',
      [TeamRole.MEMBER]: 'Medlem',
    };

    const roleDescriptions: Record<string, string> = {
      [TeamRole.OWNER]: 'Fullständig kontroll över teamet med alla behörigheter',
      [TeamRole.ADMIN]: 'Administrativa rättigheter för att hantera teamet',
      [TeamRole.MEMBER]: 'Standardbehörigheter för en teammedlem',
    };

    return new TeamRolePermission(
      role,
      permissions,
      displayName || roleDisplayNames[role] || role,
      description || roleDescriptions[role] || ''
    );
  }

  /**
   * Få alla standardroller med deras behörigheter
   */
  public static getDefaultRoles(): TeamRolePermission[] {
    return [
      this.getOwnerRole(),
      this.getAdminRole(),
      this.getMemberRole()
    ];
  }

  /**
   * Få roller ordnade efter prioritet (högre behörigheter först)
   */
  public static getRolesByPriority(): TeamRolePermission[] {
    const roles = this.getDefaultRoles();
    
    // Sortera roller efter antal behörigheter (högre först)
    return roles.sort((a, b) => b.permissions.length - a.permissions.length);
  }

  /**
   * Ägarroll med alla behörigheter
   */
  public static getOwnerRole(): TeamRolePermission {
    // Ägare har alla behörigheter
    const allPermissions = TeamPermission.createAll().map(p => p.name);
    
    return this.create(TeamRole.OWNER, allPermissions);
  }

  /**
   * Administratörsroll med många behörigheter
   */
  public static getAdminRole(): TeamRolePermission {
    // Administratörer har många behörigheter, men inte alla
    const adminPermissions = [
      TeamPermission.UPDATE_TEAM_SETTINGS,
      TeamPermission.INVITE_MEMBERS,
      TeamPermission.REMOVE_MEMBERS,
      TeamPermission.MANAGE_ROLES,
      TeamPermission.APPROVE_MEMBERS,
      TeamPermission.MANAGE_CONTENT,
      TeamPermission.CREATE_POSTS,
      TeamPermission.DELETE_POSTS,
      TeamPermission.VIEW_STATISTICS,
      TeamPermission.EXPORT_DATA,
      TeamPermission.SEND_MESSAGES,
      TeamPermission.MANAGE_CHANNELS,
      TeamPermission.CREATE_GOALS,
      TeamPermission.ASSIGN_GOALS,
      TeamPermission.COMPLETE_GOALS
    ];
    
    return this.create(TeamRole.ADMIN, adminPermissions);
  }

  /**
   * Standardmedlemsroll med grundläggande behörigheter
   */
  public static getMemberRole(): TeamRolePermission {
    // Medlemmar har begränsade behörigheter
    const memberPermissions = [
      TeamPermission.CREATE_POSTS,
      TeamPermission.VIEW_STATISTICS,
      TeamPermission.SEND_MESSAGES,
      TeamPermission.CREATE_GOALS,
      TeamPermission.COMPLETE_GOALS
    ];
    
    return this.create(TeamRole.MEMBER, memberPermissions);
  }
} 