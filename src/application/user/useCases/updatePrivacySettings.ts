/**
 * updatePrivacySettings Use Case
 * 
 * Uppdatera en användares sekretessinställningar, som profilsynlighet, aktivitetsdelning, osv.
 */

import { Result, ok, err } from '@/shared/core/Result';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { User } from '@/domain/user/entities/User';
import { EventBus } from '@/shared/core/EventBus';
import { UserPrivacySettingsChanged } from '@/domain/user/events/UserEvent';

export interface PrivacySettings {
  profileVisibility?: 'public' | 'connections' | 'private';
  showEmail?: boolean;
  showPhone?: boolean;
  shareActivity?: boolean;
  allowDataCollection?: boolean;
}

export interface UpdatePrivacySettingsInput {
  userId: string;
  settings: PrivacySettings;
}

export interface UpdatePrivacySettingsDeps {
  userRepo: UserRepository;
  eventBus: EventBus;
}

export const updatePrivacySettings = (deps: UpdatePrivacySettingsDeps) => {
  const { userRepo, eventBus } = deps;

  return async (input: UpdatePrivacySettingsInput): Promise<Result<User, Error>> => {
    try {
      const { userId, settings } = input;

      // Hitta användaren
      const userResult = await userRepo.findById(userId);
      if (userResult.isErr()) {
        return err(new Error(`Kunde inte hitta användaren: ${userResult.error.message}`));
      }

      const user = userResult.value;

      // Hämta nuvarande sekretessinställningar
      const currentPrivacy = user.settings?.privacy || {};
      
      // Skapa de uppdaterade sekretessinställningarna
      const updatedSettings = {
        ...currentPrivacy,
        ...settings
      };

      // Uppdatera användarens settings
      const updateResult = user.updateSettings({
        privacy: updatedSettings
      });
      
      if (updateResult.isErr()) {
        return err(new Error(`Kunde inte uppdatera sekretessinställningar: ${updateResult.error}`));
      }

      // Spara användaren
      const saveResult = await userRepo.save(user);
      if (saveResult.isErr()) {
        return err(new Error(`Kunde inte spara användaren: ${saveResult.error.message}`));
      }

      // Publicera event
      eventBus.publish(new UserPrivacySettingsChanged(
        user,
        updatedSettings
      ));

      return ok(user);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Okänt fel vid uppdatering av sekretessinställningar'));
    }
  };
};

export default updatePrivacySettings; 