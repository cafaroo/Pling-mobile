/**
 * Definierar olika typer av aktiviteter som kan utföras inom ett team
 */
export enum ActivityType {
  // Medlemsrelaterade aktiviteter
  MEMBER_JOINED = 'member_joined',
  MEMBER_LEFT = 'member_left',
  MEMBER_ROLE_CHANGED = 'member_role_changed',
  
  // Inbjudningsrelaterade aktiviteter
  INVITATION_SENT = 'invitation_sent',
  INVITATION_ACCEPTED = 'invitation_accepted',
  INVITATION_DECLINED = 'invitation_declined',
  
  // Teamrelaterade aktiviteter
  TEAM_CREATED = 'team_created',
  TEAM_UPDATED = 'team_updated',
  TEAM_SETTINGS_UPDATED = 'team_settings_updated',
  
  // Målrelaterade aktiviteter
  GOAL_CREATED = 'goal_created',
  GOAL_UPDATED = 'goal_updated',
  GOAL_COMPLETED = 'goal_completed',
  GOAL_DELETED = 'goal_deleted',
  GOAL_ASSIGNED = 'goal_assigned',
  
  // Aktivitetsrelaterade aktiviteter (när TeamActivity integreras med Activity-domänen)
  ACTIVITY_CREATED = 'activity_created',
  ACTIVITY_COMPLETED = 'activity_completed',
  ACTIVITY_JOINED = 'activity_joined',
  
  // Resursrelaterade aktiviteter (förberedelse för kommande funktionalitet)
  RESOURCE_ADDED = 'resource_added',
  RESOURCE_UPDATED = 'resource_updated',
  RESOURCE_REMOVED = 'resource_removed',
  
  // Kommunikationsrelaterade aktiviteter
  MESSAGE_SENT = 'message_sent',
  COMMENT_ADDED = 'comment_added',
  REACTION_ADDED = 'reaction_added',
  
  // Övriga aktiviteter
  CUSTOM_EVENT = 'custom_event'
}

/**
 * Gruppera aktivitetstyper efter kategori för enklare filtrering
 */
export const ActivityCategories = {
  MEMBER: [
    ActivityType.MEMBER_JOINED,
    ActivityType.MEMBER_LEFT,
    ActivityType.MEMBER_ROLE_CHANGED
  ],
  INVITATION: [
    ActivityType.INVITATION_SENT,
    ActivityType.INVITATION_ACCEPTED,
    ActivityType.INVITATION_DECLINED
  ],
  TEAM: [
    ActivityType.TEAM_CREATED,
    ActivityType.TEAM_UPDATED,
    ActivityType.TEAM_SETTINGS_UPDATED
  ],
  GOAL: [
    ActivityType.GOAL_CREATED,
    ActivityType.GOAL_UPDATED,
    ActivityType.GOAL_COMPLETED,
    ActivityType.GOAL_DELETED,
    ActivityType.GOAL_ASSIGNED
  ],
  ACTIVITY: [
    ActivityType.ACTIVITY_CREATED,
    ActivityType.ACTIVITY_COMPLETED,
    ActivityType.ACTIVITY_JOINED
  ],
  RESOURCE: [
    ActivityType.RESOURCE_ADDED,
    ActivityType.RESOURCE_UPDATED,
    ActivityType.RESOURCE_REMOVED
  ],
  CHAT: [
    ActivityType.MESSAGE_SENT,
    ActivityType.COMMENT_ADDED,
    ActivityType.REACTION_ADDED
  ],
  OTHER: [
    ActivityType.CUSTOM_EVENT
  ]
} as const; 