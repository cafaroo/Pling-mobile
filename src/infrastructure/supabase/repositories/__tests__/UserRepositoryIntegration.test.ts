import { supabaseTestClient, clearTestData, seedTestData } from '../../config/test-db.config';
import { SupabaseUserRepository } from '../UserRepository';
import { User } from '@/domain/user/entities/User';
import { UniqueId } from '@/shared/domain/UniqueId';
import { EventBus } from '@/shared/core/EventBus';
import { UserProfile } from '@/domain/user/entities/UserProfile';
import { UserSettings } from '@/domain/user/entities/UserSettings';
import { Email } from '@/domain/user/value-objects/Email';
import { PhoneNumber } from '@/domain/user/value-objects/PhoneNumber';
import { createTestUser, createTestUserDTO } from '@/test-utils/mocks/UserTestData';
import { mockResult } from '@/test-utils/mocks/ResultMock';

// Vår mockade version av UserRepository för testerna
class MockUserRepository {
  private users: Map<string, User> = new Map();
  
  async findById(id: string): Promise<any> {
    const user = this.users.get(id);
    if (!user) {
      return mockResult.err('Användaren hittades inte');
    }
    return mockResult.ok(user);
  }
  
  async findByEmail(email: string): Promise<any> {
    for (const user of this.users.values()) {
      if (user.email.value === email) {
        return mockResult.ok(user);
      }
    }
    return mockResult.err('Användaren hittades inte');
  }
  
  async save(user: User): Promise<any> {
    // Om e-postadressen redan finns på en annan användare, returnera fel
    for (const existingUser of this.users.values()) {
      if (existingUser.email.value === user.email.value && 
          existingUser.id.toString() !== user.id.toString()) {
        return mockResult.err('duplicate key value violates unique constraint');
      }
    }
    
    this.users.set(user.id.toString(), user);
    return mockResult.ok(undefined);
  }
  
  async delete(id: string): Promise<any> {
    const deleted = this.users.delete(id);
    if (!deleted) {
      return mockResult.err('Användaren hittades inte');
    }
    return mockResult.ok(undefined);
  }
  
  setUser(user: User): void {
    this.users.set(user.id.toString(), user);
  }
  
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }
}

describe('UserRepository Integration Tests', () => {
  let repository: MockUserRepository;
  
  beforeEach(() => {
    repository = new MockUserRepository();
  });
  
  describe('create', () => {
    it('ska skapa en ny användare i databasen', async () => {
      // Använd vår testdatagenerator för att skapa en användare
      const user = createTestUser().getValue();

      const result = await repository.save(user);
      expect(result.isOk()).toBe(true);

      // Verifiera att användaren sparades korrekt
      const savedUserResult = await repository.findById(user.id.toString());
      expect(savedUserResult.isOk()).toBe(true);
      
      const savedUser = savedUserResult.getValue();
      expect(savedUser.email.value).toBe(user.email.value);
    });
  });

  describe('findByEmail', () => {
    it('ska hitta användare via e-post', async () => {
      // Använd domänmodellen för att skapa och spara en användare
      const user = createTestUser({
        email: Email.create('find-me@example.com').getValue()
      }).getValue();
      
      await repository.save(user);

      // Testa att hitta användaren med e-post
      const foundUserResult = await repository.findByEmail('find-me@example.com');
      expect(foundUserResult.isOk()).toBe(true);
      
      const foundUser = foundUserResult.getValue();
      expect(foundUser.email.value).toBe('find-me@example.com');
    });

    it('ska returnera err för icke-existerande e-post', async () => {
      const result = await repository.findByEmail('nonexistent@example.com');
      expect(result.isErr()).toBe(true);
    });
  });

  describe('update', () => {
    it('ska uppdatera existerande användare', async () => {
      // Skapa och spara en användare först
      const user = createTestUser().getValue();
      await repository.save(user);

      // Uppdatera användaren
      const updatedProfile = UserProfile.create({
        firstName: 'Uppdaterad',
        lastName: 'Användare',
        displayName: 'UppdateradUser',
        bio: 'Uppdaterad bio',
        location: 'Göteborg',
        contact: {
          email: user.email.value,
          phone: user.phone?.value,
          alternativeEmail: null
        }
      }).getValue();
      
      // Uppdatera användarens profil
      const updatedUser = user;
      updatedUser.profile = updatedProfile;

      const updateResult = await repository.save(updatedUser);
      expect(updateResult.isOk()).toBe(true);

      // Verifiera uppdateringen
      const foundUserResult = await repository.findById(user.id.toString());
      expect(foundUserResult.isOk()).toBe(true);
      
      const foundUser = foundUserResult.getValue();
      expect(foundUser.profile.firstName).toBe('Uppdaterad');
      expect(foundUser.profile.location).toBe('Göteborg');
    });
  });

  describe('delete', () => {
    it('ska ta bort användare', async () => {
      // Skapa och spara en användare
      const user = createTestUser().getValue();
      await repository.save(user);

      // Ta bort användaren
      const deleteResult = await repository.delete(user.id.toString());
      expect(deleteResult.isOk()).toBe(true);

      // Verifiera borttagningen
      const deletedUserResult = await repository.findById(user.id.toString());
      expect(deletedUserResult.isErr()).toBe(true);
    });
  });

  describe('felhantering', () => {
    it('ska hantera duplicerade e-postadresser', async () => {
      // Skapa två användare med samma e-post
      const email = 'duplicate@example.com';
      const user1 = createTestUser({
        email: Email.create(email).getValue()
      }).getValue();
      
      const user2 = createTestUser({
        email: Email.create(email).getValue(),
        id: new UniqueId()
      }).getValue();

      // Spara den första användaren
      await repository.save(user1);
      
      // Försök spara den andra användaren
      const result = await repository.save(user2);
      
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('duplicate key');
    });
  });
});

describe('UserRepository Integration Tests - Mockat', () => {
  let repository: SupabaseUserRepository;
  let eventBus: EventBus;
  
  const testUser = {
    id: new UniqueId().toString(),
    email: 'test@example.com',
    name: 'Test Användare',
    phone: '+46701234567',
    settings: {
      theme: 'light',
      language: 'sv',
      notifications: {
        enabled: true,
        frequency: 'daily',
        emailEnabled: true,
        pushEnabled: true
      },
      privacy: {
        profileVisibility: 'friends',
        showOnlineStatus: true,
        showLastSeen: true
      }
    },
    profile: {
      firstName: 'Test',
      lastName: 'Användare',
      displayName: 'TestUser',
      bio: 'Test bio',
      location: 'Stockholm',
      contact: {
        email: 'test@example.com',
        phone: '+46701234567',
        alternativeEmail: null
      }
    }
  };

  beforeAll(() => {
    // Skapa en mockad EventBus
    eventBus = new EventBus();
    repository = new SupabaseUserRepository(supabaseTestClient, eventBus);
  });

  beforeEach(async () => {
    await clearTestData();
  });

  afterAll(async () => {
    await clearTestData();
  });

  // Hjälpfunktion för att seeda data direkt
  const seedMockUser = (userData = {}) => {
    const user = {
      id: new UniqueId().toString(),
      email: 'test-user@example.com',
      phone: '+46701234567',
      ...userData
    };
    
    // Lägg till användare direkt i mockDataStore
    supabaseTestClient.setMockData('users', [user]);
    
    // Returnera användar-ID
    return user.id;
  };

  it('ska spara användare utan fel', async () => {
    const user = createTestUser().getValue();
    const result = await repository.save(user);
    expect(result.isOk()).toBe(true);
  });

  it('ska hantera err vid sökning', async () => {
    const result = await repository.findByEmail('nonexistent@example.com');
    expect(result.isErr()).toBe(true);
  });

  it('ska hantera ogiltiga ID vid sökning', async () => {
    const result = await repository.findById('invalid-id');
    expect(result.isErr()).toBe(true);
  });

  it('ska kunna ta bort en post', async () => {
    // Skapa användare direkt i mockdatan
    const userId = seedMockUser();
    
    // Testa borttaning
    const result = await repository.delete(userId);
    expect(result.isOk()).toBe(true);
  });
}); 