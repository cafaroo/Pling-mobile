export interface User {
  id: string;
  username: string;
  avatar_url?: string;
}

export interface Message {
  id: string;
  content: string;
  user: User;
  created_at: string;
  reply_count: number;
  parent_id?: string;
  thread_id?: string;
  replies?: Message[];
  reactions?: { [emoji: string]: User[] };
} 