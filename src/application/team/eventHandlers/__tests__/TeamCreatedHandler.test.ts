import { TeamCreatedHandler } from '../TeamCreatedHandler';
import { TeamCreated } from '@/domain/team/events/TeamEvents';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result } from '@/shared/core/Result';
import { User } from '@/domain/user/entities/User';
import { Team } from '@/domain/team/entities/Team';

// Mocka repositories
const mockTeamRepository: jest.Mocked<TeamRepository> = {
  findById: jest.fn(),
  findByName: jest.fn(),
  findByMemberId: jest.fn(),
  save: jest.fn(),
  exists: jest.fn(),
  delete: jest.fn()
} as unknown as jest.Mocked<TeamRepository>;

const mockUserRepository: jest.Mocked<UserRepository> = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
  exists: jest.fn(),
  delete: jest.fn(),
  search: jest.fn(),
  updateStatus: jest.fn()
} as unknown as jest.Mocked<UserRepository>;

// Mocka domänmodeller
const mockUser = {
  addTeamMembership: jest.fn()
} as unknown as User;

const mockTeam = {
} as unknown as Team;

describe('TeamCreatedHandler', () => {
  let handler: TeamCreatedHandler;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Skapa en ny handler för varje test
    handler = new TeamCreatedHandler(mockTeamRepository, mockUserRepository);
    
    // Konfigurera standardbeteende för repositories
    mockUserRepository.findById.mockResolvedValue(Result.ok(mockUser));
    mockTeamRepository.findById.mockResolvedValue(Result.ok(mockTeam));
    mockUserRepository.save.mockResolvedValue(Result.ok());
    mockTeamRepository.save.mockResolvedValue(Result.ok());
  });
  
  it('should update user team membership when handling TeamCreated event', async () => {
    // Arrange
    const teamId = new UniqueId();
    const ownerId = new UniqueId();
    const teamName = 'Testteam';
    
    const event = new TeamCreated(teamId, ownerId, teamName);
    
    // Act
    const result = await handler['processEvent'](event);
    
    // Assert
    expect(result.isSuccess).toBe(true);
    expect(mockUserRepository.findById).toHaveBeenCalledWith(ownerId);
    expect(mockUser.addTeamMembership).toHaveBeenCalledWith(teamId);
    expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
  });
  
  it('should fail if user is not found', async () => {
    // Arrange
    const teamId = new UniqueId();
    const ownerId = new UniqueId();
    const teamName = 'Testteam';
    
    const event = new TeamCreated(teamId, ownerId, teamName);
    
    // Konfigurera mockUserRepository att returnera fel
    mockUserRepository.findById.mockResolvedValue(Result.fail('Användaren hittades inte'));
    
    // Act
    const result = await handler['processEvent'](event);
    
    // Assert
    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('Kunde inte hitta teamägaren');
    expect(mockUser.addTeamMembership).not.toHaveBeenCalled();
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });
  
  it('should handle TeamCreated event and update team statistics', async () => {
    // Arrange
    const teamId = new UniqueId();
    const ownerId = new UniqueId();
    const teamName = 'Testteam';
    
    const event = new TeamCreated(teamId, ownerId, teamName);
    
    // Act
    const result = await handler['processEvent'](event);
    
    // Assert
    expect(result.isSuccess).toBe(true);
    expect(mockTeamRepository.findById).toHaveBeenCalledWith(teamId);
    // Verifiera att teamet sparades efter eventuell uppdatering
    expect(mockTeamRepository.save).not.toHaveBeenCalled(); // Notera: vi uppdaterar inte teamet i denna implementation
  });
}); 