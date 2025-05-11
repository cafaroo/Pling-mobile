/**
 * Exempeltestfil för domänlager
 */

// Deklarera typer för de globala mockfunktionerna
declare global {
  var mockResultOk: <T>(value: T) => { 
    isOk: () => true; 
    isErr: () => false; 
    value: T; 
    error: null; 
    unwrap: () => T;
  };
  var mockResultErr: <E>(error: E) => {
    isOk: () => false; 
    isErr: () => true; 
    value: null; 
    error: E; 
    unwrap: () => never;
  };
}

// Enkel exempeldomänentitet
class User {
  constructor(
    public id: string,
    public name: string,
    public email: string
  ) {}

  isValid(): boolean {
    return !!this.id && !!this.name && !!this.email && this.email.includes('@');
  }

  static create(data: { id: string; name: string; email: string }) {
    const user = new User(data.id, data.name, data.email);
    if (!user.isValid()) {
      return global.mockResultErr('Invalid user data');
    }
    return global.mockResultOk(user);
  }
}

// Enkel repository-interface
interface UserRepository {
  save(user: User): Promise<boolean>;
  findById(id: string): Promise<User | null>;
}

// UseCase för att registrera en användare
class RegisterUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(userData: { id: string; name: string; email: string }) {
    const userResult = User.create(userData);
    if (userResult.isErr()) {
      return global.mockResultErr(`Failed to create user: ${userResult.error}`);
    }

    const user = userResult.value;
    const existingUser = await this.userRepository.findById(user.id);
    if (existingUser) {
      return global.mockResultErr('User already exists');
    }

    const saved = await this.userRepository.save(user);
    if (!saved) {
      return global.mockResultErr('Failed to save user');
    }

    return global.mockResultOk(user);
  }
}

describe('RegisterUserUseCase', () => {
  // Mock av UserRepository
  const mockUserRepository: UserRepository = {
    save: jest.fn().mockResolvedValue(true),
    findById: jest.fn().mockResolvedValue(null),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('ska skapa och spara en ny användare', async () => {
    const useCase = new RegisterUserUseCase(mockUserRepository);
    const userData = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
    };

    const result = await useCase.execute(userData);

    expect(result.isOk()).toBe(true);
    expect(result.value).toBeInstanceOf(User);
    expect(result.value?.name).toBe(userData.name);
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userData.id);
    expect(mockUserRepository.save).toHaveBeenCalled();
  });

  it('ska returnera fel om användardata är ogiltig', async () => {
    const useCase = new RegisterUserUseCase(mockUserRepository);
    const invalidUserData = {
      id: '123',
      name: 'Test User',
      email: 'invalid-email', // Ogiltig e-post utan @
    };

    const result = await useCase.execute(invalidUserData);

    expect(result.isErr()).toBe(true);
    expect(result.error).toContain('Failed to create user');
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });

  it('ska returnera fel om användaren redan finns', async () => {
    // Ändra beteendet för att simulera en befintlig användare
    mockUserRepository.findById = jest.fn().mockResolvedValue(
      new User('123', 'Existing User', 'existing@example.com')
    );

    const useCase = new RegisterUserUseCase(mockUserRepository);
    const userData = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
    };

    const result = await useCase.execute(userData);

    expect(result.isErr()).toBe(true);
    expect(result.error).toBe('User already exists');
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });

  it('ska returnera fel om det misslyckas att spara användaren', async () => {
    // Återställ findById till standardbeteendet
    mockUserRepository.findById = jest.fn().mockResolvedValue(null);
    
    // Ändra beteendet för att simulera ett misslyckande vid sparande
    mockUserRepository.save = jest.fn().mockResolvedValue(false);

    const useCase = new RegisterUserUseCase(mockUserRepository);
    const userData = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
    };

    const result = await useCase.execute(userData);

    expect(result.isErr()).toBe(true);
    expect(result.error).toBe('Failed to save user');
  });
}); 