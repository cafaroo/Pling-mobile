import { Result, ok, err } from '@/shared/core/Result';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { UserSettings } from '@/domain/user/entities/UserSettings';
import { EventBus } from '@/shared/core/EventBus';
import { UserSettingsUpdated } from '@/domain/user/events/UserEvent';

export interface UpdateSettingsInput {
  userId: string;
  settings: {
    language?: string;
    theme?: 'light' | 'dark' | 'system';
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

/**
 * Användarfall för att uppdatera användarinställningar
 */
export function updateSettings(
  deps: {
    userRepo: UserRepository;
    eventBus: EventBus;
  }
) {
  return async (input: UpdateSettingsInput): Promise<Result<void, string>> => {
    try {
      // Hämta användaren
      const userResult = await deps.userRepo.findById(input.userId);
      
      if (userResult.isErr()) {
        return userResult;
      }
      
      const user = userResult.value;
      
      // Skapa nya inställningar
      const settingsResult = UserSettings.create({
        language: input.settings.language,
        theme: input.settings.theme,
        notifications: input.settings.notifications,
        privacy: input.settings.privacy
      });
      
      if (settingsResult.isErr()) {
        return settingsResult;
      }
      
      // Uppdatera användarens inställningar
      const updateResult = user.updateSettings(settingsResult.value);
      if (updateResult.isErr()) {
        return updateResult;
      }
      
      // Spara användaren
      const saveResult = await deps.userRepo.save(user);
      if (saveResult.isErr()) {
        return err(`Kunde inte uppdatera inställningarna: ${saveResult.error}`);
      }
      
      // Publicera händelse
      await deps.eventBus.publish(new UserSettingsUpdated(
        user,
        settingsResult.value
      ));
      
      return ok(undefined);
    } catch (error) {
      return err(`Oväntat fel vid uppdatering av inställningar: ${error}`);
    }
  };
} 