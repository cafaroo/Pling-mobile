import { Database } from './supabase';

export type Profile = Database['public']['Tables']['profiles']['Row'];

export interface ProfileWithTeams extends Profile {
  teams?: Team[];
}

export interface ProfileWithRole extends Profile {
  role?: 'owner' | 'admin' | 'member';
  status?: 'active' | 'invited' | 'inactive';
}

// Utility types för profiluppdateringar
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']; 