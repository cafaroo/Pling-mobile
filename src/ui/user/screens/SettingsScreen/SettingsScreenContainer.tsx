import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { SettingsScreenPresentation, SettingsFormData } from './SettingsScreenPresentation';
import { useUser } from '@/application/user/hooks/useUser';
import { useUpdateSettings } from '@/application/user/hooks/useUpdateSettings';
import { useSnackbar } from '@/ui/shared/context/SnackbarContext';

export interface SettingsScreenContainerProps {
  // Eventuella container-props kan läggas till här
}

export const SettingsScreenContainer: React.FC<SettingsScreenContainerProps> = () => {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  
  // Hämta användardata och inställningar
  const { data: user, isLoading: isLoadingUser, error: userError } = useUser();
  
  // Mutation för att uppdatera inställningar
  const { 
    mutate: updateSettings, 
    isLoading: isUpdating 
  } = useUpdateSettings();

  // Konvertera användarinställningar till rätt format
  const userSettings = user?.settings ? {
    theme: user.settings.theme,
    language: user.settings.language,
    notifications: {
      email: user.settings.notifications?.email || false,
      push: user.settings.notifications?.push || false,
      sms: user.settings.notifications?.sms || false,
      frequency: user.settings.notifications?.frequency || 'daily',
    },
    privacy: {
      profileVisibility: user.settings.privacy?.profileVisibility || 'private',
      showEmail: user.settings.privacy?.showEmail || false,
      showPhone: user.settings.privacy?.showPhone || false,
    },
  } as SettingsFormData : undefined;
  
  // Callback när användaren sparar inställningar
  const handleSaveSettings = useCallback((settings: SettingsFormData) => {
    if (!user?.id) return;
    
    // Konvertera till formatet som förväntas av API:et
    const apiSettings = {
      theme: settings.theme,
      language: settings.language,
      notifications: {
        enabled: settings.notifications.email || settings.notifications.push || settings.notifications.sms,
        frequency: settings.notifications.frequency,
        emailEnabled: settings.notifications.email,
        pushEnabled: settings.notifications.push,
      },
      privacy: {
        profileVisibility: settings.privacy.profileVisibility,
        showOnlineStatus: true, // Standardvärde
        showLastSeen: true, // Standardvärde
      },
    };
    
    updateSettings(apiSettings, {
      onSuccess: () => {
        showSnackbar('Inställningar sparade', 'success');
      },
      onError: (error) => {
        showSnackbar('Kunde inte spara inställningar', 'error');
        console.error('Settings update error:', error);
      },
    });
  }, [user?.id, updateSettings, showSnackbar]);
  
  // Callback när inställningar har sparats
  const handleSettingsSuccess = useCallback(() => {
    showSnackbar('Inställningar uppdaterade', 'success');
  }, [showSnackbar]);
  
  // Callback för tillbakaknappen
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);
  
  return (
    <SettingsScreenPresentation
      userId={user?.id?.toString()}
      settings={userSettings}
      isLoading={isLoadingUser}
      isUpdating={isUpdating}
      error={userError}
      onSaveSettings={handleSaveSettings}
      onSettingsSuccess={handleSettingsSuccess}
      onBack={handleBack}
    />
  );
}; 