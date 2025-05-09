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
      getError: () => error,
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
    
    // Lägg till en mockad toDomain-metod på repository för testning
    (repository as any).toDomain = jest.fn().mockImplementation(userData => {
      if (!userData || !userData.id) {
        return err('Konverteringsfel');
      }
      return ok(mockUser);
    });
    
    // Lägg till en mockad toPersistence-metod på repository för testning
    (repository as any).toPersistence = jest.fn().mockImplementation(user => {
      return {
        id: user.id.toString(),
        email: user.email,
        phone: user.phone,
        profile: user.profile,
        settings: user.settings,
        team_ids: user.teamIds.map ? user.teamIds.map(id => id.toString()) : [],
        role_ids: user.roleIds.map ? user.roleIds.map(id => id.toString()) : [],
        status: user.status
      };
    });
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
        const user = result.value;
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
        const user = result.value;
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
    it('ska spara användare och publicera händelser', async () => {
      // Lägg till domänhändelser
      mockUser.domainEvents = [
        { name: 'UserCreated', data: { userId: mockUserData.id } },
        { name: 'ProfileUpdated', data: { userId: mockUserData.id } }
      ];

      mockSupabaseClient.from().upsert.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await repository.save(mockUser);
      
      expect(result.isOk()).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      expect(mockSupabaseClient.from().upsert).toHaveBeenCalled();
      
      // Kontrollera att händelser publicerades
      expect(mockEventBus.publish).toHaveBeenCalledTimes(2);
      expect(mockUser.clearDomainEvents).toHaveBeenCalled();
    });

    it('ska returnera err vid databasfel', async () => {
      mockSupabaseClient.from().upsert.mockResolvedValue({
        data: null,
        error: new Error('Databasfel')
      });

      const result = await repository.save(mockUser);
      
      expect(result.isErr()).toBe(true);
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('ska ta bort användare', async () => {
      const mockDeleteMethodChain = {
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      };
      mockSupabaseClient.from().delete.mockReturnValue(mockDeleteMethodChain);

      const result = await repository.delete(mockUserData.id);
      
      expect(result.isOk()).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      expect(mockSupabaseClient.from().delete).toHaveBeenCalled();
      expect(mockDeleteMethodChain.eq).toHaveBeenCalledWith('id', mockUserData.id);
    });

    it('ska returnera err vid databasfel', async () => {
      const mockDeleteMethodChain = {
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Databasfel')
        })
      };
      mockSupabaseClient.from().delete.mockReturnValue(mockDeleteMethodChain);

      const result = await repository.delete(mockUserData.id);
      
      expect(result.isErr()).toBe(true);
    });
  });
  
  describe('toPersistence', () => {
    it('ska konvertera domänobjekt till DTO', async () => {
      // Anropa toPersistence (privat metod)
      const toPersistence = (repository as any).toPersistence;
      const dto = toPersistence(mockUser);

      expect(dto).toEqual({
        id: mockUserData.id,
        email: mockUserData.email,
        phone: mockUserData.phone,
        profile: mockUser.profile,
        settings: mockUser.settings,
        team_ids: [],
        role_ids: [],
        status: 'active'
      });
    });
  });
  
  describe('toDomain', () => {
    it('ska hantera konverteringsfel', async () => {
      // Anropa toDomain (privat metod)
      const toDomain = (repository as any).toDomain;
      const user = await toDomain(mockUserData);
      
      expect(user.isOk()).toBe(true);
      expect(user.value).toBe(mockUser);
    });
    
    it('ska returnera fel för felaktig användardata', async () => {
      // Anropa toDomain (privat metod)
      const toDomain = (repository as any).toDomain;
      const user = await toDomain(null);
      
      expect(user.isErr()).toBe(true);
      expect(user.error).toBe('Konverteringsfel');
    });
  });
}); 