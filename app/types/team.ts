import React from 'react';
import { Team as BaseTeam, TeamMemberStatus, TeamRole } from '../../types/team';
import { Tables } from './supabase';

export type Team = BaseTeam;

export interface TeamMember extends Tables<'team_members'> {
  user: {
    id: string;
    name: string;
    avatar_url: string;
  };
}

export interface TeamMemberWithProfile extends Tables<'team_members'> {
  user: {
    id: string;
    name: string;
    avatar_url: string;
  };
}

export interface TeamInvitation extends Tables<'team_invitations'> {
  team: {
    id: string;
    name: string;
  };
  inviter: {
    id: string;
    name: string;
  };
}

export interface CreateTeamInvitationInput {
  teamId: string;
  email: string;
  role: 'admin' | 'member';
}

export interface User {
  id: string;
  name: string;
  avatar_url: string;
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

// Dummy component för Expo Router
export default function TeamTypes() {
  return null;
} 