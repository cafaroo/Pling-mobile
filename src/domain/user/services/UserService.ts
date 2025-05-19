import { User } from '../entities/User';
import { Result } from '@/shared/core/Result';

/**
 * Gränssnitt för tjänster relaterade till User-domänen
 */
export interface UserService {
  /**
   * Hämtar en användare via ID
   */
  getUserById(userId: string): Promise<Result<User, string>>;
  
  /**
   * Hämtar en användare via email
   */
  getUserByEmail(email: string): Promise<Result<User, string>>;
  
  /**
   * Sparar en användare till repositoryt
   */
  saveUser(user: User): Promise<Result<User, string>>;
  
  /**
   * Hämtar alla användare
   */
  getAllUsers(): Promise<Result<User[], string>>;
} 