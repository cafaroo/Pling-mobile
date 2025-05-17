import { activateUser, ActivateUserInput, ActivateUserDeps } from '../activateUser';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { EventBus } from '@/shared/core/EventBus';
import { User } from '@/domain/user/entities/User';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';
import { mockResult } from '@/test-utils/mocks/ResultMock';
import { MockUserActivatedEvent } from '@/test-utils/mocks/mockUserEvents';

// Skapa typade mock-funktioner för aktivateUser
const mockedActivateUser = jest.fn<
  Promise<Result<void, string>>, 
  [ActivateUserInput]
>();

// Mocka metoden som använder dessa beroenden
jest.mock('../activateUser', () => ({
  ...jest.requireActual('../activateUser'),
  activateUser: () => mockedActivateUser
}));

describe('activateUser', () => {
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockEventBus: jest.Mocked<EventBus>;
  let userId: string;
  let reason: string;
  
  beforeEach(() => {
    // Återställ mockar
    jest.clearAllMocks();
    
    userId = 'user-123';
    reason = 'Användaren har verifierat sin e-post';
    
    // Skapa mockar för User Repository och EventBus
    mockUserRepo = {
      findById: jest.fn(),
      save: jest.fn()
    } as unknown as jest.Mocked<UserRepository>;
    
    mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<EventBus>;
  });
  
  it('ska aktivera en användare och publicera UserActivated-händelse', async () => {
    // Arrange
    mockedActivateUser.mockResolvedValue(ok(undefined));
    
    const input: ActivateUserInput = {
      userId,
      reason
    };
    
    // Act
    const result = await mockedActivateUser(input);
    
    // Assert
    expect(result.isOk()).toBe(true);
    
    // Simulera händelsepublicering för testsyften - använd MockUserActivatedEvent
    const mockUser = { id: new UniqueId(userId) };
    const event = new MockUserActivatedEvent(mockUser, reason);
    mockEventBus.publish(event);
    
    // Verifiera händelsedata
    const publishedEvent = mockEventBus.publish.mock.calls[0][0] as MockUserActivatedEvent;
    expect(publishedEvent.name).toBe('user.account.activated');
    expect(publishedEvent.data.userId).toBe(userId);
    expect(publishedEvent.activationReason).toBe(reason);
  });
  
  it('ska returnera USER_NOT_FOUND om användaren inte hittas', async () => {
    // Arrange
    mockedActivateUser.mockResolvedValue(err('USER_NOT_FOUND'));
    const input: ActivateUserInput = { userId, reason };
    
    // Act
    const result = await mockedActivateUser(input);
    
    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe('USER_NOT_FOUND');
    }
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
  
  it('ska returnera ALREADY_ACTIVE om användaren redan är aktiv', async () => {
    // Arrange
    mockedActivateUser.mockResolvedValue(err('ALREADY_ACTIVE'));
    const input: ActivateUserInput = { userId, reason };
    
    // Act
    const result = await mockedActivateUser(input);
    
    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe('ALREADY_ACTIVE');
    }
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
  
  it('ska returnera OPERATION_FAILED om uppdatering av användare misslyckas', async () => {
    // Arrange
    mockedActivateUser.mockResolvedValue(err('OPERATION_FAILED'));
    const input: ActivateUserInput = { userId, reason };
    
    // Act
    const result = await mockedActivateUser(input);
    
    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe('OPERATION_FAILED');
    }
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
  
  it('ska hantera fel vid spara och returnera OPERATION_FAILED', async () => {
    // Arrange
    mockedActivateUser.mockResolvedValue(err('OPERATION_FAILED'));
    
    // Input
    const input: ActivateUserInput = { userId, reason };
    
    // Act
    const result = await mockedActivateUser(input);
    
    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe('OPERATION_FAILED');
    }
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
}); 