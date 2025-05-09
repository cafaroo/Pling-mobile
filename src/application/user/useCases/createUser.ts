import { Result, ok, err } from '@/shared/core/Result';
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
    socialLinks?: {
      website?: string;
      twitter?: string;
      linkedin?: string;
      github?: string;
    };
    interests?: string[];
  };
  settings: {
    theme: 'light' | 'dark' | 'system';
    language: 'sv' | 'en';
    notifications: {
      email: boolean;
      push: boolean;
      inApp: boolean;
    };
    privacy: {
      showProfile: boolean;
      showActivity: boolean;
      showTeams: boolean;
    };
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
      return err('En användare med denna e-postadress finns redan');
    }

    // Validera telefonnummer om det finns
    if (input.phone) {
      const phoneResult = PhoneNumber.create(input.phone);
      if (phoneResult.isErr()) {
        return err('Ogiltigt telefonnummer');
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
      socialLinks: input.profile.socialLinks,
      interests: input.profile.interests
    });

    if (profileResult.isErr()) {
      return profileResult;
    }

    // Skapa inställningar
    const settingsResult = UserSettings.create({
      theme: input.settings.theme,
      language: input.settings.language,
      notifications: {
        email: input.settings.notifications.email,
        push: input.settings.notifications.push,
        inApp: input.settings.notifications.inApp
      },
      privacy: {
        showProfile: input.settings.privacy.showProfile,
        showActivity: input.settings.privacy.showActivity,
        showTeams: input.settings.privacy.showTeams
      }
    });

    if (settingsResult.isErr()) {
      return settingsResult;
    }

    // Skapa användare
    const userResult = await User.create({
      email: input.email,
      name: `${input.profile.firstName} ${input.profile.lastName}`,
      settings: settingsResult.value,
      profile: profileResult.value,
      teamIds: input.teamIds || []
    });

    if (userResult.isErr()) {
      return userResult;
    }

    // Spara användaren
    const saveResult = await deps.userRepo.save(userResult.value);
    if (saveResult.isErr()) {
      return err(`Kunde inte skapa användaren: ${saveResult.error}`);
    }

    // Publicera händelse
    await deps.eventBus.publish(new UserCreated(userResult.value));

    return ok(undefined);
  }; 