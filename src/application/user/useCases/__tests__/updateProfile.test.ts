import { Result } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { User } from '@/domain/user/entities/User';
import { UserProfile } from '@/domain/user/entities/UserProfile';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { EventBus } from '@/shared/core/EventBus';
import { UpdateProfileUseCase } from '../UpdateProfileUseCase';
import { UserProfileUpdated } from '@/domain/user/events/UserEvent';

describe('UpdateProfileUseCase', () => {
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockEventBus: jest.Mocked<EventBus>;
  let updateProfileUseCase: UpdateProfileUseCase;
  let mockUser: User;
  let mockProfile: UserProfile;

  beforeEach(async () => {
    mockUserRepo = {
      findById: jest.fn(),
      save: jest.fn(),
      findByEmail: jest.fn(),
    } as any;

    mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined)
    } as any;

    const profileResult = await UserProfile.create({
      firstName: 'Test',
      lastName: 'Testsson',
      contact: {
        email: 'test@test.com'
      }
    });

    mockProfile = profileResult.getValue();

    const userResult = await User.create({
      email: 'test@test.com',
      name: 'Test Testsson',
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
      },
      teamIds: []
    });

    mockUser = userResult.getValue();
    updateProfileUseCase = new UpdateProfileUseCase({ 
      userRepo: mockUserRepo,
      eventBus: mockEventBus
    });
  });

  it('ska uppdatera en användares profil', async () => {
    // Arrange
    const userId = new UniqueId();
    mockUserRepo.findById.mockResolvedValue(Result.ok(mockUser));
    mockUserRepo.save.mockResolvedValue(Result.ok(undefined));

    // Act
    const result = await updateProfileUseCase.execute({
      userId: userId.toString(),
      profile: {
        firstName: 'Uppdaterad',
        lastName: 'Testsson',
        contact: {
          email: 'test@test.com'
        }
      }
    });

    // Assert
    expect(result.isOk()).toBe(true);
    expect(mockUserRepo.findById).toHaveBeenCalledWith(userId.toString());
    expect(mockUserRepo.save).toHaveBeenCalled();
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.any(UserProfileUpdated)
    );
  });

  it('ska returnera fel om användaren inte hittas', async () => {
    // Arrange
    const userId = new UniqueId();
    mockUserRepo.findById.mockResolvedValue(Result.err('Användaren hittades inte'));

    // Act
    const result = await updateProfileUseCase.execute({
      userId: userId.toString(),
      profile: {
        firstName: 'Test',
        lastName: 'Testsson',
        contact: {
          email: 'test@test.com'
        }
      }
    });

    // Assert
    expect(result.isErr()).toBe(true);
    expect(mockUserRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('ska returnera fel vid ogiltig profildata', async () => {
    // Arrange
    const userId = new UniqueId();
    mockUserRepo.findById.mockResolvedValue(Result.ok(mockUser));

    // Act
    const result = await updateProfileUseCase.execute({
      userId: userId.toString(),
      profile: {
        firstName: '', // Ogiltigt tomt namn
        lastName: 'Testsson',
        contact: {
          email: 'test@test.com'
        }
      }
    });

    // Assert
    expect(result.isErr()).toBe(true);
    expect(mockUserRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('ska returnera fel om sparande misslyckas', async () => {
    // Arrange
    const userId = new UniqueId();
    mockUserRepo.findById.mockResolvedValue(Result.ok(mockUser));
    mockUserRepo.save.mockResolvedValue(Result.err('Databasfel'));

    // Act
    const result = await updateProfileUseCase.execute({
      userId: userId.toString(),
      profile: {
        firstName: 'Test',
        lastName: 'Testsson',
        contact: {
          email: 'test@test.com'
        }
      }
    });

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.getError()).toBe('Kunde inte uppdatera profilen: Databasfel');
    }
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
}); 