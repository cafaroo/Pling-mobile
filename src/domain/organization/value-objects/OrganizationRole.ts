/**
 * OrganizationRole värde-objekt för att representera en medlems roll i en organisation
 */

import { ValueObject } from '@/shared/core/ValueObject';
import { Result, ok, err } from '@/shared/core/Result';

// Tillåtna roller i en organisation
export enum OrganizationRoleEnum {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  INVITED = 'invited'
}

// Interface för OrganizationRole-egenskaper
export interface OrganizationRoleProps {
  value: string;
}

/**
 * OrganizationRole är ett värde-objekt som representerar en medlems roll i en organisation
 */
export class OrganizationRole extends ValueObject<OrganizationRoleProps> {
  
  private constructor(props: OrganizationRoleProps) {
    super(props);
  }
  
  /**
   * Skapar ett nytt OrganizationRole-värdesobjekt
   */
  public static create(roleValue: string): Result<OrganizationRole, string> {
    // Kontrollera att rollen är en av de tillåtna värdena
    const normalizedRole = roleValue.toLowerCase();
    
    if (!Object.values(OrganizationRoleEnum).includes(normalizedRole as OrganizationRoleEnum)) {
      return err(`"${roleValue}" är inte en giltig organisationsroll. Giltiga värden är: ${Object.values(OrganizationRoleEnum).join(', ')}`);
    }
    
    return ok(new OrganizationRole({ value: normalizedRole }));
  }
  
  /**
   * Färdigdefinierade roller
   */
  public static readonly OWNER: OrganizationRole = new OrganizationRole({ value: OrganizationRoleEnum.OWNER });
  public static readonly ADMIN: OrganizationRole = new OrganizationRole({ value: OrganizationRoleEnum.ADMIN });
  public static readonly MEMBER: OrganizationRole = new OrganizationRole({ value: OrganizationRoleEnum.MEMBER });
  public static readonly INVITED: OrganizationRole = new OrganizationRole({ value: OrganizationRoleEnum.INVITED });
  
  /**
   * Hämtar rollvärdet
   */
  get value(): string {
    return this.props.value;
  }
  
  /**
   * Jämför om detta OrganizationRole-objekt är samma som en annan roll
   * Implementerar ValueObject.equals
   */
  public equals(vo?: ValueObject<OrganizationRoleProps>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    
    if (!(vo instanceof OrganizationRole)) {
      return false;
    }
    
    return this.props.value === vo.props.value;
  }
  
  /**
   * Jämför om detta OrganizationRole-objekt är samma som ett rollvärde (string eller OrganizationRole)
   */
  public equalsValue(role?: OrganizationRole | string): boolean {
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
  public hasAtLeastSamePermissionAs(role: OrganizationRole): boolean {
    const permissionLevel = this.getPermissionLevel();
    const otherPermissionLevel = role.getPermissionLevel();
    
    return permissionLevel >= otherPermissionLevel;
  }
  
  /**
   * Beräkna behörighetsnivå för en roll (högre värde = högre behörighet)
   */
  private getPermissionLevel(): number {
    switch (this.props.value) {
      case OrganizationRoleEnum.OWNER:
        return 3;
      case OrganizationRoleEnum.ADMIN:
        return 2;
      case OrganizationRoleEnum.MEMBER:
        return 1;
      case OrganizationRoleEnum.INVITED:
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
  
  /**
   * Hämtar rollvärdet (för bakåtkompatibilitet)
   */
  getValue(): string {
    return this.props.value;
  }
}

export const OrganizationRoleLabels: Record<OrganizationRoleEnum, string> = {
  [OrganizationRoleEnum.OWNER]: 'Ägare',
  [OrganizationRoleEnum.ADMIN]: 'Administratör',
  [OrganizationRoleEnum.MEMBER]: 'Medlem',
  [OrganizationRoleEnum.INVITED]: 'Inbjuden'
};

export const OrganizationRoleDescriptions: Record<OrganizationRoleEnum, string> = {
  [OrganizationRoleEnum.OWNER]: 'Fullständig kontroll över organisationen, kan inte tas bort',
  [OrganizationRoleEnum.ADMIN]: 'Kan hantera organisationsmedlemmar och inställningar',
  [OrganizationRoleEnum.MEMBER]: 'Standardroll för organisationsmedlemmar',
  [OrganizationRoleEnum.INVITED]: 'Har blivit inbjuden men inte anslutit sig ännu'
};

export const OrganizationRolePermissions = {
  [OrganizationRoleEnum.OWNER]: [
    'manage_organization',
    'manage_members',
    'manage_roles',
    'invite_members',
    'remove_members',
    'edit_organization',
    'view_organization',
    'manage_teams'
  ],
  [OrganizationRoleEnum.ADMIN]: [
    'manage_members',
    'invite_members',
    'remove_members',
    'edit_organization',
    'view_organization',
    'manage_teams'
  ],
  [OrganizationRoleEnum.MEMBER]: [
    'view_organization'
  ],
  [OrganizationRoleEnum.INVITED]: [
    'join_organization'
  ]
} as const;

export type OrganizationRolePermission = keyof typeof OrganizationRolePermissions[OrganizationRoleEnum];

export function getOrganizationRoleByName(roleName: string): OrganizationRoleEnum | undefined {
  const normalizedRoleName = roleName.toLowerCase();
  return Object.values(OrganizationRoleEnum).find(
    role => role.toLowerCase() === normalizedRoleName
  );
}

export function getOrganizationRoleLabel(role: OrganizationRoleEnum): string {
  return OrganizationRoleLabels[role] || 'Okänd roll';
}

export function getOrganizationRoleDescription(role: OrganizationRoleEnum): string {
  return OrganizationRoleDescriptions[role] || 'Ingen beskrivning tillgänglig';
}

export function isValidOrganizationRole(role: string): role is OrganizationRoleEnum {
  return Object.values(OrganizationRoleEnum).includes(role as OrganizationRoleEnum);
}

export function hasPermission(role: OrganizationRoleEnum, permission: OrganizationRolePermission): boolean {
  return OrganizationRolePermissions[role].includes(permission);
}

/**
 * Försöker konvertera en sträng eller OrganizationRole till ett OrganizationRole-värde
 * Användbart för tester och gränssnitt
 */
export function parseOrganizationRole(role: string | OrganizationRole): Result<OrganizationRole, string> {
  if (typeof role === 'string') {
    // Om rollen är en sträng, försök skapa ett OrganizationRole-objekt
    const normalizedRole = role.toLowerCase();
    
    // Översätt strängen till motsvarande OrganizationRole-instans
    switch (normalizedRole) {
      case 'owner':
        return ok(OrganizationRole.OWNER);
      case 'admin':
        return ok(OrganizationRole.ADMIN);
      case 'member':
        return ok(OrganizationRole.MEMBER);
      case 'invited':
        return ok(OrganizationRole.INVITED);
      default:
        return err(`Ogiltig organisationsroll: ${role}`);
    }
  }
  
  // Om det redan är ett OrganizationRole-värde
  return ok(role);
} 