import { Result } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { User } from '@/domain/user/entities/User';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { EventBus } from '@/shared/core/EventBus';
import { createUser, CreateUserInput } from '../createUser';
import { UserCreated } from '@/domain/user/events/UserEvent';

describe('createUser', () => {
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockEventBus: jest.Mocked<EventBus>;
  let validInput: CreateUserInput;

  beforeEach(() => {
    mockUserRepo = {
      save: jest.fn().mockResolvedValue(Result.ok(undefined)),
      findByEmail: jest.fn(),
      findById: jest.fn()
    } as any;

    mockEventBus = {
      publish: jest.fn()
    } as any;

    validInput = {
      email: 'test@example.com',
      phone: '+46701234567',
      profile: {
        firstName: 'Test',
        lastName: 'User',
        displayName: 'TestUser',
        contact: {
          email: 'test@example.com',
          phone: '+46701234567'
        }
      },
      settings: {
        theme: 'light',
        language: 'sv',
        notifications: {
          email: true,
          push: true,
          sms: false,
          frequency: 'daily'
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showPhone: false
        }
      }
    };
  });

  it('ska skapa en ny användare med giltiga värden', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(Result.err('Användaren finns inte'));

    const useCase = createUser({ userRepo: mockUserRepo, eventBus: mockEventBus });
    const result = await useCase(validInput);

    expect(result.isOk()).toBe(true);
    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(validInput.email);
    expect(mockUserRepo.save).toHaveBeenCalled();
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.any(UserCreated)
    );
  });

  it('ska returnera fel om användaren redan finns', async () => {
    const existingUser = { id: new UniqueId() } as User;
    mockUserRepo.findByEmail.mockResolvedValue(Result.ok(existingUser));

    const useCase = createUser({ userRepo: mockUserRepo, eventBus: mockEventBus });
    const result = await useCase(validInput);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.getError()).toBe('En användare med denna e-postadress finns redan');
    }
    expect(mockUserRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('ska validera e-postadress', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(Result.err('Användaren finns inte'));

    const useCase = createUser({ userRepo: mockUserRepo, eventBus: mockEventBus });
    const result = await useCase({
      ...validInput,
      email: 'invalid-email'
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.getError()).toBe('Ogiltig e-postadress');
    }
    expect(mockUserRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('ska validera telefonnummer', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(Result.err('Användaren finns inte'));

    const useCase = createUser({ userRepo: mockUserRepo, eventBus: mockEventBus });
    const result = await useCase({
      ...validInput,
      profile: {
        ...validInput.profile,
        contact: {
          ...validInput.profile.contact,
          phone: 'invalid-phone'
        }
      }
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.getError()).toBe('Ogiltigt telefonnummer');
    }
    expect(mockUserRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('ska hantera fel vid sparande', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(Result.err('Användaren finns inte'));
    mockUserRepo.save.mockResolvedValue(Result.err('Databasfel'));

    const useCase = createUser({ userRepo: mockUserRepo, eventBus: mockEventBus });
    const result = await useCase(validInput);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.getError()).toBe('Kunde inte skapa användaren: Databasfel');
    }
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
}); 