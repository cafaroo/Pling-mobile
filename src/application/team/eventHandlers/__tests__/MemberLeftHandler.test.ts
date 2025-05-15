import { MemberLeftHandler } from '../MemberLeftHandler';
import { MemberLeft } from '@/domain/team/events/TeamEvents';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result } from '@/shared/core/Result';
import { User } from '@/domain/user/entities/User';
import { Team } from '@/domain/team/entities/Team';
import { TeamStatistics } from '@/domain/team/value-objects/TeamStatistics';

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

// Mocka statistik för team
const mockStatistics = {
  decrementMemberCount: jest.fn()
} as unknown as TeamStatistics;

// Mocka domänmodeller
const mockUser = {
  removeTeamMembership: jest.fn()
} as unknown as User;

const mockTeam = {
  getStatistics: jest.fn().mockReturnValue(mockStatistics),
  updateStatistics: jest.fn()
} as unknown as Team;

describe('MemberLeftHandler', () => {
  let handler: MemberLeftHandler;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Skapa en ny handler för varje test
    handler = new MemberLeftHandler(mockTeamRepository, mockUserRepository);
    
    // Konfigurera standardbeteende för repositories
    mockUserRepository.findById.mockResolvedValue(Result.ok(mockUser));
    mockTeamRepository.findById.mockResolvedValue(Result.ok(mockTeam));
    mockUserRepository.save.mockResolvedValue(Result.ok());
    mockTeamRepository.save.mockResolvedValue(Result.ok());
  });
  
  it('should update user and team statistics when a member leaves', async () => {
    // Arrange
    const teamId = new UniqueId();
    const userId = new UniqueId();
    
    const event = new MemberLeft(teamId, userId);
    
    // Act
    const result = await handler['processEvent'](event);
    
    // Assert
    expect(result.isSuccess).toBe(true);
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    expect(mockUser.removeTeamMembership).toHaveBeenCalledWith(teamId);
    expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
    
    expect(mockTeamRepository.findById).toHaveBeenCalledWith(teamId);
    expect(mockTeam.getStatistics).toHaveBeenCalled();
    expect(mockStatistics.decrementMemberCount).toHaveBeenCalled();
    expect(mockTeam.updateStatistics).toHaveBeenCalledWith(mockStatistics);
    expect(mockTeamRepository.save).toHaveBeenCalledWith(mockTeam);
  });
  
  it('should fail if user is not found', async () => {
    // Arrange
    const teamId = new UniqueId();
    const userId = new UniqueId();
    
    const event = new MemberLeft(teamId, userId);
    
    // Konfigurera mockUserRepository att returnera fel
    mockUserRepository.findById.mockResolvedValue(Result.fail('Användaren hittades inte'));
    
    // Act
    const result = await handler['processEvent'](event);
    
    // Assert
    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('Kunde inte hitta användaren');
    expect(mockUser.removeTeamMembership).not.toHaveBeenCalled();
    expect(mockUserRepository.save).not.toHaveBeenCalled();
    expect(mockTeamRepository.findById).not.toHaveBeenCalled();
  });
  
  it('should fail if team is not found', async () => {
    // Arrange
    const teamId = new UniqueId();
    const userId = new UniqueId();
    
    const event = new MemberLeft(teamId, userId);
    
    // Konfigurera mockTeamRepository att returnera fel
    mockTeamRepository.findById.mockResolvedValue(Result.fail('Teamet hittades inte'));
    
    // Act
    const result = await handler['processEvent'](event);
    
    // Assert
    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('Kunde inte hitta teamet');
    expect(mockStatistics.decrementMemberCount).not.toHaveBeenCalled();
    expect(mockTeam.updateStatistics).not.toHaveBeenCalled();
    expect(mockTeamRepository.save).not.toHaveBeenCalled();
  });
  
  it('should handle case when team has no statistics', async () => {
    // Arrange
    const teamId = new UniqueId();
    const userId = new UniqueId();
    
    const event = new MemberLeft(teamId, userId);
    
    // Konfigurera mockTeam att returnera null för statistik
    mockTeam.getStatistics.mockReturnValue(null);
    
    // Act
    const result = await handler['processEvent'](event);
    
    // Assert
    expect(result.isSuccess).toBe(true);
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    expect(mockUser.removeTeamMembership).toHaveBeenCalledWith(teamId);
    expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
    
    expect(mockTeamRepository.findById).toHaveBeenCalledWith(teamId);
    expect(mockTeam.getStatistics).toHaveBeenCalled();
    expect(mockStatistics.decrementMemberCount).not.toHaveBeenCalled();
    expect(mockTeam.updateStatistics).not.toHaveBeenCalled();
    expect(mockTeamRepository.save).not.toHaveBeenCalled();
  });
}); 