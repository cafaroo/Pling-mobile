/**
 * updateSettings Use Case
 * 
 * Uppdatera en användares inställningar som tema, språk, notifikationer, osv.
 */

import { Result, ok, err } from '@/shared/core/Result';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { User } from '@/domain/user/entities/User';
import { EventBus } from '@/shared/core/EventBus';
import { UserSettingsUpdated } from '@/domain/user/events/UserEvent';

export interface UpdateSettingsInput {
  userId: string;
  settings: {
    theme?: 'light' | 'dark' | 'system';
    language?: 'sv' | 'en' | 'no' | 'da' | 'fi';
    notifications?: {
      email?: boolean;
      push?: boolean;
      inApp?: boolean;
    };
    privacy?: {
      showProfile?: boolean;
      showActivity?: boolean;
      showTeams?: boolean;
    };
  };
}

export interface UpdateSettingsDeps {
  userRepo: UserRepository;
  eventBus: EventBus;
}

export const updateSettings = (deps: UpdateSettingsDeps) => {
  const { userRepo, eventBus } = deps;

  return async (input: UpdateSettingsInput): Promise<Result<User, Error>> => {
    try {
      const { userId, settings } = input;

      // Hitta användaren
      const userResult = await userRepo.findById(userId);
      if (userResult.isErr()) {
        return err(new Error(`Kunde inte hitta användaren: ${userResult.error.message}`));
      }

      const user = userResult.value;

      // Hämta befintliga inställningar för att spara gamla värden för eventet
      const oldSettings = user.settings ? user.settings.toDTO() : {};

      // Uppdatera användarinställningar
      const updateResult = user.updateSettings(settings);
      if (updateResult.isErr()) {
        return err(new Error(`Kunde inte uppdatera inställningar: ${updateResult.error}`));
      }

      // Spara användaren
      const saveResult = await userRepo.save(user);
      if (saveResult.isErr()) {
        return err(new Error(`Kunde inte spara användaren: ${saveResult.error.message}`));
      }

      // Publicera event
      eventBus.publish(new UserSettingsUpdated(
        user,
        {
          newSettings: user.settings ? user.settings.toDTO() : {},
          oldSettings
        }
      ));

      return ok(user);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Okänt fel vid uppdatering av inställningar'));
    }
  };
};

export default updateSettings; 