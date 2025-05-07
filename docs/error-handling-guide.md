# Guide till förbättrad felhantering i tester

Detta dokument beskriver hur du kan använda verktyg från `src/test-utils/error-helpers.ts` för att förbättra felhantering och felrapportering i dina tester.

## Innehåll

1. [Översikt](#översikt)
2. [Testa asynkrona fel](#testa-asynkrona-fel)
3. [Testa Result-objekt](#testa-result-objekt)
4. [Tidsbaserade tester](#tidsbaserade-tester)
5. [Testa strukturer](#testa-strukturer)
6. [Testa domänhändelser](#testa-domänhändelser)
7. [Best practices](#best-practices)

## Översikt

Testhjälparna i `error-helpers.ts` gör det enklare att skriva robusta tester med tydliga felmeddelanden. Fördelarna inkluderar:

- Mer deskriptiva felmeddelanden när tester misslyckas
- Typningar som hjälper dig att skriva korrekta tester
- Konsistenta mönster för vanliga testfall
- Förbättrad testläsbarhet

## Testa asynkrona fel

För att testa att en asynkron funktion kastar fel, använd `testAsyncError`:

```typescript
import { testAsyncError } from '@/test-utils/error-helpers';

it('kastar fel vid ogiltiga indata', async () => {
  const functionThatShouldThrow = async () => {
    await createUser({ name: '' });
  };

  await testAsyncError(
    functionThatShouldThrow,
    'Ogiltigt namn', // Matchar felmeddelandet
    'createUser' // Valfri kontext för bättre felmeddelanden
  );
});
```

Du kan också använda regular expressions för att matcha felmeddelanden:

```typescript
await testAsyncError(
  functionThatShouldThrow,
  /Ogiltigt (namn|lösenord)/,
  'validering'
);
```

## Testa Result-objekt

För att testa Result-objekt (från `@/shared/core/Result`), använd `expectResultOk` och `expectResultErr`:

```typescript
import { expectResultOk, expectResultErr } from '@/test-utils/error-helpers';

// Testa att ett Result är ok och få värdet
it('returnerar korrekt värde vid framgång', () => {
  const result = userService.createUser(validInput);
  
  // Automatisk assertion + typning av unwrapped värde
  const user = expectResultOk(result, 'createUser');
  expect(user.id).toBeDefined();
});

// Testa att ett Result är err och få felet
it('returnerar fel vid ogiltiga indata', () => {
  const result = userService.createUser(invalidInput);
  
  // Automatisk assertion + typning av felet
  const error = expectResultErr(result, undefined, 'createUser');
  expect(error).toBe('VALIDATION_ERROR');
  
  // Du kan också verifiera ett specifikt fel
  expectResultErr(result, 'VALIDATION_ERROR', 'createUser');
});
```

## Tidsbaserade tester

För att testa prestanda eller tidsfördröjningar, använd `expectTimeConstraint`:

```typescript
import { expectTimeConstraint } from '@/test-utils/error-helpers';

it('avslutas inom rimlig tid', async () => {
  await expectTimeConstraint(
    () => userService.fetchProfile(userId),
    {
      maxTime: 100,  // Max 100ms
      context: 'profilhämtning'
    }
  );
});

it('upprätthåller cachingfördröjning', async () => {
  await expectTimeConstraint(
    () => cachingLayer.retrieveData(key),
    {
      minTime: 50,   // Minst 50ms (t.ex. för att verifiera throttling)
      maxTime: 200,  // Max 200ms
      context: 'caching'
    }
  );
});
```

## Testa strukturer

För att testa innehåll i arrayer och objekt med bättre felmeddelanden:

```typescript
import { expectArrayContains, expectObjectFields } from '@/test-utils/error-helpers';

it('innehåller förväntade användare', () => {
  const users = userService.getAll();
  
  // Kontrollera att minst en användare matchar kriterierna
  expectArrayContains(
    users,
    { role: 'admin' },
    'användarlistning'
  );
  
  // Använda en matchningsfunktion
  expectArrayContains(
    users,
    user => user.createdAt > yesterday,
    'nya användare'
  );
});

it('har alla obligatoriska fält', () => {
  const profile = userService.getProfile(userId);
  
  // Kontrollera att objektet har alla förväntade fält
  expectObjectFields(
    profile,
    ['id', 'name', 'email', 'settings'],
    'användarprofil'
  );
});
```

## Testa domänhändelser

För att testa att domänhändelser publiceras korrekt, använd `expectEventPublished`:

```typescript
import { expectEventPublished } from '@/test-utils/error-helpers';
import { UserCreated, UserUpdated } from '@/domain/user/events';

it('publicerar rätt händelser', async () => {
  // Förutsätter att du har ett sätt att samla händelser
  const mockEventBus = new MockEventBus();
  const userService = new UserService({ eventBus: mockEventBus });
  
  await userService.createUser(userData);
  
  // Kontrollera att händelsen har publicerats
  expectEventPublished(
    mockEventBus.getEvents(),
    UserCreated,
    { userId: expect.any(String) },
    'användarskapande'
  );
});
```

## Best practices

1. **Ge alltid en kontext**: Använd kontextparametern för att beskriva var testet körs för tydligare felmeddelanden.

2. **Föredra helper-funktioner framför direkta assertions**:

   Istället för:
   ```typescript
   expect(result.isOk()).toBe(true);
   ```

   Använd:
   ```typescript
   expectResultOk(result, 'operation');
   ```

3. **Kombinera hjälpare för komplex testning**:

   ```typescript
   it('hanterar användarskapande korrekt', async () => {
     const result = await userService.createUser(validUserData);
     
     const user = expectResultOk(result, 'createUser');
     expectObjectFields(user, ['id', 'name', 'email'], 'användarobjekt');
     
     expectEventPublished(
       eventBus.getEvents(),
       UserCreated,
       { userId: user.id },
       'händelse'
     );
   });
   ```

4. **Använd för enhetstester och integrationstester**: Hjälparna är användbara i alla typer av tester för att förbättra läsbarhet och felrapportering.

5. **Inkludera testfiler i Pull Requests**: När du skapar nya funktioner, inkludera alltid tester som använder dessa hjälpare för att säkerställa robust felhantering. 