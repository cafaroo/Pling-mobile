# Testhjälpare för domänmodellen

Detta bibliotek innehåller testhjälpare för att testa domänmodellen, inklusive aggregat, invarianter och events.

## Översikt

Följande hjälpare finns tillgängliga:

- `MockDomainEvents` - Simulerar domänevents för testning
- `InvariantTestHelper` - Hjälper till att testa invarianter i aggregat
- `AggregateTestHelper` - Hjälper till att testa events från aggregat
- `ResultTestHelper` - Hjälper till att testa Result-objekt med stöd för både nya och gamla API:er
- `UserProfileTestHelper` - Hjälper till att testa UserProfile med stöd för bakåtkompatibilitet

## Användning

### Testa invarianter med InvariantTestHelper

```typescript
import { InvariantTestHelper } from '../test-utils/helpers/invariantTestHelper';
import { Team } from '../domain/team/entities/Team';

describe('Team invariants', () => {
  it('should validate maximum members', () => {
    // Skapa ett team med max 2 medlemmar
    const team = Team.create({
      name: 'Test Team',
      description: 'Test team description',
      ownerId: 'user1',
      settings: { maxMembers: 2 }
    }).value;

    // Lägg till en användare (ska lyckas)
    InvariantTestHelper.expectNoInvariantViolation(team, 'addMember', [{
      userId: 'user2',
      role: 'MEMBER'
    }]);

    // Lägg till ytterligare en användare (ska misslyckas, eftersom ägaren redan räknas)
    InvariantTestHelper.expectInvariantViolation(team, 'addMember', [{
      userId: 'user3',
      role: 'MEMBER'
    }], 'Maximum number of members exceeded');
  });

  it('should validate owner cannot be removed', () => {
    const team = Team.create({
      name: 'Test Team',
      ownerId: 'owner1'
    }).value;

    // Försök att ta bort ägaren ska misslyckas
    InvariantTestHelper.expectInvariantViolation(
      team,
      'removeMember',
      ['owner1'],
      'Cannot remove owner from team'
    );
  });
});
```

### Testa events med AggregateTestHelper och MockDomainEvents

```typescript
import { AggregateTestHelper } from '../test-utils/helpers/aggregateTestHelper';
import { User } from '../domain/user/entities/User';
import { UserRoleAddedEvent } from '../domain/user/events/UserRoleAddedEvent';
import { UserRoleRemovedEvent } from '../domain/user/events/UserRoleRemovedEvent';

describe('User events', () => {
  beforeEach(() => {
    // Förbered testmiljön
    AggregateTestHelper.setupTest();
  });

  afterEach(() => {
    // Städa upp efter test
    AggregateTestHelper.teardownTest();
  });

  it('should publish UserRoleAddedEvent when adding a role', () => {
    // Skapa en användare
    const user = User.create({
      email: 'test@example.com',
      name: 'Test User'
    }).value;

    // Lägg till en roll
    user.addRole('admin');

    // Verifiera att rätt event publicerades
    const event = AggregateTestHelper.expectEventPublished(user, UserRoleAddedEvent);
    
    // Verifiera event-data
    expect(event.userId).toBe(user.id);
    expect(event.roleId).toBe('admin');
  });

  it('should publish events in correct sequence', () => {
    const user = User.create({
      email: 'test@example.com',
      name: 'Test User'
    }).value;

    // Lägg till och ta bort en roll
    user.addRole('admin');
    user.removeRole('admin');

    // Verifiera sekvensen av events
    AggregateTestHelper.verifyEventSequence(user, [
      UserRoleAddedEvent,
      UserRoleRemovedEvent
    ]);
  });
});
```

### Använda ResultTestHelper för bakåtkompatibilitet

```typescript
import { ResultTestHelper } from '../test-utils/helpers/resultTestHelper';
import { Result } from '../shared/core/Result';
import { Email } from '../domain/user/value-objects/Email';

describe('Email validation', () => {
  it('should validate email format', () => {
    // Med nya Result API
    const validResult = Email.create('valid@example.com');
    expect(validResult.isOk()).toBe(true);
    expect(validResult.value.value).toBe('valid@example.com');

    // Med ResultTestHelper för bakåtkompatibilitet
    const invalidResult = Email.create('invalid-email');
    expect(ResultTestHelper.compatIsFailure(invalidResult)).toBe(true);
    
    // Testa båda API:erna
    const anotherResult = Email.create('test@example.com');
    if (ResultTestHelper.compatIsSuccess(anotherResult)) {
      const email = ResultTestHelper.compatValue(anotherResult);
      expect(email.value).toBe('test@example.com');
    }
  });
});
```

## Integration i tester

De olika testhjälparna kan kombineras för att testa komplexa scenarier:

```typescript
import { AggregateTestHelper } from '../test-utils/helpers/aggregateTestHelper';
import { InvariantTestHelper } from '../test-utils/helpers/invariantTestHelper';
import { ResultTestHelper } from '../test-utils/helpers/resultTestHelper';
import { Team } from '../domain/team/entities/Team';
import { TeamMemberJoinedEvent } from '../domain/team/events/TeamMemberJoinedEvent';

describe('Team operations', () => {
  beforeEach(() => {
    AggregateTestHelper.setupTest();
  });

  afterEach(() => {
    AggregateTestHelper.teardownTest();
  });

  it('should handle adding a team member correctly', () => {
    // Skapa ett team
    const createResult = Team.create({
      name: 'Test Team',
      description: 'Test Description',
      ownerId: 'owner1'
    });
    
    // Verifiera med ResultTestHelper
    expect(ResultTestHelper.compatIsSuccess(createResult)).toBe(true);
    
    const team = ResultTestHelper.compatValue(createResult);
    
    // Testa invariant via InvariantTestHelper
    InvariantTestHelper.expectNoInvariantViolation(team, 'addMember', [{
      userId: 'user1',
      role: 'MEMBER'
    }]);
    
    // Verifiera event via AggregateTestHelper
    AggregateTestHelper.expectEventWithData(team, TeamMemberJoinedEvent, {
      teamId: team.id,
      userId: 'user1',
      role: 'MEMBER'
    });
  });
});
``` 
    }]);
    
    // Verifiera event via AggregateTestHelper
    AggregateTestHelper.expectEventWithData(team, TeamMemberJoinedEvent, {
      teamId: team.id,
      userId: 'user1',
      role: 'MEMBER'
    });
  });
});
``` 

Detta bibliotek innehåller en uppsättning testhjälpare för att förenkla testning av DDD-aggregat, invarianter och domänevents i Pling-mobile projektet.

## Hjälpklasser

### `AggregateTestHelper`

Den huvudsakliga hjälpklassen för att testa aggregat. Kombinerar testning av både invarianter och events.

```typescript
import { createAggregateTestHelper } from '@/test-utils';

// Skapa ett aggregat för testning
const aggregateResult = YourAggregate.create({...});
const aggregate = aggregateResult.value;

// Skapa en testhelper för aggregatet
const testHelper = createAggregateTestHelper(aggregate);

// Testa att en invariant valideras korrekt
testHelper.testInvariant('propertyName', invalidValue, 'expected error pattern');

// Kör en operation och förvänta dig specifika events
testHelper.executeAndExpectEvents(
  agg => {
    agg.doSomething();
  },
  [ExpectedEventType],
  events => {
    // Valideringslogik för events
    expect(events[0].payload.someValue).toBe('expectedValue');
  }
);

// Förvänta dig att ett specifikt event har publicerats
testHelper.expectEvent(EventType, {
  // Validera event-attribut
  attributeName: 'expectedValue'
});
```

### `InvariantTestHelper`

En specialiserad hjälpklass för att testa enbart invarianter i aggregat.

```typescript
import { InvariantTestHelper } from '@/test-utils';

// Testa en specifik invariant
InvariantTestHelper.testInvariantViolation(
  aggregate,
  'propertyName',
  invalidValue,
  'expected error pattern'
);

// Testa flera invarianter
InvariantTestHelper.testMultipleInvariants(
  aggregate,
  [
    {
      propertyKey: 'name',
      invalidValue: '',
      expectedErrorPattern: 'måste ha ett namn',
      description: 'Namnvalidering'
    },
    {
      propertyKey: 'ownerId',
      invalidValue: null,
      expectedErrorPattern: 'måste ha en ägare',
      description: 'Ägarkontroll'
    }
  ]
);
```

### Vanliga hjälpfunktioner

Det finns även flera fristående hjälpfunktioner för att testa events:

```typescript
import { validateEvents, validateNoEvents, validateEventAttributes, validateInvariant } from '@/test-utils';

// Validera att specifika events publiceras
validateEvents(
  () => {
    // Utför någon operation på aggregatet
    aggregate.doSomething();
  },
  [ExpectedEventType1, ExpectedEventType2],
  events => {
    // Valideringslogik för events
    validateEventAttributes(events, 0, ExpectedEventType1, {
      // Attributen att validera
      userId: 'expectedUserId'
    });
  }
);

// Validera att inga events publiceras
validateNoEvents(() => {
  // Utför någon operation på aggregatet
  aggregate.readOnlyOperation();
});

// Validera att en invariant kontrolleras
validateInvariant(
  () => {
    // Försök skapa ett aggregat med ogiltiga värden
    return YourAggregate.create({
      name: '' // Ogiltigt namn
    });
  },
  'namn' // Förväntat mönster i felmeddelandet
);
```

## Exempel på användning

Här är ett exempel på hur man kan använda dessa testhjälpare för att testa ett aggregat:

```typescript
import { createAggregateTestHelper } from '@/test-utils';
import { Team } from '../Team';
import { TeamUpdatedEvent } from '../../events/TeamUpdatedEvent';

describe('Team Aggregateroot', () => {
  let team: Team;
  let testHelper: ReturnType<typeof createAggregateTestHelper<Team>>;
  
  beforeEach(() => {
    // Skapa team för testning
    const teamResult = Team.create({
      name: 'Test Team',
      ownerId: 'test-owner-id'
    });
    team = teamResult.value;
    
    // Skapa testHelper
    testHelper = createAggregateTestHelper(team);
  });
  
  describe('Invarianter', () => {
    it('ska validera att teamet måste ha ett namn', () => {
      testHelper.testInvariant('name', null, 'Team måste ha ett namn');
    });
    
    it('ska validera att teamet måste ha en ägare', () => {
      testHelper.testInvariant('ownerId', null, 'Team måste ha en ägare');
    });
  });
  
  describe('Event-publicering', () => {
    it('ska publicera TeamUpdatedEvent vid uppdatering', () => {
      testHelper.executeAndExpectEvents(
        t => {
          t.update({ name: 'Updated Team Name' });
        },
        [TeamUpdatedEvent],
        events => {
          expect(events[0].payload.name).toBe('Updated Team Name');
        }
      );
    });
  });
});
```

## Mockningar

Biblioteket innehåller även flera mockningar för att underlätta testning:

- `mockDomainEvents` - Mockning för att fånga och verifiera domänevents
- `mockOk` och `mockErr` - Mockar för Result-objekt
- Diverse andra mockningar för externa beroenden

## Tips och best practices

1. Skapa alltid en ny instans av AggregateTestHelper i beforeEach för att undvika att events från ett test påverkar ett annat
2. Använd `testHelper.clearEvents()` mellan tester som manipulerar samma aggregat
3. När du testar events med flera steg, var noga med att validera sekvensen av events med `testHelper.expectEventSequence()`
4. Använd `jest.spyOn` för att verifiera att interna metoder som `validateInvariants` anropas i aggregatets metoder 