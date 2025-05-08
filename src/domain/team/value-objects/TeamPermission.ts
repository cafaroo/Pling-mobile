import { ValueObject } from '@/shared/domain/ValueObject';
import { TeamRole } from './TeamRole';

export enum TeamPermission {
  // Grundläggande behörigheter
  VIEW_TEAM = 'view_team',
  EDIT_TEAM = 'edit_team',
  DELETE_TEAM = 'delete_team',
  
  // Medlemshantering
  INVITE_MEMBERS = 'invite_members',
  REMOVE_MEMBERS = 'remove_members',
  MANAGE_ROLES = 'manage_roles',
  
  // Aktiviteter
  CREATE_ACTIVITIES = 'create_activities',
  EDIT_ACTIVITIES = 'edit_activities',
  DELETE_ACTIVITIES = 'delete_activities',
  JOIN_ACTIVITIES = 'join_activities',
  
  // Kommunikation
  SEND_MESSAGES = 'send_messages',
  MODERATE_MESSAGES = 'moderate_messages',
  
  // Resurshantering
  UPLOAD_FILES = 'upload_files',
  MANAGE_FILES = 'manage_files',
  
  // Målhantering
  CREATE_GOALS = 'create_goals',
  EDIT_GOALS = 'edit_goals',
  DELETE_GOALS = 'delete_goals'
}

export type PermissionCategory = 'basic' | 'members' | 'activities' | 'communication' | 'resources' | 'goals';

export interface PermissionDefinition {
  permission: TeamPermission;
  category: PermissionCategory;
  label: string;
  description: string;
}

export const TeamPermissionDetails: Record<TeamPermission, PermissionDefinition> = {
  // Grundläggande behörigheter
  [TeamPermission.VIEW_TEAM]: {
    permission: TeamPermission.VIEW_TEAM,
    category: 'basic',
    label: 'Se team',
    description: 'Kan visa teamet och grundläggande information'
  },
  [TeamPermission.EDIT_TEAM]: {
    permission: TeamPermission.EDIT_TEAM,
    category: 'basic',
    label: 'Redigera team',
    description: 'Kan ändra teamets namn, beskrivning och inställningar'
  },
  [TeamPermission.DELETE_TEAM]: {
    permission: TeamPermission.DELETE_TEAM,
    category: 'basic',
    label: 'Ta bort team',
    description: 'Kan ta bort teamet permanent'
  },
  
  // Medlemshantering
  [TeamPermission.INVITE_MEMBERS]: {
    permission: TeamPermission.INVITE_MEMBERS,
    category: 'members',
    label: 'Bjud in medlemmar',
    description: 'Kan bjuda in nya medlemmar till teamet'
  },
  [TeamPermission.REMOVE_MEMBERS]: {
    permission: TeamPermission.REMOVE_MEMBERS,
    category: 'members',
    label: 'Ta bort medlemmar',
    description: 'Kan ta bort medlemmar från teamet'
  },
  [TeamPermission.MANAGE_ROLES]: {
    permission: TeamPermission.MANAGE_ROLES,
    category: 'members',
    label: 'Hantera roller',
    description: 'Kan ändra medlemmars roller och behörigheter'
  },
  
  // Aktiviteter
  [TeamPermission.CREATE_ACTIVITIES]: {
    permission: TeamPermission.CREATE_ACTIVITIES,
    category: 'activities',
    label: 'Skapa aktiviteter',
    description: 'Kan skapa nya aktiviteter i teamet'
  },
  [TeamPermission.EDIT_ACTIVITIES]: {
    permission: TeamPermission.EDIT_ACTIVITIES,
    category: 'activities',
    label: 'Redigera aktiviteter',
    description: 'Kan ändra existerande aktiviteter'
  },
  [TeamPermission.DELETE_ACTIVITIES]: {
    permission: TeamPermission.DELETE_ACTIVITIES,
    category: 'activities',
    label: 'Ta bort aktiviteter',
    description: 'Kan ta bort aktiviteter från teamet'
  },
  [TeamPermission.JOIN_ACTIVITIES]: {
    permission: TeamPermission.JOIN_ACTIVITIES,
    category: 'activities',
    label: 'Delta i aktiviteter',
    description: 'Kan delta i teamets aktiviteter'
  },
  
  // Kommunikation
  [TeamPermission.SEND_MESSAGES]: {
    permission: TeamPermission.SEND_MESSAGES,
    category: 'communication',
    label: 'Skicka meddelanden',
    description: 'Kan skicka meddelanden i teamchatten'
  },
  [TeamPermission.MODERATE_MESSAGES]: {
    permission: TeamPermission.MODERATE_MESSAGES,
    category: 'communication',
    label: 'Moderera meddelanden',
    description: 'Kan redigera och ta bort andras meddelanden'
  },
  
  // Resurshantering
  [TeamPermission.UPLOAD_FILES]: {
    permission: TeamPermission.UPLOAD_FILES,
    category: 'resources',
    label: 'Ladda upp filer',
    description: 'Kan ladda upp filer till teamets resursbibliotek'
  },
  [TeamPermission.MANAGE_FILES]: {
    permission: TeamPermission.MANAGE_FILES,
    category: 'resources',
    label: 'Hantera filer',
    description: 'Kan organisera, redigera och ta bort filer'
  },
  
  // Målhantering
  [TeamPermission.CREATE_GOALS]: {
    permission: TeamPermission.CREATE_GOALS,
    category: 'goals',
    label: 'Skapa mål',
    description: 'Kan skapa nya mål för teamet'
  },
  [TeamPermission.EDIT_GOALS]: {
    permission: TeamPermission.EDIT_GOALS,
    category: 'goals',
    label: 'Redigera mål',
    description: 'Kan ändra existerande mål'
  },
  [TeamPermission.DELETE_GOALS]: {
    permission: TeamPermission.DELETE_GOALS,
    category: 'goals',
    label: 'Ta bort mål',
    description: 'Kan ta bort teamets mål'
  }
};

export const DefaultRolePermissions = {
  [TeamRole.OWNER]: Object.values(TeamPermission),
  [TeamRole.ADMIN]: [
    TeamPermission.VIEW_TEAM,
    TeamPermission.EDIT_TEAM,
    TeamPermission.INVITE_MEMBERS,
    TeamPermission.REMOVE_MEMBERS,
    TeamPermission.MANAGE_ROLES,
    TeamPermission.CREATE_ACTIVITIES,
    TeamPermission.EDIT_ACTIVITIES,
    TeamPermission.DELETE_ACTIVITIES,
    TeamPermission.JOIN_ACTIVITIES,
    TeamPermission.SEND_MESSAGES,
    TeamPermission.MODERATE_MESSAGES,
    TeamPermission.UPLOAD_FILES,
    TeamPermission.MANAGE_FILES,
    TeamPermission.CREATE_GOALS,
    TeamPermission.EDIT_GOALS,
    TeamPermission.DELETE_GOALS
  ],
  [TeamRole.MEMBER]: [
    TeamPermission.VIEW_TEAM,
    TeamPermission.JOIN_ACTIVITIES,
    TeamPermission.SEND_MESSAGES,
    TeamPermission.UPLOAD_FILES
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
 * Value object för behörigheter i team-domänen
 */
export class TeamPermission extends ValueObject<string> {
  // Team Management
  public static readonly MANAGE_TEAM = 'manage_team';
  public static readonly UPDATE_TEAM_SETTINGS = 'update_team_settings';
  public static readonly DELETE_TEAM = 'delete_team';
  
  // Member Management
  public static readonly INVITE_MEMBERS = 'invite_members';
  public static readonly REMOVE_MEMBERS = 'remove_members';
  public static readonly MANAGE_ROLES = 'manage_roles';
  public static readonly APPROVE_MEMBERS = 'approve_members';
  
  // Content Management
  public static readonly MANAGE_CONTENT = 'manage_content';
  public static readonly CREATE_POSTS = 'create_posts';
  public static readonly DELETE_POSTS = 'delete_posts';
  
  // Statistics
  public static readonly VIEW_STATISTICS = 'view_statistics';
  public static readonly EXPORT_DATA = 'export_data';
  
  // Communication
  public static readonly SEND_MESSAGES = 'send_messages';
  public static readonly MANAGE_CHANNELS = 'manage_channels';
  
  // Goals
  public static readonly CREATE_GOALS = 'create_goals';
  public static readonly ASSIGN_GOALS = 'assign_goals';
  public static readonly COMPLETE_GOALS = 'complete_goals';
  
  // Admin
  public static readonly ADMIN_ACCESS = 'admin_access';

  private _name: string;
  private _description: string;
  private _category: PermissionCategory;

  private constructor(name: string, description: string, category: PermissionCategory) {
    super(name);
    this._name = name;
    this._description = description;
    this._category = category;
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get category(): PermissionCategory {
    return this._category;
  }

  // Skapa en behörighet från ett namn
  public static create(name: string): TeamPermission {
    const permission = this.getPermissionDefinition(name);
    if (!permission) {
      throw new Error(`Ogiltig teambehörighet: ${name}`);
    }
    return permission;
  }

  // Returnera alla möjliga behörigheter
  public static createAll(): TeamPermission[] {
    return [
      this.createManageTeam(),
      this.createUpdateTeamSettings(),
      this.createDeleteTeam(),
      this.createInviteMembers(),
      this.createRemoveMembers(),
      this.createManageRoles(),
      this.createApproveMembers(),
      this.createManageContent(),
      this.createCreatePosts(),
      this.createDeletePosts(),
      this.createViewStatistics(),
      this.createExportData(),
      this.createSendMessages(),
      this.createManageChannels(),
      this.createCreateGoals(),
      this.createAssignGoals(),
      this.createCompleteGoals(),
      this.createAdminAccess()
    ];
  }

  // Hitta behörighet baserat på namn
  private static getPermissionDefinition(name: string): TeamPermission | undefined {
    const allPermissions = this.createAll();
    return allPermissions.find(p => p.name === name);
  }

  // Olika behörighetsdefinitioner
  
  // Team Management
  private static createManageTeam(): TeamPermission {
    return new TeamPermission(
      this.MANAGE_TEAM,
      'Fullständig kontroll över teamet',
      PermissionCategory.TEAM_MANAGEMENT
    );
  }

  private static createUpdateTeamSettings(): TeamPermission {
    return new TeamPermission(
      this.UPDATE_TEAM_SETTINGS,
      'Uppdatera teaminställningar',
      PermissionCategory.TEAM_MANAGEMENT
    );
  }

  private static createDeleteTeam(): TeamPermission {
    return new TeamPermission(
      this.DELETE_TEAM,
      'Ta bort teamet',
      PermissionCategory.TEAM_MANAGEMENT
    );
  }
  
  // Member Management
  private static createInviteMembers(): TeamPermission {
    return new TeamPermission(
      this.INVITE_MEMBERS,
      'Bjuda in nya medlemmar till teamet',
      PermissionCategory.MEMBER_MANAGEMENT
    );
  }

  private static createRemoveMembers(): TeamPermission {
    return new TeamPermission(
      this.REMOVE_MEMBERS,
      'Ta bort medlemmar från teamet',
      PermissionCategory.MEMBER_MANAGEMENT
    );
  }

  private static createManageRoles(): TeamPermission {
    return new TeamPermission(
      this.MANAGE_ROLES,
      'Hantera roller och behörigheter',
      PermissionCategory.MEMBER_MANAGEMENT
    );
  }

  private static createApproveMembers(): TeamPermission {
    return new TeamPermission(
      this.APPROVE_MEMBERS,
      'Godkänna medlemsansökningar',
      PermissionCategory.MEMBER_MANAGEMENT
    );
  }
  
  // Content Management
  private static createManageContent(): TeamPermission {
    return new TeamPermission(
      this.MANAGE_CONTENT,
      'Hantera allt teaminnehåll',
      PermissionCategory.CONTENT_MANAGEMENT
    );
  }

  private static createCreatePosts(): TeamPermission {
    return new TeamPermission(
      this.CREATE_POSTS,
      'Skapa inlägg för teamet',
      PermissionCategory.CONTENT_MANAGEMENT
    );
  }

  private static createDeletePosts(): TeamPermission {
    return new TeamPermission(
      this.DELETE_POSTS,
      'Ta bort inlägg från teamet',
      PermissionCategory.CONTENT_MANAGEMENT
    );
  }
  
  // Statistics
  private static createViewStatistics(): TeamPermission {
    return new TeamPermission(
      this.VIEW_STATISTICS,
      'Visa teamstatistik och rapporter',
      PermissionCategory.STATISTICS
    );
  }

  private static createExportData(): TeamPermission {
    return new TeamPermission(
      this.EXPORT_DATA,
      'Exportera teamdata',
      PermissionCategory.STATISTICS
    );
  }
  
  // Communication
  private static createSendMessages(): TeamPermission {
    return new TeamPermission(
      this.SEND_MESSAGES,
      'Skicka meddelanden till teamet',
      PermissionCategory.COMMUNICATION
    );
  }

  private static createManageChannels(): TeamPermission {
    return new TeamPermission(
      this.MANAGE_CHANNELS,
      'Hantera kommunikationskanaler',
      PermissionCategory.COMMUNICATION
    );
  }
  
  // Goals
  private static createCreateGoals(): TeamPermission {
    return new TeamPermission(
      this.CREATE_GOALS,
      'Skapa mål för teamet',
      PermissionCategory.GOALS
    );
  }

  private static createAssignGoals(): TeamPermission {
    return new TeamPermission(
      this.ASSIGN_GOALS,
      'Tilldela mål till medlemmar',
      PermissionCategory.GOALS
    );
  }

  private static createCompleteGoals(): TeamPermission {
    return new TeamPermission(
      this.COMPLETE_GOALS,
      'Markera mål som avklarade',
      PermissionCategory.GOALS
    );
  }
  
  // Admin
  private static createAdminAccess(): TeamPermission {
    return new TeamPermission(
      this.ADMIN_ACCESS,
      'Fullständig administratörsåtkomst',
      PermissionCategory.ADMIN
    );
  }

  // Översätt värdet till en läsbar sträng
  public toString(): string {
    const friendlyNames: Record<string, string> = {
      'manage_team': 'Hantera team',
      'update_team_settings': 'Uppdatera inställningar',
      'delete_team': 'Ta bort team',
      'invite_members': 'Bjuda in medlemmar',
      'remove_members': 'Ta bort medlemmar',
      'manage_roles': 'Hantera roller',
      'approve_members': 'Godkänna medlemmar',
      'manage_content': 'Hantera innehåll',
      'create_posts': 'Skapa inlägg',
      'delete_posts': 'Ta bort inlägg',
      'view_statistics': 'Visa statistik',
      'export_data': 'Exportera data',
      'send_messages': 'Skicka meddelanden',
      'manage_channels': 'Hantera kanaler',
      'create_goals': 'Skapa mål',
      'assign_goals': 'Tilldela mål',
      'complete_goals': 'Slutföra mål',
      'admin_access': 'Administratörsåtkomst'
    };

    return friendlyNames[this.name] || this.name;
  }
} 