import { Database } from './supabase';
import { Profile } from './profile';
import React from 'react';

export type TeamStatus = 'active' | 'inactive' | 'archived';
export type TeamRole = 'owner' | 'admin' | 'moderator' | 'member' | 'guest';

export interface TeamSettings {
  allowInvites: boolean;
  maxMembers: number;
  requireAdminApproval: boolean;
  notificationPreferences: {
    newMembers: boolean;
    chatMessages: boolean;
    teamUpdates: boolean;
    mentions: boolean;
  };
  customTheme?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
  };
  privacy: {
    isPublic: boolean;
    allowMemberInvites: boolean;
    showMemberList: boolean;
  };
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  organization_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive' | 'archived';
  max_members: number;
  profile_image: string | null;
  settings: TeamSettings;
  team_members: TeamMember[];
}

/**
 * Status för en teammedlem
 * Matchar databasens team_member_status enum
 */
export type TeamMemberStatus = 'active' | 'pending' | 'invited' | 'inactive';

export const TeamMemberStatus = {
  ACTIVE: 'active' as const,
  PENDING: 'pending' as const,
  INVITED: 'invited' as const,
  INACTIVE: 'inactive' as const,
} as const;

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  status: TeamMemberStatus;
  created_at: string;
  updated_at: string;
}

export type TeamMessage = {
  id: string;
  team_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  parent_id?: string;
  mentions: string[];
  attachments: MessageAttachment[];
  message_type: MessageType;
  reply_count: number;
  user: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
};

export type MessageType = 'text' | 'image' | 'file' | 'mixed';

export type MessageAttachment = {
  type: 'image' | 'file';
  url: string;
  filename?: string;
  size?: number;
  mime_type?: string;
};

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: TeamRole;
  token: string;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
  created_by: string;
  team?: {
    id: string;
    name: string;
    description?: string;
    profile_image?: string;
  };
}

export interface CreateTeamInvitationInput {
  email: string;
  role: TeamRole;
  created_by: string;
  user_id?: string;
}

export interface TeamInvite {
  id: string;
  team_id: string;
  invited_by: string;
  email: string;
  role: TeamRole;
  created_at: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

export interface TeamJoinRequest {
  id: string;
  team_id: string;
  user_id: string;
  message?: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

// Helper type för att extrahera team-relaterade typer från databasen
export type DbTeam = Database['public']['Tables']['teams']['Row'];
export type DbTeamMember = Database['public']['Tables']['team_members']['Row'];
export type DbTeamMessage = Database['public']['Tables']['team_messages']['Row'];

export interface TeamState {
  teams: Team[];
  selectedTeam: Team | null;
  selectedTeamId: string | null;
  currentUserRole: TeamRole | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  members: TeamMember[];
  inviteError: Error | null;
  isGeneratingInvite: boolean;
  inviteCode: string | null;
}

export interface TeamMutations {
  createTeam: (name: string) => Promise<Team>;
  updateTeam: (teamId: string, updates: Partial<Team>) => Promise<Team>;
  deleteTeam: (teamId: string) => Promise<void>;
  joinTeam: (inviteCode: string) => Promise<void>;
  leaveTeam: (teamId: string) => Promise<void>;
  selectTeam: (teamId: string) => Promise<void>;
  generateInviteCode: (teamId: string) => Promise<string>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;
  approveMember: (memberId: string) => Promise<void>;
  rejectMember: (memberId: string) => Promise<void>;
  updateMemberRole: (params: { memberId: string; newRole: TeamRole }) => Promise<void>;
  updateMemberStatus: (params: { memberId: string; status: TeamMemberStatus }) => Promise<void>;
  removeMember: (params: { memberId: string }) => Promise<void>;
  addMember: (params: { teamId: string; email: string; role: TeamRole }) => Promise<TeamMember>;
}

// Dummy component to satisfy Expo Router's requirements
export default function TeamTypes() {
  return null;
} 