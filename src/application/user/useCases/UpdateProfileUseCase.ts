import { Result } from '@/shared/core/Result';
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
    contact: {
      email: string;
      phone?: string;
      alternativeEmail?: string;
    };
    customFields?: Record<string, unknown>;
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

    const user = userResult.getValue();

    // Skapa ny profil
    const profileResult = await UserProfile.create({
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

    // Uppdatera användaren med ny profil
    const updateResult = user.updateProfile(profileResult.getValue());
    if (updateResult.isErr()) {
      return updateResult;
    }

    // Spara användaren
    const saveResult = await this.deps.userRepo.save(user);
    if (saveResult.isErr()) {
      return Result.err(`Kunde inte uppdatera profilen: ${saveResult.getError()}`);
    }

    // Publicera händelse
    await this.deps.eventBus.publish(new UserProfileUpdated(
      user,
      profileResult.getValue()
    ));

    return Result.ok(undefined);
  }
} 