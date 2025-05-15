import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useTeamStandardized } from '../useTeamStandardized';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { TeamActivityRepository } from '@/domain/team/repositories/TeamActivityRepository';
import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';
import { Team } from '@/domain/team/entities/Team';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result } from '@/shared/core/Result';

// Skapa mock-repositories och publisher
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

const mockTeamActivityRepository: jest.Mocked<TeamActivityRepository> = {
  findByTeamId: jest.fn(),
  save: jest.fn(),
  exists: jest.fn(),
  delete: jest.fn()
} as unknown as jest.Mocked<TeamActivityRepository>;

const mockEventPublisher: jest.Mocked<IDomainEventPublisher> = {
  publish: jest.fn(),
  publishAll: jest.fn()
} as unknown as jest.Mocked<IDomainEventPublisher>;

// Skapa en mock-team
const mockTeam = {
  id: new UniqueId('test-team-id'),
  name: 'Test Team',
  description: 'A test team',
  ownerId: new UniqueId('test-owner-id'),
  members: []
} as unknown as Team;

// Testkomponent som använder hooken
function TestComponent({ teamId }: { teamId?: string }) {
  const { useTeamById } = useTeamStandardized(
    mockTeamRepository,
    mockUserRepository,
    mockTeamActivityRepository,
    mockEventPublisher
  );
  
  const { data: team, isLoading, error } = useTeamById(teamId);
  
  if (isLoading) return <div>Laddar...</div>;
  if (error) return <div>Fel: {(error as Error).message}</div>;
  if (!team) return <div>Inget team hittades</div>;
  
  return <div>Team: {team.name}</div>;
}

describe('useTeamStandardized', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    
    jest.clearAllMocks();
  });
  
  it('should load a team by id', async () => {
    // Arrange
    const teamId = 'test-team-id';
    mockTeamRepository.findById.mockResolvedValue(Result.ok(mockTeam));
    
    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent teamId={teamId} />
      </QueryClientProvider>
    );
    
    // Assert
    expect(screen.getByText('Laddar...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Team: Test Team')).toBeInTheDocument();
    });
    
    expect(mockTeamRepository.findById).toHaveBeenCalledWith(expect.objectContaining({
      value: teamId
    }));
  });
  
  it('should handle error when team is not found', async () => {
    // Arrange
    const teamId = 'test-team-id';
    mockTeamRepository.findById.mockResolvedValue(Result.fail('Team not found'));
    
    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent teamId={teamId} />
      </QueryClientProvider>
    );
    
    // Assert
    expect(screen.getByText('Laddar...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Fel: Team not found')).toBeInTheDocument();
    });
  });
  
  it('should return null when no teamId is provided', async () => {
    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    );
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText('Inget team hittades')).toBeInTheDocument();
    });
    
    expect(mockTeamRepository.findById).not.toHaveBeenCalled();
  });
}); 