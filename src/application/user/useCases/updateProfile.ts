import { Result, ok, err } from '@/shared/core/Result';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { UserProfile } from '@/domain/user/entities/UserProfile';
import { UniqueId } from '@/shared/core/UniqueId';
import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';

export interface UpdateProfileDTO {
  userId: string;
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
}

export interface UpdateProfileResponse {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  updatedAt: Date;
}

type UpdateProfileError = {
  message: string;
  code: 'USER_NOT_FOUND' | 'VALIDATION_ERROR' | 'DATABASE_ERROR' | 'UNEXPECTED_ERROR';
};

interface Dependencies {
  userRepo: UserRepository;
  eventPublisher: IDomainEventPublisher;
}

export class UpdateProfileUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {}

  static create(deps: Dependencies): UpdateProfileUseCase {
    return new UpdateProfileUseCase(
      deps.userRepo,
      deps.eventPublisher
    );
  }

  async execute(dto: UpdateProfileDTO): Promise<Result<UpdateProfileResponse, UpdateProfileError>> {
    try {
      // Hämta användaren
      const userIdObj = new UniqueId(dto.userId);
      const userResult = await this.userRepo.findById(userIdObj);
      
      if (userResult.isErr()) {
        return err({
          message: `Användaren hittades inte: ${userResult.error}`,
          code: 'USER_NOT_FOUND'
        });
      }

      const user = userResult.value;

      // Skapa ny profil
      const profileResult = UserProfile.create({
        firstName: dto.firstName,
        lastName: dto.lastName,
        displayName: dto.displayName,
        avatarUrl: dto.avatarUrl,
        bio: dto.bio,
        location: dto.location,
        socialLinks: dto.socialLinks,
        interests: dto.interests
      });

      if (profileResult.isErr()) {
        return err({
          message: profileResult.error,
          code: 'VALIDATION_ERROR'
        });
      }

      // Uppdatera användaren med ny profil
      const updateResult = user.updateProfile(profileResult.value);
      if (updateResult.isErr()) {
        return err({
          message: updateResult.error,
          code: 'VALIDATION_ERROR'
        });
      }

      // Spara användaren
      const saveResult = await this.userRepo.save(user);
      if (saveResult.isErr()) {
        return err({
          message: `Kunde inte uppdatera profilen: ${saveResult.error}`,
          code: 'DATABASE_ERROR'
        });
      }

      // Publicera domänevents
      const domainEvents = user.getDomainEvents();
      for (const event of domainEvents) {
        await this.eventPublisher.publish(event);
      }
      
      // Rensa events
      user.clearEvents();

      // Returnera response
      return ok({
        userId: user.id.toString(),
        displayName: user.profile?.displayName || `${user.profile?.firstName} ${user.profile?.lastName}`,
        avatarUrl: user.profile?.avatarUrl,
        updatedAt: user.updatedAt
      });
    } catch (error) {
      return err({
        message: `Ett oväntat fel uppstod vid uppdatering av profil: ${error instanceof Error ? error.message : String(error)}`,
        code: 'UNEXPECTED_ERROR'
      });
    }
  }
} 