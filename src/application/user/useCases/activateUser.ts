import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { Result, err, ok } from '@/shared/core/Result';
import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';
import { UniqueId } from '@/shared/core/UniqueId';

export interface ActivateUserDTO {
  userId: string;
  reason: string;
}

export interface ActivateUserResponse {
  userId: string;
  status: string;
  activatedAt: Date;
}

type ActivateUserError = {
  message: string;
  code: 'USER_NOT_FOUND' | 'ALREADY_ACTIVE' | 'DATABASE_ERROR' | 'UNEXPECTED_ERROR';
};

interface Dependencies {
  userRepo: UserRepository;
  eventPublisher: IDomainEventPublisher;
}

/**
 * Användarfall för att aktivera en inaktiv användare
 */
export class ActivateUserUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {}

  static create(deps: Dependencies): ActivateUserUseCase {
    return new ActivateUserUseCase(
      deps.userRepo,
      deps.eventPublisher
    );
  }

  async execute(dto: ActivateUserDTO): Promise<Result<ActivateUserResponse, ActivateUserError>> {
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
      
      // Kontrollera om användaren redan är aktiv
      if (user.status === 'active') {
        return err({
          message: 'Användaren är redan aktiverad',
          code: 'ALREADY_ACTIVE'
        });
      }
      
      // Aktivera användaren genom att uppdatera status
      const updateResult = user.updateStatus('active', dto.reason);
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
          message: `Kunde inte spara den aktiverade användaren: ${saveResult.error}`,
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
        activatedAt: user.updatedAt
      });
    } catch (error) {
      return err({
        message: `Ett oväntat fel uppstod vid aktivering av användare: ${error instanceof Error ? error.message : String(error)}`,
        code: 'UNEXPECTED_ERROR'
      });
    }
  }
} 