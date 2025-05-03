// @ts-nocheck
import { View } from 'react-native';
import React from 'react';

const DatabaseTypes = () => {
  return <View />;
};

export default DatabaseTypes;

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
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
          settings: any;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          organization_id?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          status?: 'active' | 'inactive' | 'archived';
          max_members?: number;
          profile_image?: string | null;
          settings?: any;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          organization_id?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          status?: 'active' | 'inactive' | 'archived';
          max_members?: number;
          profile_image?: string | null;
          settings?: any;
        };
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          role: string;
          status: 'active' | 'pending' | 'invited';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          role?: string;
          status?: 'active' | 'pending' | 'invited';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          role?: string;
          status?: 'active' | 'pending' | 'invited';
          created_at?: string;
          updated_at?: string;
        };
      };
      team_messages: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          content: string | null;
          created_at: string;
          updated_at: string;
          parent_id?: string;
          thread_id?: string;
          reply_count?: number;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          content?: string | null;
          created_at?: string;
          updated_at?: string;
          parent_id?: string;
          thread_id?: string;
          reply_count?: number;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          content?: string | null;
          created_at?: string;
          updated_at?: string;
          parent_id?: string;
          thread_id?: string;
          reply_count?: number;
        };
      };
    };
  };
}

// Dummy component to satisfy Expo Router's requirements
export default function DatabaseTypes() {
  return null;
} 