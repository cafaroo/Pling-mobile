import { ValueObject } from '@/shared/domain/ValueObject';
import { Result, err, ok } from '@/shared/core/Result';
import { UserPermission, PermissionName } from './UserPermission';

export enum RoleName {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  TEAM_LEADER = 'team_leader',
  TEAM_MEMBER = 'team_member',
  USER = 'user',
  GUEST = 'guest',
  ANALYST = 'analyst',
  CONTENT_MANAGER = 'content_manager',
  SUPPORT = 'support',
  DEVELOPER = 'developer'
}

interface RoleDefinition {
  name: RoleName;
  displayName: string;
  description: string;
  permissions: PermissionName[];
  isSystemRole: boolean;
  priority: number;
}

/**
 * Map för rollerna i systemet
 */
const ROLES: Record<RoleName, RoleDefinition> = {
  [RoleName.ADMIN]: {
    name: RoleName.ADMIN,
    displayName: 'Administratör',
    description: 'Har fullständig kontroll över systemet',
    permissions: [
      PermissionName.MANAGE_SYSTEM,
      PermissionName.MANAGE_USERS,
      PermissionName.MANAGE_TEAMS,
      PermissionName.MANAGE_CONTENT,
      PermissionName.MANAGE_SETTINGS,
      PermissionName.VIEW_ANALYTICS,
      PermissionName.EXPORT_ANALYTICS,
      PermissionName.MANAGE_PROFILE,
      PermissionName.MANAGE_COMPETITIONS,
      PermissionName.MANAGE_GOALS,
      PermissionName.MANAGE_MESSAGES,
      PermissionName.VIEW_ACTIVITY,
      PermissionName.EXPORT_ACTIVITY,
      PermissionName.VIEW_LOGS,
      PermissionName.RESET_PASSWORDS
    ],
    isSystemRole: true,
    priority: 100
  },
  [RoleName.MODERATOR]: {
    name: RoleName.MODERATOR,
    displayName: 'Moderator',
    description: 'Övervakar innehåll och hanterar användare',
    permissions: [
      PermissionName.VIEW_USERS,
      PermissionName.MANAGE_CONTENT,
      PermissionName.VIEW_ANALYTICS,
      PermissionName.MANAGE_PROFILE,
      PermissionName.MANAGE_MESSAGES,
      PermissionName.VIEW_ACTIVITY
    ],
    isSystemRole: true,
    priority: 80
  },
  [RoleName.TEAM_LEADER]: {
    name: RoleName.TEAM_LEADER,
    displayName: 'Teamledare',
    description: 'Leder en grupp av användare',
    permissions: [
      PermissionName.VIEW_USERS,
      PermissionName.CREATE_TEAM,
      PermissionName.INVITE_TO_TEAM,
      PermissionName.EDIT_CONTENT,
      PermissionName.VIEW_CONTENT,
      PermissionName.MANAGE_PROFILE,
      PermissionName.CREATE_COMPETITION,
      PermissionName.JOIN_COMPETITION,
      PermissionName.MANAGE_GOALS,
      PermissionName.SEND_MESSAGES,
      PermissionName.READ_MESSAGES,
      PermissionName.VIEW_ACTIVITY,
      PermissionName.LOG_ACTIVITY
    ],
    isSystemRole: true,
    priority: 70
  },
  [RoleName.TEAM_MEMBER]: {
    name: RoleName.TEAM_MEMBER,
    displayName: 'Teammedlem',
    description: 'Medlem i ett team',
    permissions: [
      PermissionName.JOIN_TEAM,
      PermissionName.VIEW_CONTENT,
      PermissionName.MANAGE_PROFILE,
      PermissionName.JOIN_COMPETITION,
      PermissionName.CREATE_GOAL,
      PermissionName.SEND_MESSAGES,
      PermissionName.READ_MESSAGES,
      PermissionName.LOG_ACTIVITY
    ],
    isSystemRole: true,
    priority: 50
  },
  [RoleName.USER]: {
    name: RoleName.USER,
    displayName: 'Användare',
    description: 'Standardanvändare i systemet',
    permissions: [
      PermissionName.VIEW_CONTENT,
      PermissionName.MANAGE_PROFILE,
      PermissionName.JOIN_TEAM,
      PermissionName.JOIN_COMPETITION,
      PermissionName.SEND_MESSAGES,
      PermissionName.READ_MESSAGES,
      PermissionName.LOG_ACTIVITY
    ],
    isSystemRole: true,
    priority: 30
  },
  [RoleName.GUEST]: {
    name: RoleName.GUEST,
    displayName: 'Gäst',
    description: 'Begränsad tillgång till systemet',
    permissions: [
      PermissionName.VIEW_CONTENT
    ],
    isSystemRole: true,
    priority: 10
  },
  [RoleName.ANALYST]: {
    name: RoleName.ANALYST,
    displayName: 'Analytiker',
    description: 'Specialiserad på dataanalys',
    permissions: [
      PermissionName.VIEW_USERS,
      PermissionName.VIEW_CONTENT,
      PermissionName.MANAGE_PROFILE,
      PermissionName.VIEW_ANALYTICS,
      PermissionName.EXPORT_ANALYTICS,
      PermissionName.VIEW_ACTIVITY,
      PermissionName.EXPORT_ACTIVITY
    ],
    isSystemRole: true,
    priority: 60
  },
  [RoleName.CONTENT_MANAGER]: {
    name: RoleName.CONTENT_MANAGER,
    displayName: 'Innehållshanterare',
    description: 'Hanterar innehåll och publiceringar',
    permissions: [
      PermissionName.MANAGE_CONTENT,
      PermissionName.EDIT_CONTENT,
      PermissionName.VIEW_CONTENT,
      PermissionName.MANAGE_PROFILE,
      PermissionName.VIEW_ANALYTICS
    ],
    isSystemRole: true,
    priority: 65
  },
  [RoleName.SUPPORT]: {
    name: RoleName.SUPPORT,
    displayName: 'Support',
    description: 'Hjälper användare med problem',
    permissions: [
      PermissionName.VIEW_USERS,
      PermissionName.VIEW_CONTENT,
      PermissionName.MANAGE_PROFILE,
      PermissionName.READ_MESSAGES,
      PermissionName.SEND_MESSAGES,
      PermissionName.VIEW_ACTIVITY
    ],
    isSystemRole: true,
    priority: 55
  },
  [RoleName.DEVELOPER]: {
    name: RoleName.DEVELOPER,
    displayName: 'Utvecklare',
    description: 'Teknisk utvecklare med utökad systemåtkomst',
    permissions: [
      PermissionName.VIEW_USERS,
      PermissionName.VIEW_CONTENT,
      PermissionName.MANAGE_PROFILE,
      PermissionName.VIEW_SETTINGS,
      PermissionName.VIEW_LOGS,
      PermissionName.VIEW_ANALYTICS,
      PermissionName.EXPORT_ANALYTICS,
      PermissionName.VIEW_ACTIVITY,
      PermissionName.EXPORT_ACTIVITY
    ],
    isSystemRole: true,
    priority: 75
  }
};

/**
 * Value-object som representerar en användarroll i systemet
 */
export class UserRole extends ValueObject<string> {
  // Konstantreferenser för systemroller
  public static readonly ADMIN = RoleName.ADMIN;
  public static readonly MODERATOR = RoleName.MODERATOR;
  public static readonly TEAM_LEADER = RoleName.TEAM_LEADER;
  public static readonly TEAM_MEMBER = RoleName.TEAM_MEMBER;
  public static readonly USER = RoleName.USER;
  public static readonly GUEST = RoleName.GUEST;
  public static readonly ANALYST = RoleName.ANALYST;
  public static readonly CONTENT_MANAGER = RoleName.CONTENT_MANAGER;
  public static readonly SUPPORT = RoleName.SUPPORT;
  public static readonly DEVELOPER = RoleName.DEVELOPER;

  private _permissionCache: UserPermission[] | null = null;

  private constructor(name: string) {
    super(name);
  }

  /**
   * Skapar en ny användarroll
   */
  public static create(name: string): Result<UserRole, Error> {
    // Validera att rollen finns i systemet
    if (!Object.values(RoleName).includes(name as RoleName)) {
      return err(new Error(`Rollen "${name}" är inte en giltig systemroll`));
    }
    
    return ok(new UserRole(name));
  }
  
  /**
   * Returnerar alla tillgängliga systemroller
   */
  public static getAllRoles(): UserRole[] {
    return Object.values(RoleName).map(
      name => this.create(name).getValue()
    );
  }
  
  /**
   * Returnerar alla systemroller sorterade efter prioritet (högst först)
   */
  public static getRolesByPriority(): UserRole[] {
    return this.getAllRoles().sort((a, b) => 
      ROLES[b.name as RoleName].priority - ROLES[a.name as RoleName].priority
    );
  }
  
  /**
   * Hämtar högsta rollen baserat på en lista av roller
   */
  public static getHighestRole(roles: UserRole[]): UserRole | null {
    if (roles.length === 0) return null;
    
    return roles.sort((a, b) => 
      ROLES[b.name as RoleName].priority - ROLES[a.name as RoleName].priority
    )[0];
  }

  /**
   * Returnerar rollens namn
   */
  public get name(): RoleName {
    return this.props as RoleName;
  }
  
  /**
   * Returnerar rolldetaljer
   */
  public get details(): RoleDefinition {
    return ROLES[this.name];
  }
  
  /**
   * Returnerar rollens visningsnamn
   */
  public get displayName(): string {
    return this.details.displayName;
  }
  
  /**
   * Returnerar rollens beskrivning
   */
  public get description(): string {
    return this.details.description;
  }
  
  /**
   * Returnerar rollens prioritet
   */
  public get priority(): number {
    return this.details.priority;
  }
  
  /**
   * Kontrollerar om rollen är en systemroll
   */
  public get isSystemRole(): boolean {
    return this.details.isSystemRole;
  }
  
  /**
   * Returnerar en lista av behörigheter för rollen
   */
  public get permissions(): string[] {
    return [...this.details.permissions];
  }
  
  /**
   * Returnerar alla behörighetsobjekt för rollen
   */
  public get permissionObjects(): UserPermission[] {
    if (this._permissionCache === null) {
      // Skapa behörighetsobjekt från rollens behörigheter
      const directPermissions = this.details.permissions.map(
        permName => UserPermission.create(permName).getValue()
      );
      
      // Skapa en set för att undvika dubbletter
      const allPermissionNames = new Set<string>();
      
      // Lägg till direkta behörigheter och deras inkluderade
      directPermissions.forEach(perm => {
        allPermissionNames.add(perm.name);
        
        // Lägg även till alla inkluderade behörigheter
        perm.includedPermissions.forEach(includedPerm => {
          allPermissionNames.add(includedPerm.name);
        });
      });
      
      // Konvertera tillbaka till behörighetsobjekt
      this._permissionCache = Array.from(allPermissionNames).map(
        permName => UserPermission.create(permName).getValue()
      );
    }
    
    return this._permissionCache;
  }
  
  /**
   * Kontrollerar om rollen har en specifik behörighet
   */
  public hasPermission(permissionName: string): boolean {
    const permissionResult = UserPermission.create(permissionName);
    if (permissionResult.isErr()) return false;
    
    const permission = permissionResult.getValue();
    
    // Kontrollera om behörigheten finns bland rollens behörighetsobjekt
    return this.permissionObjects.some(perm => 
      perm.equals(permission) || perm.includes(permission)
    );
  }
  
  /**
   * Kontrollerar om denna roll är administratör
   */
  public isAdmin(): boolean {
    return this.name === RoleName.ADMIN;
  }
  
  /**
   * Kontrollerar om denna roll är moderator
   */
  public isModerator(): boolean {
    return this.name === RoleName.MODERATOR;
  }
  
  /**
   * Kontrollerar om denna roll är teamledare
   */
  public isTeamLeader(): boolean {
    return this.name === RoleName.TEAM_LEADER;
  }
  
  /**
   * Kontrollerar om denna roll har högre prioritet än en annan roll
   */
  public hasHigherPriorityThan(otherRole: UserRole): boolean {
    return this.priority > otherRole.priority;
  }
  
  /**
   * Jämför om denna roll är likvärdig med en annan
   */
  public equals(other: UserRole): boolean {
    return this.name === other.name;
  }
  
  /**
   * Returnerar en strängrepresentation av rollen
   */
  public toString(): string {
    return `${this.displayName} (${this.name})`;
  }
} 