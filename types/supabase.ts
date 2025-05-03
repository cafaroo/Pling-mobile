export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      teams: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          max_members: number | null
          name: string
          notification_settings: Json
          organization_id: string | null
          profile_image: string | null
          settings: Json | null
          status: "active" | "inactive" | "archived" | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          max_members?: number | null
          name: string
          notification_settings?: Json
          organization_id?: string | null
          profile_image?: string | null
          settings?: Json | null
          status?: "active" | "inactive" | "archived" | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          max_members?: number | null
          name?: string
          notification_settings?: Json
          organization_id?: string | null
          profile_image?: string | null
          settings?: Json | null
          status?: "active" | "inactive" | "archived" | null
          updated_at?: string | null
        }
      }
      team_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          role: "owner" | "admin" | "member"
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: "owner" | "admin" | "member"
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: "owner" | "admin" | "member"
          team_id?: string
          user_id?: string
        }
      }
      team_messages: {
        Row: {
          attachments: Json[] | null
          content: string | null
          created_at: string | null
          id: string
          mentions: Json | null
          message_type: string
          parent_id: string | null
          reply_count: number
          team_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attachments?: Json[] | null
          content?: string | null
          created_at?: string | null
          id?: string
          mentions?: Json | null
          message_type?: string
          parent_id?: string | null
          reply_count?: number
          team_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attachments?: Json[] | null
          content?: string | null
          created_at?: string | null
          id?: string
          mentions?: Json | null
          message_type?: string
          parent_id?: string | null
          reply_count?: number
          team_id?: string
          updated_at?: string | null
          user_id?: string
        }
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      team_members_view: {
        Row: {
          avatar_url: string | null
          email: string | null
          id: string | null
          invited_by: string | null
          joined_at: string | null
          name: string | null
          role: "owner" | "admin" | "member" | null
          team_id: string | null
          user_id: string | null
        }
      }
      team_messages_with_user: {
        Row: {
          avatar_url: string | null
          content: string | null
          created_at: string | null
          email: string | null
          id: string | null
          mentions: Json | null
          name: string | null
          parent_id: string | null
          team_id: string | null
          team_name: string | null
          updated_at: string | null
          user_id: string | null
        }
      }
    }
    Enums: {
      team_member_role: "owner" | "admin" | "member"
      team_status: "active" | "inactive" | "archived"
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row']
