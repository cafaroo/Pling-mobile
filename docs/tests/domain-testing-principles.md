# Principer för domäntestning i Pling Mobile

Domäntestning fokuserar på att verifiera att kärndomänen i vår applikation fungerar korrekt. Dessa tester körs i en node-miljö för bättre prestanda och enkelhet.

## Grundläggande principer

1. **Testa värdesobjekt** - Verifiera skapande, validering och jämförelse
2. **Testa entiteter** - Verifiera livscykel, uppdatering och metodbeteenden 
3. **Testa aggregat** - Verifiera domänregler och affärslogik
4. **Testa domäntjänster** - Verifiera operationer över flera entiteter
5. **Isolera tester** - Använd mockade beroenden för externa resurser

## Teststruktur för domänobjekt

```typescript
describe('[KlassNamn]', () => {
  describe('create', () => {
    it('ska skapa ett giltigt objekt med rätt egenskaper', () => {
      // Test implementation
    });
    
    it('ska returnera fel vid ogiltiga värden', () => {
      // Test implementation 
    });
  });
  
  describe('metodnamn', () => {
    it('ska utföra korrekt beteende', () => {
      // Test implementation
    });
    
    it('ska hantera felfall korrekt', () => {
      // Test implementation
    });
  });
});
```

## Testfokus för olika domänobjekt

### 1. Värdesobjekt

För värdesobjekt (Value Objects), fokusera på:

- **Skapande** - Testa att objekt skapas korrekt med giltiga värden
- **Validering** - Testa att ogiltiga värden avvisas
- **Likhetsjämförelse** - Testa att `equals()` fungerar korrekt
- **Metodbeteenden** - Testa alla hjälpmetoder

```typescript
// Exempel på värdesobjekttest
describe('Email', () => {
  describe('create', () => {
    it('ska skapa ett giltigt Email-objekt', () => {
      const result = Email.create('test@example.com');
      expect(result.isOk()).toBe(true);
      expect(result.value.toString()).toBe('test@example.com');
    });
    
    it('ska normalisera e-postadresser till gemener', () => {
      const result = Email.create('TEST@EXAMPLE.COM');
      expect(result.isOk()).toBe(true);
      expect(result.value.toString()).toBe('test@example.com');
    });
    
    it('ska returnera fel för tom e-post', () => {
      const result = Email.create('');
      expect(result.isErr()).toBe(true);
    });
  });
  
  describe('equals', () => {
    it('ska korrekt jämföra två e-postadresser', () => {
      const email1 = Email.create('test@example.com').value;
      const email2 = Email.create('test@example.com').value;
      const email3 = Email.create('other@example.com').value;
      
      expect(email1.equals(email2)).toBe(true);
      expect(email1.equals(email3)).toBe(false);
    });
  });
});
```

### 2. Entiteter

För entiteter, fokusera på:

- **Tillstånd** - Testa att entiteten håller korrekt tillstånd
- **Beteenden** - Testa att entitetens metoder fungerar korrekt
- **Invarianter** - Testa att affärsregler/invarianter upprätthålls
- **Relationer** - Testa relationer till andra entiteter

```typescript
// Exempel på entitetstest
describe('User', () => {
  describe('create', () => {
    it('ska skapa en giltig användare med korrekta värden', () => {
      const result = User.create({
        email: Email.create('test@example.com').value,
        name: 'Test User',
        status: 'active'
      });
      
      expect(result.isOk()).toBe(true);
      expect(result.value.email.toString()).toBe('test@example.com');
      expect(result.value.name).toBe('Test User');
      expect(result.value.status).toBe('active');
    });
  });
  
  describe('updateSettings', () => {
    it('ska uppdatera användarinställningar', () => {
      const user = User.create({
        email: Email.create('test@example.com').value,
        name: 'Test User',
        status: 'active'
      }).value;
      
      const newSettings = UserSettings.create({
        theme: 'dark',
        language: Language.create('sv').value
      }).value;
      
      const result = user.updateSettings(newSettings);
      
      expect(result.isOk()).toBe(true);
      expect(user.settings.theme).toBe('dark');
      expect(user.settings.language.code).toBe('sv');
    });
  });
});
```

### 3. Domäntjänster

För domäntjänster, fokusera på:

- **Input/Output** - Testa olika indata och förväntad utdata
- **Orkestrering** - Testa samspel mellan flera domänobjekt
- **Felhantering** - Testa alla felfall och gränsfall
- **Mockade beroenden** - Mocka externa beroenden som repositories

```typescript
// Exempel på domäntjänsttest
describe('UserRegistrationService', () => {
  let userRepository: MockUserRepository;
  let emailService: MockEmailService;
  let userRegistrationService: UserRegistrationService;
  
  beforeEach(() => {
    userRepository = new MockUserRepository();
    emailService = new MockEmailService();
    userRegistrationService = new UserRegistrationService(
      userRepository,
      emailService
    );
  });
  
  it('ska registrera en ny användare', async () => {
    // Arrange
    const email = 'test@example.com';
    const name = 'Test User';
    
    // Act
    const result = await userRegistrationService.registerUser({
      email,
      name,
      password: 'SecurePassword123!'
    });
    
    // Assert
    expect(result.isOk()).toBe(true);
    expect(userRepository.saveCalledWith).toHaveProperty('email.value', email);
    expect(userRepository.saveCalledWith).toHaveProperty('name', name);
    expect(emailService.sendWelcomeEmailCalled).toBe(true);
  });
});
```

## Mockstrategier

### 1. Repository-mockar

```typescript
class MockUserRepository implements UserRepository {
  savedUsers: User[] = [];
  saveCalledWith: User | null = null;
  
  async save(user: User): Promise<Result<User, Error>> {
    this.savedUsers.push(user);
    this.saveCalledWith = user;
    return ok(user);
  }
  
  async findById(id: UniqueId): Promise<Result<User, Error>> {
    const user = this.savedUsers.find(u => u.id.equals(id));
    return user ? ok(user) : err(new Error('User not found'));
  }
  
  // Andra metoder...
}
```

### 2. Service-mockar

```typescript
class MockEmailService implements EmailService {
  sendWelcomeEmailCalled = false;
  
  async sendWelcomeEmail(to: string): Promise<Result<void, Error>> {
    this.sendWelcomeEmailCalled = true;
    return ok(undefined);
  }
}
```

### 3. Event-mockar

```typescript
class MockEventBus implements EventBus {
  publishedEvents: DomainEvent[] = [];
  
  publish(event: DomainEvent): void {
    this.publishedEvents.push(event);
  }
  
  subscribe(handler: EventHandler): void {
    // Implementation för test
  }
}
```

## Test för use cases

Use cases är applikationslagernivå, men följer liknande mönster som domäntjänster:

```typescript
describe('CreateUserUseCase', () => {
  let userRepository: MockUserRepository;
  let createUserUseCase: CreateUserUseCase;
  
  beforeEach(() => {
    userRepository = new MockUserRepository();
    createUserUseCase = new CreateUserUseCase(userRepository);
  });
  
  it('ska skapa en ny användare med giltiga värden', async () => {
    // Arrange
    const input = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'SecurePassword123!'
    };
    
    // Act
    const result = await createUserUseCase.execute(input);
    
    // Assert
    expect(result.isOk()).toBe(true);
    expect(userRepository.saveCalledWith).toHaveProperty('email.value', input.email);
    expect(userRepository.saveCalledWith).toHaveProperty('name', input.name);
  });
  
  it('ska returnera fel om användaren redan finns', async () => {
    // Arrange: Skapa en användare först
    userRepository.findByEmailResult = ok(User.create({
      email: Email.create('test@example.com').value,
      name: 'Existing User',
      status: 'active'
    }).value);
    
    // Act
    const result = await createUserUseCase.execute({
      email: 'test@example.com',
      name: 'Test User',
      password: 'SecurePassword123!'
    });
    
    // Assert
    expect(result.isErr()).toBe(true);
    expect(result.error).toBe('USER_ALREADY_EXISTS');
  });
});
```

## Hantera Result-objekt i tester

Vi använder Result-mönstret (ok/err) i vår domän. För att testa dessa resultat:

```typescript
// Testa lyckade resultat
const result = SomeClass.someMethod();
expect(result.isOk()).toBe(true);
expect(result.value).toHaveProperty('someProperty');

// Testa felaktiga resultat
const failResult = SomeClass.someMethod(invalidInput);
expect(failResult.isErr()).toBe(true);
expect(failResult.error).toBe('EXPECTED_ERROR_CODE');
```

## Testexempel för hooks

Hooks inom applikationslagret som använder domänobjekt:

```typescript
// Mock beroenden
jest.mock('@/infrastructure/InfrastructureFactory', () => ({
  InfrastructureFactory: {
    getInstance: jest.fn(() => ({
      getUserRepository: () => mockUserRepository
    }))
  }
}));

describe('useUser', () => {
  it('ska hämta användardata', async () => {
    // Arrange
    const userId = 'test-user-id';
    mockUserRepository.findById.mockResolvedValue(ok(mockUser));
    
    // Act
    const { result, waitFor } = renderHook(() => useUser(userId), {
      wrapper: createWrapper()
    });
    
    // Wait for async operations
    await waitFor(() => !result.current.isLoading);
    
    // Assert
    expect(result.current.user).toEqual(mockUser);
    expect(mockUserRepository.findById).toHaveBeenCalledWith(expect.any(UniqueId));
  });
}); 