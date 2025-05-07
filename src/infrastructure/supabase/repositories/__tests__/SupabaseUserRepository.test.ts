import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseUserRepository } from '../SupabaseUserRepository';
import { User } from '@/domain/user/entities/User';
import { UserMapper } from '../../mappers/UserMapper';
import { UniqueId } from '@/shared/domain/UniqueId';
import { Result, ok } from '@/shared/core/Result';

// Mock Supabase klient
jest.mock('@supabase/supabase-js');

describe('SupabaseUserRepository', () => {
  let mockSupabase: jest.Mocked<SupabaseClient>;
  let repository: SupabaseUserRepository;
  let mockUser: User;

  const mockUserData = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    phone: '+46701234567',
    settings: {
      theme: 'light',
      language: 'sv',
      notifications: {
        email: true,
        push: true,
        sms: false,
        frequency: 'daily'
      }
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn()
    } as any;

    repository = new SupabaseUserRepository(mockSupabase);
    mockUser = User.create({
      id: new UniqueId(mockUserData.id),
      email: mockUserData.email,
      name: mockUserData.name,
      phone: mockUserData.phone,
      settings: mockUserData.settings
    }).value as User;
  });

  describe('findById', () => {
    it('ska hämta användare med specifikt ID', async () => {
      mockSupabase.from().select().single.mockResolvedValue({
        data: mockUserData,
        error: null
      });

      const result = await repository.findById(new UniqueId(mockUserData.id));
      expect(result).toBeDefined();
      expect(result?.id.toString()).toBe(mockUserData.id);
      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabase.select).toHaveBeenCalled();
    });

    it('ska returnera null om användaren inte hittas', async () => {
      mockSupabase.from().select().single.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await repository.findById(new UniqueId('non-existent-id'));
      expect(result).toBeNull();
    });

    it('ska hantera databasfel', async () => {
      mockSupabase.from().select().single.mockResolvedValue({
        data: null,
        error: new Error('Databasfel')
      });

      await expect(repository.findById(new UniqueId(mockUserData.id)))
        .rejects.toThrow('Databasfel');
    });
  });

  describe('findByEmail', () => {
    it('ska hämta användare med specifik e-postadress', async () => {
      mockSupabase.from().select().single.mockResolvedValue({
        data: mockUserData,
        error: null
      });

      const result = await repository.findByEmail(mockUserData.email);
      expect(result).toBeDefined();
      expect(result?.email).toBe(mockUserData.email);
    });

    it('ska returnera null om e-postadressen inte hittas', async () => {
      mockSupabase.from().select().single.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await repository.findByEmail('non-existent@example.com');
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('ska skapa ny användare', async () => {
      mockSupabase.from().insert().single.mockResolvedValue({
        data: mockUserData,
        error: null
      });

      const result = await repository.save(mockUser);
      expect(result.isOk()).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it('ska uppdatera existerande användare', async () => {
      // Simulera att användaren redan finns
      mockSupabase.from().select().single.mockResolvedValue({
        data: mockUserData,
        error: null
      });

      mockSupabase.from().update().single.mockResolvedValue({
        data: { ...mockUserData, name: 'Updated Name' },
        error: null
      });

      const updatedUser = { ...mockUser, name: 'Updated Name' } as User;
      const result = await repository.save(updatedUser);
      
      expect(result.isOk()).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabase.update).toHaveBeenCalled();
    });

    it('ska hantera fel vid sparande', async () => {
      mockSupabase.from().insert().single.mockResolvedValue({
        data: null,
        error: new Error('Kunde inte spara användaren')
      });

      const result = await repository.save(mockUser);
      expect(result.isErr()).toBe(true);
    });
  });

  describe('delete', () => {
    it('ska ta bort användare', async () => {
      mockSupabase.from().delete().eq.mockResolvedValue({
        data: mockUserData,
        error: null
      });

      const result = await repository.delete(mockUser.id);
      expect(result.isOk()).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabase.delete).toHaveBeenCalled();
    });

    it('ska hantera fel vid borttagning', async () => {
      mockSupabase.from().delete().eq.mockResolvedValue({
        data: null,
        error: new Error('Kunde inte ta bort användaren')
      });

      const result = await repository.delete(mockUser.id);
      expect(result.isErr()).toBe(true);
    });
  });
}); 