import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { Result, err, ok } from '@/shared/core/Result';
import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';
import { UniqueId } from '@/shared/core/UniqueId';
import { UserSettings } from '@/domain/user/entities/UserSettings';

export interface PrivacySettings {
  profileVisibility: 'public' | 'team' | 'private';
  showEmail: boolean;
  showPhone: boolean;
  shareActivity: boolean;
  allowDataCollection: boolean;
  customSettings?: Record<string, any>;
}

export interface UpdatePrivacySettingsDTO {
  userId: string;
  settings: Partial<PrivacySettings>;
}

export interface UpdatePrivacySettingsResponse {
  userId: string;
  profileVisibility: string;
  updatedAt: Date;
}

type UpdatePrivacySettingsError = {
  message: string;
  code: 'USER_NOT_FOUND' | 'INVALID_SETTINGS' | 'DATABASE_ERROR' | 'VALIDATION_ERROR' | 'UNEXPECTED_ERROR';
};

interface Dependencies {
  userRepo: UserRepository;
  eventPublisher: IDomainEventPublisher;
}

/**
 * Användarfall för att uppdatera en användares integritetsinställningar
 */
export class UpdatePrivacySettingsUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {}

  static create(deps: Dependencies): UpdatePrivacySettingsUseCase {
    return new UpdatePrivacySettingsUseCase(
      deps.userRepo,
      deps.eventPublisher
    );
  }

  async execute(dto: UpdatePrivacySettingsDTO): Promise<Result<UpdatePrivacySettingsResponse, UpdatePrivacySettingsError>> {
    try {
      const userIdObj = new UniqueId(dto.userId);
      
      // Hämta användaren från repository
      const userResult = await this.userRepo.findById(userIdObj);
      if (userResult.isErr()) {
        return err({
          message: `Användaren hittades inte: ${userResult.error}`,
          code: 'USER_NOT_FOUND'
        });
      }
      
      const user = userResult.value;
      
      // Validera inställningarna
      if (dto.settings.profileVisibility && 
          !['public', 'team', 'private'].includes(dto.settings.profileVisibility)) {
        return err({
          message: 'Ogiltig profilsynlighet. Måste vara "public", "team" eller "private"',
          code: 'INVALID_SETTINGS'
        });
      }
      
      // Validera ytterligare inställningar
      if (!validatePrivacySettings(dto.settings)) {
        return err({
          message: 'Ogiltiga integritetsinställningar',
          code: 'VALIDATION_ERROR'
        });
      }
      
      // Hämta nuvarande privacy-inställningar
      const currentSettings = user.settings?.privacy || {};
      
      // Skapa uppdaterade inställningar
      const updatedPrivacySettings = {
        ...currentSettings,
        ...dto.settings
      };
      
      // Skapa nya inställningar baserat på användarens nuvarande inställningar
      const settingsToUpdate = {
        ...user.settings,
        privacy: updatedPrivacySettings
      };
      
      // Skapa UserSettings-objekt
      const userSettingsResult = UserSettings.create(settingsToUpdate);
      if (userSettingsResult.isErr()) {
        return err({
          message: userSettingsResult.error,
          code: 'VALIDATION_ERROR'
        });
      }
      
      // Uppdatera användarens inställningar
      const updateResult = user.updateSettings(userSettingsResult.value);
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
          message: `Kunde inte spara integritetsinställningarna: ${saveResult.error}`,
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
        profileVisibility: updatedPrivacySettings.profileVisibility || 'private',
        updatedAt: user.updatedAt
      });
    } catch (error) {
      return err({
        message: `Ett oväntat fel uppstod vid uppdatering av integritetsinställningar: ${error instanceof Error ? error.message : String(error)}`,
        code: 'UNEXPECTED_ERROR'
      });
    }
  }
}

/**
 * Validerar privacyinställningar
 * 
 * I en riktig implementation skulle detta innehålla omfattande validering
 * av inställningarna baserat på domänregler.
 */
function validatePrivacySettings(settings: Partial<PrivacySettings>): boolean {
  // Kontrollera att settings finns och är ett objekt
  if (!settings || typeof settings !== 'object') {
    return false;
  }
  
  // Kontrollera profilsynlighet om den finns
  if ('profileVisibility' in settings) {
    const validVisibilities = ['public', 'team', 'private'];
    if (!validVisibilities.includes(settings.profileVisibility)) {
      return false;
    }
  }
  
  // Ytterligare valideringar beroende på affärsregler...
  
  return true;
} 