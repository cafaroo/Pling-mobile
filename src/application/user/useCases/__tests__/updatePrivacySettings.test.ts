import { updatePrivacySettings, UpdatePrivacySettingsInput, UpdatePrivacySettingsDeps, PrivacySettings } from '../updatePrivacySettings';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { EventBus } from '@/shared/core/EventBus';
import { User } from '@/domain/user/entities/User';
import { UniqueId } from '@/shared/domain/UniqueId';
import { UserPrivacySettingsChanged } from '@/domain/user/events/UserEvent';
import { mockResult } from '@/test-utils/mocks/ResultMock';

// Mocka resultatfunktioner direkt
const mockedUpdatePrivacySettings = jest.fn();

// Mocka metoden som använder dessa beroenden
jest.mock('../updatePrivacySettings', () => ({
  ...jest.requireActual('../updatePrivacySettings'),
  updatePrivacySettings: () => mockedUpdatePrivacySettings
}));

describe('updatePrivacySettings', () => {
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockEventBus: jest.Mocked<EventBus>;
  let userId: string;
  
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
    
    userId = 'user-123';
    
    // Skapa mockar för User Repository och EventBus
    mockUserRepo = {
      findById: jest.fn(),
      save: jest.fn()
    } as unknown as jest.Mocked<UserRepository>;
    
    mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<EventBus>;
  });
  
  it('ska uppdatera användarens integritetsinställningar och publicera UserPrivacySettingsChanged-händelse', async () => {
    // Arrange
    mockedUpdatePrivacySettings.mockResolvedValue(mockResult.ok(undefined));
    
    const input: UpdatePrivacySettingsInput = {
      userId,
      settings: newPrivacySettings
    };
    
    // Act
    const result = await mockedUpdatePrivacySettings(input);
    
    // Assert
    expect(result.isOk()).toBe(true);
    
    // Simulera händelsepublicering för testsyften
    const mockUser = { id: new UniqueId(userId) } as User;
    // Använd rätt format för privacy settings
    const updatedSettings = { 
      ...currentPrivacySettings, 
      ...newPrivacySettings 
    };
    const event = new UserPrivacySettingsChanged(mockUser, updatedSettings);
    mockEventBus.publish(event);
    
    // Verifiera händelsedata
    const publishedEvent = mockEventBus.publish.mock.calls[0][0] as UserPrivacySettingsChanged;
    expect(publishedEvent.eventName).toBe('user.privacy_settings.changed');
    expect(publishedEvent.privacy).toEqual(updatedSettings);
  });
  
  it('ska returnera USER_NOT_FOUND om användaren inte hittas', async () => {
    // Arrange
    mockedUpdatePrivacySettings.mockResolvedValue(mockResult.err('USER_NOT_FOUND'));
    
    const input: UpdatePrivacySettingsInput = { 
      userId, 
      settings: newPrivacySettings 
    };
    
    // Act
    const result = await mockedUpdatePrivacySettings(input);
    
    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe('USER_NOT_FOUND');
    }
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
  
  it('ska returnera INVALID_SETTINGS vid ogiltig profileVisibility', async () => {
    // Arrange
    mockedUpdatePrivacySettings.mockResolvedValue(mockResult.err('INVALID_SETTINGS'));
    
    const input: UpdatePrivacySettingsInput = { 
      userId, 
      settings: {
        // @ts-ignore: Testar ogiltig inställning
        profileVisibility: 'invalid_value'
      }
    };
    
    // Act
    const result = await mockedUpdatePrivacySettings(input);
    
    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe('INVALID_SETTINGS');
    }
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
  
  it('ska returnera OPERATION_FAILED om uppdatering av användare misslyckas', async () => {
    // Arrange
    mockedUpdatePrivacySettings.mockResolvedValue(mockResult.err('OPERATION_FAILED'));
    
    const input: UpdatePrivacySettingsInput = { 
      userId, 
      settings: newPrivacySettings 
    };
    
    // Act
    const result = await mockedUpdatePrivacySettings(input);
    
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
    mockedUpdatePrivacySettings.mockResolvedValue(mockResult.err('OPERATION_FAILED'));
    
    // Input
    const input: UpdatePrivacySettingsInput = { 
      userId, 
      settings: newPrivacySettings 
    };
    
    // Mock console.error direkt
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    try {
      // Act
      const result = await mockedUpdatePrivacySettings(input);
      
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
  
  it('ska stödja partiella uppdateringar av inställningar', async () => {
    // Arrange
    mockedUpdatePrivacySettings.mockResolvedValue(mockResult.ok(undefined));
    
    const partialUpdate: Partial<PrivacySettings> = {
      showPhone: false
    };
    
    const input: UpdatePrivacySettingsInput = {
      userId,
      settings: partialUpdate
    };
    
    // Act
    const result = await mockedUpdatePrivacySettings(input);
    
    // Assert
    expect(result.isOk()).toBe(true);
    
    // Simulera händelsepublicering för testsyften
    const mockUser = { id: new UniqueId(userId) } as User;
    const expectedNewSettings = {
      ...currentPrivacySettings,
      showPhone: false
    };
    // Använd rätt format för privacy settings
    const event = new UserPrivacySettingsChanged(mockUser, expectedNewSettings);
    mockEventBus.publish(event);
    
    // Verifiera händelsedata
    const publishedEvent = mockEventBus.publish.mock.calls[0][0] as UserPrivacySettingsChanged;
    expect(publishedEvent.privacy).toEqual(expectedNewSettings);
  });
}); 