/**
 * MockUserRepository
 * 
 * Mockat repository för User-entiteten som används i tester
 */

import { User } from '@/domain/user/entities/User';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { Result, ok, err } from '@/shared/core/Result';
import { Email } from '@/domain/user/value-objects/Email';
import { UniqueId } from '@/shared/core/UniqueId';

export class MockUserRepository implements UserRepository {
  // Gör users map publik för testning
  public users: Map<string, User> = new Map();
  private usersByEmail: Map<string, User> = new Map();
  private savedUsers: User[] = [];
  private userCount: number = 0;

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
    if (!user || !user.id) {
      console.error('Försökte lägga till användare utan giltigt ID', user);
      return;
    }
    
    // Använd toString för att säkerställa att vi alltid använder string-nycklar
    this.users.set(user.id.toString(), user);
    
    if (user.email && user.email.value) {
      this.usersByEmail.set(user.email.value, user);
    }
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
   * Hittar en användare baserat på ID
   */
  async findById(id: string | UniqueId): Promise<Result<User, Error>> {
    const idStr = typeof id === 'string' ? id : id.toString();
    console.log('User findById söker efter:', idStr);
    console.log('users map innehåller:', Array.from(this.users.keys()));
    
    const user = this.users.get(idStr);
    if (!user) {
      return err(new Error(`Användare med ID ${idStr} hittades inte`));
    }
    return ok(user);
  }

  /**
   * Hittar en användare baserat på email
   */
  async findByEmail(email: string | Email): Promise<Result<User, Error>> {
    const emailValue = email instanceof Email ? email.value : email;
    const user = this.usersByEmail.get(emailValue);
    if (!user) {
      return err(new Error(`Användare med email ${emailValue} hittades inte`));
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
   * Söker användare baserat på sökterm
   */
  async search(term: string): Promise<Result<User[], Error>> {
    if (!term) {
      return ok([]);
    }

    // Enkel sökning som matchar namn eller email
    const lowercaseTerm = term.toLowerCase();
    const results = Array.from(this.users.values()).filter(user => {
      const nameMatch = user.fullName?.toLowerCase().includes(lowercaseTerm);
      const emailMatch = user.email?.value.toLowerCase().includes(lowercaseTerm);
      return nameMatch || emailMatch;
    });

    return ok(results);
  }

  /**
   * Finns användare med id?
   */
  async exists(userId: string): Promise<Result<boolean, Error>> {
    return ok(this.users.has(userId));
  }

  /**
   * Spara en användare (skapa eller uppdatera)
   */
  async save(user: User): Promise<Result<User, Error>> {
    if (!user || !user.id) {
      return err(new Error('Kan inte spara användare: Ogiltigt User-objekt eller saknat ID'));
    }
    
    // Använd toString för att säkerställa att vi alltid använder string-nycklar
    const userIdStr = user.id.toString();
      
    this.users.set(userIdStr, user);
    
    if (user.email && user.email.value) {
      this.usersByEmail.set(user.email.value, user);
    }
    
    this.savedUsers.push(user);
    return ok(user);
  }

  /**
   * Radera en användare
   */
  async delete(userId: string | UniqueId): Promise<Result<void, Error>> {
    const userIdStr = typeof userId === 'string' ? userId : userId.toString();
    const user = this.users.get(userIdStr);
    
    if (!user) {
      return err(new Error(`Användare med ID ${userIdStr} hittades inte`));
    }
    
    if (user.email && user.email.value) {
      this.usersByEmail.delete(user.email.value);
    }
    
    this.users.delete(userIdStr);
    return ok(undefined);
  }

  /**
   * Få antalet användare
   */
  async count(): Promise<Result<number, Error>> {
    return ok(this.users.size);
  }

  /**
   * Mock-implementation av getAll
   */
  async getAll(): Promise<Result<User[], Error>> {
    return ok(Array.from(this.users.values()));
  }

  /**
   * Metod som gör mockingen möjlig
   */
  mockAddUser(user: User): void {
    if (!user || !user.id) {
      throw new Error('Kan inte lägga till användare: Ogiltigt User-objekt eller saknat ID');
    }
    
    // Använd toString för att säkerställa att vi alltid använder string-nycklar
    const userIdStr = user.id.toString();
      
    this.users.set(userIdStr, user);
    
    if (user.email && user.email.value) {
      this.usersByEmail.set(user.email.value, user);
    }
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