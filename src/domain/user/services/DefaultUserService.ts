import { UserService } from './UserService';
import { UserRepository } from '../repositories/UserRepository';
import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';
import { User } from '../entities/User';
import { Result } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * Standard implementation av UserService
 */
export class DefaultUserService implements UserService {
  private userRepository: UserRepository;
  private eventPublisher: IDomainEventPublisher;

  constructor(userRepository: UserRepository, eventPublisher: IDomainEventPublisher) {
    this.userRepository = userRepository;
    this.eventPublisher = eventPublisher;
  }

  /**
   * Hämtar en användare via ID
   */
  async getUserById(userId: string): Promise<Result<User, string>> {
    try {
      return await this.userRepository.findById(userId);
    } catch (error) {
      return Result.fail(`Kunde inte hämta användare: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Hämtar en användare via email
   */
  async getUserByEmail(email: string): Promise<Result<User, string>> {
    try {
      return await this.userRepository.findByEmail(email);
    } catch (error) {
      return Result.fail(`Kunde inte hämta användare med email: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Sparar en användare till repositoryt
   */
  async saveUser(user: User): Promise<Result<User, string>> {
    try {
      // Publicera alla händelser från användaren till eventbussen
      const events = user.getDomainEvents();
      
      await this.userRepository.save(user);
      
      // Publicera events efter att användaren sparats
      for (const event of events) {
        this.eventPublisher.publish(event);
      }
      
      // Rensa events efter publicering
      user.clearEvents();
      
      return Result.ok(user);
    } catch (error) {
      return Result.fail(`Kunde inte spara användare: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Hämtar alla användare
   */
  async getAllUsers(): Promise<Result<User[], string>> {
    try {
      return await this.userRepository.findAll();
    } catch (error) {
      return Result.fail(`Kunde inte hämta alla användare: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 