import { Tables } from './supabase';

export interface MessageAttachment {
  type: 'image' | 'file';
  url: string;
  filename?: string;
  size?: number;
  mime_type?: string;
}

export interface MessageReaction {
  id: string;
  user_id: string;
  message_id: string;
  emoji: string;
  created_at: string;
}

export interface Message {
  id: string;
  team_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user: {
    name: string;
    avatar_url: string | null;
  };
  reactions: MessageReaction[];
  mentions?: {
    id: string;
    name: string;
  }[];
  attachments: MessageAttachment[];
  reply_count?: number;
}

// Exportera typerna direkt
export type { Message, MessageAttachment, MessageReaction }; 

// Dummy component för att tillfredsställa Expo Router-krav
export default function ChatTypes() {
  return null;
} 