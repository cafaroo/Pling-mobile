import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { User } from '@/domain/user/entities/User';
import { UserSettings } from '@/domain/user/entities/UserSettings';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { EventBus } from '@/shared/core/EventBus';
import { updateSettings, UpdateSettingsInput } from '../updateSettings';
import { UserSettingsUpdated } from '@/domain/user/events/UserEvent';

describe('updateSettings', () => {
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockEventBus: jest.Mocked<EventBus>;
  let mockUser: User;
  let mockSettings: UserSettings;
  let userId: UniqueId;

  beforeEach(async () => {
    userId = new UniqueId('test-user-id');

    // Skapa mockade inställningar
    const settingsResult = await UserSettings.create({
      theme: 'light',
      language: 'sv',
      notifications: {
        enabled: true,
        frequency: 'daily',
        emailEnabled: true,
        pushEnabled: true
      },
      privacy: {
        profileVisibility: 'public',
        showOnlineStatus: true,
        showLastSeen: true
      }
    });

    mockSettings = settingsResult.value;

    // Skapa mockad användare
    const userResult = await User.create({
      email: 'test@test.com',
      name: 'Test User',
      settings: mockSettings,
      teamIds: []
    });

    mockUser = userResult.value;
    Object.defineProperty(mockUser, 'id', {
      get: () => userId
    });

    // Skapa mock repositories
    mockUserRepo = {
      findById: jest.fn().mockResolvedValue(ok(mockUser)),
      save: jest.fn().mockResolvedValue(ok(undefined)),
      findByEmail: jest.fn()
    } as unknown as jest.Mocked<UserRepository>;

    mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<EventBus>;
  });

  it('ska uppdatera användarinställningar och publicera händelse vid framgång', async () => {
    const input: UpdateSettingsInput = {
      userId: userId.toString(),
      settings: {
        theme: 'dark',
        language: 'en',
        notifications: {
          enabled: true,
          frequency: 'weekly',
          emailEnabled: true,
          pushEnabled: true
        },
        privacy: {
          profileVisibility: 'private',
          showOnlineStatus: false,
          showLastSeen: false
        }
      }
    };

    const useCase = updateSettings({ userRepo: mockUserRepo, eventBus: mockEventBus });
    const result = await useCase(input);

    expect(result.isOk()).toBe(true);
    expect(mockUserRepo.findById).toHaveBeenCalledWith(userId.toString());
    expect(mockUserRepo.save).toHaveBeenCalled();
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.any(UserSettingsUpdated)
    );
  });

  it('ska returnera fel när användaren inte hittas', async () => {
    mockUserRepo.findById.mockResolvedValue(ok(null));

    const input: UpdateSettingsInput = {
      userId: 'non-existent-id',
      settings: {
        theme: 'light',
        language: 'sv',
        notifications: {
          enabled: true,
          frequency: 'daily',
          emailEnabled: true,
          pushEnabled: true
        },
        privacy: {
          profileVisibility: 'public',
          showOnlineStatus: true,
          showLastSeen: true
        }
      }
    };

    const useCase = updateSettings({ userRepo: mockUserRepo, eventBus: mockEventBus });
    const result = await useCase(input);

    expect(result.isErr()).toBe(true);
    expect(mockUserRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('ska returnera fel vid ogiltiga inställningar', async () => {
    const input: UpdateSettingsInput = {
      userId: userId.toString(),
      settings: {
        theme: 'invalid' as any, // Ogiltigt tema
        language: 'sv',
        notifications: {
          enabled: true,
          frequency: 'daily',
          emailEnabled: true,
          pushEnabled: true
        },
        privacy: {
          profileVisibility: 'public',
          showOnlineStatus: true,
          showLastSeen: true
        }
      }
    };

    const useCase = updateSettings({ userRepo: mockUserRepo, eventBus: mockEventBus });
    const result = await useCase(input);

    expect(result.isErr()).toBe(true);
    expect(mockUserRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('ska returnera fel vid databasfel', async () => {
    mockUserRepo.save.mockResolvedValue(err('Databasfel'));

    const input: UpdateSettingsInput = {
      userId: userId.toString(),
      settings: {
        theme: 'light',
        language: 'sv',
        notifications: {
          enabled: true,
          frequency: 'daily',
          emailEnabled: true,
          pushEnabled: true
        },
        privacy: {
          profileVisibility: 'public',
          showOnlineStatus: true,
          showLastSeen: true
        }
      }
    };

    const useCase = updateSettings({ userRepo: mockUserRepo, eventBus: mockEventBus });
    const result = await useCase(input);

    expect(result.isErr()).toBe(true);
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
}); 