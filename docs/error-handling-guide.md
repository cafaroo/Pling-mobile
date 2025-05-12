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
8. [Vanliga feltyper och lösningar](#vanliga-feltyper-och-lösningar)

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

## Vanliga feltyper och lösningar

### Supabase Authentication Error

#### Multiple GoTrueClient instances

```
Multiple GoTrueClient instances detected in the same browser context.
```

**Orsak:** Det finns flera instanser av Supabase-klienten som skapats genom anrop till createClient.

**Lösning:**
1. Konsolidera all Supabase-klientinitiering till en central plats (src/lib/supabase.ts)
2. Importera supabase-klienten från denna plats i all kod som behöver den
3. Använd aldrig createClient direkt i komponentkod

```typescript
// Korrekt:
import { supabase } from '@/lib/supabase';

// INTE korrekt:
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(url, key);
```

#### Row Level Security Violation

```
new row violates row-level security policy for table "profiles"
```

**Orsak:** Databasen har RLS (Row Level Security) aktiverat, men saknar lämpliga policyer för att tillåta operationen.

**Lösning:**
1. Identifiera vilken operation som orsakar felet (INSERT, UPDATE, SELECT, etc.)
2. Skapa lämpliga RLS-policyer via SQL-migrationsfiler:

```sql
-- För att tillåta infogning (INSERT)
CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- För administratörsåtkomst
CREATE POLICY "Service role can do all" 
  ON profiles
  TO service_role
  USING (true)
  WITH CHECK (true);
```

3. Kör migrationen i Supabase-projektet
4. Testa noggrant för att bekräfta att felet är åtgärdat
5. Uppdatera dokumentationen med nya RLS-policyer

### React Native Style Warnings

```
style.resizeMode is deprecated. Please use props.resizeMode
```

**Orsak:** Användande av äldre stilprops som nu är ersatta med nya attribut.

**Lösning:** Uppdatera komponenten att använda rekommenderade attribut:

```tsx
// Innan:
<Image style={{ resizeMode: 'contain' }} ... />

// Efter:
<Image resizeMode="contain" ... />
```

## Felhantering i Edge Functions

För att förbättra felhanteringen i Edge Functions har vi infört en omfattande felhanteringsarkitektur med tre huvudsakliga moduler: 

### Huvudmoduler

1. **error-handler.ts**

   Denna modul tillhandahåller grundläggande verktyg för felhantering:

   ```typescript
   import { WebhookError, createErrorResponse, logError, withRetry } from '../common/error-handler.ts';

   // Använd specialiserade felklasser
   throw new WebhookError('Ogiltig signatur', 400);

   // Skapa standardiserade felresponser
   return createErrorResponse(error, 500, ErrorCode.INTERNAL_SERVER_ERROR);

   // Logga strukturerad felinformation
   logError(error, { operation: 'webhook', context: 'subscription-create' });

   // Utför automatiska återförsök
   const result = await withRetry(async () => {
     return await riskyOperation();
   }, 3, 1000);
   ```

2. **db-helper.ts**

   För säkra databasoperationer:

   ```typescript
   import { safeDbOperation, getSubscriptionByStripeId } from '../common/db-helper.ts';

   // Säker databasoperation med felhantering
   const result = await safeDbOperation(
     async (client) => {
       return await client.from('table').select('*').eq('id', id);
     },
     'Kunde inte hämta data',
     true // Använd service role
   );
   ```

3. **stripe-helper.ts**

   För Stripe API-anrop:

   ```typescript
   import { verifyStripeWebhookSignature, getSubscriptionFromStripe } from '../common/stripe-helper.ts';

   // Verifiera webhook-signatur
   const event = verifyStripeWebhookSignature(body, signature);

   // Hämta Stripe-prenumeration med automatiska återförsök
   const subscription = await getSubscriptionFromStripe(subscriptionId);
   ```

### Användning och implementation

1. **Strukturerad felhantering**

   ```typescript
   try {
     // Utför operation
   } catch (error) {
     // Logga strukturerat fel
     logError(error, { context: 'operationName' });
     
     // Skapa lämplig felrespons
     return createErrorResponse(
       error,
       error instanceof WebhookError ? error.statusCode : 500,
       ErrorCode.OPERATION_FAILED
     );
   }
   ```

2. **Operationsspårning**

   ```typescript
   await withErrorTracking(
     'Handle webhook event',
     async () => {
       // Kod som ska övervakas och tidsmätas
     }
   );
   ```

3. **Automatiska återförsök**

   ```typescript
   await withRetry(
     async () => {
       // Nätverksanrop eller annan operation som kan misslyckas tillfälligt
     },
     3, // Max antal försök
     1000 // Basförsening i ms (kommer att öka exponentiellt)
   );
   ```

### Fördelar

1. **Ökad robusthet**: Systemet kan återhämta sig från tillfälliga fel
2. **Tydligare felmeddelanden**: Standardiserad felstruktur förenklar felsökning
3. **Prestandaövervakning**: Inbyggd tidsmätning och spårning
4. **Säkrare databasåtkomst**: Förhindrar oväntat databeteende
5. **Förbättrad utvecklingsupplevelse**: Minskad kodduplicering genom återanvändbara felhanteringsmönster

Den nya felhanteringsarkitekturen rekommenderas för alla Edge Functions och serverless-funktioner för att säkerställa konsekvent och robust felhantering. 