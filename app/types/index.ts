import React from 'react';

// Re-export team types
export * from '@/types/team';

export type Message = {
  id: string;
  user_id: string;
  content?: string;
  attachments: MessageAttachment[];
  message_type: 'text' | 'image' | 'file' | 'mixed';
  created_at: string;
  user: {
    name: string;
    avatar_url: string;
  };
  reactions?: MessageReaction[];
  parent_id?: string;
  reply_count?: number;
  replies?: Message[];
};

export type Permission = 
  | 'manage_chat'
  | 'send_messages' 
  | 'delete_messages'
  | 'manage_members'
  | 'invite_members'
  | 'manage_goals'
  | 'create_goals'
  | 'delete_goals'
  | 'manage_competitions'
  | 'create_competitions';

export interface Team {
  id: string;
  name: string;
  description?: string;
  profileImage?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Dummy component för att tillfredsställa Expo Router-krav
export default function AppTypes() {
  return null;
} 