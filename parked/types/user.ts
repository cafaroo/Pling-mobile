import React from 'react';

// Dummy-komponent för att tillfredsställa Expo Router's krav
export default function UserTypes() {
  return null;
}

import { Team } from './team';

export type UserRole = 'owner' | 'admin' | 'member';

export type User = {
  id: string;
  email?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  avatarUrl?: string;
  avatar_url?: string | null;
  contact_email?: string;
  created_at?: string;
  teams?: Team[];
  role?: UserRole;
}; 