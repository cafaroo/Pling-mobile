import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { UserDeactivated } from '@/domain/user/events/UserEvent';
import { Result, err, ok } from '@/shared/core/Result';
import { EventBus } from '@/shared/core/EventBus';

export interface DeactivateUserInput {
  userId: string;
  reason: string;
}

export type DeactivateUserError = 
  | 'USER_NOT_FOUND'
  | 'ALREADY_INACTIVE'
  | 'OPERATION_FAILED';

export interface DeactivateUserDeps {
  userRepo: UserRepository;
  eventBus: EventBus;
}

/**
 * Användarfall för att inaktivera en användare
 * 
 * Detta användarfall tar en användar-ID och en anledning, 
 * ändrar användarens status till inaktiv och publicerar en UserDeactivated-händelse.
 */
export const deactivateUser = (deps: DeactivateUserDeps) => 
  async (input: DeactivateUserInput): Promise<Result<void, DeactivateUserError>> => {
    const { userId, reason } = input;
    
    // Hämta användaren från repository
    const userResult = await deps.userRepo.findById(userId);
    if (!userResult) {
      return err('USER_NOT_FOUND');
    }
    
    const user = userResult;
    
    // Kontrollera om användaren redan är inaktiv
    if (user.status === 'inactive') {
      return err('ALREADY_INACTIVE');
    }
    
    try {
      // Inaktivera användaren genom att uppdatera status
      const updatedUser = user.updateStatus('inactive');
      if (updatedUser.isErr()) {
        return err('OPERATION_FAILED');
      }
      
      // Spara användaren och publicera händelsen
      await deps.userRepo.save(updatedUser.getValue());
      await deps.eventBus.publish(new UserDeactivated(updatedUser.getValue(), reason));
      
      return ok(undefined);
    } catch (error) {
      console.error('Fel vid inaktivering av användare:', error);
      return err('OPERATION_FAILED');
    }
  }; 