import { testUseCaseErrors, verifyUseCaseErrorEvents } from '@/test-utils/helpers/useCaseErrorTestHelper';
import { UpdateTeamUseCase } from '../UpdateTeamUseCase';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { Team } from '@/domain/team/entities/Team';
import { TeamSettings } from '@/domain/team/value-objects/TeamSettings';
import { MockEventBus } from '@/test-utils/mocks/MockEventBus';
import { UniqueId } from '@/shared/core/UniqueId';
import { TestKit } from '@/test-utils';
import { Result } from '@/shared/core/Result';

describe('UpdateTeamUseCase Error Handling', () => {
  // Skapa mockad repository och eventBus
  const mockTeamRepository: jest.Mocked<TeamRepository> = {
    findById: jest.fn(),
    save: jest.fn(),
    findByName: jest.fn(),
    delete: jest.fn(),
    findByOwnerId: jest.fn(),
    findTeamsForUser: jest.fn()
  } as any;
  
  const mockEventBus = new MockEventBus();
  
  // Skapa use case
  const updateTeamUseCase = new UpdateTeamUseCase(
    mockTeamRepository,
    mockEventBus
  );
  
  // Skapa basis-indata för testet
  const baseInput = {
    teamId: 'team-123',
    name: 'Uppdaterat Teamnamn',
    description: 'En uppdaterad beskrivning'
  };
  
  // Skapa exempeldata
  const teamId = new UniqueId('team-123');
  const ownerId = new UniqueId('owner-123');
  const mockTeam = TestKit.mockEntity.createMockTeam({
    id: teamId.toString(),
    name: 'Gammalt Teamnamn',
    description: 'Gammal beskrivning',
    ownerId: ownerId.toString()
  }).value;
  
  beforeEach(() => {
    // Återställ alla mocks
    jest.clearAllMocks();
    
    // Standardkonfiguration
    mockTeamRepository.findById.mockResolvedValue(Result.ok(mockTeam));
    mockTeamRepository.save.mockResolvedValue(Result.ok(mockTeam));
  });
  
  it('ska hantera databasfel vid sparande av team', async () => {
    await testUseCaseErrors(
      {
        databaseError: {
          method: 'save',
          errorMessage: 'DATABASE_ERROR',
          expectedUseCaseError: 'Kunde inte uppdatera team'
        }
      },
      mockTeamRepository,
      (input) => updateTeamUseCase.execute(input),
      baseInput
    );
    
    // Verifiera att inga events publicerades vid fel
    verifyUseCaseErrorEvents(mockEventBus.publish);
  });
  
  it('ska hantera när team inte hittas', async () => {
    await testUseCaseErrors(
      {
        notFoundError: {
          method: 'findById',
          id: 'team-123',
          expectedUseCaseError: 'Team hittades inte'
        }
      },
      mockTeamRepository,
      (input) => updateTeamUseCase.execute(input),
      baseInput
    );
    
    // Verifiera att inga events publicerades vid fel
    verifyUseCaseErrorEvents(mockEventBus.publish);
  });
  
  it('ska hantera valideringsfel för teamnamn', async () => {
    await testUseCaseErrors(
      {
        validationError: {
          invalidInput: 'name',
          invalidValue: '',
          expectedUseCaseError: 'Ogiltigt teamnamn'
        }
      },
      mockTeamRepository,
      (input) => updateTeamUseCase.execute(input),
      baseInput
    );
    
    // Verifiera att inga events publicerades vid fel
    verifyUseCaseErrorEvents(mockEventBus.publish);
  });
  
  it('ska hantera när ett undantag kastas', async () => {
    await testUseCaseErrors(
      {
        thrownError: {
          method: 'findById',
          error: new Error('Oväntat fel'),
          expectedUseCaseError: 'Ett oväntat fel inträffade'
        }
      },
      mockTeamRepository,
      (input) => updateTeamUseCase.execute(input),
      baseInput
    );
    
    // Verifiera att inga events publicerades vid fel
    verifyUseCaseErrorEvents(mockEventBus.publish);
  });
}); 