# Guide för mockning i team-domänen

## Introduktion

Detta dokument beskriver hur man använder mockar i tester för team-domänen. Det innehåller standard-mockar, tips för att skapa nya mockar och exempel på hur man hanterar beroenden i tester.

## Tillgängliga mockar

### TeamSettings

En robust mock för TeamSettings-objektet finns i `src/domain/team/entities/__mocks__/TeamSettings.ts`. Denna mock implementerar alla nödvändiga metoder som används i Team-entiteten och andra delar av applikationen.

```typescript
// Importera mocken direkt
import { TeamSettings, mockTeamSettings } from '@/domain/team/entities/__mocks__/TeamSettings';

// Exempel på användning
describe('Team', () => {
  beforeEach(() => {
    jest.mock('@/domain/team/entities/TeamSettings', () => {
      return {
        TeamSettings: {
          create: jest.fn().mockImplementation((props) => {
            // Använd den befintliga mocken för att skapa en korrekt instans
            return TeamSettings.create(props);
          })
        }
      };
    });
  });
});
```

Du kan även använda den fördefinierade instansen:

```typescript
import { mockTeamSettings } from '@/domain/team/entities/__mocks__/TeamSettings';

// Testa med den fördefinierade instansen
const team = {
  // ... andra team-egenskaper
  settings: mockTeamSettings
};
```

### Anpassning av TeamSettings-mock

Om du behöver anpassa TeamSettings för ett specifikt testfall:

```typescript
import { TeamSettings } from '@/domain/team/entities/__mocks__/TeamSettings';

// Skapa en anpassad instans med specifika värden
const customSettings = TeamSettings.create({
  isPrivate: false,
  maxMembers: 100,
  notificationSettings: {
    newMembers: false,
    memberLeft: true,
    roleChanges: false,
    activityUpdates: true
  }
}).value;
```

## Result-hantering i tester

För att hantera Result-objekt i tester rekommenderar vi att använda följande mönster:

1. **Kontrollera status med isOk/isErr**
   ```typescript
   const result = someFunction();
   expect(result.isOk()).toBe(true);
   ```

2. **Använd direkta egenskaper för att få värden**
   ```typescript
   const result = someFunction();
   expect(result.isOk()).toBe(true);
   const value = result.value;
   ```

3. **Hantera fel explicit**
   ```typescript
   const result = someFunction();
   if (result.isErr()) {
     // Hantera fel
     console.error(result.error);
     return;
   }
   
   // Använd värdet
   const value = result.value;
   ```

4. **Undvik att använda olika stilar i samma testfil**
   - Använd `.isOk()/.isErr()` konsekvent istället för `.isSuccess()/.isFailure()`
   - Använd `.value/.error` konsekvent istället för `.getValue()/.getError()`
   - Undvik `.unwrap()` eller `.unwrapOr()` och använd explicit felhantering istället

## Standardiserad Result-mock

För konsekvent testning av Result-objekt, använd följande standardiserade mock-implementering:

```typescript
// Placera i src/test-utils/mocks/ResultMock.ts
export const mockResult = {
  ok: (value) => ({
    isOk: () => true,
    isErr: () => false,
    value,
    error: null,
    // Bakåtkompatibilitet
    getValue: () => value,
    getError: () => { throw new Error('Cannot get error from OK result'); },
    unwrap: () => value,
    unwrapOr: (defaultValue) => value,
    // Kedjeoperationer
    map: (fn) => mockResult.ok(fn(value)),
    mapErr: () => mockResult.ok(value),
    andThen: (fn) => fn(value)
  }),
  
  err: (error) => ({
    isOk: () => false,
    isErr: () => true,
    value: null,
    error,
    // Bakåtkompatibilitet
    getValue: () => { throw new Error(typeof error === 'string' ? error : 'Error'); },
    getError: () => error,
    unwrap: () => { throw new Error(typeof error === 'string' ? error : 'Error'); },
    unwrapOr: (defaultValue) => defaultValue,
    // Kedjeoperationer
    map: () => mockResult.err(error),
    mapErr: (fn) => mockResult.err(fn(error)),
    andThen: () => mockResult.err(error)
  })
};
```

### Exempel på användning av Result-mock

```typescript
import { mockResult } from '@/test-utils/mocks/ResultMock';

// Mock av ett repository som returnerar Result-objekt
const mockTeamRepository = {
  findById: jest.fn().mockImplementation((id) => {
    if (id === 'valid-id') {
      return Promise.resolve(mockResult.ok({
        id: 'valid-id',
        name: 'Test Team',
        // ... övriga team-egenskaper
      }));
    }
    return Promise.resolve(mockResult.err('Team not found'));
  }),
  
  save: jest.fn().mockImplementation((team) => {
    return Promise.resolve(mockResult.ok(undefined));
  })
};

// Användning i tester
describe('TeamService', () => {
  it('ska hämta team med giltigt ID', async () => {
    const result = await mockTeamRepository.findById('valid-id');
    
    expect(result.isOk()).toBe(true);
    expect(result.value.id).toBe('valid-id');
    expect(result.value.name).toBe('Test Team');
  });
  
  it('ska hantera ogiltigt ID', async () => {
    const result = await mockTeamRepository.findById('invalid-id');
    
    expect(result.isErr()).toBe(true);
    expect(result.error).toBe('Team not found');
  });
});
```

### Mockning av Result i jest.mock

När du behöver mocka hela Result-modulen:

```typescript
jest.mock('@/shared/core/Result', () => {
  const originalModule = jest.requireActual('@/shared/core/Result');
  return {
    ...originalModule,
    ok: jest.fn().mockImplementation(value => ({
      isOk: () => true,
      isErr: () => false,
      value,
      error: null,
      // Bakåtkompatibilitet men rekommenderas inte att använda
      getValue: () => value,
      getError: () => { throw new Error('Cannot get error from OK result'); },
      unwrap: () => value
    })),
    err: jest.fn().mockImplementation(error => ({
      isOk: () => false,
      isErr: () => true,
      value: null,
      error,
      // Bakåtkompatibilitet men rekommenderas inte att använda
      getValue: () => { throw new Error('Cannot get value from Error result'); },
      getError: () => error,
      unwrap: () => { throw new Error('Cannot unwrap Error result'); }
    }))
  };
});
```

## ESLint-verktyg för Result-API

För att hjälpa utvecklare att använda den standardiserade Result-API:n, har vi skapat en ESLint-regel som automatiskt varnar för användning av de äldre metoderna.

### Installation och användning

ESLint-regeln är redan konfigurerad i projektet. Du kan köra den med:

```bash
npm run lint:result-api
```

### Vad regeln kontrollerar

Regeln flaggar följande Problem:

1. Användning av `.getValue()` - använd `.value` istället
2. Användning av `.getError()` - använd `.error` istället
3. Användning av `.unwrap()` - kontrollera först med `.isOk()` och använd sedan `.value`
4. Användning av `.unwrapOr()` - använd explicit felhantering med `result.isOk() ? result.value : defaultValue`

### Exempel på korrigering

```typescript
// Flaggas av ESLint
const value = result.getValue();

// Korrekt användning
if (result.isOk()) {
  const value = result.value;
  // Använd value...
}
```

### Automatisk korrigering

Vissa problem kan korrigeras automatiskt. Kör:

```bash
npm run lint:result-api -- --fix
```

Detta kommer att automatiskt ersätta:
- `.getValue()` med `.value`
- `.getError()` med `.error`

För `.unwrap()` och `.unwrapOr()` kommer du att få en varning som du behöver åtgärda manuellt, eftersom dessa kräver omstrukturering av koden.

## Hjälpverktyg för testning

Om du fixar många tester, finns det hjälpfunktioner i ResultMock:

```typescript
import { expectOk, expectErr } from '@/test-utils/mocks/ResultMock';

// Istället för att alltid kontrollera isOk/isErr och sedan hämta värdet
it('ska returnera korrekt värde', () => {
  const result = someFunction();
  const value = expectOk(result, 'Funktionen misslyckades oväntat');
  expect(value).toBe(expectedValue);
});

// För att testa fel
it('ska returnera ett fel', () => {
  const result = someFunction();
  const error = expectErr(result, 'Funktionen lyckades oväntat');
  expect(error).toBe(expectedError);
});
```

Dessa hjälpfunktioner gör testerna mer robusta och tydliggör intentionen.

## Typade Result-hjälpfunktioner

För att förbättra typinferering i tester, använd de typade hjälpfunktionerna:

```typescript
import { mockOkResult, mockErrResult } from '@/test-utils/mocks/ResultMock';

// Typat OK-resultat
const userResult = mockOkResult<User>({ id: '1', name: 'Test' });
mockRepository.findById.mockResolvedValue(userResult);

// Typat Error-resultat
const userError = mockErrResult<User, string>('Användaren hittades inte');
mockRepository.findById.mockResolvedValueOnce(userError);
```

Detta ger bättre typstöd och mer korrekta tester.

## Mockning av AggregateRoot-metoder

När du testar domänentiteter som ärver från AggregateRoot, tänk på följande:

1. **Använd clearEvents istället för clearDomainEvents**
   ```typescript
   // KORREKT
   team.clearEvents();
   
   // FELAKTIGT - finns inte i AggregateRoot
   team.clearDomainEvents();
   ```

2. **Kontrollera domänhändelser korrekt**
   ```typescript
   // Lägg till en medlem för att generera en händelse
   team.addMember(member);
   
   // Kontrollera att händelsen har lagts till
   expect(team.domainEvents.length).toBe(1);
   expect(team.domainEvents[0].name).toBe('MemberJoined');
   ```

## Rekommenderad mocka-metodik

För att skapa robusta mockar, följ dessa riktlinjer:

1. **Implementera alla nödvändiga metoder**
   - Säkerställ att mocken har alla metoder som används i produktionskoden
   - Lägg särskild vikt vid metoder som `toJSON()`, `equals()` och andra ofta använda metoder

2. **Använd samma returtyp som originalet**
   - Om originalet returnerar ett Result-objekt, ska mocken också göra det
   - Om originalet returnerar ett specifikt domänobjekt, ska mocken också göra det

3. **Placera mockar på lämpliga platser**
   - Domänobjekt-mockar: `src/domain/team/entities/__mocks__/` eller `src/domain/team/value-objects/__mocks__/`
   - Infrastrukturobjekt-mockar: `src/infrastructure/__mocks__/`
   - Applikationslager-mockar: `src/application/team/__mocks__/`

4. **Dokumentera dina mockar**
   - Lägg till JSDoc-kommentarer för att förklara hur mocken ska användas
   - Inkludera exempel på användning
   - Förklara eventuella begränsningar eller förutsättningar

Genom att följa dessa riktlinjer kommer dina tester att bli mer robusta, lättare att underhålla och mindre benägna att bryta när API:er ändras. 