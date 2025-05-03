import { Team } from './team';

export interface User {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  avatar_url: string | null;
  created_at: string;
  teams?: Team[];
}

export interface UserProfile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
} 