import React from 'react';

// Dummy-komponent för att tillfredsställa Expo Router's krav
export default function UserTypes() {
  return null;
}

import { Team } from './team';

export type User = {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  avatar_url: string | null;
  created_at: string;
  teams?: Team[];
}; 