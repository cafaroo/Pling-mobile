import { OrganizationRole } from './OrganizationRole';

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
export const DefaultRoleResourcePermissions: Record<OrganizationRole, ResourcePermission[]> = {
  [OrganizationRole.OWNER]: [
    ResourcePermission.VIEW,
    ResourcePermission.EDIT,
    ResourcePermission.DELETE,
    ResourcePermission.SHARE,
    ResourcePermission.MANAGE_PERMISSIONS,
    ResourcePermission.CHANGE_OWNER
  ],
  [OrganizationRole.ADMIN]: [
    ResourcePermission.VIEW,
    ResourcePermission.EDIT,
    ResourcePermission.DELETE,
    ResourcePermission.SHARE,
    ResourcePermission.MANAGE_PERMISSIONS
  ],
  [OrganizationRole.MEMBER]: [
    ResourcePermission.VIEW
  ],
  [OrganizationRole.INVITED]: []
}; 