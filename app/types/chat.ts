export interface User {
  id: string;
  username: string;
  avatar_url?: string;
}

export type Message = {
  id: string;
  user_id: string;
  team_id: string;
  content: string;
  created_at: string;
  thread_id?: string;
  parent_id?: string;
  reply_count?: number;
  message_type?: 'text' | 'image' | 'file' | 'mixed';
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  user: {
    id: string;
    name: string;
    avatar_url: string;
  };
  mentions?: {
    id: string;
    name: string;
  }[];
};

export type MessageAttachment = {
  type: 'image' | 'file';
  url: string;
  filename?: string;
  size?: number;
  mime_type?: string;
};

export type MessageReaction = {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  count?: number;
}; 