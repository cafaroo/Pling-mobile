import { deactivateUser, DeactivateUserInput, DeactivateUserDeps } from '../deactivateUser';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { EventBus } from '@/shared/core/EventBus';
import { User } from '@/domain/user/entities/User';
import { UniqueId } from '@/shared/domain/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';
import { UserDeactivated } from '@/domain/user/events/UserEvent';
import { mockErrorHandler } from '@/test-utils/error-helpers';

// Mocka beroenden
jest.mock('@/shared/core/EventBus');

describe('deactivateUser', () => {
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockEventBus: jest.Mocked<EventBus>;
  let mockUser: jest.Mocked<User>;
  let deps: DeactivateUserDeps;
  
  const userId = 'user-123';
  const reason = 'Användaren har begärt inaktivering av kontot';
  
  beforeEach(() => {
    // Återställ mockar
    jest.clearAllMocks();
    
    // Skapa mockar
    mockUser = {
      id: new UniqueId(userId),
      status: 'active',
      updateStatus: jest.fn().mockReturnValue(ok(mockUser)),
    } as unknown as jest.Mocked<User>;
    
    mockUserRepo = {
      findById: jest.fn().mockResolvedValue(mockUser),
      save: jest.fn().mockResolvedValue(true)
    } as unknown as jest.Mocked<UserRepository>;
    
    mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<EventBus>;
    
    // Skapa beroenden
    deps = {
      userRepo: mockUserRepo,
      eventBus: mockEventBus
    };
    
    // Uppdatera användarstatus till inaktiv efter deaktivering
    mockUser.status = 'inactive';
  });
  
  it('ska inaktivera en användare och publicera UserDeactivated-händelse', async () => {
    // Arrange
    const input: DeactivateUserInput = {
      userId,
      reason
    };
    
    // Act
    const result = await deactivateUser(deps)(input);
    
    // Assert
    expect(result.isOk()).toBe(true);
    expect(mockUserRepo.findById).toHaveBeenCalledWith(userId);
    expect(mockUser.updateStatus).toHaveBeenCalledWith('inactive');
    expect(mockUserRepo.save).toHaveBeenCalled();
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.any(UserDeactivated)
    );
    
    // Verifiera händelsedata
    const publishedEvent = mockEventBus.publish.mock.calls[0][0] as UserDeactivated;
    expect(publishedEvent.name).toBe('user.account.deactivated');
    expect(publishedEvent.data.userId).toBe(userId);
    expect(publishedEvent.deactivationReason).toBe(reason);
  });
  
  it('ska returnera USER_NOT_FOUND om användaren inte hittas', async () => {
    // Arrange
    mockUserRepo.findById.mockResolvedValue(null);
    const input: DeactivateUserInput = { userId, reason };
    
    // Act
    const result = await deactivateUser(deps)(input);
    
    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe('USER_NOT_FOUND');
    }
    expect(mockUserRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
  
  it('ska returnera ALREADY_INACTIVE om användaren redan är inaktiv', async () => {
    // Arrange
    mockUser.status = 'inactive';
    const input: DeactivateUserInput = { userId, reason };
    
    // Act
    const result = await deactivateUser(deps)(input);
    
    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe('ALREADY_INACTIVE');
    }
    expect(mockUser.updateStatus).not.toHaveBeenCalled();
    expect(mockUserRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
  
  it('ska returnera OPERATION_FAILED om uppdatering av användare misslyckas', async () => {
    // Arrange
    mockUser.updateStatus = jest.fn().mockReturnValue(err('Kunde inte uppdatera användare'));
    const input: DeactivateUserInput = { userId, reason };
    
    // Act
    const result = await deactivateUser(deps)(input);
    
    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe('OPERATION_FAILED');
    }
    expect(mockUserRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
  
  it('ska hantera fel vid spara och returnera OPERATION_FAILED', async () => {
    // Arrange
    mockUserRepo.save = jest.fn().mockRejectedValue(new Error('Databasfel'));
    
    // Registrera felhanterare för console.error
    const errorHandler = mockErrorHandler();
    
    // Input
    const input: DeactivateUserInput = { userId, reason };
    
    // Act
    const result = await deactivateUser(deps)(input);
    
    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe('OPERATION_FAILED');
    }
    expect(errorHandler).toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
}); 