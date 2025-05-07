import { Result } from '@/shared/core/Result';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { UserProfile } from '@/domain/user/entities/UserProfile';
import { UniqueId } from '@/shared/core/UniqueId';

export interface UpdateProfileInput {
  userId: string;
  name: string;
  email: string;
  avatar_url?: string;
  settings: {
    name?: string;
    bio?: string;
    location?: string;
    contact?: {
      phone?: string;
      website?: string;
    };
  };
}

export interface UpdateProfileDeps {
  userRepo: UserRepository;
}

export const updateProfile = (deps: UpdateProfileDeps) =>
  async (input: UpdateProfileInput): Promise<Result<void, string>> => {
    // Hämta användaren
    const userResult = await deps.userRepo.findById(input.userId);
    if (userResult.isErr()) {
      return userResult;
    }

    const user = userResult.value;

    // Skapa ny profil
    const profileResult = UserProfile.create({
      name: input.name,
      email: input.email,
      avatarUrl: input.avatar_url,
      settings: {
        ...user.settings, // Behåll existerande inställningar
        ...input.settings, // Uppdatera med nya inställningar
      }
    });

    if (profileResult.isErr()) {
      return profileResult;
    }

    // Uppdatera användaren med ny profil
    const updatedUserResult = user.updateProfile(profileResult.value);
    if (updatedUserResult.isErr()) {
      return updatedUserResult;
    }

    // Spara uppdaterad användare
    return deps.userRepo.save(updatedUserResult.value);
  }; 