# Teststrategi för Domänmodellen

Denna fil beskriver den övergripande strategin för att testa domänmodellen i Pling-mobile projektet enligt principerna för Domain-Driven Design (DDD).

## Principer för domäntestning

I vår testning av domänmodellen följer vi dessa grundläggande principer:

1. **Aggregate Roots ska testas som en enhet** - Vi testar interna entiteter och värde-objekt via aggregatroten, inte separat.
2. **Invarianter ska valideras** - Alla aggregatinvarianter ska testas explicit.
3. **Event-publicering ska testas** - Vi verifierar att rätt events publiceras när aggregat ändrar tillstånd.
4. **Värde-objekt testas separat** - Vi testar skapande, validering och affärsregler i värde-objekt självständigt.
5. **Repositories testas mot gränssnitt** - Repositories testas mot deras interface, inte implementation.
6. **Domäntjänster mockdeklareras** - Vi använder mockar för domäntjänster för att testa domänbeteende.

## Testtyper

Vi använder följande testtyper för olika delar av domänmodellen:

### 1. Enhetstester för värde-objekt

Testar validering och regler i värde-objekt:

- **Vad som testas:** 
  - Validering av indata
  - Skapande av nya instanser
  - Affärsregler och beräkningar
  - Immutabilitet

- **Verktyg:**
  - `TestKit.mockValueObject` för att skapa testinstanser
  - `TestKit.result` för att hantera Result-typen

### 2. Enhetstester för aggregat

Testar aggregat med fokus på två områden:

**Invarianter:**
- Att aggregatet upprätthåller sina regler oavsett tillstånd
- Att ogiltig manipulation förhindras
- Att korrekt aggregatstruktur säkerställs

**Domänevents:**
- Att rätt events publiceras i rätt ordning
- Att events innehåller korrekt data
- Att events publiceras endast när tillstånd faktiskt ändras

- **Verktyg:**
  - `TestKit.invariant` för att testa invarianter
  - `TestKit.aggregate` för att testa event-publicering
  - `TestKit.mockEntity` för att skapa testinstanser

### 3. Tester för repositories

Testar att repositories korrekt:
- Mappar databasmodeller till domänmodeller
- Upprätthåller domänintegriteten
- Hanterar queries och kommandon korrekt

- **Verktyg:**
  - `TestKit.mockRepository` för att skapa repository-mockar
  - Supabase-mockar för att testa utan databasanslutning

### 4. Tester för use cases

Testar att applikationslagrets use cases:
- Koordinerar domänoperationer korrekt
- Hanterar felfall korrekt
- Validerar indata

- **Verktyg:**
  - `TestKit.mockRepository` för att mocka repositories
  - `TestKit.mockService` för att mocka domäntjänster
  - `TestKit.events` för att spåra domänevents

## Standardiserad teststruktur

Vi följer en konsekvent struktur för alla tester i domänmodellen:

```typescript
// 1. Import av testverktyg
import { TestKit } from '../../test-utils';

// 2. Import av enheten som ska testas och dess beroenden
import { SomeEntity } from '../SomeEntity';
import { SomeEvent } from '../events/SomeEvent';

describe('Entity Name', () => {
  // 3. Setup och teardown av testmiljön
  beforeEach(() => {
    TestKit.aggregate.setupTest();
  });

  afterEach(() => {
    TestKit.aggregate.teardownTest();
  });

  // 4. Gruppering av tester efter beteende
  describe('Entity Creation', () => {
    it('should create a valid entity', () => {
      // Arrange
      const props = { /* ... */ };
      
      // Act
      const result = SomeEntity.create(props);
      
      // Assert
      expect(result.isOk()).toBe(true);
    });
  });

  describe('Business Rules', () => {
    it('should enforce some business rule', () => {
      // ...
    });
  });

  describe('Event Publishing', () => {
    it('should publish events when state changes', () => {
      // ...
    });
  });
});
```

## Fokusområden för testning

Vi har fokuserat vår testning på följande områden av domänmodellen:

1. **Team-domänen**
   - Team-aggregatet och dess invarianter
   - TeamMember värde-objekt
   - TeamSettings värde-objekt
   - Team-relaterade events och use cases

2. **User-domänen**
   - User-aggregatet och dess invarianter
   - UserProfile värde-objekt
   - UserSettings värde-objekt
   - User-relaterade events och use cases

3. **Organization-domänen**
   - Organization-aggregatet och dess invarianter
   - OrganizationMember värde-objekt
   - Organization-relaterade events och use cases

4. **Subscription-domänen**
   - Subscription värde-objekt
   - FeatureFlagService och dess implementation
   - Subscription-relaterade repositories

## Best Practices

1. **Använd standardiserade mock-factories** - Föredra `TestKit.mockEntity` och `TestKit.mockValueObject` framför direkta anrop till `.create()` för att skapa entiteter och värde-objekt.

2. **Testa event-publicering explicit** - Använd alltid `TestKit.aggregate.expectEventPublished` för att verifiera events.

3. **Testa invarianter med specifika metoder** - Använd `TestKit.invariant.expectInvariantViolation` och `TestKit.invariant.expectNoInvariantViolation` för att testa aggregatregler.

4. **Undvik hårdkodade ID:n** - Föredra att generera ID:n dynamiskt med hjälp av mock-factories.

5. **Föredra testning av aggregat via gränssnitt** - Testa mot aggregatets publika API, undvik att testa privata metoder.

6. **Förbered och rensa testmiljön** - Använd `setupTest()` och `teardownTest()` i `beforeEach` och `afterEach` för att säkerställa ren testmiljö.

7. **Begränsa test scope** - Testa en funktionalitet per test, undvik överlappande tester.

## Testexempel

### Exempel 1: Testa värde-objekt

```typescript
describe('Email', () => {
  it('should create valid email', () => {
    const emailResult = TestKit.mockValueObject.createMockEmail('valid@example.com');
    expect(emailResult.isOk()).toBe(true);
  });
  
  it('should reject invalid email', () => {
    const emailResult = TestKit.mockValueObject.createMockEmail('invalid-email');
    expect(emailResult.isErr()).toBe(true);
  });
});
```

### Exempel 2: Testa aggregatinvarianter

```typescript
describe('Team', () => {
  it('should enforce maximum members rule', () => {
    const team = TestKit.mockEntity.createMockTeam({
      settings: { maxMembers: 2 }
    }).value;
    
    // Första medlemmen (ägaren) finns redan
    // Andra medlemmen (når maxgränsen)
    TestKit.invariant.expectNoInvariantViolation(team, 'addMember', [{
      userId: 'user-123',
      role: 'MEMBER',
      joinedAt: new Date()
    }]);
    
    // Tredje medlemmen (överskrider maxgränsen)
    TestKit.invariant.expectInvariantViolation(team, 'addMember', [{
      userId: 'user-456',
      role: 'MEMBER',
      joinedAt: new Date()
    }], 'maximum');
  });
});
```

### Exempel 3: Testa event-publicering

```typescript
describe('Team', () => {
  beforeEach(() => TestKit.aggregate.setupTest());
  afterEach(() => TestKit.aggregate.teardownTest());
  
  it('should publish events when adding member', () => {
    const team = TestKit.mockEntity.createMockTeam().value;
    
    team.addMember({
      userId: 'user-123',
      role: 'MEMBER',
      joinedAt: new Date()
    });
    
    const event = TestKit.aggregate.expectEventPublished(team, TeamMemberJoinedEvent);
    expect(event.teamId).toBe(team.id.toString());
    expect(event.userId).toBe('user-123');
  });
});
```

### Exempel 4: Testa use case med mockade repositories

```typescript
describe('CreateTeamUseCase', () => {
  beforeEach(() => TestKit.aggregate.setupTest());
  afterEach(() => TestKit.aggregate.teardownTest());
  
  it('should create a team and save it', async () => {
    // Skapa mockrepositorier
    const mockTeamRepository = TestKit.mockRepository.createMockTeamRepository();
    const mockUserRepository = TestKit.mockRepository.createMockUserRepository([
      TestKit.mockEntity.createMockUser({ id: 'user-123' }).value
    ]);
    
    // Skapa use case
    const createTeamUseCase = new CreateTeamUseCase(
      mockTeamRepository,
      mockUserRepository,
      /* andra beroenden */
    );
    
    // Anropa use case
    await createTeamUseCase.execute({
      name: 'Test Team',
      ownerId: 'user-123',
      /* andra props */
    });
    
    // Verifiera att teamet sparades
    const teams = await mockTeamRepository.findAll();
    expect(teams.isOk()).toBe(true);
    expect(teams.value.length).toBe(1);
    
    // Verifiera att event publicerades (om relevant)
    const events = TestKit.events.getEvents();
    expect(events.some(e => e instanceof TeamCreatedEvent)).toBe(true);
  });
}); 