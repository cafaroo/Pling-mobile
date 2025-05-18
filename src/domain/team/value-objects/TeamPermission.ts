import { ValueObject } from '@/shared/domain/ValueObject';
import { TeamRole } from './TeamRole';
import { Result, ok, err } from '@/shared/core/Result';

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
  DELETE_GOALS = 'delete_goals',

  // Admin
  ADMIN_ACCESS = 'admin_access',
  MANAGE_TEAM = 'manage_team',
  UPDATE_TEAM_SETTINGS = 'update_team_settings',
  APPROVE_MEMBERS = 'approve_members',
  MANAGE_CONTENT = 'manage_content',
  CREATE_POSTS = 'create_posts',
  DELETE_POSTS = 'delete_posts',
  VIEW_STATISTICS = 'view_statistics',
  EXPORT_DATA = 'export_data',
  MANAGE_CHANNELS = 'manage_channels',
  ASSIGN_GOALS = 'assign_goals',
  COMPLETE_GOALS = 'complete_goals'
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
  },

  // Admin
  [TeamPermission.ADMIN_ACCESS]: {
    permission: TeamPermission.ADMIN_ACCESS,
    category: 'admin',
    label: 'Administratörsåtkomst',
    description: 'Har full administratörsåtkomst till teamet'
  },
  [TeamPermission.MANAGE_TEAM]: {
    permission: TeamPermission.MANAGE_TEAM,
    category: 'admin',
    label: 'Hantera team',
    description: 'Kan hantera alla aspekter av teamet'
  },
  [TeamPermission.UPDATE_TEAM_SETTINGS]: {
    permission: TeamPermission.UPDATE_TEAM_SETTINGS,
    category: 'admin',
    label: 'Uppdatera teaminställningar',
    description: 'Kan ändra avancerade teaminställningar'
  },
  [TeamPermission.APPROVE_MEMBERS]: {
    permission: TeamPermission.APPROVE_MEMBERS,
    category: 'admin',
    label: 'Godkänn medlemmar',
    description: 'Kan godkänna nya medlemsansökningar'
  },
  [TeamPermission.MANAGE_CONTENT]: {
    permission: TeamPermission.MANAGE_CONTENT,
    category: 'admin',
    label: 'Hantera innehåll',
    description: 'Kan hantera allt innehåll i teamet'
  },
  [TeamPermission.CREATE_POSTS]: {
    permission: TeamPermission.CREATE_POSTS,
    category: 'admin',
    label: 'Skapa inlägg',
    description: 'Kan skapa officiella teaminlägg'
  },
  [TeamPermission.DELETE_POSTS]: {
    permission: TeamPermission.DELETE_POSTS,
    category: 'admin',
    label: 'Ta bort inlägg',
    description: 'Kan ta bort alla inlägg'
  },
  [TeamPermission.VIEW_STATISTICS]: {
    permission: TeamPermission.VIEW_STATISTICS,
    category: 'admin',
    label: 'Se statistik',
    description: 'Kan se detaljerad teamstatistik'
  },
  [TeamPermission.EXPORT_DATA]: {
    permission: TeamPermission.EXPORT_DATA,
    category: 'admin',
    label: 'Exportera data',
    description: 'Kan exportera teamdata'
  },
  [TeamPermission.MANAGE_CHANNELS]: {
    permission: TeamPermission.MANAGE_CHANNELS,
    category: 'admin',
    label: 'Hantera kanaler',
    description: 'Kan hantera kommunikationskanaler'
  },
  [TeamPermission.ASSIGN_GOALS]: {
    permission: TeamPermission.ASSIGN_GOALS,
    category: 'admin',
    label: 'Tilldela mål',
    description: 'Kan tilldela mål till medlemmar'
  },
  [TeamPermission.COMPLETE_GOALS]: {
    permission: TeamPermission.COMPLETE_GOALS,
    category: 'admin',
    label: 'Markera mål som klara',
    description: 'Kan markera mål som slutförda'
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
    TeamPermission.DELETE_GOALS,
    TeamPermission.ADMIN_ACCESS,
    TeamPermission.MANAGE_TEAM,
    TeamPermission.UPDATE_TEAM_SETTINGS,
    TeamPermission.APPROVE_MEMBERS,
    TeamPermission.MANAGE_CONTENT,
    TeamPermission.CREATE_POSTS,
    TeamPermission.DELETE_POSTS,
    TeamPermission.VIEW_STATISTICS,
    TeamPermission.EXPORT_DATA,
    TeamPermission.MANAGE_CHANNELS,
    TeamPermission.ASSIGN_GOALS,
    TeamPermission.COMPLETE_GOALS
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
 * Kontrollerar om ett TeamPermission-värde är lika med ett annat värde
 * Användbart för att jämföra enums med strängar i tester och applikation
 */
export function equalsTeamPermission(
  permission: TeamPermission,
  otherPermission: TeamPermission | string
): boolean {
  if (typeof otherPermission === 'string') {
    return permission === otherPermission;
  }
  return permission === otherPermission;
}

/**
 * Försöker konvertera en sträng till ett TeamPermission-värde
 * Användbart för tester och gränssnitt där vi tar emot strängar
 */
export function parseTeamPermission(permissionStr: string): Result<TeamPermission, string> {
  const normalizedStr = permissionStr.toLowerCase();
  
  // Kolla om strängen matchar någon av enum-värdena
  const matchingPermission = Object.values(TeamPermission).find(
    p => p.toLowerCase() === normalizedStr
  );
  
  if (matchingPermission) {
    return ok(matchingPermission);
  }
  
  return err(`"${permissionStr}" är inte en giltig teambehörighet`);
}

/**
 * Funktion för att hantera både gamla och nya sätt att jämföra permissions
 * Hjälper med testkompatibilitet
 */
export function hasTeamPermission(
  userPermissions: TeamPermission[] | string[],
  requiredPermission: TeamPermission | string
): boolean {
  return userPermissions.some(permission => {
    if (typeof permission === 'string' && typeof requiredPermission === 'string') {
      return permission === requiredPermission;
    }
    
    if (typeof permission === 'string' && typeof requiredPermission !== 'string') {
      return permission === requiredPermission.toString();
    }
    
    if (typeof permission !== 'string' && typeof requiredPermission === 'string') {
      return permission.toString() === requiredPermission;
    }
    
    return permission === requiredPermission;
  });
} 