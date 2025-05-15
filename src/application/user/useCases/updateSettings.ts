import { Result, ok, err } from '@/shared/core/Result';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { UserSettings } from '@/domain/user/entities/UserSettings';
import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';
import { UniqueId } from '@/shared/core/UniqueId';

export interface UpdateSettingsDTO {
  userId: string;
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
}

export interface UpdateSettingsResponse {
  userId: string;
  theme: string;
  language: string;
  updatedAt: Date;
}

type UpdateSettingsError = {
  message: string;
  code: 'USER_NOT_FOUND' | 'VALIDATION_ERROR' | 'DATABASE_ERROR' | 'UNEXPECTED_ERROR';
};

interface Dependencies {
  userRepo: UserRepository;
  eventPublisher: IDomainEventPublisher;
}

/**
 * Användarfall för att uppdatera användarinställningar
 */
export class UpdateSettingsUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {}

  static create(deps: Dependencies): UpdateSettingsUseCase {
    return new UpdateSettingsUseCase(
      deps.userRepo,
      deps.eventPublisher
    );
  }

  async execute(dto: UpdateSettingsDTO): Promise<Result<UpdateSettingsResponse, UpdateSettingsError>> {
    try {
      const userIdObj = new UniqueId(dto.userId);
      
      // Hämta användaren
      const userResult = await this.userRepo.findById(userIdObj);
      
      if (userResult.isErr()) {
        return err({
          message: `Användaren hittades inte: ${userResult.error}`,
          code: 'USER_NOT_FOUND'
        });
      }
      
      const user = userResult.value;
      
      // Skapa nya inställningar baserat på användarens nuvarande inställningar
      // och de inställningar som ska uppdateras
      const currentSettings = user.settings || {};
      
      const settingsResult = UserSettings.create({
        language: dto.language || currentSettings.language,
        theme: dto.theme || currentSettings.theme,
        notifications: {
          ...currentSettings.notifications,
          ...dto.notifications
        },
        privacy: {
          ...currentSettings.privacy,
          ...dto.privacy
        }
      });
      
      if (settingsResult.isErr()) {
        return err({
          message: settingsResult.error,
          code: 'VALIDATION_ERROR'
        });
      }
      
      // Uppdatera användarens inställningar
      const updateResult = user.updateSettings(settingsResult.value);
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
          message: `Kunde inte uppdatera inställningarna: ${saveResult.error}`,
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
      
      return ok({
        userId: user.id.toString(),
        theme: user.settings.theme,
        language: user.settings.language,
        updatedAt: user.updatedAt
      });
    } catch (error) {
      return err({
        message: `Ett oväntat fel uppstod vid uppdatering av inställningar: ${error instanceof Error ? error.message : String(error)}`,
        code: 'UNEXPECTED_ERROR'
      });
    }
  }
} 