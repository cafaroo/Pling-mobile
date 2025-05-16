# Guide för testning av felhantering i Use Cases

Denna guide beskriver hur man använder de standardiserade testverktygen för att testa felhantering i use cases enligt projektets riktlinjer.

## Innehåll

1. [Översikt](#översikt)
2. [Felhanteringsverktyg](#felhanteringsverktyg)
3. [Testscenarier](#testscenarier)
4. [Praktiska exempel](#praktiska-exempel)
5. [Bästa praxis](#bästa-praxis)

## Översikt

Robust felhantering är en kritisk del av alla use cases i applikationen. För att säkerställa konsekvent felhantering har vi utvecklat standardiserade testhjälpare som gör det enkelt att testa olika felscenarier.

## Felhanteringsverktyg

Följande verktyg finns tillgängliga för att testa felhantering:

### `testUseCaseErrors`

Denna funktion gör det möjligt att testa flera olika felscenarier för ett use case på ett deklarativt sätt. Den hanterar automatiskt mockning och assertions.

```typescript
import { testUseCaseErrors } from '@/test-utils/helpers/useCaseErrorTestHelper';

// Exempel på användning
await testUseCaseErrors(
  {
    databaseError: {
      method: 'save',
      errorMessage: 'DATABASE_ERROR',
      expectedUseCaseError: 'Kunde inte spara entitet'
    }
  },
  mockRepository,
  (input) => useCase.execute(input),
  baseInput
);
```

### `verifyUseCaseErrorEvents`

Denna funktion verifierar att rätt events publiceras eller inte publiceras vid olika felscenarier.

```typescript
import { verifyUseCaseErrorEvents } from '@/test-utils/helpers/useCaseErrorTestHelper';

// Exempel på användning
verifyUseCaseErrorEvents(mockEventBus.publish, {
  onDatabaseError: false,
  onValidationError: false
});
```

## Testscenarier

Följande felscenarier bör testas för alla use cases:

### 1. Databasfel

Testa att use case hanterar fel från repository-lagret korrekt. Exempel:

```typescript
await testUseCaseErrors(
  {
    databaseError: {
      method: 'save',
      errorMessage: 'DATABASE_ERROR',
      expectedUseCaseError: 'Kunde inte spara användaren'
    }
  },
  mockUserRepository,
  (input) => createUserUseCase.execute(input),
  validInput
);
```

### 2. Valideringsfel

Testa att use case hanterar ogiltiga indata korrekt. Exempel:

```typescript
await testUseCaseErrors(
  {
    validationError: {
      invalidInput: 'email',
      invalidValue: 'invalid-email',
      expectedUseCaseError: 'Ogiltig e-postadress'
    }
  },
  mockUserRepository,
  (input) => createUserUseCase.execute(input),
  validInput
);
```

### 3. Not Found-fel

Testa att use case hanterar situation där entiteter inte kan hittas. Exempel:

```typescript
await testUseCaseErrors(
  {
    notFoundError: {
      method: 'findById',
      id: 'user-123',
      expectedUseCaseError: 'Användaren hittades inte'
    }
  },
  mockUserRepository,
  (input) => updateUserUseCase.execute(input),
  validInput
);
```

### 4. Tillståndsfel

Testa att use case hanterar situation där entiteter är i fel tillstånd. Exempel:

```typescript
await testUseCaseErrors(
  {
    stateError: {
      method: 'findById',
      state: { ...mockUser, status: 'inactive' },
      expectedUseCaseError: 'Användaren är inaktiverad'
    }
  },
  mockUserRepository,
  (input) => performUserActionUseCase.execute(input),
  validInput
);
```

### 5. Behörighetsfel

Testa att use case hanterar behörighetsfel korrekt. Exempel:

```typescript
await testUseCaseErrors(
  {
    permissionError: {
      method: 'checkPermission',
      userId: 'user-123',
      expectedUseCaseError: 'Saknar behörighet'
    }
  },
  mockPermissionService,
  (input) => deleteResourceUseCase.execute(input),
  validInput
);
```

### 6. Kastade undantag

Testa att use case hanterar oväntade fel korrekt. Exempel:

```typescript
await testUseCaseErrors(
  {
    thrownError: {
      method: 'findById',
      error: new Error('Unexpected database error'),
      expectedUseCaseError: 'Ett oväntat fel inträffade'
    }
  },
  mockUserRepository,
  (input) => updateUserUseCase.execute(input),
  validInput
);
```

## Praktiska exempel

Se `src/application/team/useCases/__tests__/UpdateTeamUseCase.error-handling.test.ts` för ett komplett exempel på hur man använder dessa testverktyg i praktiken.

## Bästa praxis

1. **Testa alla use cases** - Varje use case bör ha dedikerade tester för felhantering
2. **Återanvänd bas-indata** - Använd samma bas-indata för alla felscenarier för att göra tester mer koncisa
3. **Kontrollera event-publicering** - Verifiera alltid om events ska publiceras eller inte vid fel
4. **Standardisera felmeddelanden** - Använd samma felmeddelanden för samma typ av fel i hela applikationen
5. **Testa edge cases** - Tänk på gränssituationer som null-värden, tomma strängar eller ogiltig indata
6. **Testa alla felvägar** - Säkerställ att alla möjliga felvägar i use case testas
7. **Verifiera felmeddelanden** - Kontrollera att felmeddelanden är informativa och användbara 