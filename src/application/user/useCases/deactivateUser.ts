import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { Result, err, ok } from '@/shared/core/Result';
import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';
import { UniqueId } from '@/shared/core/UniqueId';

export interface DeactivateUserDTO {
  userId: string;
  reason: string;
}

export interface DeactivateUserResponse {
  userId: string;
  status: string;
  deactivatedAt: Date;
}

type DeactivateUserError = {
  message: string;
  code: 'USER_NOT_FOUND' | 'ALREADY_INACTIVE' | 'DATABASE_ERROR' | 'UNEXPECTED_ERROR';
};

interface Dependencies {
  userRepo: UserRepository;
  eventPublisher: IDomainEventPublisher;
}

/**
 * Användarfall för att inaktivera en användare
 * 
 * Detta användarfall tar en användar-ID och en anledning, 
 * ändrar användarens status till inaktiv och publicerar en UserDeactivated-händelse.
 */
export class DeactivateUserUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {}

  static create(deps: Dependencies): DeactivateUserUseCase {
    return new DeactivateUserUseCase(
      deps.userRepo,
      deps.eventPublisher
    );
  }

  async execute(dto: DeactivateUserDTO): Promise<Result<DeactivateUserResponse, DeactivateUserError>> {
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
      
      // Kontrollera om användaren redan är inaktiv
      if (user.status === 'inactive') {
        return err({
          message: 'Användaren är redan inaktiverad',
          code: 'ALREADY_INACTIVE'
        });
      }
      
      // Inaktivera användaren genom att uppdatera status
      const updateResult = user.updateStatus('inactive', dto.reason);
      if (updateResult.isErr()) {
        return err({
          message: updateResult.error,
          code: 'UNEXPECTED_ERROR'
        });
      }
      
      // Spara användaren
      const saveResult = await this.userRepo.save(user);
      if (saveResult.isErr()) {
        return err({
          message: `Kunde inte spara den inaktiverade användaren: ${saveResult.error}`,
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
        status: user.status,
        deactivatedAt: user.updatedAt
      });
    } catch (error) {
      return err({
        message: `Ett oväntat fel uppstod vid inaktivering av användare: ${error instanceof Error ? error.message : String(error)}`,
        code: 'UNEXPECTED_ERROR'
      });
    }
  }
} 