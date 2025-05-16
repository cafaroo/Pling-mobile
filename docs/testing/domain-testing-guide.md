# Guide för domäntestning i Pling-mobile

Denna dokumentation beskriver hur du använder de standardiserade testverktygen i projektet för att testa olika aspekter av domänmodellen enligt DDD-principer.

## Innehåll

1. [Översikt](#översikt)
2. [TestKit API](#testkit-api)
3. [Testa aggregat](#testa-aggregat)
   - [Invarianter](#testa-invarianter)
   - [Event-publicering](#testa-event-publicering)
4. [Testa värde-objekt](#testa-värde-objekt)
5. [Testa use cases](#testa-use-cases)
6. [Bästa praxis](#bästa-praxis)

## Översikt

För att hjälpa med domäntestning enligt DDD-principer har vi skapat ett komplett TestKit som finns i `test-utils/index.ts`. Detta TestKit innehåller:

- **Testhjälpare** för att testa aggregat, invarianter och events
- **Mock factories** för att skapa entiteter, värde-objekt, tjänster och repositories
- **Hjälpare för Result-API** och UserProfile-hantering

## TestKit API

Du kommer åt TestKit genom att importera det från test-utils:

```typescript
import { TestKit } from '../../test-utils';
```

Testkitet innehåller följande komponenter:

```typescript
TestKit.aggregate        // För att testa event-publicering från aggregat
TestKit.invariant        // För att testa invarianter i aggregat
TestKit.events           // För att spåra och kontrollera domänevents
TestKit.result           // För att hantera Result-API (isOk/value vs isSuccess/getValue)
TestKit.profile          // För att hantera UserProfile-ändringar

TestKit.mockEntity       // Factory för att skapa entiteter (User, Team, Organization)
TestKit.mockValueObject  // Factory för att skapa värde-objekt (Email, TeamName osv.)
TestKit.mockService      // Factory för att skapa tjänster (FeatureFlagService osv.)
TestKit.mockRepository   // Factory för att skapa repositories
```

## Testa aggregat

Aggregattestning fokuserar på två huvudområden: invarianter och event-publicering.

### Testa invarianter

Invarianter är regler som alltid måste vara sanna för ett aggregat. För att testa dem använder du `TestKit.invariant`:

```typescript
import { TestKit } from '../../test-utils';

describe('Team Aggregate', () => {
  it('should validate maximum members invariant', () => {
    // Skapa ett team med maxgräns på 2 medlemmar
    const team = TestKit.mockEntity.createMockTeam({
      settings: { maxMembers: 2 }
    }).value;
    
    // Lägg till en medlem (inom maxgränsen)
    TestKit.invariant.expectNoInvariantViolation(team, 'addMember', [{
      userId: 'user-123',
      role: 'MEMBER',
      joinedAt: new Date()
    }]);
    
    // Försök lägga till ytterligare en medlem (över maxgränsen)
    TestKit.invariant.expectInvariantViolation(team, 'addMember', [{
      userId: 'user-456',
      role: 'MEMBER',
      joinedAt: new Date()
    }], 'maximum');
  });
});
```

#### API för invarianttestning

- `expectInvariantViolation(aggregate, operation, args, errorMessage)` - Förväntar sig att en operation bryter en invariant
- `expectNoInvariantViolation(aggregate, operation, args)` - Förväntar sig att en operation inte bryter någon invariant

### Testa event-publicering

Domänevents publiceras av aggregat när deras tillstånd förändras. För att testa event-publicering:

```typescript
import { TestKit } from '../../test-utils';
import { TeamMemberJoinedEvent } from '../../domain/team/events/TeamMemberJoinedEvent';

describe('Team Aggregate', () => {
  beforeEach(() => {
    // Förbered test med event-spårning
    TestKit.aggregate.setupTest();
  });

  afterEach(() => {
    // Rensa events efter testet
    TestKit.aggregate.teardownTest();
  });

  it('should publish TeamMemberJoinedEvent when adding a member', () => {
    // Skapa ett team
    const team = TestKit.mockEntity.createMockTeam().value;
    
    // Lägg till en medlem
    team.addMember({
      userId: 'user-123',
      role: 'MEMBER',
      joinedAt: new Date()
    });
    
    // Verifiera att korrekt event publicerades
    const event = TestKit.aggregate.expectEventPublished(team, TeamMemberJoinedEvent);
    
    // Verifiera event-data
    expect(event.teamId).toBe(team.id.toString());
    expect(event.userId).toBe('user-123');
  });
});
```

#### API för event-testning

- `expectEventPublished(aggregate, eventType)` - Kontrollerar att ett visst event har publicerats
- `expectNoEventPublished(aggregate, eventType)` - Kontrollerar att ett visst event inte har publicerats
- `verifyEventSequence(aggregate, expectedEvents)` - Verifierar sekvensen av publicerade events

## Testa värde-objekt

Värde-objekt testas huvudsakligen för validering och skapande. För dessa tester använder du `TestKit.mockValueObject`:

```typescript
import { TestKit } from '../../test-utils';

describe('Email Value Object', () => {
  it('should create valid email', () => {
    // Skapa ett giltigt email-objekt
    const emailResult = TestKit.mockValueObject.createMockEmail('valid@example.com');
    
    // Verifiera att det skapades framgångsrikt
    expect(emailResult.isOk()).toBe(true);
    expect(emailResult.value.value).toBe('valid@example.com');
  });
  
  it('should reject invalid email', () => {
    // Försök skapa ett ogiltigt email-objekt
    const emailResult = TestKit.mockValueObject.createMockEmail('invalid-email');
    
    // Verifiera att det misslyckades
    expect(emailResult.isErr()).toBe(true);
  });
});
```

## Testa use cases

Use cases i applikationslagret testas genom att mocka repositories och tjänster:

```typescript
import { TestKit } from '../../test-utils';
import { CreateTeamUseCase } from '../CreateTeamUseCase';
import { CreateTeamDTO } from '../dto/CreateTeamDTO';

describe('CreateTeamUseCase', () => {
  it('should create a team successfully', async () => {
    // Skapa mockrepositorier
    const mockUserRepository = TestKit.mockRepository.createMockUserRepository([
      TestKit.mockEntity.createMockUser({ id: 'user-123' }).value
    ]);
    
    const mockTeamRepository = TestKit.mockRepository.createMockTeamRepository();
    
    const mockOrganizationRepository = TestKit.mockRepository.createMockOrganizationRepository([
      TestKit.mockEntity.createMockOrganization({ id: 'org-123' }).value
    ]);
    
    // Skapa mock FeatureFlagService
    const mockFeatureFlagService = TestKit.mockService.createMockFeatureFlagService();
    
    // Skapa use case med mockar
    const createTeamUseCase = new CreateTeamUseCase(
      mockTeamRepository,
      mockUserRepository,
      mockOrganizationRepository,
      mockFeatureFlagService
    );
    
    // Skapa DTO
    const dto: CreateTeamDTO = {
      name: 'Test Team',
      description: 'Test Description',
      ownerId: 'user-123',
      organizationId: 'org-123'
    };
    
    // Anropa use case
    const result = await createTeamUseCase.execute(dto);
    
    // Verifiera resultat
    expect(result.isOk()).toBe(true);
    
    // Verifiera att team sparades i repository
    const allTeams = await mockTeamRepository.findAll();
    expect(allTeams.isOk()).toBe(true);
    expect(allTeams.value.length).toBe(1);
  });
});
```

## Bästa praxis

### För användbara tester

1. **Förbered och rensa miljön** - Använd `setupTest()` och `teardownTest()` i `beforeEach` och `afterEach`.
2. **Testa ett beteende per test** - Håll tester fokuserade på ett specifikt beteende.
3. **Verifiera invarianter och events** - Testa att aggregat upprätthåller regler och publicerar rätt events.
4. **Använd standardiserade mockar** - Använd TestKit-factories för konsekvent testning.
5. **Följ teststrukturmönstret** - Arrange, Act, Assert.

### Mönster för teststruktur

```typescript
describe('Entity eller funktionalitet', () => {
  beforeEach(() => {
    // Förbered testmiljö
    TestKit.aggregate.setupTest();
  });

  afterEach(() => {
    // Rensa efter test
    TestKit.aggregate.teardownTest();
  });

  describe('Kategori av beteende', () => {
    it('should [förväntat beteende]', () => {
      // Arrange - Förbered testdata
      const entity = TestKit.mockEntity.createMock...();
      
      // Act - Utför operation
      entity.doSomething();
      
      // Assert - Verifiera resultat
      expect(...).toBe(...);
      
      // Assert - Verifiera events/invarianter
      TestKit.aggregate.expectEventPublished(...);
    });
  });
});
```

### Felhanteringshjälp

Om du stöter på problem med ändringar i Result-API:et (isOk/value vs isSuccess/getValue), använd `TestKit.result` för att hantera bakåtkompatibilitet:

```typescript
// För gamla tester som använder det gamla API:et
const value = TestKit.result.compatValue(result);
const isSuccess = TestKit.result.compatIsSuccess(result);
```

För problem med UserProfile-ändringar, använd `TestKit.profile` för att skapa backwards-kompatibla profiler. 