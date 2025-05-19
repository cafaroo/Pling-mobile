import React from 'react';
import { render, act } from '@testing-library/react';
import { useTeamStandardized } from '../useTeamStandardized';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { TeamActivityRepository } from '@/domain/team/repositories/TeamActivityRepository';
import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';
import { Team } from '@/domain/team/entities/Team';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result } from '@/shared/core/Result';
import { QueryClientTestProvider } from '@/test-utils';

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

// Konstanter för att undvika hårda-kodade värden
const MOCK_TEAM_ID = 'test-team-id';
const LOADING_TEST_ID = 'loading';
const ERROR_TEST_ID = 'error';
const NO_TEAM_TEST_ID = 'no-team';
const TEAM_DATA_TEST_ID = 'team-data';

/**
 * Testkomponent som använder hooken
 */
function TestComponent({ teamId }: { teamId?: string }) {
  const { useTeamById } = useTeamStandardized(
    mockTeamRepository,
    mockUserRepository,
    mockTeamActivityRepository,
    mockEventPublisher
  );
  
  const { data: team, isLoading, error } = useTeamById(teamId);
  
  if (isLoading) {
    return <div data-testid={LOADING_TEST_ID}>Laddar...</div>;
  }
  
  if (error) {
    return <div data-testid={ERROR_TEST_ID}>Fel: {error}</div>;
  }
  
  if (!team) {
    return <div data-testid={NO_TEAM_TEST_ID}>Inget team hittades</div>;
  }
  
  return <div data-testid={TEAM_DATA_TEST_ID}>Team: {team.name}</div>;
}

describe('useTeamStandardized', () => {
  let renderResult: any;

  const setup = (id?: string) => {
    renderResult = render(
      <QueryClientTestProvider>
        <TestComponent teamId={id} />
      </QueryClientTestProvider>
    );
  };

  beforeEach(() => {
    // Återställ mockar
    jest.clearAllMocks();
  });
  
  it('should load a team by id', async () => {
    // Arrangera
    const teamId = MOCK_TEAM_ID;
    mockTeamRepository.findById.mockResolvedValue(Result.ok(mockTeam));
    
    // Vi använder en timeout för att simulera hämtning
    await act(async () => {
      setup(teamId);
      // Kort fördröjning för att säkerställa att React-komponenterna renderas och anropen sker
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    
    // Verifiera att repository anropades med rätt parametrar (oavsett om vi ser UI:t eller inte)
    expect(mockTeamRepository.findById).toHaveBeenCalledWith(
      expect.objectContaining({ id: teamId })
    );

    // Verifiera att rätt UI-element skulle visas om vi renderarde på riktigt
    expect(renderResult.queryByTestId(TEAM_DATA_TEST_ID)).not.toBeNull();
  });
  
  it('should handle error when team is not found', async () => {
    // Arrangera
    const teamId = MOCK_TEAM_ID;
    const errorMessage = 'Team not found';
    mockTeamRepository.findById.mockResolvedValue(Result.fail(errorMessage));
    
    // Vi använder act() för att vänta på asynkrona operationer
    await act(async () => {
      setup(teamId);
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    
    // Verifiera repository-anrop
    expect(mockTeamRepository.findById).toHaveBeenCalledWith(
      expect.objectContaining({ id: teamId })
    );

    // Verifiera att felmeddelandet visas
    expect(renderResult.queryByTestId(ERROR_TEST_ID)).not.toBeNull();
  });
  
  it('should return null when no teamId is provided', async () => {
    // Vi använder act() för att vänta på asynkrona operationer
    await act(async () => {
      setup(); // Ingen teamId
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    
    // Verifiera att repository inte anropades
    expect(mockTeamRepository.findById).not.toHaveBeenCalled();
    
    // Verifiera att 'no-team' visas
    expect(renderResult.queryByTestId(NO_TEAM_TEST_ID)).not.toBeNull();
  });
}); 