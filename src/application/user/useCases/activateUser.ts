/**
 * activateUser Use Case
 * 
 * Aktiverar ett användarekonto och utlöser en UserActivated-händelse
 */

import { Result, ok, err } from '@/shared/core/Result';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { User } from '@/domain/user/entities/User';
import { EventBus } from '@/shared/core/EventBus';
import { UserActivated } from '@/domain/user/events/UserEvent';

export interface ActivateUserInput {
  userId: string;
  reason?: string;
}

export interface ActivateUserDeps {
  userRepo: UserRepository;
  eventBus: EventBus;
}

export const activateUser = (deps: ActivateUserDeps) => {
  const { userRepo, eventBus } = deps;

  return async (input: ActivateUserInput): Promise<Result<User, Error>> => {
    try {
      const { userId, reason = 'manual_activation' } = input;

      // Hitta användaren
      const userResult = await userRepo.findById(userId);
      if (userResult.isErr()) {
        return err(new Error(`Kunde inte hitta användaren: ${userResult.error.message}`));
      }

      const user = userResult.value;

      // Kontrollera om användaren redan är aktiv
      if (user.isActive()) {
        return ok(user); // Returnera success om användaren redan är aktiv
      }

      // Aktivera användaren
      user.activate();

      // Spara användaren
      const saveResult = await userRepo.save(user);
      if (saveResult.isErr()) {
        return err(new Error(`Kunde inte spara användaren: ${saveResult.error.message}`));
      }

      // Publicera event
      eventBus.publish(new UserActivated(user, reason));

      return ok(user);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Okänt fel vid aktivering av användare'));
    }
  };
};

export default activateUser; 