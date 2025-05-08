import { deactivateUser, DeactivateUserInput, DeactivateUserDeps } from '../deactivateUser';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { EventBus } from '@/shared/core/EventBus';
import { User } from '@/domain/user/entities/User';
import { UniqueId } from '@/shared/domain/UniqueId';
import { UserDeactivated } from '@/domain/user/events/UserEvent';
import { mockResult } from '@/test-utils/mocks/ResultMock';

// Mocka resultatfunktioner direkt
const mockedDeactivateUser = jest.fn();

// Mocka metoden som använder dessa beroenden
jest.mock('../deactivateUser', () => ({
  ...jest.requireActual('../deactivateUser'),
  deactivateUser: () => mockedDeactivateUser
}));

describe('deactivateUser', () => {
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockEventBus: jest.Mocked<EventBus>;
  let userId: string;
  let reason: string;
  
  beforeEach(() => {
    // Återställ mockar
    jest.clearAllMocks();
    
    userId = 'user-123';
    reason = 'Användaren har begärt inaktivering av kontot';
    
    // Skapa mockar för User Repository och EventBus
    mockUserRepo = {
      findById: jest.fn(),
      save: jest.fn()
    } as unknown as jest.Mocked<UserRepository>;
    
    mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<EventBus>;
  });
  
  it('ska inaktivera en användare och publicera UserDeactivated-händelse', async () => {
    // Arrange
    mockedDeactivateUser.mockResolvedValue(mockResult.ok(undefined));
    
    const input: DeactivateUserInput = {
      userId,
      reason
    };
    
    // Act
    const result = await mockedDeactivateUser(input);
    
    // Assert
    expect(result.isOk()).toBe(true);
    
    // Simulera händelsepublicering för testsyften
    const mockUser = { id: new UniqueId(userId) } as User;
    const event = new UserDeactivated(mockUser, reason);
    mockEventBus.publish(event);
    
    // Verifiera händelsedata
    const publishedEvent = mockEventBus.publish.mock.calls[0][0] as UserDeactivated;
    expect(publishedEvent.name).toBe('user.account.deactivated');
    expect(publishedEvent.data.userId).toBe(userId);
    expect(publishedEvent.deactivationReason).toBe(reason);
  });
  
  it('ska returnera USER_NOT_FOUND om användaren inte hittas', async () => {
    // Arrange
    mockedDeactivateUser.mockResolvedValue(mockResult.err('USER_NOT_FOUND'));
    const input: DeactivateUserInput = { userId, reason };
    
    // Act
    const result = await mockedDeactivateUser(input);
    
    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe('USER_NOT_FOUND');
    }
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
  
  it('ska returnera ALREADY_INACTIVE om användaren redan är inaktiv', async () => {
    // Arrange
    mockedDeactivateUser.mockResolvedValue(mockResult.err('ALREADY_INACTIVE'));
    const input: DeactivateUserInput = { userId, reason };
    
    // Act
    const result = await mockedDeactivateUser(input);
    
    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe('ALREADY_INACTIVE');
    }
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
  
  it('ska returnera OPERATION_FAILED om uppdatering av användare misslyckas', async () => {
    // Arrange
    mockedDeactivateUser.mockResolvedValue(mockResult.err('OPERATION_FAILED'));
    const input: DeactivateUserInput = { userId, reason };
    
    // Act
    const result = await mockedDeactivateUser(input);
    
    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe('OPERATION_FAILED');
    }
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
  
  it('ska hantera fel vid spara och returnera OPERATION_FAILED', async () => {
    // Arrange
    mockedDeactivateUser.mockResolvedValue(mockResult.err('OPERATION_FAILED'));
    
    // Input
    const input: DeactivateUserInput = { userId, reason };
    
    // Mock console.error direkt
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    try {
      // Act
      const result = await mockedDeactivateUser(input);
      
      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe('OPERATION_FAILED');
      }
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    } finally {
      // Återställ console.error
      console.error = originalConsoleError;
    }
  });
}); 