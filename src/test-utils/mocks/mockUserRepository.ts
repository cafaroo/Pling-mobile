/**
 * MockUserRepository
 * 
 * Mockat repository för User-entiteten som används i tester
 */

import { User } from '@/domain/user/entities/User';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { Result, ok, err } from '@/shared/core/Result';
import { Email } from '@/domain/user/value-objects/Email';

export class MockUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();
  private usersByEmail: Map<string, User> = new Map();
  private savedUsers: User[] = [];

  /**
   * Återställer mocken till ursprungligt tillstånd
   */
  reset(): void {
    this.users.clear();
    this.usersByEmail.clear();
    this.savedUsers = [];
  }

  /**
   * Lägger till en användare i mocken
   */
  addUser(user: User): void {
    this.users.set(user.id.toString(), user);
    this.usersByEmail.set(user.email.value, user);
  }

  /**
   * Lägger till flera användare i mocken
   */
  addUsers(users: User[]): void {
    users.forEach(user => this.addUser(user));
  }

  /**
   * Hämtar alla sparade användare
   */
  getSavedUsers(): User[] {
    return [...this.savedUsers];
  }

  /**
   * Mock-implementation av findById
   */
  async findById(id: string): Promise<Result<User, Error>> {
    const user = this.users.get(id);
    
    if (!user) {
      return err(new Error(`Användare med ID ${id} hittades inte`));
    }
    
    return ok(user);
  }

  /**
   * Mock-implementation av findByEmail
   */
  async findByEmail(email: Email | string): Promise<Result<User, Error>> {
    const emailStr = email instanceof Email ? email.value : email;
    const user = this.usersByEmail.get(emailStr);
    
    if (!user) {
      return err(new Error(`Användare med e-post ${emailStr} hittades inte`));
    }
    
    return ok(user);
  }

  /**
   * Mock-implementation av findByUsername (om det finns)
   */
  async findByUsername(username: string): Promise<Result<User, Error>> {
    const matchingUser = Array.from(this.users.values())
      .find(user => user.name?.toLowerCase() === username.toLowerCase());
    
    if (!matchingUser) {
      return err(new Error(`Användare med användarnamn ${username} hittades inte`));
    }
    
    return ok(matchingUser);
  }

  /**
   * Mock-implementation av save
   */
  async save(user: User): Promise<Result<User, Error>> {
    this.users.set(user.id.toString(), user);
    this.usersByEmail.set(user.email.value, user);
    this.savedUsers.push(user);
    return ok(user);
  }

  /**
   * Mock-implementation av delete
   */
  async delete(id: string): Promise<Result<void, Error>> {
    const user = this.users.get(id);
    
    if (!user) {
      return err(new Error(`Användare med ID ${id} hittades inte`));
    }

    this.usersByEmail.delete(user.email.value);
    this.users.delete(id);
    return ok(undefined);
  }

  /**
   * Mock-implementation av getAll
   */
  async getAll(): Promise<Result<User[], Error>> {
    return ok(Array.from(this.users.values()));
  }

  /**
   * Mock-implementation som simulerar ett databasfel
   */
  triggerError(methodName: string): void {
    this[methodName as keyof MockUserRepository] = async () => {
      return err(new Error('Simulerat databasfel'));
    };
  }
}

// Exportera en factory-funktion för enkel användning
export const createMockUserRepository = (): MockUserRepository => {
  return new MockUserRepository();
}; 