import { ValueObject } from '@/shared/core/ValueObject';
import { TeamRole } from './TeamRole';
import { Result, ok, err } from '@/shared/core/Result';

/**
 * Enum för alla tillgängliga team-behörigheter
 */
export enum TeamPermissionEnum {
  // Grundläggande behörigheter
  VIEW_TEAM = 'VIEW_TEAM',
  EDIT_TEAM = 'EDIT_TEAM',
  DELETE_TEAM = 'DELETE_TEAM',
  
  // Medlemsbehörigheter
  VIEW_MEMBERS = 'VIEW_MEMBERS',
  ADD_MEMBERS = 'ADD_MEMBERS',
  REMOVE_MEMBERS = 'REMOVE_MEMBERS',
  CHANGE_MEMBER_ROLE = 'CHANGE_MEMBER_ROLE',
  
  // Aktivitetsbehörigheter
  VIEW_ACTIVITIES = 'VIEW_ACTIVITIES',
  CREATE_ACTIVITY = 'CREATE_ACTIVITY',
  EDIT_ACTIVITY = 'EDIT_ACTIVITY',
  DELETE_ACTIVITY = 'DELETE_ACTIVITY',
  
  // Inställningsbehörigheter
  VIEW_SETTINGS = 'VIEW_SETTINGS',
  EDIT_SETTINGS = 'EDIT_SETTINGS'
}

/**
 * Type-alias för alla TeamPermission-värden som strängar
 */
export type TeamPermission = keyof typeof TeamPermissionEnum | TeamPermissionEnum;

/**
 * Props för TeamPermissionValue
 */
interface TeamPermissionValueProps {
  permission: TeamPermissionEnum;
}

/**
 * Value Object för TeamPermission som säkerställer att behörigheter är giltiga
 */
export class TeamPermissionValue extends ValueObject<TeamPermissionValueProps> {
  /**
   * Privat konstruktor - använd static factory-metoder istället
   */
  private constructor(props: TeamPermissionValueProps) {
    super(props);
  }

  /**
   * Validerar att en behörighet är giltig
   */
  private static isValidPermission(permission: TeamPermission): boolean {
    const permissionEnumValues = Object.values(TeamPermissionEnum);
    
    if (typeof permission === 'string') {
      return permissionEnumValues.includes(permission as TeamPermissionEnum);
    }
    
    return permissionEnumValues.includes(permission);
  }

  /**
   * Skapar en ny TeamPermissionValue med validering
   */
  public static create(permission: TeamPermission): Result<TeamPermissionValue, string> {
    if (!this.isValidPermission(permission)) {
      return err(`"${permission}" är inte en giltig TeamPermission`);
    }

    // Konvertera till enum-värde om det är en sträng
    const permissionEnum = typeof permission === 'string' 
      ? permission as TeamPermissionEnum 
      : permission;
    
    return ok(new TeamPermissionValue({ permission: permissionEnum }));
  }

  /**
   * Jämför med rått värde (sträng eller enum)
   */
  public equalsValue(value?: TeamPermission): boolean {
    if (value === null || value === undefined) {
      return false;
    }
    
    if (typeof value === 'string') {
      return this.props.permission === value;
    }
    
    return this.props.permission === value;
  }

  /**
   * Returnerar strängrepresentation av behörigheten
   */
  public toString(): string {
    return this.props.permission;
  }

  /**
   * Returnerar det faktiska enum-värdet
   */
  public value(): TeamPermissionEnum {
    return this.props.permission;
  }
}

export type PermissionCategory = 'basic' | 'members' | 'activities' | 'communication' | 'resources' | 'goals' | 'admin';

export interface PermissionDefinition {
  permission: TeamPermission;
  category: PermissionCategory;
  label: string;
  description: string;
}

export const TeamPermissionDetails: Record<TeamPermission, PermissionDefinition> = {
  // Grundläggande behörigheter
  [TeamPermissionEnum.VIEW_TEAM]: {
    permission: TeamPermissionEnum.VIEW_TEAM,
    category: 'basic',
    label: 'Se team',
    description: 'Kan visa teamet och grundläggande information'
  },
  [TeamPermissionEnum.EDIT_TEAM]: {
    permission: TeamPermissionEnum.EDIT_TEAM,
    category: 'basic',
    label: 'Redigera team',
    description: 'Kan ändra teamets namn, beskrivning och inställningar'
  },
  [TeamPermissionEnum.DELETE_TEAM]: {
    permission: TeamPermissionEnum.DELETE_TEAM,
    category: 'basic',
    label: 'Ta bort team',
    description: 'Kan ta bort teamet permanent'
  },
  
  // Medlemshantering
  [TeamPermissionEnum.VIEW_MEMBERS]: {
    permission: TeamPermissionEnum.VIEW_MEMBERS,
    category: 'members',
    label: 'Se medlemmar',
    description: 'Kan se medlemmar i teamet'
  },
  [TeamPermissionEnum.ADD_MEMBERS]: {
    permission: TeamPermissionEnum.ADD_MEMBERS,
    category: 'members',
    label: 'Bjud in medlemmar',
    description: 'Kan bjuda in nya medlemmar till teamet'
  },
  [TeamPermissionEnum.REMOVE_MEMBERS]: {
    permission: TeamPermissionEnum.REMOVE_MEMBERS,
    category: 'members',
    label: 'Ta bort medlemmar',
    description: 'Kan ta bort medlemmar från teamet'
  },
  [TeamPermissionEnum.CHANGE_MEMBER_ROLE]: {
    permission: TeamPermissionEnum.CHANGE_MEMBER_ROLE,
    category: 'members',
    label: 'Ändra medlemmars roller',
    description: 'Kan ändra medlemmars roller'
  },
  
  // Aktiviteter
  [TeamPermissionEnum.VIEW_ACTIVITIES]: {
    permission: TeamPermissionEnum.VIEW_ACTIVITIES,
    category: 'activities',
    label: 'Se aktiviteter',
    description: 'Kan se aktiviteter i teamet'
  },
  [TeamPermissionEnum.CREATE_ACTIVITY]: {
    permission: TeamPermissionEnum.CREATE_ACTIVITY,
    category: 'activities',
    label: 'Skapa aktiviteter',
    description: 'Kan skapa nya aktiviteter i teamet'
  },
  [TeamPermissionEnum.EDIT_ACTIVITY]: {
    permission: TeamPermissionEnum.EDIT_ACTIVITY,
    category: 'activities',
    label: 'Redigera aktiviteter',
    description: 'Kan ändra existerande aktiviteter'
  },
  [TeamPermissionEnum.DELETE_ACTIVITY]: {
    permission: TeamPermissionEnum.DELETE_ACTIVITY,
    category: 'activities',
    label: 'Ta bort aktiviteter',
    description: 'Kan ta bort aktiviteter från teamet'
  },
  
  // Inställningsbehörigheter
  [TeamPermissionEnum.VIEW_SETTINGS]: {
    permission: TeamPermissionEnum.VIEW_SETTINGS,
    category: 'admin',
    label: 'Se teaminställningar',
    description: 'Kan se teaminställningar'
  },
  [TeamPermissionEnum.EDIT_SETTINGS]: {
    permission: TeamPermissionEnum.EDIT_SETTINGS,
    category: 'admin',
    label: 'Ändra teaminställningar',
    description: 'Kan ändra teaminställningar'
  }
};

// Säkra nyckeltyper för DefaultRolePermissions
type RoleKey = string;

export const DefaultRolePermissions: Record<RoleKey, TeamPermissionEnum[]> = {
  // Använd strängvärden istället för computed properties
  'OWNER': Object.values(TeamPermissionEnum),
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
  'MEMBER': [
    TeamPermissionEnum.VIEW_TEAM,
    TeamPermissionEnum.VIEW_MEMBERS,
    TeamPermissionEnum.VIEW_ACTIVITIES,
    TeamPermissionEnum.VIEW_SETTINGS
  ]
};

export function getPermissionsByCategory(category: PermissionCategory): PermissionDefinition[] {
  return Object.values(TeamPermissionDetails).filter(
    permission => permission.category === category
  );
}

export function getPermissionLabel(permission: TeamPermission): string {
  return TeamPermissionDetails[permission]?.label || permission;
}

export function getPermissionDescription(permission: TeamPermission): string {
  return TeamPermissionDetails[permission]?.description || '';
}

/**
 * Kontrollerar om ett TeamPermission-värde är lika med ett annat värde
 * Användbart för att jämföra enums med strängar i tester och applikation
 */
export function equalsTeamPermission(
  permission: TeamPermission | TeamPermissionValue,
  otherPermission: TeamPermission | TeamPermissionValue | string
): boolean {
  // Om permission är TeamPermissionValue och har equalsValue-metod, använd den
  if (permission instanceof TeamPermissionValue) {
    // Säker typning för parameter till equalsValue
    return permission.equalsValue(
      otherPermission instanceof TeamPermissionValue ? 
        otherPermission.value() : 
        (otherPermission as TeamPermission)
    );
  }
  
  // Om permission är enum och otherPermission är TeamPermissionValue
  if (otherPermission instanceof TeamPermissionValue) {
    return permission === otherPermission.value();
  }
  
  // Om båda är strängar eller enums
  if (typeof otherPermission === 'string') {
    return permission === otherPermission;
  }
  
  return permission === otherPermission;
}

/**
 * Försöker konvertera en sträng till ett TeamPermission-värde
 * Användbart för tester och gränssnitt där vi tar emot strängar
 */
export function parseTeamPermission(permissionStr: string): Result<TeamPermissionValue | TeamPermission, string> {
  // Försök konvertera till TeamPermissionValue först
  const teamPermissionValueResult = TeamPermissionValue.create(permissionStr as TeamPermission);
  if (teamPermissionValueResult.isOk()) {
    return ok(teamPermissionValueResult.value);
  }
  
  // Alternativt, försök matcha med enum-värdet direkt
  const normalizedStr = permissionStr.toLowerCase();
  
  // Kolla om strängen matchar någon av enum-värdena
  const matchingPermission = Object.values(TeamPermissionEnum).find(
    p => p.toLowerCase() === normalizedStr
  );
  
  if (matchingPermission) {
    return ok(matchingPermission as TeamPermission);
  }
  
  return err(`"${permissionStr}" är inte en giltig teambehörighet`);
}

/**
 * Funktion för att hantera både gamla och nya sätt att jämföra permissions
 * Hjälper med testkompatibilitet
 */
export function hasTeamPermission(
  userPermissions: (TeamPermission | TeamPermissionValue | string)[],
  requiredPermission: TeamPermission | TeamPermissionValue | string
): boolean {
  return userPermissions.some(permission => {
    // Om permission är en TeamPermissionValue
    if (permission instanceof TeamPermissionValue) {
      // Säker typning vid anrop till equalsValue
      if (requiredPermission instanceof TeamPermissionValue) {
        return permission.value() === requiredPermission.value();
      }
      return permission.value() === requiredPermission;
    }
    
    // Om requiredPermission är en TeamPermissionValue
    if (requiredPermission instanceof TeamPermissionValue) {
      return permission === requiredPermission.value();
    }
    
    // Strängjämförelser
    if (typeof permission === 'string' && typeof requiredPermission === 'string') {
      return permission === requiredPermission;
    }
    
    // Mixed jämförelser mellan objekt och strängar
    const permStr = typeof permission === 'string' ? 
      permission : String(permission);
      
    const reqPermStr = typeof requiredPermission === 'string' ? 
      requiredPermission : String(requiredPermission);
      
    return permStr === reqPermStr;
  });
} 