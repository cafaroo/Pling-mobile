# Migration till nytt Result-API

Detta dokument beskriver hur du uppdaterar tester för att använda det nya Result-API:et i vår kodstruktur.

## Ändringar i Result-API

Vi har gjort följande förändringar i Result-API:et:

| Gammalt API          | Nytt API       |
|----------------------|----------------|
| `isSuccess`          | `isOk()`       |
| `isFailure`          | `isErr()`      |
| `getValue()`         | `value`        |
| `getErrorValue()`    | `error`        |
| `Result.success(x)`  | `Result.ok(x)` |
| `Result.failure(e)`  | `Result.err(e)`|

## Hjälpfunktioner för testmigration

För att underlätta migrationen har vi skapat hjälpfunktioner i `src/test-utils/resultTestHelper.ts`:

```typescript
// För att göra en Result-instans kompatibel med både gamla och nya API:et
import { makeResultCompatible } from '@/test-utils';

// Användning
const result = someFunction();
const compatibleResult = makeResultCompatible(result);

// Kan nu använda både nya och gamla API:et
if (compatibleResult.isSuccess) { // Gammalt API
  const value = compatibleResult.getValue();
}

if (compatibleResult.isOk()) { // Nytt API
  const value = compatibleResult.value;
}
```

För mockningar kan du använda `OldResult`:

```typescript
import { OldResult } from '@/test-utils';

// I dina mockar
jest.mock('../repository', () => ({
  findById: jest.fn().mockResolvedValue(OldResult.ok({ id: '123' })),
  create: jest.fn().mockResolvedValue(OldResult.err('Ett fel uppstod'))
}));
```

## Bästa praxis för att uppdatera tester

### Metod 1: Direkt uppdatering (rekommenderas för nya tester)

Uppdatera testerna att använda det nya API:et direkt:

```typescript
// INNAN
const result = SomeValueObject.create(data);
expect(result.isSuccess).toBe(true);
if (result.isSuccess) {
  const obj = result.getValue();
  // ...
}

// EFTER
const result = SomeValueObject.create(data);
expect(result.isOk()).toBe(true);
if (result.isOk()) {
  const obj = result.value;
  // ...
}
```

### Metod 2: Använd kompabilitetsfunktionen (för snabba fixar)

Använd `makeResultCompatible` för att fortsätta använda det gamla API:et tillfälligt:

```typescript
import { makeResultCompatible } from '@/test-utils';

const rawResult = SomeValueObject.create(data);
const result = makeResultCompatible(rawResult);

// Gamla API:et fortsätter fungera
expect(result.isSuccess).toBe(true); 
if (result.isSuccess) {
  const obj = result.getValue();
  // ...
}
```

### Metod 3: Wrappa testerna

Använd wrappers för att göra om hela testerna:

```typescript
import { wrapMockWithOldResultAPI } from '@/test-utils';

// Förvandla en mock-funktion som returnerar nya Result till en som returnerar gamla
const mockRepository = {
  findById: jest.fn().mockResolvedValue(Result.ok(entity))
};

// Wrappa hela repository-mocken
const compatibleMockRepository = {
  ...mockRepository,
  findById: wrapMockWithOldResultAPI(mockRepository.findById)
};
```

## Migrationsstrategi

1. **Ta en modul i taget**: Fokusera på att migrera tester för en modul i taget
2. **Börja med värde-objekt**: Värde-objekt är oftast enkla och bra att börja med
3. **Använd kompabilitetsfunktioner**: För tester som är svåra att uppdatera direkt
4. **Uppdatera mockar**: Säkerställ att mockar returnerar Result med rätt API

## Hantera UserProfile

UserProfile har ändrats från en vanlig klass till ett ValueObject. Använd hjälpfunktionerna i `src/test-utils/userProfileTestHelper.ts`:

```typescript
import { createMockUserProfile, createLegacyUserProfile } from '@/test-utils';

// För att skapa ett mock UserProfile i tester
const profileResult = createMockUserProfile({
  firstName: 'Test',
  lastName: 'User'
});

// För att skapa ett bakåtkompatibelt objekt som fungerar med gammal kod
const profile = profileResult.getValue();
const legacyProfile = createLegacyUserProfile(profile);

// legacyProfile har properties som firstName, lastName som getters
// och metoder som toString(), toJSON() som det gamla UserProfile
```

## Entity getters

Entiteter som `User` har ändrat sina getters för att returnera värde-objekt istället för direkta värden:

```typescript
// INNAN
const user = someUserResult.getValue();
expect(user.email).toBe('test@example.com');

// EFTER
const user = someUserResult.value;
expect(user.email.value).toBe('test@example.com');
// eller för properties som nu är värde-objekt:
expect(user.email.props.value).toBe('test@example.com');
```

För entiteter, kolla deras implementation för att se exakt hur getters är definierade.

## Vanliga misstag att undvika

1. **Blanda gamla och nya API:er**: Var konsekvent i dina tester
2. **Glömma att anropa isOk/isErr som funktioner**: Det nya API:et är metoder, inte properties
3. **Anta samma felmeddelanden**: Felmeddelanden kan ha ändrats, använd `toContain()` för robustare tester
4. **Ignorera props**: Värden är ofta i `props`-objektet istället för direkt på objektet

## Checklist för migration

- [ ] Kör testerna för att hitta alla misslyckade tester
- [ ] Identifiera vilka tester som använder Result och UserProfile
- [ ] Välj migrationsstrategi för varje testfil
- [ ] Uppdatera testerna med rätt API-anrop
- [ ] Verifiera att testerna passerar
- [ ] Uppdatera mockar för att använda rätt Result-API
- [ ] Ta bort temporära kompabilitetslösningar när alla tester är migrerade 