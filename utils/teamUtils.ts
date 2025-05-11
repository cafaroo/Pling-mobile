import { TeamRole } from '@types/team';
import { Users, Shield, Star, Crown } from 'lucide-react-native';

export const ROLE_HIERARCHY: Record<TeamRole, number> = {
  owner: 4,
  admin: 3,
  moderator: 2,
  member: 1,
  guest: 0,
};

export const ROLE_LABELS: Record<TeamRole, string> = {
  owner: 'Ägare',
  admin: 'Administratör',
  moderator: 'Moderator',
  member: 'Medlem',
  guest: 'Gäst',
};

export const ROLE_DESCRIPTIONS: Record<TeamRole, string> = {
  owner: 'Full kontroll över teamet och dess inställningar',
  admin: 'Kan hantera medlemmar och inställningar',
  moderator: 'Kan hantera meddelanden och vissa medlemsåtgärder',
  member: 'Kan delta i teamaktiviteter',
  guest: 'Begränsad åtkomst till teamet',
};

/**
 * Kontrollerar om en användare har tillräcklig behörighet för en viss roll
 */
export function hasRolePermission(userRole: TeamRole, targetRole: TeamRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[targetRole];
}

/**
 * Kontrollerar om en användare kan ändra en annan användares roll
 */
export function canModifyRole(
  currentUserRole: TeamRole,
  targetUserRole: TeamRole,
  newRole: TeamRole
): boolean {
  // Kan inte ändra sin egen roll
  if (currentUserRole === targetUserRole) {
    return false;
  }

  // Måste ha högre roll än både målrollen och den nya rollen
  return (
    ROLE_HIERARCHY[currentUserRole] > ROLE_HIERARCHY[targetUserRole] &&
    ROLE_HIERARCHY[currentUserRole] > ROLE_HIERARCHY[newRole]
  );
}

/**
 * Kontrollerar om en användare kan ta bort en annan användare
 */
export function canRemoveMember(
  currentUserRole: TeamRole,
  targetUserRole: TeamRole
): boolean {
  // Kan inte ta bort sig själv
  if (currentUserRole === targetUserRole) {
    return false;
  }

  // Måste ha högre roll än användaren som ska tas bort
  return ROLE_HIERARCHY[currentUserRole] > ROLE_HIERARCHY[targetUserRole];
}

/**
 * Hämtar tillgängliga roller som en användare kan tilldela
 */
export function getAvailableRoles(currentUserRole: TeamRole): TeamRole[] {
  const currentRoleLevel = ROLE_HIERARCHY[currentUserRole];
  return Object.entries(ROLE_HIERARCHY)
    .filter(([_, level]) => level < currentRoleLevel)
    .map(([role]) => role as TeamRole);
}

/**
 * Kontrollerar om en användare kan bjuda in nya medlemmar
 */
export function canInviteMembers(role: TeamRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.moderator;
}

/**
 * Kontrollerar om en användare kan hantera teaminställningar
 */
export function canManageTeamSettings(role: TeamRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.admin;
}

/**
 * Kontrollerar om en användare kan hantera meddelanden
 */
export function canManageMessages(role: TeamRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.moderator;
}

/**
 * Formaterar en roll för visning
 */
export function formatRole(role: TeamRole): string {
  return ROLE_LABELS[role] || role;
}

/**
 * Hämtar beskrivning för en roll
 */
export function getRoleDescription(role: TeamRole): string {
  return ROLE_DESCRIPTIONS[role] || '';
}

/**
 * Sorterar medlemmar efter rollhierarki
 */
export function sortMembersByRole<T extends { role: TeamRole }>(
  members: T[]
): T[] {
  return [...members].sort(
    (a, b) => ROLE_HIERARCHY[b.role] - ROLE_HIERARCHY[a.role]
  );
}

export const getRoleLabel = (role: TeamRole): string => {
  return ROLE_LABELS[role] || 'Okänd roll';
};

export const getRoleIcon = (role: TeamRole) => {
  switch (role) {
    case 'owner':
      return Crown;
    case 'admin':
      return Star;
    case 'moderator':
      return Shield;
    case 'member':
    case 'guest':
      return Users;
    default:
      return Users;
  }
}; 