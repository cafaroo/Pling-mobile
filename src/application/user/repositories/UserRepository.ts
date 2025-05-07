import { supabase } from '../../../infrastructure/supabase';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
  contact: {
    email?: string;
    phone?: string;
    website?: string;
  };
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    emailEnabled: boolean;
    pushEnabled: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'contacts';
    showOnlineStatus: boolean;
    showLastSeen: boolean;
  };
}

export class UserRepository {
  async getProfile(userId: string): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        avatar_url,
        settings->>'name' as display_name,
        settings->>'bio' as bio,
        settings->>'location' as location,
        settings->'contact' as contact
      `)
      .eq('id', userId)
      .single();

    if (error) throw new Error('Kunde inte hämta användarprofil');

    // Dela upp namnet i förnamn och efternamn
    const [firstName = '', lastName = ''] = (data.name || '').split(' ');

    return {
      id: data.id,
      firstName,
      lastName,
      displayName: data.display_name,
      bio: data.bio,
      location: data.location,
      avatarUrl: data.avatar_url,
      contact: {
        email: data.email,
        ...(data.contact || {}),
      },
    };
  }

  async getSettings(userId: string): Promise<UserSettings> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select(`
        theme,
        language,
        notification_settings,
        timezone
      `)
      .eq('user_id', userId)
      .single();

    if (error) throw new Error('Kunde inte hämta användarinställningar');

    const notificationSettings = data.notification_settings || {};

    return {
      theme: data.theme || 'system',
      language: data.language || 'sv',
      notifications: {
        enabled: notificationSettings.enabled ?? true,
        frequency: notificationSettings.frequency || 'daily',
        emailEnabled: notificationSettings.email ?? true,
        pushEnabled: notificationSettings.push ?? true,
      },
      privacy: {
        profileVisibility: 'public', // Default värden tills vi implementerar privacy-inställningar
        showOnlineStatus: true,
        showLastSeen: true,
      },
    };
  }
} 