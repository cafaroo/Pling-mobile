import { Result } from '@/shared/core/Result';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { UserSettings } from '@/domain/user/entities/UserSettings';
import { EventBus } from '@/shared/core/EventBus';
import { UserSettingsUpdated } from '@/domain/user/events/UserEvent';

export interface UpdateSettingsInput {
  userId: string;
  settings: {
    theme: 'light' | 'dark' | 'system';
    language: 'sv' | 'en' | 'no' | 'dk';
    notifications: {
      enabled: boolean;
      frequency: 'immediately' | 'daily' | 'weekly';
      emailEnabled: boolean;
      pushEnabled: boolean;
    };
    privacy: {
      profileVisibility: 'public' | 'team' | 'private';
      showOnlineStatus: boolean;
      showLastSeen: boolean;
    };
    appSettings?: Record<string, unknown>;
  };
}

export interface UpdateSettingsDeps {
  userRepo: UserRepository;
  eventBus: EventBus;
}

export const updateSettings = (deps: UpdateSettingsDeps) =>
  async (input: UpdateSettingsInput): Promise<Result<void, string>> => {
    // Hämta användaren
    const userResult = await deps.userRepo.findById(input.userId);
    if (userResult.isErr()) {
      return userResult;
    }

    const user = userResult.getValue();

    // Skapa nya inställningar
    const settingsResult = UserSettings.create({
      theme: input.settings.theme,
      language: input.settings.language,
      notifications: input.settings.notifications,
      privacy: input.settings.privacy,
      appSettings: input.settings.appSettings
    });

    if (settingsResult.isErr()) {
      return settingsResult;
    }

    // Uppdatera användaren med nya inställningar
    const updatedUserResult = user.updateSettings(settingsResult.getValue());
    if (updatedUserResult.isErr()) {
      return updatedUserResult;
    }

    // Spara uppdaterad användare
    const saveResult = await deps.userRepo.save(user);
    if (saveResult.isErr()) {
      return saveResult;
    }

    // Publicera händelse
    await deps.eventBus.publish(new UserSettingsUpdated(
      user,
      settingsResult.getValue()
    ));

    return Result.ok(undefined);
  }; 