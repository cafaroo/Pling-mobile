import { Result } from '@/shared/core/Result';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { User } from '@/domain/user/entities/User';
import { UserProfile } from '@/domain/user/entities/UserProfile';
import { UserSettings } from '@/domain/user/entities/UserSettings';
import { EventBus } from '@/shared/core/EventBus';
import { UserCreated } from '@/domain/user/events/UserEvent';
import { PhoneNumber } from '@/domain/user/value-objects/PhoneNumber';

export interface CreateUserInput {
  email: string;
  phone?: string;
  profile: {
    firstName: string;
    lastName: string;
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
    location?: string;
    contact: {
      email: string;
      phone?: string;
      alternativeEmail?: string;
    };
    customFields?: Record<string, unknown>;
  };
  settings: {
    theme: 'light' | 'dark' | 'system';
    language: 'sv' | 'en' | 'no' | 'dk';
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
      frequency: 'immediately' | 'daily' | 'weekly';
    };
    privacy: {
      profileVisibility: 'public' | 'team' | 'private';
      showEmail: boolean;
      showPhone: boolean;
    };
    appSettings?: Record<string, unknown>;
  };
  teamIds?: string[];
  roleIds?: string[];
}

export interface CreateUserDeps {
  userRepo: UserRepository;
  eventBus: EventBus;
}

export const createUser = (deps: CreateUserDeps) =>
  async (input: CreateUserInput): Promise<Result<void, string>> => {
    // Kontrollera om användaren redan finns
    const existingUserResult = await deps.userRepo.findByEmail(input.email);
    if (existingUserResult.isOk()) {
      return Result.err('En användare med denna e-postadress finns redan');
    }

    // Validera telefonnummer om det finns
    if (input.profile.contact.phone) {
      const phoneResult = PhoneNumber.create(input.profile.contact.phone);
      if (phoneResult.isErr()) {
        return Result.err('Ogiltigt telefonnummer');
      }
    }

    // Skapa profil
    const profileResult = UserProfile.create({
      firstName: input.profile.firstName,
      lastName: input.profile.lastName,
      displayName: input.profile.displayName,
      avatarUrl: input.profile.avatarUrl,
      bio: input.profile.bio,
      location: input.profile.location,
      contact: input.profile.contact,
      customFields: input.profile.customFields
    });

    if (profileResult.isErr()) {
      return profileResult;
    }

    // Skapa inställningar
    const settingsResult = UserSettings.create({
      theme: input.settings.theme,
      language: input.settings.language,
      notifications: {
        enabled: input.settings.notifications.email || input.settings.notifications.push,
        frequency: input.settings.notifications.frequency,
        emailEnabled: input.settings.notifications.email,
        pushEnabled: input.settings.notifications.push
      },
      privacy: {
        profileVisibility: input.settings.privacy.profileVisibility,
        showOnlineStatus: true,
        showLastSeen: true
      }
    });

    if (settingsResult.isErr()) {
      return settingsResult;
    }

    // Skapa användare
    const userResult = User.create({
      email: input.email,
      name: `${input.profile.firstName} ${input.profile.lastName}`,
      settings: settingsResult.getValue(),
      teamIds: []
    });

    if (userResult.isErr()) {
      return userResult;
    }

    // Spara användaren
    const saveResult = await deps.userRepo.save(userResult.getValue());
    if (saveResult.isErr()) {
      return Result.err(`Kunde inte skapa användaren: ${saveResult.getError()}`);
    }

    // Publicera händelse
    await deps.eventBus.publish(new UserCreated(userResult.getValue()));

    return Result.ok(undefined);
  }; 