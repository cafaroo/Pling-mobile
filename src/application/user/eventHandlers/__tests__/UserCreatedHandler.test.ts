import { UserCreatedHandler } from '../UserCreatedHandler';
import { MockUserCreatedEvent } from '@/test-utils/mocks/mockUserEvents';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { OrganizationRepository } from '@/domain/organization/repositories/OrganizationRepository';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result } from '@/shared/core/Result';
import { User } from '@/domain/user/entities/User';

// Mocka repositories
const mockUserRepository: jest.Mocked<UserRepository> = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  save: jest.fn(),
  exists: jest.fn(),
  delete: jest.fn(),
  search: jest.fn(),
  updateStatus: jest.fn()
};

const mockTeamRepository: jest.Mocked<TeamRepository> = {
  findById: jest.fn(),
  findByName: jest.fn(),
  findByMemberId: jest.fn(),
  save: jest.fn(),
  exists: jest.fn(),
  delete: jest.fn()
};

const mockOrganizationRepository: jest.Mocked<OrganizationRepository> = {
  findById: jest.fn(),
  findByName: jest.fn(),
  save: jest.fn(),
  exists: jest.fn(),
  delete: jest.fn()
};

describe('UserCreatedHandler', () => {
  let handler: UserCreatedHandler;
  let userId: string;
  
  // Återställ alla mocks före varje test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Instansiera handlern med mockade repositories
    handler = new UserCreatedHandler(
      mockUserRepository,
      mockTeamRepository,
      mockOrganizationRepository
    );
    
    // Skapa ett exempel-userId som string
    userId = new UniqueId().toString();
  });
  
  it('ska returnera korrekt eventType', () => {
    // @ts-ignore - Vi testar en protected property
    expect(handler.eventType).toBe('UserCreated');
  });
  
  it('ska initiera användarstatistik när en användare skapas', async () => {
    // Skapa ett MockUserCreatedEvent
    const event = new MockUserCreatedEvent(
      userId,
      'test@example.com',
      'Test User'
    );
    
    // Mocka ett User-objekt
    const mockUser = {
      id: new UniqueId(userId),
      hasStatistics: jest.fn().mockReturnValue(false),
      initializeStatistics: jest.fn(),
      hasPrivacySettings: jest.fn().mockReturnValue(false),
      updatePrivacySettings: jest.fn()
    } as unknown as User;
    
    // Konfigurera mockRepository att returnera mockUser
    mockUserRepository.findById.mockResolvedValue(Result.ok(mockUser));
    mockUserRepository.save.mockResolvedValue(Result.ok());
    
    // Säkerställ att userId är korrekt i eventet
    expect(event.userId.toString()).toBe(userId);
    
    // Anropa handleEvent
    await handler.handleEvent(event);
    
    // Verifiera att findById anropades med rätt parameter - ett UniqueId-objekt
    expect(mockUserRepository.findById).toHaveBeenCalledWith(
      expect.objectContaining({ 
        id: expect.any(String) 
      })
    );
    
    // Verifiera att hasStatistics anropades
    expect(mockUser.hasStatistics).toHaveBeenCalled();
    
    // Verifiera att initializeStatistics anropades med förväntade parametrar
    expect(mockUser.initializeStatistics).toHaveBeenCalledWith(expect.objectContaining({
      totalLogins: 1,
      lastLogin: expect.any(Date),
      createdTeams: 0,
      joinedTeams: 0,
      completedTasks: 0
    }));
    
    // Verifiera att hasPrivacySettings anropades
    expect(mockUser.hasPrivacySettings).toHaveBeenCalled();
    
    // Verifiera att updatePrivacySettings anropades med förväntade parametrar
    expect(mockUser.updatePrivacySettings).toHaveBeenCalledWith(expect.objectContaining({
      shareProfile: false,
      allowDataCollection: true,
      visibleToTeamMembers: true
    }));
    
    // Verifiera att save anropades med mockUser
    expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
  });
  
  it('ska hantera fel om användaren inte kan hittas', async () => {
    // Skapa ett MockUserCreatedEvent
    const event = new MockUserCreatedEvent(
      userId,
      'test@example.com',
      'Test User'
    );
    
    // Konfigurera mockRepository att returnera ett fel
    mockUserRepository.findById.mockResolvedValue(Result.fail('Användaren hittades inte'));
    
    // Skapa spion för console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Säkerställ att userId är korrekt i eventet
    expect(event.userId.toString()).toBe(userId);
    
    // Anropa handleEvent
    await handler.handleEvent(event);
    
    // Verifiera att findById anropades med rätt parameter - ett UniqueId-objekt
    expect(mockUserRepository.findById).toHaveBeenCalledWith(
      expect.objectContaining({ 
        id: expect.any(String) 
      })
    );
    
    // Verifiera att console.error anropades med rätt felmeddelande
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('UserCreated'),
      expect.any(String)
    );
    
    // Återställ spionen
    consoleErrorSpy.mockRestore();
  });
}); 