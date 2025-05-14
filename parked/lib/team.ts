import { Database } from './database.types';
import { TeamMemberStatus, TeamSettings, TeamRole } from '../types/team';

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

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  status: TeamMemberStatus;
  created_at: string;
  updated_at: string;
  user?: {
    email: string;
    name?: string;
    avatar_url?: string;
  };
}

export type TeamInsert = Database['public']['Tables']['teams']['Insert'];
export type TeamUpdate = Database['public']['Tables']['teams']['Update'];
export type TeamMemberInsert = Database['public']['Tables']['team_members']['Insert'];
export type TeamMemberUpdate = Database['public']['Tables']['team_members']['Update']; 