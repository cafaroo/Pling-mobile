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