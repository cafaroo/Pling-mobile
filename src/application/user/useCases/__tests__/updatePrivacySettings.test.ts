import { updatePrivacySettings, UpdatePrivacySettingsInput, UpdatePrivacySettingsDeps, PrivacySettings } from '../updatePrivacySettings';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { EventBus } from '@/shared/core/EventBus';
import { User } from '@/domain/user/entities/User';
import { UserSettings } from '@/domain/user/entities/UserSettings';
import { UniqueId } from '@/shared/domain/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';
import { UserPrivacySettingsChanged } from '@/domain/user/events/UserEvent';
import { mockErrorHandler } from '@/test-utils/error-helpers';

// Mocka beroenden
jest.mock('@/shared/core/EventBus');

describe('updatePrivacySettings', () => {
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockEventBus: jest.Mocked<EventBus>;
  let mockUser: jest.Mocked<User>;
  let mockSettings: jest.Mocked<UserSettings>;
  let deps: UpdatePrivacySettingsDeps;
  
  const userId = 'user-123';
  const currentPrivacySettings = {
    profileVisibility: 'public',
    showEmail: true,
    showPhone: true,
    shareActivity: true,
    allowDataCollection: true
  };
  
  const newPrivacySettings: Partial<PrivacySettings> = {
    profileVisibility: 'private',
    showEmail: false,
    shareActivity: false
  };
  
  beforeEach(() => {
    // Återställ mockar
    jest.clearAllMocks();
    
    // Skapa mockar för settings
    mockSettings = {
      privacy: currentPrivacySettings
    } as unknown as jest.Mocked<UserSettings>;
    
    // Skapa mockar för user
    mockUser = {
      id: new UniqueId(userId),
      settings: mockSettings,
      updateSettings: jest.fn().mockReturnValue(ok(mockUser))
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
  });
  
  it('ska uppdatera användarens integritetsinställningar och publicera UserPrivacySettingsChanged-händelse', async () => {
    // Arrange
    const input: UpdatePrivacySettingsInput = {
      userId,
      settings: newPrivacySettings
    };
    
    // Act
    const result = await updatePrivacySettings(deps)(input);
    
    // Assert
    expect(result.isOk()).toBe(true);
    expect(mockUserRepo.findById).toHaveBeenCalledWith(userId);
    expect(mockUser.updateSettings).toHaveBeenCalledWith({
      privacy: {
        ...currentPrivacySettings,
        ...newPrivacySettings
      }
    });
    expect(mockUserRepo.save).toHaveBeenCalled();
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.any(UserPrivacySettingsChanged)
    );
    
    // Verifiera händelsedata
    const publishedEvent = mockEventBus.publish.mock.calls[0][0] as UserPrivacySettingsChanged;
    expect(publishedEvent.name).toBe('user.privacy.updated');
    expect(publishedEvent.data.userId).toBe(userId);
    expect(publishedEvent.oldSettings).toEqual(currentPrivacySettings);
    expect(publishedEvent.newSettings).toEqual({
      ...currentPrivacySettings,
      ...newPrivacySettings
    });
  });
  
  it('ska returnera USER_NOT_FOUND om användaren inte hittas', async () => {
    // Arrange
    mockUserRepo.findById.mockResolvedValue(null);
    const input: UpdatePrivacySettingsInput = { 
      userId, 
      settings: newPrivacySettings 
    };
    
    // Act
    const result = await updatePrivacySettings(deps)(input);
    
    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe('USER_NOT_FOUND');
    }
    expect(mockUserRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
  
  it('ska returnera INVALID_SETTINGS vid ogiltig profileVisibility', async () => {
    // Arrange
    const input: UpdatePrivacySettingsInput = { 
      userId, 
      settings: {
        // @ts-ignore: Testar ogiltig inställning
        profileVisibility: 'invalid_value'
      }
    };
    
    // Act
    const result = await updatePrivacySettings(deps)(input);
    
    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe('INVALID_SETTINGS');
    }
    expect(mockUser.updateSettings).not.toHaveBeenCalled();
    expect(mockUserRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
  
  it('ska returnera OPERATION_FAILED om uppdatering av användare misslyckas', async () => {
    // Arrange
    mockUser.updateSettings = jest.fn().mockReturnValue(err('Kunde inte uppdatera inställningar'));
    const input: UpdatePrivacySettingsInput = { 
      userId, 
      settings: newPrivacySettings 
    };
    
    // Act
    const result = await updatePrivacySettings(deps)(input);
    
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
    const input: UpdatePrivacySettingsInput = { 
      userId, 
      settings: newPrivacySettings 
    };
    
    // Act
    const result = await updatePrivacySettings(deps)(input);
    
    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe('OPERATION_FAILED');
    }
    expect(errorHandler).toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
  
  it('ska stödja partiella uppdateringar av inställningar', async () => {
    // Arrange
    const partialUpdate: Partial<PrivacySettings> = {
      showPhone: false
    };
    
    const input: UpdatePrivacySettingsInput = {
      userId,
      settings: partialUpdate
    };
    
    // Act
    const result = await updatePrivacySettings(deps)(input);
    
    // Assert
    expect(result.isOk()).toBe(true);
    expect(mockUser.updateSettings).toHaveBeenCalledWith({
      privacy: {
        ...currentPrivacySettings,
        showPhone: false
      }
    });
    
    // Verifiera händelsedata
    const publishedEvent = mockEventBus.publish.mock.calls[0][0] as UserPrivacySettingsChanged;
    expect(publishedEvent.newSettings).toEqual({
      ...currentPrivacySettings,
      showPhone: false
    });
  });
}); 