export enum OrganizationRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  INVITED = 'invited'
}

export const OrganizationRoleLabels: Record<OrganizationRole, string> = {
  [OrganizationRole.OWNER]: 'Ägare',
  [OrganizationRole.ADMIN]: 'Administratör',
  [OrganizationRole.MEMBER]: 'Medlem',
  [OrganizationRole.INVITED]: 'Inbjuden'
};

export const OrganizationRoleDescriptions: Record<OrganizationRole, string> = {
  [OrganizationRole.OWNER]: 'Fullständig kontroll över organisationen, kan inte tas bort',
  [OrganizationRole.ADMIN]: 'Kan hantera organisationsmedlemmar och inställningar',
  [OrganizationRole.MEMBER]: 'Standardroll för organisationsmedlemmar',
  [OrganizationRole.INVITED]: 'Har blivit inbjuden men inte anslutit sig ännu'
};

export const OrganizationRolePermissions = {
  [OrganizationRole.OWNER]: [
    'manage_organization',
    'manage_members',
    'manage_roles',
    'invite_members',
    'remove_members',
    'edit_organization',
    'view_organization',
    'manage_teams'
  ],
  [OrganizationRole.ADMIN]: [
    'manage_members',
    'invite_members',
    'remove_members',
    'edit_organization',
    'view_organization',
    'manage_teams'
  ],
  [OrganizationRole.MEMBER]: [
    'view_organization'
  ],
  [OrganizationRole.INVITED]: [
    'join_organization'
  ]
} as const;

export type OrganizationRolePermission = keyof typeof OrganizationRolePermissions[OrganizationRole];

export function getOrganizationRoleByName(roleName: string): OrganizationRole | undefined {
  const normalizedRoleName = roleName.toLowerCase();
  return Object.values(OrganizationRole).find(
    role => role.toLowerCase() === normalizedRoleName
  );
}

export function getOrganizationRoleLabel(role: OrganizationRole): string {
  return OrganizationRoleLabels[role] || 'Okänd roll';
}

export function getOrganizationRoleDescription(role: OrganizationRole): string {
  return OrganizationRoleDescriptions[role] || 'Ingen beskrivning tillgänglig';
}

export function isValidOrganizationRole(role: string): role is OrganizationRole {
  return Object.values(OrganizationRole).includes(role as OrganizationRole);
}

export function hasPermission(role: OrganizationRole, permission: OrganizationRolePermission): boolean {
  return OrganizationRolePermissions[role].includes(permission);
} 