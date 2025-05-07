import { ValueObject } from '@/shared/domain/ValueObject';
import { Result, err, ok } from '@/shared/core/Result';
import { UniqueId } from '@/shared/domain/UniqueId';

/**
 * Enum med alla möjliga behörigheter i systemet
 */
export enum PermissionName {
  // Användarbehörigheter
  MANAGE_USERS = 'manage_users',
  VIEW_USERS = 'view_users',
  
  // Team-behörigheter
  MANAGE_TEAMS = 'manage_teams',
  CREATE_TEAM = 'create_team',
  JOIN_TEAM = 'join_team',
  INVITE_TO_TEAM = 'invite_to_team',
  
  // Innehållsbehörigheter
  MANAGE_CONTENT = 'manage_content',
  EDIT_CONTENT = 'edit_content',
  VIEW_CONTENT = 'view_content',
  
  // Inställningsbehörigheter
  MANAGE_SETTINGS = 'manage_settings',
  VIEW_SETTINGS = 'view_settings',
  
  // Analyticsbehörigheter
  VIEW_ANALYTICS = 'view_analytics',
  EXPORT_ANALYTICS = 'export_analytics',
  
  // Profilbehörigheter
  MANAGE_PROFILE = 'manage_profile',
  
  // Tävlingsbehörigheter
  MANAGE_COMPETITIONS = 'manage_competitions',
  CREATE_COMPETITION = 'create_competition',
  JOIN_COMPETITION = 'join_competition',
  
  // Målbehörigheter
  MANAGE_GOALS = 'manage_goals',
  CREATE_GOAL = 'create_goal',
  
  // Meddelandebehörigheter
  SEND_MESSAGES = 'send_messages',
  READ_MESSAGES = 'read_messages',
  MANAGE_MESSAGES = 'manage_messages',
  
  // Aktivitetsbehörigheter
  VIEW_ACTIVITY = 'view_activity',
  LOG_ACTIVITY = 'log_activity',
  EXPORT_ACTIVITY = 'export_activity',
  
  // Administrativa behörigheter
  MANAGE_SYSTEM = 'manage_system',
  VIEW_LOGS = 'view_logs',
  RESET_PASSWORDS = 'reset_passwords'
}

/**
 * Kategori-enum för gruppering av behörigheter
 */
export enum PermissionCategory {
  USER = 'user',
  TEAM = 'team',
  CONTENT = 'content',
  SETTINGS = 'settings',
  ANALYTICS = 'analytics',
  PROFILE = 'profile',
  COMPETITION = 'competition',
  GOAL = 'goal',
  MESSAGING = 'messaging',
  ACTIVITY = 'activity',
  ADMIN = 'admin'
}

/**
 * Map för att kategorisera behörigheter
 */
const PERMISSION_CATEGORIES: Record<PermissionName, PermissionCategory> = {
  [PermissionName.MANAGE_USERS]: PermissionCategory.USER,
  [PermissionName.VIEW_USERS]: PermissionCategory.USER,
  
  [PermissionName.MANAGE_TEAMS]: PermissionCategory.TEAM,
  [PermissionName.CREATE_TEAM]: PermissionCategory.TEAM,
  [PermissionName.JOIN_TEAM]: PermissionCategory.TEAM,
  [PermissionName.INVITE_TO_TEAM]: PermissionCategory.TEAM,
  
  [PermissionName.MANAGE_CONTENT]: PermissionCategory.CONTENT,
  [PermissionName.EDIT_CONTENT]: PermissionCategory.CONTENT,
  [PermissionName.VIEW_CONTENT]: PermissionCategory.CONTENT,
  
  [PermissionName.MANAGE_SETTINGS]: PermissionCategory.SETTINGS,
  [PermissionName.VIEW_SETTINGS]: PermissionCategory.SETTINGS,
  
  [PermissionName.VIEW_ANALYTICS]: PermissionCategory.ANALYTICS,
  [PermissionName.EXPORT_ANALYTICS]: PermissionCategory.ANALYTICS,
  
  [PermissionName.MANAGE_PROFILE]: PermissionCategory.PROFILE,
  
  [PermissionName.MANAGE_COMPETITIONS]: PermissionCategory.COMPETITION,
  [PermissionName.CREATE_COMPETITION]: PermissionCategory.COMPETITION,
  [PermissionName.JOIN_COMPETITION]: PermissionCategory.COMPETITION,
  
  [PermissionName.MANAGE_GOALS]: PermissionCategory.GOAL,
  [PermissionName.CREATE_GOAL]: PermissionCategory.GOAL,
  
  [PermissionName.SEND_MESSAGES]: PermissionCategory.MESSAGING,
  [PermissionName.READ_MESSAGES]: PermissionCategory.MESSAGING,
  [PermissionName.MANAGE_MESSAGES]: PermissionCategory.MESSAGING,
  
  [PermissionName.VIEW_ACTIVITY]: PermissionCategory.ACTIVITY,
  [PermissionName.LOG_ACTIVITY]: PermissionCategory.ACTIVITY,
  [PermissionName.EXPORT_ACTIVITY]: PermissionCategory.ACTIVITY,
  
  [PermissionName.MANAGE_SYSTEM]: PermissionCategory.ADMIN,
  [PermissionName.VIEW_LOGS]: PermissionCategory.ADMIN,
  [PermissionName.RESET_PASSWORDS]: PermissionCategory.ADMIN
};

/**
 * Map för beskrivningar av behörigheter
 */
const PERMISSION_DESCRIPTIONS: Record<PermissionName, string> = {
  [PermissionName.MANAGE_USERS]: 'Hantera alla användare och deras konton',
  [PermissionName.VIEW_USERS]: 'Se information om andra användare',
  
  [PermissionName.MANAGE_TEAMS]: 'Hantera alla team och deras inställningar',
  [PermissionName.CREATE_TEAM]: 'Skapa nya team',
  [PermissionName.JOIN_TEAM]: 'Gå med i existerande team',
  [PermissionName.INVITE_TO_TEAM]: 'Bjuda in andra användare till team',
  
  [PermissionName.MANAGE_CONTENT]: 'Hantera allt innehåll i systemet',
  [PermissionName.EDIT_CONTENT]: 'Redigera specifikt innehåll',
  [PermissionName.VIEW_CONTENT]: 'Se all tillgänglig innehåll',
  
  [PermissionName.MANAGE_SETTINGS]: 'Hantera systemets inställningar',
  [PermissionName.VIEW_SETTINGS]: 'Se systemets inställningar',
  
  [PermissionName.VIEW_ANALYTICS]: 'Se analytisk data och rapporter',
  [PermissionName.EXPORT_ANALYTICS]: 'Exportera analytisk data och rapporter',
  
  [PermissionName.MANAGE_PROFILE]: 'Hantera sin egen profil',
  
  [PermissionName.MANAGE_COMPETITIONS]: 'Hantera alla tävlingar i systemet',
  [PermissionName.CREATE_COMPETITION]: 'Skapa nya tävlingar',
  [PermissionName.JOIN_COMPETITION]: 'Delta i tävlingar',
  
  [PermissionName.MANAGE_GOALS]: 'Hantera och övervaka alla mål',
  [PermissionName.CREATE_GOAL]: 'Skapa nya mål',
  
  [PermissionName.SEND_MESSAGES]: 'Skicka meddelanden till andra användare',
  [PermissionName.READ_MESSAGES]: 'Läsa meddelanden från andra användare',
  [PermissionName.MANAGE_MESSAGES]: 'Hantera alla meddelanden i systemet',
  
  [PermissionName.VIEW_ACTIVITY]: 'Se aktivitetshistorik',
  [PermissionName.LOG_ACTIVITY]: 'Logga ny aktivitet',
  [PermissionName.EXPORT_ACTIVITY]: 'Exportera aktivitetsdata',
  
  [PermissionName.MANAGE_SYSTEM]: 'Administrera systemet på högsta nivå',
  [PermissionName.VIEW_LOGS]: 'Se systemloggar och felrapporter',
  [PermissionName.RESET_PASSWORDS]: 'Återställa användares lösenord'
};

/**
 * Map för att definiera behörighetshierarkier (inkludering)
 * Varje behörighet listar andra behörigheter som den automatiskt inkluderar
 */
const PERMISSION_INCLUDES: Partial<Record<PermissionName, PermissionName[]>> = {
  [PermissionName.MANAGE_USERS]: [
    PermissionName.VIEW_USERS,
    PermissionName.RESET_PASSWORDS
  ],
  
  [PermissionName.MANAGE_TEAMS]: [
    PermissionName.CREATE_TEAM,
    PermissionName.JOIN_TEAM,
    PermissionName.INVITE_TO_TEAM
  ],
  
  [PermissionName.MANAGE_CONTENT]: [
    PermissionName.EDIT_CONTENT,
    PermissionName.VIEW_CONTENT
  ],
  
  [PermissionName.MANAGE_SETTINGS]: [
    PermissionName.VIEW_SETTINGS
  ],
  
  [PermissionName.EXPORT_ANALYTICS]: [
    PermissionName.VIEW_ANALYTICS
  ],
  
  [PermissionName.MANAGE_COMPETITIONS]: [
    PermissionName.CREATE_COMPETITION,
    PermissionName.JOIN_COMPETITION
  ],
  
  [PermissionName.MANAGE_GOALS]: [
    PermissionName.CREATE_GOAL
  ],
  
  [PermissionName.MANAGE_MESSAGES]: [
    PermissionName.SEND_MESSAGES,
    PermissionName.READ_MESSAGES
  ],
  
  [PermissionName.EXPORT_ACTIVITY]: [
    PermissionName.VIEW_ACTIVITY
  ],
  
  [PermissionName.MANAGE_SYSTEM]: [
    PermissionName.MANAGE_USERS,
    PermissionName.MANAGE_TEAMS,
    PermissionName.MANAGE_CONTENT,
    PermissionName.MANAGE_SETTINGS,
    PermissionName.VIEW_LOGS,
    PermissionName.MANAGE_COMPETITIONS,
    PermissionName.MANAGE_GOALS,
    PermissionName.MANAGE_MESSAGES,
    PermissionName.EXPORT_ANALYTICS,
    PermissionName.EXPORT_ACTIVITY
  ]
};

/**
 * Behörighetsobjekt som representerar en specifik behörighet i systemet
 */
export class UserPermission extends ValueObject<string> {
  // Cachelagra alla skapade behörigheter för att förhindra dubbla instanser
  private static permissionInstances: Map<string, UserPermission> = new Map();
  
  private constructor(name: string) {
    super(name);
  }

  /**
   * Skapar en ny behörighet eller returnerar en existerande instans
   * för behörighetens namn
   */
  public static create(name: string): Result<UserPermission, Error> {
    // Validera att behörigheten finns i systemet
    if (!Object.values(PermissionName).includes(name as PermissionName)) {
      return err(
        new Error(`Behörigheten "${name}" är inte en giltig systembehörighet`)
      );
    }
    
    // Återanvänd behörighetsinstanser för att förhindra dubbla objekt
    if (!this.permissionInstances.has(name)) {
      this.permissionInstances.set(name, new UserPermission(name));
    }
    
    return ok(this.permissionInstances.get(name)!);
  }
  
  /**
   * Skapar behörigheter för alla systembehörigheter
   */
  public static createAll(): UserPermission[] {
    return Object.values(PermissionName).map(
      name => this.create(name).getValue()
    );
  }
  
  /**
   * Skapar behörigheter för en specifik kategori
   */
  public static createForCategory(category: PermissionCategory): UserPermission[] {
    return Object.entries(PERMISSION_CATEGORIES)
      .filter(([_, cat]) => cat === category)
      .map(([name]) => this.create(name as PermissionName).getValue());
  }
  
  /**
   * Returnerar alla kategorier i systemet
   */
  public static getAllCategories(): PermissionCategory[] {
    return Object.values(PermissionCategory);
  }
  
  /**
   * Grupperar alla behörigheter efter kategori
   */
  public static groupByCategory(): Record<PermissionCategory, UserPermission[]> {
    const result: Partial<Record<PermissionCategory, UserPermission[]>> = {};
    
    // Initiera tomma arrayer för varje kategori
    Object.values(PermissionCategory).forEach(category => {
      result[category] = [];
    });
    
    // Lägg till behörigheter i respektive kategori
    this.createAll().forEach(permission => {
      const category = permission.category;
      result[category]!.push(permission);
    });
    
    return result as Record<PermissionCategory, UserPermission[]>;
  }

  /**
   * Returnerar behörighetens namn
   */
  public get name(): string {
    return this.props;
  }
  
  /**
   * Returnerar behörighetens kategori
   */
  public get category(): PermissionCategory {
    return PERMISSION_CATEGORIES[this.name as PermissionName];
  }
  
  /**
   * Returnerar behörighetens beskrivning
   */
  public get description(): string {
    return PERMISSION_DESCRIPTIONS[this.name as PermissionName];
  }
  
  /**
   * Returnerar alla behörigheter som denna behörighet inkluderar
   */
  public get includedPermissions(): UserPermission[] {
    const directlyIncluded = PERMISSION_INCLUDES[this.name as PermissionName] || [];
    
    // Skapa en set för att undvika dubbletter
    const includedSet = new Set<string>();
    
    // Lägg till direkt inkluderade behörigheter
    directlyIncluded.forEach(permName => includedSet.add(permName));
    
    // Expandera rekursivt för att få alla transitivt inkluderade behörigheter
    const expandPermissions = (permissions: PermissionName[]) => {
      permissions.forEach(permName => {
        const nestedPerms = PERMISSION_INCLUDES[permName] || [];
        nestedPerms.forEach(nestedPerm => {
          if (!includedSet.has(nestedPerm)) {
            includedSet.add(nestedPerm);
            expandPermissions([nestedPerm]);
          }
        });
      });
    };
    
    expandPermissions(directlyIncluded);
    
    // Konvertera tillbaka till behörighetsobjekt
    return Array.from(includedSet).map(
      permName => UserPermission.create(permName).getValue()
    );
  }
  
  /**
   * Kontrollerar om denna behörighet automatiskt inkluderar en annan behörighet
   */
  public includes(permission: UserPermission): boolean {
    // En behörighet inkluderar alltid sig själv
    if (this.equals(permission)) {
      return true;
    }
    
    // Kontrollera om denna behörighet har den andra som underliggande
    return this.includedPermissions.some(included => 
      included.equals(permission)
    );
  }
  
  /**
   * Skapar en behörighetsidentifierare för kontrollsyften
   */
  public toIdentifier(): string {
    return `permission:${this.name}`;
  }
  
  /**
   * Returnerar en strängrepresentation av behörigheten
   */
  public toString(): string {
    return `${this.description} (${this.name})`;
  }
  
  /**
   * Jämför om två behörigheter är lika
   */
  public equals(other: UserPermission): boolean {
    return this.name === other.name;
  }

  /**
   * Kontrollerar om denna behörighet inkluderar en annan behörighet
   * (baserat på behörighetshierarkin)
   */
  public includesPermission(permissionName: string): boolean {
    // Kontrollera om denna behörighet är samma som den efterfrågade
    if (this.name === permissionName) {
      return true;
    }
    
    // Kontrollera om denna behörighet inkluderar andra behörigheter via hierarkin
    const includes = PERMISSION_INCLUDES[this.name as PermissionName];
    
    if (includes && includes.length > 0) {
      if (includes.includes(permissionName as PermissionName)) {
        return true;
      }
      
      // Rekursiv kontroll för hierarkiska behörigheter
      for (const includedPermName of includes) {
        try {
          const includedPerm = UserPermission.create(includedPermName).getValue();
          if (includedPerm.includesPermission(permissionName)) {
            return true;
          }
        } catch (error) {
          console.error(`Invalid permission in hierarchy: ${includedPermName}`, error);
        }
      }
    }
    
    return false;
  }
} 