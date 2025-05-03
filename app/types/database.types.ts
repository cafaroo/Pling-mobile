import React from 'react';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      team_members_with_profiles: {
        Row: {
          user_id: string
          team_id: string
          role: 'owner' | 'admin' | 'member'
          name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          team_id: string
          role?: 'owner' | 'admin' | 'member'
          name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          user_id?: string
          team_id?: string
          role?: 'owner' | 'admin' | 'member'
          name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      // Lägg till fler tabeller här efter behov
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Dummy component för att tillfredsställa Expo Router-krav
export default function DatabaseTypes() {
  return null;
} 