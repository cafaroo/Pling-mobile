export enum TeamRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  GUEST = 'guest'
}

export const TeamRoleLabels: Record<TeamRole, string> = {
  [TeamRole.OWNER]: 'Ägare',
  [TeamRole.ADMIN]: 'Administratör',
  [TeamRole.MEMBER]: 'Medlem',
  [TeamRole.GUEST]: 'Gäst'
};

export const TeamRoleDescriptions: Record<TeamRole, string> = {
  [TeamRole.OWNER]: 'Fullständig kontroll över teamet, kan inte tas bort',
  [TeamRole.ADMIN]: 'Kan hantera teammedlemmar och inställningar',
  [TeamRole.MEMBER]: 'Standardroll för teammedlemmar',
  [TeamRole.GUEST]: 'Kan se teaminformation'
};

export const TeamRolePermissions = {
  [TeamRole.OWNER]: [
    'manage_team',
    'manage_members',
    'manage_roles',
    'invite_members',
    'remove_members',
    'edit_team',
    'view_team'
  ],
  [TeamRole.ADMIN]: [
    'manage_members',
    'invite_members',
    'remove_members',
    'edit_team',
    'view_team'
  ],
  [TeamRole.MEMBER]: [
    'view_team'
  ],
  [TeamRole.GUEST]: [
    'view_team'
  ]
} as const;

export type TeamRolePermission = keyof typeof TeamRolePermissions[TeamRole];

export function getTeamRoleByName(roleName: string): TeamRole | undefined {
  const normalizedRoleName = roleName.toLowerCase();
  return Object.values(TeamRole).find(
    role => role.toLowerCase() === normalizedRoleName
  );
}

export function getTeamRoleLabel(role: TeamRole): string {
  return TeamRoleLabels[role] || 'Okänd roll';
}

export function getTeamRoleDescription(role: TeamRole): string {
  return TeamRoleDescriptions[role] || 'Ingen beskrivning tillgänglig';
}

export function isValidTeamRole(role: string): role is TeamRole {
  return Object.values(TeamRole).includes(role as TeamRole);
}

export function hasPermission(role: TeamRole, permission: TeamRolePermission): boolean {
  return TeamRolePermissions[role].includes(permission);
} 