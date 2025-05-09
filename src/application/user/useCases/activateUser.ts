import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { UserActivated } from '@/domain/user/events/UserEvent';
import { Result, err, ok } from '@/shared/core/Result';
import { EventBus } from '@/shared/core/EventBus';

export interface ActivateUserInput {
  userId: string;
  reason: string;
}

export type ActivateUserError = 
  | 'USER_NOT_FOUND'
  | 'ALREADY_ACTIVE'
  | 'OPERATION_FAILED';

export interface ActivateUserDeps {
  userRepo: UserRepository;
  eventBus: EventBus;
}

/**
 * Användarfall för att aktivera en inaktiv användare
 */
export const activateUser = (deps: ActivateUserDeps) => 
  async (input: ActivateUserInput): Promise<Result<void, ActivateUserError>> => {
    const { userId, reason } = input;
    
    // Hämta användaren från repository
    const userResult = await deps.userRepo.findById(userId);
    if (userResult.isErr()) {
      return err('USER_NOT_FOUND');
    }
    
    const user = userResult.value;
    
    // Kontrollera om användaren redan är aktiv
    if (user.status === 'active') {
      return err('ALREADY_ACTIVE');
    }
    
    try {
      // Aktivera användaren genom att uppdatera status
      const updatedUser = user.updateStatus('active');
      if (updatedUser.isErr()) {
        return err('OPERATION_FAILED');
      }
      
      // Spara användaren och publicera händelsen
      await deps.userRepo.save(updatedUser.value);
      await deps.eventBus.publish(new UserActivated(updatedUser.value, reason));
      
      return ok(undefined);
    } catch (error) {
      console.error('Fel vid aktivering av användare:', error);
      return err('OPERATION_FAILED');
    }
  }; 