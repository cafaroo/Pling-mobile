import { Tables } from './supabase';

export type MessageAttachment = {
  type: 'image' | 'file';
  url: string;
  filename?: string;
  size?: number;
  mime_type?: string;
};

export type MessageReaction = Tables<'message_reactions'>;

export type Message = Tables<'team_messages'> & {
  user: {
    name: string;
    avatar_url: string;
  };
  reactions?: MessageReaction[];
  mentions?: {
    id: string;
    name: string;
  }[];
  attachments: MessageAttachment[];
}; 