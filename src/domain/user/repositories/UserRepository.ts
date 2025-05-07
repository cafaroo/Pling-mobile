import { Result } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { User } from '../entities/User';

export interface UserRepository {
  findById(id: UniqueId | string): Promise<Result<User, string>>;
  findByEmail(email: string): Promise<Result<User, string>>;
  save(user: User): Promise<Result<void, string>>;
  delete(id: UniqueId | string): Promise<Result<void, string>>;
  findByTeamId(teamId: UniqueId | string): Promise<Result<User[], string>>;
  findById(id: string): Promise<Result<User, string>>;
} 