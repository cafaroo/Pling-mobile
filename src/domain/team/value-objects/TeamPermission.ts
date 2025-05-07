import { ValueObject } from '@/shared/domain/ValueObject';

export enum PermissionCategory {
  TEAM_MANAGEMENT = 'team_management',
  MEMBER_MANAGEMENT = 'member_management',
  CONTENT_MANAGEMENT = 'content_management',
  STATISTICS = 'statistics',
  COMMUNICATION = 'communication',
  GOALS = 'goals',
  ADMIN = 'admin'
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