import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import { TeamSettingsScreenPresentation, TeamSettingsFormData } from './TeamSettingsScreenPresentation';
import { useTeamWithStandardHook } from '@/application/team/hooks/useTeamWithStandardHook';
import { useUserContext } from '@/ui/user/context/UserContext';
import { TeamSettings } from '@/domain/team/value-objects/TeamSettings';
import { isDeepEqual } from '@/shared/core/utils/isDeepEqual';

export interface TeamSettingsScreenContainerProps {
  teamId?: string;
}

export const TeamSettingsScreenContainer: React.FC<TeamSettingsScreenContainerProps> = ({ 
  teamId: propTeamId 
}) => {
  const router = useRouter();
  const params = useLocalSearchParams<{ teamId: string }>();
  const { currentUser } = useUserContext();
  
  // Använd teamId från props om det finns, annars från URL-parametrar
  const teamId = propTeamId || params.teamId;
  
  // Hooks för teamdata och operationer
  const { 
    getTeam,
    updateTeam,
    leaveTeam,
    archiveTeam,
    deleteTeam 
  } = useTeamWithStandardHook();
  
  // Formulärtillstånd
  const [formData, setFormData] = useState<TeamSettingsFormData>({
    name: '',
    description: '',
    isPrivate: false,
    allowGuests: false,
    maxMembers: 50,
    notificationSettings: {
      enableEmailNotifications: true,
      enablePushNotifications: true,
      activityDigestFrequency: 'daily',
      notifyOnNewMembers: true,
      notifyOnMemberLeave: true,
      notifyOnRoleChanges: true
    }
  });
  
  // Initial formulärdata
  const [initialFormData, setInitialFormData] = useState<TeamSettingsFormData | null>(null);
  
  // Lokalt tillstånd för fel vid sparande
  const [saveError, setSaveError] = useState<{ message: string } | undefined>(undefined);
  
  // Kontrollera om användaren är admin
  const isAdmin = useCallback(() => {
    if (!getTeam.data || !currentUser) return false;
    
    return getTeam.data.members.some(
      member => member.userId.toString() === currentUser.id.toString() && 
                (member.role === 'admin' || member.role === 'owner')
    );
  }, [getTeam.data, currentUser]);
  
  // Hämta team när komponenten laddas
  useEffect(() => {
    if (teamId) {
      getTeam.execute({ teamId });
    }
  }, [teamId]);
  
  // Uppdatera formulärdata när team laddas
  useEffect(() => {
    if (getTeam.data && getTeam.data.settings) {
      const settings = getTeam.data.settings;
      
      const newFormData: TeamSettingsFormData = {
        name: getTeam.data.name,
        description: getTeam.data.description || '',
        isPrivate: settings.isPrivate || false,
        allowGuests: settings.allowGuests || false,
        maxMembers: settings.maxMembers || 50,
        notificationSettings: {
          enableEmailNotifications: settings.notificationSettings?.enableEmailNotifications || true,
          enablePushNotifications: settings.notificationSettings?.enablePushNotifications || true,
          activityDigestFrequency: settings.notificationSettings?.activityDigestFrequency || 'daily',
          notifyOnNewMembers: settings.notificationSettings?.notifyOnNewMembers || true,
          notifyOnMemberLeave: settings.notificationSettings?.notifyOnMemberLeave || true,
          notifyOnRoleChanges: settings.notificationSettings?.notifyOnRoleChanges || true
        }
      };
      
      setFormData(newFormData);
      setInitialFormData(newFormData);
    }
  }, [getTeam.data]);
  
  // Hantera ändringar i formulärfält
  const handleFieldChange = useCallback((field: string, value: any) => {
    setFormData(prevData => ({
      ...prevData,
      [field]: value
    }));
    
    // Rensa eventuella tidigare sparfel
    setSaveError(undefined);
  }, []);
  
  // Hantera ändringar i nästlade formulärfält
  const handleNestedFieldChange = useCallback((parent: string, field: string, value: any) => {
    setFormData(prevData => ({
      ...prevData,
      [parent]: {
        ...prevData[parent as keyof TeamSettingsFormData],
        [field]: value
      }
    }));
    
    // Rensa eventuella tidigare sparfel
    setSaveError(undefined);
  }, []);
  
  // Kontrollera om formuläret har ändringar
  const hasChanges = initialFormData ? !isDeepEqual(formData, initialFormData) : false;
  
  // Hantera avbryt
  const handleCancel = useCallback(() => {
    if (initialFormData) {
      setFormData(initialFormData);
    }
    setSaveError(undefined);
  }, [initialFormData]);
  
  // Hantera spara
  const handleSave = useCallback(async () => {
    if (!teamId || !getTeam.data) return;
    
    try {
      // Bygg TeamSettings objekt från formulärdata
      const settingsData = {
        isPrivate: formData.isPrivate,
        allowGuests: formData.allowGuests,
        maxMembers: formData.maxMembers,
        notificationSettings: {
          ...formData.notificationSettings
        }
      };
      
      // Uppdatera team
      const result = await updateTeam.execute({
        teamId,
        name: formData.name,
        description: formData.description,
        settings: settingsData
      });
      
      if (result.isOk()) {
        setInitialFormData(formData);
        setSaveError(undefined);
        Alert.alert('Lyckades', 'Teaminställningarna har uppdaterats.');
      } else {
        setSaveError({ message: result.error.message });
      }
    } catch (error: any) {
      setSaveError({ message: error.message || 'Ett fel uppstod vid sparande av inställningar' });
    }
  }, [teamId, formData, updateTeam, getTeam.data]);
  
  // Hantera borttagning av team
  const handleDeleteTeam = useCallback(() => {
    if (!teamId) return;
    
    Alert.alert(
      'Ta bort team',
      'Är du säker på att du vill ta bort detta team permanent? Denna åtgärd kan inte ångras.',
      [
        { text: 'Avbryt', style: 'cancel' },
        { 
          text: 'Ta bort', 
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteTeam.execute({ teamId });
              
              if (result.isOk()) {
                Alert.alert('Teamet har tagits bort', 'Du kommer att omdirigeras till startsidan.');
                router.push('/');
              } else {
                Alert.alert('Fel', `Kunde inte ta bort teamet: ${result.error.message}`);
              }
            } catch (error: any) {
              Alert.alert('Fel', `Ett oväntat fel uppstod: ${error.message}`);
            }
          }
        }
      ]
    );
  }, [teamId, deleteTeam, router]);
  
  // Hantera lämna team
  const handleLeaveTeam = useCallback(() => {
    if (!teamId || !currentUser) return;
    
    Alert.alert(
      'Lämna team',
      'Är du säker på att du vill lämna detta team?',
      [
        { text: 'Avbryt', style: 'cancel' },
        { 
          text: 'Lämna', 
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await leaveTeam.execute({ teamId, userId: currentUser.id });
              
              if (result.isOk()) {
                Alert.alert('Du har lämnat teamet', 'Du kommer att omdirigeras till startsidan.');
                router.push('/');
              } else {
                Alert.alert('Fel', `Kunde inte lämna teamet: ${result.error.message}`);
              }
            } catch (error: any) {
              Alert.alert('Fel', `Ett oväntat fel uppstod: ${error.message}`);
            }
          }
        }
      ]
    );
  }, [teamId, leaveTeam, currentUser, router]);
  
  // Hantera arkivering av team
  const handleArchiveTeam = useCallback(() => {
    if (!teamId) return;
    
    Alert.alert(
      'Arkivera team',
      'Är du säker på att du vill arkivera detta team? Det kan aktiveras igen senare.',
      [
        { text: 'Avbryt', style: 'cancel' },
        { 
          text: 'Arkivera', 
          onPress: async () => {
            try {
              const result = await archiveTeam.execute({ teamId });
              
              if (result.isOk()) {
                Alert.alert('Teamet har arkiverats', 'Du kommer att omdirigeras till startsidan.');
                router.push('/');
              } else {
                Alert.alert('Fel', `Kunde inte arkivera teamet: ${result.error.message}`);
              }
            } catch (error: any) {
              Alert.alert('Fel', `Ett oväntat fel uppstod: ${error.message}`);
            }
          }
        }
      ]
    );
  }, [teamId, archiveTeam, router]);
  
  // Rendrera presentationskomponenten
  return (
    <TeamSettingsScreenPresentation
      team={getTeam.data}
      teamSettings={getTeam.data?.settings}
      formData={formData}
      isLoading={getTeam.isLoading}
      isSaving={updateTeam.isLoading}
      hasChanges={hasChanges}
      error={getTeam.error}
      saveError={saveError}
      onRetry={() => getTeam.retry()}
      onFieldChange={handleFieldChange}
      onNestedFieldChange={handleNestedFieldChange}
      onSave={handleSave}
      onCancel={handleCancel}
      onDeleteTeam={handleDeleteTeam}
      onLeaveTeam={handleLeaveTeam}
      onArchiveTeam={handleArchiveTeam}
    />
  );
}; 