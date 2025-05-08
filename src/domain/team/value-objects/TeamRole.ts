import { ValueObject } from '@/shared/domain/ValueObject';

export enum TeamRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member'
}

export const TeamRoleLabels: Record<TeamRole, string> = {
  [TeamRole.OWNER]: 'Ägare',
  [TeamRole.ADMIN]: 'Administratör',
  [TeamRole.MEMBER]: 'Medlem'
};

export const TeamRoleDescriptions: Record<TeamRole, string> = {
  [TeamRole.OWNER]: 'Fullständig kontroll över teamet, kan inte tas bort',
  [TeamRole.ADMIN]: 'Kan hantera teammedlemmar och inställningar',
  [TeamRole.MEMBER]: 'Standardroll för teammedlemmar'
};

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

export function isValidTeamRole(role: string): boolean {
  return Object.values(TeamRole).includes(role as TeamRole);
}

export class TeamRole extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  public static create(role: string): TeamRole {
    if (!this.isValidRole(role)) {
      throw new Error('Ogiltig teamroll');
    }
    return new TeamRole(role);
  }

  public static isValidRole(role: string): role is typeof TeamRole.OWNER | typeof TeamRole.ADMIN | typeof TeamRole.MEMBER {
    return [TeamRole.OWNER, TeamRole.ADMIN, TeamRole.MEMBER].includes(role as any);
  }
} 