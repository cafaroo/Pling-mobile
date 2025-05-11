# Guide för testning med Result-objekt

Detta dokument beskriver best practices för att testa kod som använder Result-objekt i Pling-applikationen.

## Problem med Result-API

I kodbasen finns det för närvarande inkonsekvenser i hur Result-objekt används:

1. **Status-kontroll**:
   - Vissa delar använder `.isOk()`/`.isErr()`
   - Andra delar använder `.isSuccess()`/`.isFailure()`

2. **Värdeåtkomst**:
   - Vissa delar använder direkta egenskaper `.value`/`.error`
   - Andra delar använder metodanrop `.getValue()`/`.getError()`
   - Vissa delar använder `.unwrap()` eller `.unwrapOr()`

## Rekommenderad standardisering

För att uppnå konsekvens över hela kodbasen, rekommenderar vi följande standard:

1. **För statuskontroll**: Använd `.isOk()`/`.isErr()`
2. **För värdeåtkomst**: Använd direkta egenskaper `.value`/`.error`
3. **För felhantering**: Använd explicit felhantering med `.isErr() ? defaultValue : result.value` istället för `.unwrapOr()`

## Best practices för testning

### 1. För verkliga Result-objekt

När man testar faktiska Result-objekt (inte mockade), använd följande mönster:

```typescript
// Skapa ett result-objekt
const result = someFunction();

// Kontrollera status
expect(result.isOk()).toBe(true); // eller expect(result.isErr()).toBe(true);

// Om resultatet är ok, kontrollera värdet
if (result.isOk()) {
  const value = result.value;
  expect(value).toHaveProperty('someProperty');
}

// Om resultatet är ett fel, kontrollera felmeddelandet
if (result.isErr()) {
  expect(result.error).toContain('förväntat felmeddelande');
}
```

### 2. För mockade Result-objekt

När man testar kod som använder mockade Result-objekt (som i TeamCache-testerna), använd följande mönster:

#### Option 1: Undvik Result-API helt

```typescript
// Skapa mockad entitet utan att använda Result
const goal = {
  id: new UniqueId(),
  // ...andra egenskaper
} as TeamGoal;

// Testa direkt med entiteten
teamCache.updateGoalOptimistically(teamId, goal);
```

#### Option 2: Mocka Result-objekt

```typescript
// Skapa mockad entitet
const goal = {
  id: new UniqueId(),
  // ...andra egenskaper
} as TeamGoal;

// Mocka TeamGoal.create för att returnera ett objekt som liknar ett Result
(TeamGoal.create as jest.Mock).mockReturnValue({
  value: goal,
  isOk: () => true,
  isErr: () => false
});

// Kontrollera att Result.isOk() är true
const result = TeamGoal.create({});
expect(result.isOk()).toBe(true);

// Använd värdet
const value = result.value;
```

### 3. När man mockar domänentiteter med create-metoder

När du testar kod som använder `Entity.create()`-metoder, följ detta mönster:

```typescript
// I setup-delen av testet
jest.mock('@/domain/team/entities/TeamGoal', () => ({
  TeamGoal: {
    create: jest.fn().mockImplementation((props) => ({
      value: {
        id: props.id || new UniqueId(),
        // ...andra egenskaper baserat på props
        equals: jest.fn().mockImplementation((other) => other.id === props.id)
      },
      isOk: () => true,
      isErr: () => false
    }))
  }
}));

// I testet
it('ska skapa ett mål', () => {
  const result = TeamGoal.create({ title: 'Test mål' });
  expect(result.isOk()).toBe(true);
  expect(result.value.title).toBe('Test mål');
});
```

## Vanliga fallgropar att undvika

1. **Blanda API-stilar**: Undvik att använda `.isSuccess()` i en del av koden och `.isOk()` i en annan.

2. **Direkt åtkomst utan kontroll**: Undvik att komma åt `.value` utan att först kontrollera `.isOk()`:
   ```typescript
   // DÅLIGT
   const value = result.value; // Kan kasta fel om result är err
   
   // BRA
   if (result.isOk()) {
     const value = result.value;
     // använd value
   }
   ```

3. **Använda `.unwrap()` i tester**: Undvik att använda `.unwrap()` i tester eftersom det kan orsaka testfel om resultatet är ett felresultat:
   ```typescript
   // DÅLIGT
   const value = result.unwrap(); // Kastar fel om result är err
   
   // BRA
   expect(result.isOk()).toBe(true);
   const value = result.value;
   ```

4. **Ignorera felfall i test**: Testa alltid både success- och felfall för funktioner som returnerar Result:
   ```typescript
   it('ska returnera ok vid framgång', () => {
     // Mocka lyckad operation
     const result = someFunction();
     expect(result.isOk()).toBe(true);
   });
   
   it('ska returnera err vid fel', () => {
     // Mocka misslyckad operation
     const result = someFunction();
     expect(result.isErr()).toBe(true);
     expect(result.error).toContain('förväntat felmeddelande');
   });
   ```

## Integrering med jest.mock

När du använder `jest.mock` för att mocka Result-objekt, kom ihåg att:

1. Mocka hela Result-objektet: 
   ```typescript
   jest.mock('@/shared/core/Result', () => ({
     ok: jest.fn().mockImplementation((value) => ({
       value,
       error: null,
       isOk: () => true,
       isErr: () => false
     })),
     err: jest.fn().mockImplementation((error) => ({
       value: undefined,
       error,
       isOk: () => false,
       isErr: () => true
     }))
   }));
   ```

2. För specifika entiteter:
   ```typescript
   jest.mock('@/domain/team/entities/TeamGoal', () => ({
     TeamGoal: {
       create: jest.fn().mockImplementation((props) => ({
         value: { ...props },
         isOk: () => true,
         isErr: () => false
       }))
     }
   }));
   ```

## Exempel från projektet

### TeamCache.test.ts

```typescript
// Skapa en mockad Goal
const goal = {
  id: new UniqueId(),
  teamId: new UniqueId(teamId),
  title: 'Test mål',
  // ...andra egenskaper
} as TeamGoal;

// Mocka TeamGoal.create för att returnera ett objekt som efterliknar ett Result
(TeamGoal.create as jest.Mock).mockReturnValue({
  value: goal,
  isOk: () => true
});

teamCache.updateGoalOptimistically(teamId, goal);
```

### TeamStatistics.test.ts

```typescript
const result = TeamStatistics.create({
  teamId,
  period: StatisticsPeriod.WEEKLY,
  // ...andra egenskaper
});

expect(result.isOk()).toBe(true);
const stats = result.value;
expect(stats.teamId.equals(teamId)).toBe(true);
expect(stats.period).toBe(StatisticsPeriod.WEEKLY);
```

### SupabaseTeamStatisticsRepository.test.ts

```typescript
const result = await repository.getStatistics(teamId, StatisticsPeriod.WEEKLY);

// Kontrollera Result-objektet direkt
expect(result.error).toBeNull();
expect(result.value).toBeTruthy();

// Kontrollera egenskaper på värdet
const stats = result.value;
expect(stats.teamId.equals(teamId)).toBe(true);
```

## Slutsats

Att konsekvent följa dessa riktlinjer kommer att göra testningen mer robust och mindre känslig för ändringar i Result-API:et. Det kommer också att göra det lättare att förstå och underhålla testerna över tid. 