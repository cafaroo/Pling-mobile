/**
 * TeamRole värde-objekt för att representera en medlems roll i ett team
 */

import { ValueObject } from '@/shared/core/ValueObject';
import { Result, ok, err } from '@/shared/core/Result';

// Tillåtna roller i ett team
export enum TeamRoleEnum {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  GUEST = 'guest'
}

// Interface för TeamRole-egenskaper
export interface TeamRoleProps {
  value: string;
}

/**
 * TeamRole är ett värde-objekt som representerar en medlems roll i ett team
 */
export class TeamRole extends ValueObject<TeamRoleProps> {
  
  private constructor(props: TeamRoleProps) {
    super(props);
  }
  
  /**
   * Skapar ett nytt TeamRole-värdesobjekt
   */
  public static create(roleValue: string | null | undefined): Result<TeamRole, string> {
    // Kontrollera att rollen inte är null eller undefined
    if (roleValue === null || roleValue === undefined) {
      return err('Teamroll kan inte vara null eller undefined');
    }
    
    // Kontrollera att rollen är en av de tillåtna värdena
    const normalizedRole = roleValue.toLowerCase();
    
    if (!Object.values(TeamRoleEnum).includes(normalizedRole as TeamRoleEnum)) {
      return err(`"${roleValue}" är inte en giltig teamroll. Giltiga värden är: ${Object.values(TeamRoleEnum).join(', ')}`);
    }
    
    return ok(new TeamRole({ value: normalizedRole }));
  }
  
  /**
   * Färdigdefinierade roller
   */
  public static readonly OWNER: TeamRole = new TeamRole({ value: TeamRoleEnum.OWNER });
  public static readonly ADMIN: TeamRole = new TeamRole({ value: TeamRoleEnum.ADMIN });
  public static readonly MEMBER: TeamRole = new TeamRole({ value: TeamRoleEnum.MEMBER });
  public static readonly GUEST: TeamRole = new TeamRole({ value: TeamRoleEnum.GUEST });
  
  /**
   * Hämtar rollvärdet
   */
  get value(): string {
    return this.props.value;
  }
  
  /**
   * Jämför om detta TeamRole-objekt är samma som en annan roll
   * Implementerar ValueObject.equals
   */
  public equals(vo?: ValueObject<TeamRoleProps>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    
    if (!(vo instanceof TeamRole)) {
      return false;
    }
    
    return this.props.value === vo.props.value;
  }
  
  /**
   * Jämför om detta TeamRole-objekt är samma som ett rollvärde (string eller TeamRole)
   */
  public equalsValue(role?: TeamRole | string): boolean {
    if (role === null || role === undefined) {
      return false;
    }
    
    if (typeof role === 'string') {
      return this.props.value === role.toLowerCase();
    }
    
    return this.props.value === role.props.value;
  }
  
  /**
   * Kontrollera om denna roll har minst samma behörighet som en annan roll
   */
  public hasAtLeastSamePermissionAs(role: TeamRole): boolean {
    const permissionLevel = this.getPermissionLevel();
    const otherPermissionLevel = role.getPermissionLevel();
    
    return permissionLevel >= otherPermissionLevel;
  }
  
  /**
   * Beräkna behörighetsnivå för en roll (högre värde = högre behörighet)
   */
  private getPermissionLevel(): number {
    switch (this.props.value) {
      case TeamRoleEnum.OWNER:
        return 3;
      case TeamRoleEnum.ADMIN:
        return 2;
      case TeamRoleEnum.MEMBER:
        return 1;
      case TeamRoleEnum.GUEST:
        return 0;
      default:
        return -1; // Okänd roll
    }
  }
  
  /**
   * Returnerar strängreprentation av rollen
   */
  toString(): string {
    return this.props.value;
  }
}

export const TeamRoleLabels: Record<TeamRoleEnum, string> = {
  [TeamRoleEnum.OWNER]: 'Ägare',
  [TeamRoleEnum.ADMIN]: 'Administratör',
  [TeamRoleEnum.MEMBER]: 'Medlem',
  [TeamRoleEnum.GUEST]: 'Gäst'
};

export const TeamRoleDescriptions: Record<TeamRoleEnum, string> = {
  [TeamRoleEnum.OWNER]: 'Fullständig kontroll över teamet, kan inte tas bort',
  [TeamRoleEnum.ADMIN]: 'Kan hantera teammedlemmar och inställningar',
  [TeamRoleEnum.MEMBER]: 'Standardroll för teammedlemmar',
  [TeamRoleEnum.GUEST]: 'Kan se teaminformation'
};

export const TeamRolePermissions = {
  [TeamRoleEnum.OWNER]: [
    'manage_team',
    'manage_members',
    'manage_roles',
    'invite_members',
    'remove_members',
    'edit_team',
    'view_team'
  ],
  [TeamRoleEnum.ADMIN]: [
    'manage_members',
    'invite_members',
    'remove_members',
    'edit_team',
    'view_team'
  ],
  [TeamRoleEnum.MEMBER]: [
    'view_team'
  ],
  [TeamRoleEnum.GUEST]: [
    'view_team'
  ]
} as const;

export type TeamRolePermission = typeof TeamRolePermissions[TeamRoleEnum][number];

export function getTeamRoleByName(roleName: string): TeamRoleEnum | undefined {
  const normalizedRoleName = roleName.toLowerCase();
  return Object.values(TeamRoleEnum).find(
    role => role.toLowerCase() === normalizedRoleName
  );
}

export function getTeamRoleLabel(role: TeamRoleEnum): string {
  return TeamRoleLabels[role] || 'Okänd roll';
}

export function getTeamRoleDescription(role: TeamRoleEnum): string {
  return TeamRoleDescriptions[role] || 'Ingen beskrivning tillgänglig';
}

export function isValidTeamRole(role: string): role is TeamRoleEnum {
  return Object.values(TeamRoleEnum).includes(role as TeamRoleEnum);
}

export function hasPermission(role: TeamRoleEnum, permission: TeamRolePermission): boolean {
  return TeamRolePermissions[role].includes(permission as any);
}

/**
 * Försöker konvertera en sträng eller TeamRole till ett TeamRole-värde
 * Användbart för tester och gränssnitt
 */
export function parseTeamRole(role: string | TeamRole): Result<TeamRole, string> {
  if (typeof role === 'string') {
    // Om rollen är en sträng, försök skapa ett TeamRole-objekt
    const normalizedRole = role.toLowerCase();
    
    // Översätt strängen till motsvarande TeamRole-instans
    switch (normalizedRole) {
      case 'owner':
        return ok(TeamRole.OWNER);
      case 'admin':
        return ok(TeamRole.ADMIN);
      case 'member':
        return ok(TeamRole.MEMBER);
      case 'guest':
        return ok(TeamRole.GUEST);
      default:
        return err(`Ogiltig teamroll: ${role}`);
    }
  }
  
  // Om det redan är ett TeamRole-värde
  return ok(role);
} 