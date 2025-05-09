import { Result, ok, err } from '@/shared/core/Result';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { UserProfile } from '@/domain/user/entities/UserProfile';
import { EventBus } from '@/shared/core/EventBus';
import { UserProfileUpdated } from '@/domain/user/events/UserEvent';

export interface UpdateProfileInput {
  userId: string;
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
}

export class UpdateProfileUseCase {
  constructor(private readonly deps: { 
    userRepo: UserRepository;
    eventBus: EventBus;
  }) {}

  async execute(input: UpdateProfileInput): Promise<Result<void, string>> {
    // Hämta användaren
    const userResult = await this.deps.userRepo.findById(input.userId);
    if (userResult.isErr()) {
      return userResult;
    }

    const user = userResult.value;

    // Skapa ny profil
    const profileResult = await UserProfile.create({
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

    // Uppdatera användaren med ny profil
    const updateResult = user.updateProfile(profileResult.value);
    if (updateResult.isErr()) {
      return updateResult;
    }

    // Spara användaren
    const saveResult = await this.deps.userRepo.save(user);
    if (saveResult.isErr()) {
      return err(`Kunde inte uppdatera profilen: ${saveResult.error}`);
    }

    // Publicera händelse
    await this.deps.eventBus.publish(new UserProfileUpdated(
      user,
      profileResult.value
    ));

    return ok(undefined);
  }
} 