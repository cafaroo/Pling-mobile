import { Result, ok, err } from '@/shared/core/Result';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { User } from '@/domain/user/entities/User';
import { UserProfile } from '@/domain/user/entities/UserProfile';
import { UserSettings } from '@/domain/user/entities/UserSettings';
import { UserCreated } from '@/domain/user/events/UserEvent';
import { PhoneNumber } from '@/domain/user/value-objects/PhoneNumber';
import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';
import { UniqueId } from '@/shared/core/UniqueId';

export interface CreateUserDTO {
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

export interface CreateUserResponse {
  userId: string;
  email: string;
  name: string;
  createdAt: Date;
}

type CreateUserError = {
  message: string;
  code: 'USER_ALREADY_EXISTS' | 'INVALID_PHONE_NUMBER' | 'VALIDATION_ERROR' | 'DATABASE_ERROR' | 'UNEXPECTED_ERROR';
};

interface Dependencies {
  userRepo: UserRepository;
  eventPublisher: IDomainEventPublisher;
}

export class CreateUserUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {}

  static create(deps: Dependencies): CreateUserUseCase {
    return new CreateUserUseCase(
      deps.userRepo,
      deps.eventPublisher
    );
  }

  async execute(dto: CreateUserDTO): Promise<Result<CreateUserResponse, CreateUserError>> {
    try {
      // Kontrollera om användaren redan finns
      const existingUserResult = await this.userRepo.findByEmail(dto.email);
      if (existingUserResult.isOk()) {
        return err({
          message: 'En användare med denna e-postadress finns redan',
          code: 'USER_ALREADY_EXISTS'
        });
      }

      // Validera telefonnummer om det finns
      if (dto.phone) {
        const phoneResult = PhoneNumber.create(dto.phone);
        if (phoneResult.isErr()) {
          return err({
            message: 'Ogiltigt telefonnummer',
            code: 'INVALID_PHONE_NUMBER'
          });
        }
      }

      // Skapa profil
      const profileResult = UserProfile.create({
        firstName: dto.profile.firstName,
        lastName: dto.profile.lastName,
        displayName: dto.profile.displayName,
        avatarUrl: dto.profile.avatarUrl,
        bio: dto.profile.bio,
        location: dto.profile.location,
        socialLinks: dto.profile.socialLinks,
        interests: dto.profile.interests
      });

      if (profileResult.isErr()) {
        return err({
          message: profileResult.error,
          code: 'VALIDATION_ERROR'
        });
      }

      // Skapa inställningar
      const settingsResult = UserSettings.create({
        theme: dto.settings.theme,
        language: dto.settings.language,
        notifications: {
          email: dto.settings.notifications.email,
          push: dto.settings.notifications.push,
          inApp: dto.settings.notifications.inApp
        },
        privacy: {
          showProfile: dto.settings.privacy.showProfile,
          showActivity: dto.settings.privacy.showActivity,
          showTeams: dto.settings.privacy.showTeams
        }
      });

      if (settingsResult.isErr()) {
        return err({
          message: settingsResult.error,
          code: 'VALIDATION_ERROR'
        });
      }

      // Skapa användare
      const userResult = await User.create({
        email: dto.email,
        name: `${dto.profile.firstName} ${dto.profile.lastName}`,
        settings: settingsResult.value,
        profile: profileResult.value,
        teamIds: dto.teamIds || []
      });

      if (userResult.isErr()) {
        return err({
          message: userResult.error,
          code: 'VALIDATION_ERROR'
        });
      }

      const user = userResult.value;

      // Spara användaren
      const saveResult = await this.userRepo.save(user);
      if (saveResult.isErr()) {
        return err({
          message: `Kunde inte skapa användaren: ${saveResult.error}`,
          code: 'DATABASE_ERROR'
        });
      }

      const savedUser = saveResult.value;

      // Publicera händelser
      const domainEvents = savedUser.getDomainEvents();
      for (const event of domainEvents) {
        await this.eventPublisher.publish(event);
      }
      
      // Rensa händelser efter publicering
      savedUser.clearEvents();

      // Returnera response
      return ok({
        userId: savedUser.id.toString(),
        email: savedUser.email,
        name: savedUser.name,
        createdAt: savedUser.createdAt
      });
    } catch (error) {
      return err({
        message: `Ett oväntat fel uppstod vid skapande av användare: ${error instanceof Error ? error.message : String(error)}`,
        code: 'UNEXPECTED_ERROR'
      });
    }
  }
} 