export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  settings: Record<string, any>;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  user_id: string;
  notification_settings: {
    email: boolean;
    push: boolean;
    in_app: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface UserDevice {
  id: string;
  user_id: string;
  device_token: string;
  device_type: string;
  device_name: string | null;
  last_used_at: string;
  created_at: string;
  updated_at: string;
}

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface CreateUserDTO {
  email: string;
  name?: string;
  avatar_url?: string;
  settings?: Record<string, any>;
}

export interface UpdateUserDTO {
  name?: string;
  avatar_url?: string;
  settings?: Record<string, any>;
  status?: UserStatus;
} 