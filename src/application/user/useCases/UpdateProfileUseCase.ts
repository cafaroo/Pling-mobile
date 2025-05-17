import { Result, ok, err } from '@/shared/core/Result';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { User } from '@/domain/user/entities/User';
import { EventBus } from '@/shared/core/EventBus';
import { UserProfileUpdated } from '@/domain/user/events/UserEvent';
import { UserProfile } from '@/domain/user/entities/UserProfile';

export interface UpdateProfileInput {
  userId: string;
  profile: {
    firstName: string;
    lastName: string;
    bio?: string;
    location?: string;
    socialLinks?: {
      website?: string;
      linkedin?: string;
      twitter?: string;
      github?: string;
    }
  }
}

export interface UpdateProfileDeps {
  userRepo: UserRepository;
  eventBus: EventBus;
}

export class UpdateProfileUseCase {
  private userRepo: UserRepository;
  private eventBus: EventBus;

  constructor(deps: UpdateProfileDeps) {
    this.userRepo = deps.userRepo;
    this.eventBus = deps.eventBus;
  }

  async execute(input: UpdateProfileInput): Promise<Result<User, string>> {
    try {
      const { userId, profile } = input;
      
      // Hämta användaren
      const userResult = await this.userRepo.findById(userId);
      
      if (userResult.isErr()) {
        return err(userResult.error);
      }
      
      const user = userResult.value;
      
      // Konvertera raw profil-data till UserProfile-objekt
      const profileResult = UserProfile.create(profile);
      
      if (profileResult.isErr()) {
        return err(`Kunde inte uppdatera profilen: ${profileResult.error}`);
      }
      
      // Uppdatera profilen
      const updateResult = user.updateProfile(profileResult.value);
      
      if (updateResult.isErr()) {
        return err(`Kunde inte uppdatera profilen: ${updateResult.error}`);
      }
      
      // Spara användaren
      const saveResult = await this.userRepo.save(user);
      
      if (saveResult.isErr()) {
        return err(`Kunde inte uppdatera profilen: ${saveResult.error}`);
      }
      
      // Publicera event om att profilen uppdaterats
      const profileUpdatedEvent = new UserProfileUpdated({
        userId: user.id.toString(),
        updatedFields: Object.keys(profile)
      });
      
      this.eventBus.publish(profileUpdatedEvent);
      
      return ok(user);
    } catch (error) {
      return err(error instanceof Error ? error.message : 'Okänt fel vid uppdatering av profil');
    }
  }
}

// För bakåtkompatibilitet behåller vi även den funktionella versionen
export const createUpdateProfileUseCase = (deps: UpdateProfileDeps) => {
  const useCase = new UpdateProfileUseCase(deps);
  return (input: UpdateProfileInput) => useCase.execute(input);
};

export default createUpdateProfileUseCase; 