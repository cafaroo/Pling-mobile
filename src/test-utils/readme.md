# Testhjälpare för DDD-aggregat och domänevents

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