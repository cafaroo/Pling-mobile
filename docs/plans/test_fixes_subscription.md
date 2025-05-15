# Testfixar för Subscription-domänen

## Upptäckta problem

När vi försökte köra testerna för subscription-domänen stötte vi på flera problem:

### 1. Result-klassen saknas i testerna

Många tester använder `Result.ok()` och `Result.fail()` men kan inte hitta dessa metoder. 
Det beror på att Result-klassen inte är tillgänglig. Troligen behöver denna importeras eller mockas.

```typescript
TypeError: Cannot read properties of undefined (reading 'ok')
```

### 2. Syntaxfel i TeamStatistics.ts

Filen `domain/team/value-objects/TeamStatistics.ts` har ett syntaxfel med en icke-avslutad template-sträng på rad 496:

```typescript
return err(`
                  ^
```

Detta orsakar att många tester som beror på TeamStatistics-filen inte kan kompileras.

### 3. Problem med JSX i Context Provider

Det verkar som att Babel-parsern har problem med JSX-syntaxen i SubscriptionContextProvider:

```typescript
<SubscriptionContext.Provider value={value}>
                        ^
```

### 4. DOM-miljö saknas

Vissa tester försöker använda JSDOM men miljön är inte konfigurerad korrekt:

```
The error below may be caused by using the wrong test environment, see https://jestjs.io/docs/configuration#testenvironment-string.
Consider using the "jsdom" test environment.

ReferenceError: document is not defined
```

### 5. Saknade mockar

Vissa mockar saknas, exempelvis för `react-native-toast-message`:

```
Could not locate module react-native-toast-message mapped as:
C:\Users\cafar\Documents\Pling\new\Pling-mobile\__mocks__\react-native-toast-message.js
```

## Förslag på åtgärder

För att åtgärda dessa problem, rekommenderar vi följande:

### 1. Fixa Result-importen

Lägg till en explicit import av Result-klassen i alla testfiler som använder den:

```typescript
import { Result } from '@/shared/core/Result';
```

Alternativt, skapa en mock för Result i testmiljön:

```typescript
jest.mock('@/shared/core/Result', () => ({
  Result: {
    ok: (value) => ({ isSuccess: () => true, getValue: () => value }),
    fail: (error) => ({ isFailure: () => true, getError: () => error })
  }
}));
```

### 2. Fixa TeamStatistics.ts

Hitta och åtgärda den icke-avslutade template-strängen i `domain/team/value-objects/TeamStatistics.ts`. 
På rad 496 behöver template-strängen avslutas korrekt:

```typescript
// Från:
return err(`

// Till:
return err(`Ett fel uppstod: ${error}`);
```

### 3. Fixa JSX i Context Provider

Se över JSX-syntaxen i SubscriptionContextProvider och se till att Babel är konfigurerat korrekt för att hantera JSX.

### 4. Konfigurera JSDOM

Uppdatera Jest-konfigurationen för att använda JSDOM-miljön när det behövs:

```javascript
// I jest.config.js
module.exports = {
  // ...
  testEnvironment: 'jsdom',
  // ...
};
```

### 5. Lägg till saknade mockar

Skapa mock-filer för de externa beroenden som saknas:

```javascript
// __mocks__/react-native-toast-message.js
export const toast = {
  show: jest.fn(),
  hide: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
};
```

## Prioriterad ordning för fixar

1. Fixa syntaxfelet i TeamStatistics.ts eftersom detta påverkar många tester
2. Skapa en gemensam mock för Result-klassen
3. Konfigurera JSDOM-miljön korrekt
4. Lägg till saknade mockar för externa beroenden
5. Fixa JSX-syntax för Context Providers

När dessa problem är åtgärdade bör vi kunna köra testerna för subscription-domänen utan fel.

## Teststruktur för Subscription-domänen

För att följa projektets konventioner bör vi strukturera testerna för subscription-domänen på följande sätt:

```
src/
  application/
    subscription/
      hooks/
        __tests__/
          useSubscriptionStandardized.test.tsx  // Testar standardiserade hooks
          useSubscriptionContext.test.tsx       // Testar context provider
      services/
        __tests__/
          SubscriptionService.test.ts           // Testar tjänster
  domain/
    subscription/
      entities/
        __tests__/
          Subscription.test.ts                  // Testar domänentiteter
      value-objects/
        __tests__/
          SubscriptionTypes.test.ts             // Testar värde-objekt
      services/
        __tests__/
          DefaultFeatureFlagService.test.ts     // Testar domäntjänster
          DefaultSubscriptionService.test.ts
          UsageTrackingService.test.ts
  infrastructure/
    supabase/
      repositories/
        subscription/
          __tests__/
            SupabaseSubscriptionRepository.test.ts  // Testar repository-implementationer
```

## Nästa steg

Efter att dessa problem är åtgärdade bör vi utöka testningen med:

1. Tester för domänentiteterna (Subscription)
2. Tester för värde-objekten (SubscriptionTypes, SubscriptionPeriod)
3. Tester för domäntjänsterna (DefaultSubscriptionService, DefaultFeatureFlagService, UsageTrackingService)
4. Tester för repository-implementationen (SupabaseSubscriptionRepository)

Dessa tester bör fokusera på att validera korrekt affärslogik, felhantering och integration med övriga delar av systemet. 