import { OrganizationRole, OrganizationRoleEnum } from './OrganizationRole';

/**
 * Definierar behörigheter för resurser i en organisation
 * 
 * Dessa behörigheter kan appliceras på varje resurs för att kontrollera
 * vem som kan göra vad med resursen.
 */
export enum ResourcePermission {
  // Läsbehörigheter
  VIEW = 'view',
  
  // Skrivbehörigheter
  EDIT = 'edit',
  DELETE = 'delete',
  
  // Delningsbehörigheter
  SHARE = 'share',
  
  // Administrativa behörigheter
  MANAGE_PERMISSIONS = 'manage_permissions',
  CHANGE_OWNER = 'change_owner'
}

/**
 * Svenska etiketter för resursbehörigheter
 */
export const ResourcePermissionLabels: Record<ResourcePermission, string> = {
  [ResourcePermission.VIEW]: 'Visa',
  [ResourcePermission.EDIT]: 'Redigera',
  [ResourcePermission.DELETE]: 'Ta bort',
  [ResourcePermission.SHARE]: 'Dela',
  [ResourcePermission.MANAGE_PERMISSIONS]: 'Hantera behörigheter',
  [ResourcePermission.CHANGE_OWNER]: 'Ändra ägare'
};

/**
 * Standardbehörigheter per organisationsroll
 * 
 * Definierar vilka resursbehörigheter olika roller har som standard
 * när en ny resurs skapas. Dessa behörigheter kan justeras för individuella resurser.
 */
export const DefaultRoleResourcePermissions: Record<OrganizationRoleEnum, ResourcePermission[]> = {
  [OrganizationRoleEnum.OWNER]: [
    ResourcePermission.VIEW,
    ResourcePermission.EDIT,
    ResourcePermission.DELETE,
    ResourcePermission.SHARE,
    ResourcePermission.MANAGE_PERMISSIONS,
    ResourcePermission.CHANGE_OWNER
  ],
  [OrganizationRoleEnum.ADMIN]: [
    ResourcePermission.VIEW,
    ResourcePermission.EDIT,
    ResourcePermission.DELETE,
    ResourcePermission.SHARE,
    ResourcePermission.MANAGE_PERMISSIONS
  ],
  [OrganizationRoleEnum.MEMBER]: [
    ResourcePermission.VIEW
  ],
  [OrganizationRoleEnum.INVITED]: []
};

/**
 * Kontrollerar om ett ResourcePermission-värde är lika med ett annat värde
 * Användbart för att jämföra enums med strängar i tester och applikation
 */
export function equalsResourcePermission(
  permission: ResourcePermission,
  otherPermission: ResourcePermission | string
): boolean {
  if (typeof otherPermission === 'string') {
    return permission === otherPermission;
  }
  return permission === otherPermission;
}

/**
 * Hämtar namnet på en resursbehörighet på svenska
 */
export function getResourcePermissionName(permission: ResourcePermission): string {
  return ResourcePermissionLabels[permission] || 'Okänd behörighet';
} 