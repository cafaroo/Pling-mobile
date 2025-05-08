import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseUserRepository } from '../UserRepository';
import { User } from '@/domain/user/entities/User';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';
import { EventBus } from '@/shared/core/EventBus';

// Mock Supabase klient och EventBus
jest.mock('@supabase/supabase-js');
jest.mock('@/shared/core/EventBus');

// Mock av Result-funktioner
jest.mock('@/shared/core/Result', () => {
  const originalModule = jest.requireActual('@/shared/core/Result');
  return {
    ...originalModule,
    ok: jest.fn().mockImplementation(value => ({
      isOk: () => true,
      isErr: () => false,
      value,
      error: null,
      unwrap: () => value,
      getValue: () => value,
      andThen: (fn: (value: any) => any) => originalModule.ok(fn(value))
    })),
    err: jest.fn().mockImplementation(error => ({
      isOk: () => false,
      isErr: () => true,
      value: null,
      error,
      unwrap: () => { throw new Error(error) },
      getValue: () => { throw new Error(error) },
      andThen: () => originalModule.err(error)
    }))
  };
});

// Mocka User för att undvika typfel
jest.mock('@/domain/user/entities/User', () => ({
  User: {
    create: jest.fn()
  }
}));

describe('SupabaseUserRepository', () => {
  let mockSupabaseClient: any;
  let mockEventBus: any;
  let repository: SupabaseUserRepository;
  let mockUser: any;

  const mockUserData = {
    id: 'test-user-id',
    email: 'test@example.com',
    phone: '+46701234567',
    profile: {
      firstName: 'Test',
      lastName: 'User',
      displayName: 'TestUser',
      bio: 'Test bio',
      location: 'Stockholm',
      contact: {
        email: 'test@example.com',
        phone: '+46701234567',
        alternativeEmail: null
      }
    },
    settings: {
      theme: 'light',
      language: 'sv',
      notifications: {
        email: true,
        push: true,
        sms: false,
        frequency: 'daily'
      },
      privacy: {
        profileVisibility: 'friends'
      }
    },
    team_ids: [],
    role_ids: [],
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Skapa mockade funktioner för Supabase-klient
  const createMockSupabaseClient = () => {
    const mockFrom = jest.fn();
    const mockSelect = jest.fn();
    const mockInsert = jest.fn();
    const mockUpsert = jest.fn();
    const mockUpdate = jest.fn();
    const mockDelete = jest.fn();
    const mockEq = jest.fn();
    const mockSingle = jest.fn();
    const mockMaybeSingle = jest.fn();
    
    // Konfigurera returvärden
    mockSingle.mockResolvedValue({
      data: mockUserData,
      error: null
    });
    
    mockUpsert.mockResolvedValue({
      data: null,
      error: null
    });
    
    // Skapa en mock för delete-operationen som korrekt kedjar metoderna
    const mockDeleteReturn = jest.fn().mockResolvedValue({
      data: null,
      error: null
    });
    
    mockEq.mockReturnValue({ 
      single: mockSingle,
      mockResolvedValue: mockDeleteReturn
    });
    
    mockDelete.mockReturnValue({
      eq: mockEq
    });
    
    mockSelect.mockReturnValue({ 
      eq: mockEq,
      single: mockSingle,
      maybeSingle: mockMaybeSingle
    });
    
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      upsert: mockUpsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq
    });
    
    return {
      from: mockFrom,
      // Lägg till metoderna på själva klientobjektet för att hjälpa typningen
      select: mockSelect,
      insert: mockInsert, 
      upsert: mockUpsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      single: mockSingle,
      maybeSingle: mockMaybeSingle
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabaseClient = createMockSupabaseClient();
    
    mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn()
    };

    // Skapa mockUser som ett objekt som liknar en User-instans
    mockUser = {
      id: { 
        toString: () => mockUserData.id,
        valueOf: () => mockUserData.id
      },
      email: mockUserData.email,
      phone: mockUserData.phone,
      profile: { ...mockUserData.profile },
      settings: { ...mockUserData.settings },
      teamIds: [],
      roleIds: [],
      status: 'active',
      domainEvents: [],
      clearDomainEvents: jest.fn()
    };
    
    repository = new SupabaseUserRepository(mockSupabaseClient, mockEventBus);
    
    // Konfigurera User.create
    (User.create as jest.Mock).mockReturnValue(ok(mockUser));
  });

  describe('findById', () => {
    it('ska hämta användare med specifikt ID', async () => {
      // Upprätta vad mockSupabaseClient ska returnera
      mockSupabaseClient.from().select().single.mockResolvedValue({
        data: mockUserData,
        error: null
      });

      const result = await repository.findById(mockUserData.id);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const user = result.getValue();
        expect(user.id.toString()).toBe(mockUserData.id);
        expect(user.email).toBe(mockUserData.email);
      }
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
    });

    it('ska returnera err om användaren inte hittas', async () => {
      mockSupabaseClient.from().select().single.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await repository.findById('non-existent-id');
      expect(result.isErr()).toBe(true);
    });

    it('ska returnera err vid databasfel', async () => {
      mockSupabaseClient.from().select().single.mockResolvedValue({
        data: null,
        error: new Error('Databasfel')
      });

      const result = await repository.findById(mockUserData.id);
      expect(result.isErr()).toBe(true);
    });
  });

  describe('findByEmail', () => {
    it('ska hämta användare med specifik e-postadress', async () => {
      mockSupabaseClient.from().select().single.mockResolvedValue({
        data: mockUserData,
        error: null
      });

      const result = await repository.findByEmail(mockUserData.email);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const user = result.getValue();
        expect(user.email).toBe(mockUserData.email);
      }
    });

    it('ska returnera err om e-postadressen inte hittas', async () => {
      mockSupabaseClient.from().select().single.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await repository.findByEmail('non-existent@example.com');
      expect(result.isErr()).toBe(true);
    });
  });

  describe('save', () => {
    it('ska skapa ny användare', async () => {
      mockSupabaseClient.from().upsert.mockResolvedValue({ 
        error: null,
        data: mockUserData
      });

      const result = await repository.save(mockUser);
      expect(result.isOk()).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      
      // Verifiera att domänhändelser publicerades
      if (mockUser.domainEvents && mockUser.domainEvents.length > 0) {
        expect(mockEventBus.publish).toHaveBeenCalled();
        expect(mockUser.clearDomainEvents).toHaveBeenCalled();
      }
    });

    it('ska hantera fel vid sparande', async () => {
      mockSupabaseClient.from().upsert.mockResolvedValue({
        error: new Error('Kunde inte spara användaren'),
        data: null
      });

      const result = await repository.save(mockUser);
      expect(result.isErr()).toBe(true);
    });
  });

  describe('delete', () => {
    it('ska ta bort användare', async () => {
      // Uppdatera mockningen av delete-operationen
      const mockDeleteEq = jest.fn().mockResolvedValue({
        error: null,
        data: {}
      });
      
      mockSupabaseClient.from().delete.mockReturnValue({
        eq: mockDeleteEq
      });

      const result = await repository.delete(mockUserData.id);
      expect(result.isOk()).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      expect(mockSupabaseClient.from().delete).toBeDefined();
    });

    it('ska hantera fel vid borttagning', async () => {
      // Uppdatera mockningen av delete-operationen vid fel
      const mockDeleteEq = jest.fn().mockResolvedValue({
        error: new Error('Kunde inte ta bort användaren'),
        data: null
      });
      
      mockSupabaseClient.from().delete.mockReturnValue({
        eq: mockDeleteEq
      });

      const result = await repository.delete(mockUserData.id);
      expect(result.isErr()).toBe(true);
    });
  });
}); 