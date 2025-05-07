import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { UserPrivacySettingsChanged } from '@/domain/user/events/UserEvent';
import { Result, err, ok } from '@/shared/core/Result';
import { EventBus } from '@/shared/core/EventBus';

export interface PrivacySettings {
  profileVisibility: 'public' | 'team' | 'private';
  showEmail: boolean;
  showPhone: boolean;
  shareActivity: boolean;
  allowDataCollection: boolean;
  customSettings?: Record<string, any>;
}

export interface UpdatePrivacySettingsInput {
  userId: string;
  settings: Partial<PrivacySettings>;
}

export type UpdatePrivacySettingsError = 
  | 'USER_NOT_FOUND'
  | 'INVALID_SETTINGS'
  | 'OPERATION_FAILED';

export interface UpdatePrivacySettingsDeps {
  userRepo: UserRepository;
  eventBus: EventBus;
}

/**
 * Användarfall för att uppdatera en användares integritetsinställningar
 */
export const updatePrivacySettings = (deps: UpdatePrivacySettingsDeps) => 
  async (input: UpdatePrivacySettingsInput): Promise<Result<void, UpdatePrivacySettingsError>> => {
    const { userId, settings } = input;
    
    // Hämta användaren från repository
    const userResult = await deps.userRepo.findById(userId);
    if (!userResult) {
      return err('USER_NOT_FOUND');
    }
    
    const user = userResult;
    
    // Validera inställningarna
    if (settings.profileVisibility && 
        !['public', 'team', 'private'].includes(settings.profileVisibility)) {
      return err('INVALID_SETTINGS');
    }
    
    try {
      // Hämta nuvarande privacy-inställningar
      const currentSettings = user.settings.privacy;
      
      // Skapa uppdaterade inställningar
      const updatedSettings = {
        ...currentSettings,
        ...settings
      };
      
      // Uppdatera användarens inställningar
      const updatedUser = user.updateSettings({
        privacy: updatedSettings
      });
      
      if (updatedUser.isErr()) {
        return err('OPERATION_FAILED');
      }
      
      // Spara användaren och publicera händelsen
      await deps.userRepo.save(updatedUser.getValue());
      await deps.eventBus.publish(
        new UserPrivacySettingsChanged(
          updatedUser.getValue(), 
          currentSettings, 
          updatedSettings
        )
      );
      
      return ok(undefined);
    } catch (error) {
      console.error('Fel vid uppdatering av integritetsinställningar:', error);
      return err('OPERATION_FAILED');
    }
  };

/**
 * Validerar privacyinställningar
 * 
 * I en riktig implementation skulle detta innehålla omfattande validering
 * av inställningarna baserat på domänregler.
 */
function validatePrivacySettings(settings: Record<string, any>): boolean {
  // Kontrollera att settings finns och är ett objekt
  if (!settings || typeof settings !== 'object') {
    return false;
  }
  
  // Kontrollera profilsynlighet om den finns
  if ('profileVisibility' in settings) {
    const validVisibilities = ['public', 'friends', 'private'];
    if (!validVisibilities.includes(settings.profileVisibility)) {
      return false;
    }
  }
  
  // Ytterligare valideringar beroende på affärsregler...
  
  return true;
} 