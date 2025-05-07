import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../infrastructure/supabase';

interface UserSettings {
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

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: UserSettings) => {
      const { error } = await supabase
        .from('user_settings')
        .update({
          theme: settings.theme,
          language: settings.language,
          notification_settings: {
            enabled: settings.notifications.enabled,
            frequency: settings.notifications.frequency,
            email_enabled: settings.notifications.emailEnabled,
            push_enabled: settings.notifications.pushEnabled,
          },
          privacy_settings: {
            profile_visibility: settings.privacy.profileVisibility,
            show_online_status: settings.privacy.showOnlineStatus,
            show_last_seen: settings.privacy.showLastSeen,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw new Error('Kunde inte uppdatera inställningarna');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}; 