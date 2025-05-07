import { supabaseTestClient, clearTestData, seedTestData } from '../../config/test-db.config';
import { SupabaseUserRepository } from '../SupabaseUserRepository';
import { User } from '@/domain/user/entities/User';
import { UniqueId } from '@/shared/domain/UniqueId';

describe('UserRepository Integration Tests', () => {
  let repository: SupabaseUserRepository;

  const testUser = {
    id: new UniqueId().toString(),
    email: 'test@example.com',
    name: 'Test Användare',
    phone: '+46701234567',
    settings: {
      theme: 'light',
      language: 'sv',
      notifications: {
        email: true,
        push: true
      }
    },
    profile: {
      firstName: 'Test',
      lastName: 'Användare',
      displayName: 'TestUser',
      bio: 'Test bio',
      location: 'Stockholm'
    }
  };

  beforeAll(() => {
    repository = new SupabaseUserRepository(supabaseTestClient);
  });

  beforeEach(async () => {
    await clearTestData();
  });

  afterAll(async () => {
    await clearTestData();
  });

  describe('create', () => {
    it('ska skapa en ny användare i databasen', async () => {
      const user = User.create({
        id: new UniqueId(testUser.id),
        email: testUser.email,
        name: testUser.name,
        phone: testUser.phone,
        settings: testUser.settings,
        profile: testUser.profile
      }).value as User;

      const result = await repository.save(user);
      expect(result.isOk()).toBe(true);

      // Verifiera att användaren sparades korrekt
      const savedUser = await repository.findById(user.id);
      expect(savedUser).toBeDefined();
      expect(savedUser?.email).toBe(testUser.email);
      expect(savedUser?.name).toBe(testUser.name);
    });
  });

  describe('findByEmail', () => {
    it('ska hitta användare via e-post', async () => {
      // Seeda testdata
      await seedTestData({
        users: [testUser]
      });

      const user = await repository.findByEmail(testUser.email);
      expect(user).toBeDefined();
      expect(user?.email).toBe(testUser.email);
    });

    it('ska returnera null för icke-existerande e-post', async () => {
      const user = await repository.findByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });
  });

  describe('update', () => {
    it('ska uppdatera existerande användare', async () => {
      // Seeda testdata
      await seedTestData({
        users: [testUser]
      });

      const user = (await repository.findById(new UniqueId(testUser.id)))!;
      const updatedName = 'Uppdaterad Användare';
      const updatedUser = User.create({
        ...user,
        name: updatedName
      }).value as User;

      const result = await repository.save(updatedUser);
      expect(result.isOk()).toBe(true);

      // Verifiera uppdateringen
      const savedUser = await repository.findById(user.id);
      expect(savedUser?.name).toBe(updatedName);
    });
  });

  describe('delete', () => {
    it('ska ta bort användare', async () => {
      // Seeda testdata
      await seedTestData({
        users: [testUser]
      });

      const result = await repository.delete(new UniqueId(testUser.id));
      expect(result.isOk()).toBe(true);

      // Verifiera borttagningen
      const deletedUser = await repository.findById(new UniqueId(testUser.id));
      expect(deletedUser).toBeNull();
    });
  });

  describe('felhantering', () => {
    it('ska hantera duplicerade e-postadresser', async () => {
      const user1 = User.create({
        id: new UniqueId(),
        email: testUser.email,
        name: 'User 1'
      }).value as User;

      const user2 = User.create({
        id: new UniqueId(),
        email: testUser.email,
        name: 'User 2'
      }).value as User;

      await repository.save(user1);
      const result = await repository.save(user2);
      
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('duplicate key');
    });

    it('ska hantera ogiltiga ID-format', async () => {
      const result = await repository.findById(new UniqueId('invalid-id'));
      expect(result).toBeNull();
    });
  });
}); 