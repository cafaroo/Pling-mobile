import { OrganizationRole } from './OrganizationRole';

/**
 * Definierar olika behörigheter inom en organisation
 * 
 * Dessa behörigheter används för att kontrollera vad olika medlemsroller
 * tillåts göra i organisationen.
 */
export enum OrganizationPermission {
  // Läsbehörigheter
  VIEW_ORGANIZATION = 'view_organization',
  VIEW_MEMBERS = 'view_members',
  VIEW_TEAMS = 'view_teams',
  VIEW_INVITATIONS = 'view_invitations',

  // Administrativa behörigheter
  INVITE_MEMBERS = 'invite_members',
  REMOVE_MEMBERS = 'remove_members',
  UPDATE_MEMBER_ROLES = 'update_member_roles',
  
  // Teambehörigheter
  CREATE_TEAMS = 'create_teams',
  UPDATE_TEAMS = 'update_teams',
  DELETE_TEAMS = 'delete_teams',
  
  // Organisationsbehörigheter
  UPDATE_ORGANIZATION = 'update_organization',
  DELETE_ORGANIZATION = 'delete_organization',
}

/**
 * Svenska etiketter för behörigheter
 */
export const OrganizationPermissionLabels: Record<OrganizationPermission, string> = {
  [OrganizationPermission.VIEW_ORGANIZATION]: 'Visa organisation',
  [OrganizationPermission.VIEW_MEMBERS]: 'Visa medlemmar',
  [OrganizationPermission.VIEW_TEAMS]: 'Visa team',
  [OrganizationPermission.VIEW_INVITATIONS]: 'Visa inbjudningar',
  [OrganizationPermission.INVITE_MEMBERS]: 'Bjud in medlemmar',
  [OrganizationPermission.REMOVE_MEMBERS]: 'Ta bort medlemmar',
  [OrganizationPermission.UPDATE_MEMBER_ROLES]: 'Uppdatera roller',
  [OrganizationPermission.CREATE_TEAMS]: 'Skapa team',
  [OrganizationPermission.UPDATE_TEAMS]: 'Uppdatera team',
  [OrganizationPermission.DELETE_TEAMS]: 'Ta bort team',
  [OrganizationPermission.UPDATE_ORGANIZATION]: 'Redigera organisation',
  [OrganizationPermission.DELETE_ORGANIZATION]: 'Ta bort organisation'
};

/**
 * Grundläggande behörigheter för medlemmar
 */
const MEMBER_PERMISSIONS = [
  OrganizationPermission.VIEW_ORGANIZATION,
  OrganizationPermission.VIEW_MEMBERS,
  OrganizationPermission.VIEW_TEAMS
];

/**
 * Behörigheter för administratörer utöver medlemsbehörigheter
 */
const ADMIN_PERMISSIONS = [
  ...MEMBER_PERMISSIONS,
  OrganizationPermission.VIEW_INVITATIONS,
  OrganizationPermission.INVITE_MEMBERS,
  OrganizationPermission.REMOVE_MEMBERS,
  OrganizationPermission.UPDATE_MEMBER_ROLES,
  OrganizationPermission.CREATE_TEAMS,
  OrganizationPermission.UPDATE_TEAMS,
  OrganizationPermission.DELETE_TEAMS,
  OrganizationPermission.UPDATE_ORGANIZATION
];

/**
 * Kontrollerar om en roll har en specifik behörighet
 * 
 * @param role Användarens roll i organisationen
 * @param permission Behörigheten som ska kontrolleras
 * @returns true om rollen har behörigheten, annars false
 */
export function hasOrganizationPermission(
  role: OrganizationRole,
  permission: OrganizationPermission
): boolean {
  // Ägare har alla behörigheter
  if (role === OrganizationRole.OWNER) {
    return true;
  }
  
  // Administratörer har alla utom DELETE_ORGANIZATION
  if (role === OrganizationRole.ADMIN) {
    return permission !== OrganizationPermission.DELETE_ORGANIZATION;
  }
  
  // Medlemmar har bara grundläggande läsbehörigheter
  if (role === OrganizationRole.MEMBER) {
    return MEMBER_PERMISSIONS.includes(permission);
  }
  
  // Inbjudna har inga behörigheter i organisationen
  return false;
}

/**
 * Hämtar namnet på en behörighet på svenska
 * 
 * @param permission Behörigheten
 * @returns Behörighetens namn på svenska
 */
export function getOrganizationPermissionName(permission: OrganizationPermission): string {
  return OrganizationPermissionLabels[permission] || 'Okänd behörighet';
} 