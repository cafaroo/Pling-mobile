import { UserRolePermission } from '../UserRolePermission';
import { UserRole, RoleName } from '../UserRole';
import { UserPermission, PermissionName } from '../UserPermission';

describe('UserRolePermission', () => {
  it('ska skapa UserRolePermission med standardroll', () => {
    const rolePermission = UserRolePermission.getUserRole();
    
    expect(rolePermission).toBeDefined();
    expect(rolePermission.roleName).toBe(RoleName.USER);
    expect(rolePermission.customPermissions).toEqual([]);
  });
  
  it('ska skapa UserRolePermission med administratörsroll', () => {
    const rolePermission = UserRolePermission.getAdminRole();
    
    expect(rolePermission).toBeDefined();
    expect(rolePermission.roleName).toBe(RoleName.ADMIN);
    expect(rolePermission.customPermissions).toEqual([]);
  });
  
  it('ska skapa UserRolePermission med anpassade behörigheter', () => {
    const customPermissions = [PermissionName.MANAGE_CONTENT, PermissionName.VIEW_ANALYTICS];
    const rolePermission = UserRolePermission.create(RoleName.USER, customPermissions);
    
    expect(rolePermission).toBeDefined();
    expect(rolePermission.roleName).toBe(RoleName.USER);
    expect(rolePermission.customPermissions).toEqual(customPermissions);
    expect(rolePermission.customPermissions).not.toBe(customPermissions); // Ska vara en kopia
  });
  
  it('ska returnera korrekt rollinfo', () => {
    const rolePermission = UserRolePermission.create(RoleName.MODERATOR);
    const roleInfo = rolePermission.roleInfo;
    
    expect(roleInfo).toBeDefined();
    expect(roleInfo.displayName).toBeDefined();
    expect(roleInfo.description).toBeDefined();
    
    // Verifiera att rollinfo matchar den faktiska rollen
    const roleResult = UserRole.create(RoleName.MODERATOR);
    expect(roleResult.isOk()).toBe(true);
    
    if (roleResult.isOk()) {
      const role = roleResult.value;
      expect(roleInfo.displayName).toBe(role.displayName);
      expect(roleInfo.description).toBe(role.description);
    }
  });
  
  it('ska korrekt identifiera om användaren har en specifik behörighet', () => {
    // Skapa en administratör
    const adminPermission = UserRolePermission.getAdminRole();
    
    // Administratör bör ha alla behörigheter
    expect(adminPermission.hasPermission(PermissionName.MANAGE_USERS)).toBe(true);
    expect(adminPermission.hasPermission(PermissionName.MANAGE_TEAMS)).toBe(true);
    expect(adminPermission.hasPermission(PermissionName.MANAGE_CONTENT)).toBe(true);
    
    // Skapa en vanlig användare
    const userPermission = UserRolePermission.getUserRole();
    
    // Användare bör ha vissa behörigheter men inte andra
    expect(userPermission.hasPermission(PermissionName.MANAGE_PROFILE)).toBe(true);
    expect(userPermission.hasPermission(PermissionName.JOIN_TEAM)).toBe(true);
    
    // Användare bör inte ha administrationsbehörigheter
    expect(userPermission.hasPermission(PermissionName.MANAGE_USERS)).toBe(false);
    expect(userPermission.hasPermission(PermissionName.MANAGE_TEAMS)).toBe(false);
  });
  
  it('ska korrekt identifiera om användaren har minst en av flera behörigheter', () => {
    // Skapa en användare med anpassade behörigheter
    const customPermissions = [PermissionName.MANAGE_CONTENT];
    const rolePermission = UserRolePermission.create(RoleName.USER, customPermissions);
    
    // Bör returnera true eftersom användaren har minst en av behörigheterna
    expect(rolePermission.hasAnyPermission([
      PermissionName.MANAGE_USERS, 
      PermissionName.MANAGE_CONTENT
    ])).toBe(true);
    
    // Bör returnera false eftersom användaren inte har någon av behörigheterna
    expect(rolePermission.hasAnyPermission([
      PermissionName.MANAGE_USERS, 
      PermissionName.MANAGE_TEAMS
    ])).toBe(false);
  });
  
  it('ska korrekt identifiera om användaren har alla angivna behörigheter', () => {
    // Skapa en användare med anpassade behörigheter
    const customPermissions = [
      PermissionName.MANAGE_CONTENT, 
      PermissionName.VIEW_ANALYTICS
    ];
    const rolePermission = UserRolePermission.create(RoleName.USER, customPermissions);
    
    // Bör returnera true eftersom användaren har alla angivna behörigheter
    expect(rolePermission.hasAllPermissions([
      PermissionName.MANAGE_PROFILE, 
      PermissionName.VIEW_ANALYTICS
    ])).toBe(true);
    
    // Bör returnera false eftersom användaren inte har alla behörigheter
    expect(rolePermission.hasAllPermissions([
      PermissionName.MANAGE_PROFILE, 
      PermissionName.MANAGE_USERS
    ])).toBe(false);
  });
  
  it('ska korrekt returnera alla behörighetsobjekt', () => {
    // Skapa en användare med anpassade behörigheter
    const customPermissions = [PermissionName.MANAGE_CONTENT];
    const rolePermission = UserRolePermission.create(RoleName.USER, customPermissions);
    
    const permissionObjects = rolePermission.permissionObjects;
    
    // Verifiera att behörighetsobjekten innehåller de förväntade värdena
    expect(permissionObjects.length).toBeGreaterThan(0);
    
    // Verifiera att anpassade behörigheter finns med
    expect(permissionObjects.some(perm => perm.name === PermissionName.MANAGE_CONTENT)).toBe(true);
    
    // Verifiera att standardbehörigheter för användarrollen finns med
    expect(permissionObjects.some(perm => perm.name === PermissionName.MANAGE_PROFILE)).toBe(true);
    expect(permissionObjects.some(perm => perm.name === PermissionName.JOIN_TEAM)).toBe(true);
  });
  
  it('ska returnera en informativ strängrepresentation', () => {
    // Skapa en användare utan anpassade behörigheter
    const userPermission = UserRolePermission.getUserRole();
    const userString = userPermission.toString();
    
    // Strängrepresentationen bör innehålla rollinformation
    expect(userString).toContain('Användare');
    expect(userString).not.toContain('anpassade');
    
    // Skapa en användare med anpassade behörigheter
    const customPermissions = [
      PermissionName.MANAGE_CONTENT, 
      PermissionName.VIEW_ANALYTICS
    ];
    const customRolePermission = UserRolePermission.create(RoleName.USER, customPermissions);
    const customString = customRolePermission.toString();
    
    // Strängrepresentationen bör innehålla information om anpassade behörigheter
    expect(customString).toContain('Användare');
    expect(customString).toContain('2 anpassade');
  });
}); 