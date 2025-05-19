import { TeamRole } from './TeamRole';
import { TeamPermissionEnum } from './TeamPermission';

/**
 * Definition av standardbehörigheter för olika roller
 */
export const DefaultRolePermissions: Record<string, TeamPermissionEnum[]> = {
  // OWNER-rollen har alla behörigheter
  'OWNER': Object.values(TeamPermissionEnum),
  
  // ADMIN-rollen har alla behörigheter utom att ta bort teamet
  'ADMIN': [
    TeamPermissionEnum.VIEW_TEAM,
    TeamPermissionEnum.EDIT_TEAM,
    TeamPermissionEnum.VIEW_MEMBERS,
    TeamPermissionEnum.ADD_MEMBERS,
    TeamPermissionEnum.REMOVE_MEMBERS,
    TeamPermissionEnum.CHANGE_MEMBER_ROLE,
    TeamPermissionEnum.VIEW_ACTIVITIES,
    TeamPermissionEnum.CREATE_ACTIVITY,
    TeamPermissionEnum.EDIT_ACTIVITY,
    TeamPermissionEnum.DELETE_ACTIVITY,
    TeamPermissionEnum.VIEW_SETTINGS,
    TeamPermissionEnum.EDIT_SETTINGS
  ],
  
  // MEMBER-rollen har begränsade behörigheter
  'MEMBER': [
    TeamPermissionEnum.VIEW_TEAM,
    TeamPermissionEnum.VIEW_MEMBERS,
    TeamPermissionEnum.VIEW_ACTIVITIES,
    TeamPermissionEnum.CREATE_ACTIVITY,
    TeamPermissionEnum.VIEW_SETTINGS
  ],
  
  // GUEST-rollen har minimala behörigheter
  'GUEST': [
    TeamPermissionEnum.VIEW_TEAM,
    TeamPermissionEnum.VIEW_MEMBERS,
    TeamPermissionEnum.VIEW_ACTIVITIES
  ]
};

/**
 * Hjälpfunktion för att få behörigheter för en specifik roll
 */
export function getPermissionsForRole(role: TeamRole | string): TeamPermissionEnum[] {
  // Konvertera role till sträng om det är ett TeamRole-objekt
  const roleKey = typeof role === 'string' ? role : role.toString();
  
  // Returnera behörigheter för rollen, eller en tom array om rollen inte finns
  return DefaultRolePermissions[roleKey] || [];
}

/**
 * Kontrollerar om en roll har en specifik behörighet
 */
export function roleHasPermission(
  role: TeamRole | string, 
  permission: TeamPermissionEnum | string
): boolean {
  const permissions = getPermissionsForRole(role);
  
  // Konvertera permission till sträng om det behövs
  const permissionStr = typeof permission === 'string' ? permission : permission.toString();
  
  return permissions.some(p => p.toString() === permissionStr);
} 