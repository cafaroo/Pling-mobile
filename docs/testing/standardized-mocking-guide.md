# Guide för standardiserad mockning

Detta dokument beskriver hur man använder standardiserade mock-verktyg i Pling-mobile-projektet för att skapa enhetliga, underhållbara tester.

## Översikt

Vi har implementerat ett komplett testkit med olika factories för att skapa standardiserade mockar:

1. **MockEntityFactory** - För att mockda domänentiteter (User, Team, Organization)
2. **MockValueObjectFactory** - För att mockda värde-objekt (Email, UserProfile, TeamName, etc.)
3. **MockRepositoryFactory** - För att mockda repositories med konsekvent beteende
4. **MockServiceFactory** - För att mockda domäntjänster (FeatureFlagService, etc.)
5. **MockDomainEvents** - För att spåra och verifiera event-publicering

Dessutom har vi två testhjälpare:
- **InvariantTestHelper** - För att testa invarianter i aggregat
- **AggregateTestHelper** - För att testa event-publicering från aggregat

## Installation och användning

### Importering

Importera testkitet och dess komponenter så här:

```typescript
// Importera hela testkitet
import { TestKit } from '../../test-utils';

// Eller importera specifika factories
import { 
  MockEntityFactory, 
  MockValueObjectFactory,
  MockRepositoryFactory,
  MockServiceFactory,
  MockDomainEvents,
  InvariantTestHelper,
  AggregateTestHelper
} from '../../test-utils';
```

### TestKit API

Det centrala `TestKit`-objektet kombinerar alla testhjälpare:

```typescript
TestKit.aggregate    // AggregateTestHelper
TestKit.invariant    // InvariantTestHelper
TestKit.events       // MockDomainEvents
TestKit.result       // ResultTestHelper
TestKit.profile      // UserProfileTestHelper
  
TestKit.mockEntity       // MockEntityFactory
TestKit.mockValueObject  // MockValueObjectFactory
TestKit.mockService      // MockServiceFactory
TestKit.mockRepository   // MockRepositoryFactory
```

## Exempel på användning

### 1. Domänentiteter

Skapa mockar av entiteter med standardvärden:

```typescript
// Skapa en enkel användare med standardvärden
const user = MockEntityFactory.createMockUser().value;

// Skapa en användare med specificerade värden
const customUser = MockEntityFactory.createMockUser({
  id: 'user-123',
  email: 'custom@example.com',
  name: 'Custom User',
  roleIds: ['admin'],
  teamIds: ['team-1', 'team-2']
}).value;

// Skapa flera användare på en gång
const users = MockEntityFactory.createMockUsers(5, {
  emailDomain: 'company.com',
  namePrefix: 'Employee'
});
```

### 2. Värde-objekt

Skapa värde-objekt för testning:

```typescript
// Skapa ett Email-värde-objekt
const email = MockValueObjectFactory.createMockEmail('test@example.com').value;

// Skapa ett UserProfile-värde-objekt
const profile = MockValueObjectFactory.createMockUserProfile({
  displayName: 'Test User',
  bio: 'This is a test profile'
}).value;

// Skapa TeamSettings med anpassade värden
const teamSettings = MockValueObjectFactory.createMockTeamSettings({
  maxMembers: 15,
  isPrivate: true
}).value;
```

### 3. Repositories

Skapa repository-mockar med konsekvent beteende:

```typescript
// Skapa ett enkelt UserRepository med standardanvändare
const userRepo = MockRepositoryFactory.createMockUserRepository();

// Skapa TeamRepository med specificerade team
const teamRepo = MockRepositoryFactory.createMockTeamRepository([
  MockEntityFactory.createMockTeam({ id: 'team-1', name: 'Team 1' }).value,
  MockEntityFactory.createMockTeam({ id: 'team-2', name: 'Team 2' }).value
]);

// Skapa ett repo som alltid returnerar fel
const errorRepo = MockRepositoryFactory.createErrorRepository('Database connection error');
```

### 4. Domain Services

Mockda domäntjänster:

```typescript
// Skapa en standard FeatureFlagService
const featureFlagService = MockServiceFactory.createMockFeatureFlagService();

// Skapa en FeatureFlagService för specifik prenumerationsnivå
const premiumService = MockServiceFactory.createPremiumTierFeatureFlagService();
const freeService = MockServiceFactory.createFreeTierFeatureFlagService();

// Skapa en FeatureFlagService som alltid returnerar fel
const errorService = MockServiceFactory.createErrorFeatureFlagService();
```

### 5. Testa invarianter med InvariantTestHelper

Testa att regler upprätthålls i aggregat:

```typescript
// Förvänta sig att en invariant bryts
TestKit.invariant.expectInvariantViolation(team, 'addMember', [{
  userId: 'user-123',
  role: 'MEMBER'
}], 'maximum members exceeded');

// Förvänta sig att ingen invariant bryts
TestKit.invariant.expectNoInvariantViolation(team, 'update', [{
  name: 'Updated Team Name'
}]);
```

### 6. Testa events med AggregateTestHelper

Testa att events publiceras korrekt:

```typescript
beforeEach(() => {
  // Förbered miljön för att testa events
  TestKit.aggregate.setupTest();
});

afterEach(() => {
  // Städa upp efter testet
  TestKit.aggregate.teardownTest();
});

it('should publish events', () => {
  // Utför en operation som ska publicera events
  team.addMember({ userId: 'user-123', role: 'MEMBER' });
  
  // Verifiera att ett specifikt event publicerades
  const event = TestKit.aggregate.expectEventPublished(team, TeamMemberJoinedEvent);
  
  // Verifiera event-data
  expect(event.teamId).toBe(team.id.toString());
  expect(event.userId).toBe('user-123');
  
  // Verifiera eventsekvens
  TestKit.aggregate.verifyEventSequence(team, [
    TeamCreatedEvent,
    TeamMemberJoinedEvent
  ]);
});
```

## Bästa praxis

1. **Använd standardmockar** när specifika värden inte är relevanta för testet
2. **Definiera endast nödvändiga värden** - låt factory-funktionerna hantera standardvärden
3. **Förbered och rensa eventlyssnare** med `setupTest` och `teardownTest` i `beforeEach`/`afterEach`
4. **Föredra `TestKit`-objektet** framför direkta imports för att göra koden mer konsekvent
5. **Gruppera tester efter beteende**, inte efter mockade komponenter

## Teststruktur

Följ denna struktur när du skriver tester:

1. **Arrange** - Förbered mockar och testmiljö
   ```typescript
   // Arrange
   const mockRepo = MockRepositoryFactory.createMockUserRepository();
   const mockService = MockServiceFactory.createMockFeatureFlagService();
   const useCase = new SomeUseCase(mockRepo, mockService);
   ```

2. **Act** - Utför testoperationen
   ```typescript
   // Act
   const result = await useCase.execute(inputData);
   ```

3. **Assert** - Verifiera resultat och sidoeffekter
   ```typescript
   // Assert
   expect(result.isOk()).toBe(true);
   expect(mockRepo.save).toHaveBeenCalledWith(expect.any(User));
   const event = TestKit.aggregate.expectEventPublished(user, UserCreatedEvent);
   expect(event.userId).toBe(user.id.toString());
   ```

## Slutsats

Genom att använda dessa standardiserade mockverktyg kan vi skapa mer konsekventa, underhållbara och robusta tester i hela projektet. De hjälper oss att testa varje del av domänmodellen på ett standardiserat sätt och minskar duplicering av testkod. 