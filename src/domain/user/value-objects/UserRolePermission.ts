import { ValueObject } from '@/shared/domain/ValueObject';
import { Result, err, ok } from '@/shared/core/Result';
import { UserPermission, PermissionName } from './UserPermission';
import { UserRole, RoleName } from './UserRole';

interface UserRolePermissionProps {
  role: string;
  customPermissions: string[];
}

/**
 * Value-object som kombinerar en användarroll med anpassade behörigheter
 */
export class UserRolePermission extends ValueObject<UserRolePermissionProps> {
  private _permissionCache: UserPermission[] | null = null;
  private _roleObject: UserRole | null = null;

  private constructor(props: UserRolePermissionProps) {
    super(props);
  }

  /**
   * Skapar ett nytt UserRolePermission-objekt
   */
  public static create(
    roleName: string, 
    customPermissions: string[] = []
  ): UserRolePermission {
    return new UserRolePermission({
      role: roleName,
      customPermissions: [...customPermissions]
    });
  }

  /**
   * Returnerar ett UserRolePermission-objekt för standardanvändarrollen
   */
  public static getUserRole(): UserRolePermission {
    return this.create(RoleName.USER);
  }

  /**
   * Returnerar ett UserRolePermission-objekt för administratörsrollen
   */
  public static getAdminRole(): UserRolePermission {
    return this.create(RoleName.ADMIN);
  }

  /**
   * Returnerar rollnamnet
   */
  public get roleName(): string {
    return this.props.role;
  }

  /**
   * Returnerar roll-objektet
   */
  public get roleObject(): UserRole {
    if (!this._roleObject) {
      const roleResult = UserRole.create(this.props.role);
      this._roleObject = roleResult.isOk() 
        ? roleResult.value 
        : UserRole.create(RoleName.USER).value;
    }
    return this._roleObject;
  }

  /**
   * Returnerar rollinformation (visningsnamn och beskrivning)
   */
  public get roleInfo(): { displayName: string; description: string } {
    return {
      displayName: this.roleObject.displayName,
      description: this.roleObject.description
    };
  }

  /**
   * Returnerar listan av anpassade behörigheter
   */
  public get customPermissions(): string[] {
    return [...this.props.customPermissions];
  }

  /**
   * Returnerar alla behörighetsobjekt inklusive både rollbehörigheter och anpassade behörigheter
   */
  public get permissionObjects(): UserPermission[] {
    if (this._permissionCache === null) {
      // Hämta rollens behörigheter
      const rolePermissions = this.roleObject.permissionObjects;
      
      // Skapa en set för att undvika dubbletter
      const allPermissionNames = new Set<string>(
        rolePermissions.map(perm => perm.name)
      );
      
      // Lägg till anpassade behörigheter
      this.props.customPermissions.forEach(permName => {
        const permResult = UserPermission.create(permName);
        if (permResult.isOk()) {
          const perm = permResult.value;
          allPermissionNames.add(perm.name);
          
          // Lägg även till alla inkluderade behörigheter
          perm.includedPermissions.forEach(includedPerm => {
            allPermissionNames.add(includedPerm.name);
          });
        }
      });
      
      // Konvertera tillbaka till behörighetsobjekt
      this._permissionCache = Array.from(allPermissionNames)
        .map(permName => {
          const permResult = UserPermission.create(permName);
          return permResult.isOk() ? permResult.value : null;
        })
        .filter((perm): perm is UserPermission => perm !== null);
    }
    
    return this._permissionCache;
  }

  /**
   * Kontrollerar om användaren har en specifik behörighet
   */
  public hasPermission(permissionName: string): boolean {
    const permissionResult = UserPermission.create(permissionName);
    if (permissionResult.isErr()) return false;
    
    const permission = permissionResult.value;
    
    // Kontrollera om behörigheten finns bland rollens behörighetsobjekt
    return this.permissionObjects.some(perm => 
      perm.equals(permission) || perm.includes(permission)
    );
  }

  /**
   * Kontrollerar om användaren har åtminstone en av de angivna behörigheterna
   */
  public hasAnyPermission(permissionNames: string[]): boolean {
    return permissionNames.some(permName => this.hasPermission(permName));
  }

  /**
   * Kontrollerar om användaren har alla angivna behörigheter
   */
  public hasAllPermissions(permissionNames: string[]): boolean {
    return permissionNames.every(permName => this.hasPermission(permName));
  }

  /**
   * Returnerar en strängrepresentation av UserRolePermission
   */
  public toString(): string {
    const customCount = this.props.customPermissions.length;
    const customText = customCount > 0 
      ? ` (+ ${customCount} anpassade)` 
      : '';
    
    return `${this.roleInfo.displayName}${customText}`;
  }
} 