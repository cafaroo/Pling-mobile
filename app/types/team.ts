import React from 'react';
import { Team as BaseTeam, TeamMemberStatus, TeamRole } from '../../types/team';

export type Team = BaseTeam;

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  userId?: string; // För kompatibilitet med äldre kod
  role: TeamRole;
  status: TeamMemberStatus;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    created_at: string;
  };
  invited_by?: string;
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: TeamRole;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
  created_by: string;
  team?: Team;
}

export interface CreateTeamInvitationInput {
  email: string;
  role: TeamRole;
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
  team?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  inviter?: {
    id: string;
    name: string;
  };
}

// Lägg till en User-typ som stöder både enskilt team och array av teams för bakåtkompatibilitet
export interface User {
  id: string;
  email: string;
  name?: string;
  profile_image?: string;
  team?: Team; // För äldre kod som använder user.team
  teams?: Team[]; // För nyare kod som använder user.teams 
  created_at: string;
  updated_at: string;
}

// Dummy component för att tillfredsställa Expo Router-krav
export default function TeamTypes() {
  return null;
} 