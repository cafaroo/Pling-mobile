# Guide för testning av användardomänen

Detta dokument beskriver bästa metoder och mönster för att testa användardomänen i Pling-applikationen.

## Innehållsförteckning
1. [Teststruktur](#teststruktur)
2. [Applikationslagertester](#applikationslagertester)
3. [UI-lagertester](#ui-lagertester)
4. [Vanliga mockningsmönster](#vanliga-mockningsmönster)
5. [Testfallsmönster](#testfallsmönster)

## Teststruktur

### Mappar och filer
Testerna för användardomänen är organiserade enligt följande struktur:
```
src/
├─ domain/user/             # Domänlagertester
│   └─ __tests__/           # Test för domänentiteter och värde-objekt
├─ application/user/        # Applikationslagertester
│   ├─ useCases/__tests__/  # Test för användarfall
│   └─ hooks/__tests__/     # Test för React-hooks
└─ ui/user/                 # UI-lagertester
    ├─ screens/__tests__/   # Test för skärmkomponenter
    ├─ components/__tests__/ # Test för UI-komponenter
    └─ hooks/__tests__/     # Test för UI-specifika hooks
```

### Testmiljö
- **UI-lager**: Använder `jest.setup.js` för att konfigurera testmiljön
- **Applikationslager**: Använder `jest.setup-apptest.js` med mockar för infrastrukturlager
- **Domänlager**: Använder vanlig enhetstestning utan speciella mockar

## Applikationslagertester

### Test av hooks

Hooks i applikationslagret testas med `@testing-library/react-native` och `@tanstack/react-query`. Ett typiskt test omfattar:

1. **Mocka beroenden**: Supabase, UniqueId, EventBus, useCase-implementationer
2. **Testa framgångsrik exekvering**: Verifiera att hook returnerar korrekt data
3. **Testa felhantering**: Verifiera att hook hanterar fel korrekt
4. **Testa laddningstillstånd**: Verifiera att hook visar korrekt laddningstillstånd
5. **Testa cacheinvalidering**: Verifiera att hook invaliderar cachad data korrekt

Exempel på test för en hook:
```typescript
import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdateProfile } from '../useUpdateProfile';

// Mocka beroenden
jest.mock('../../useCases/updateProfile');
jest.mock('@/infrastructure/supabase/index');

describe('useUpdateProfile', () => {
  // Konfigurera QueryClient
  let queryClient: QueryClient;
  beforeEach(() => { /* Konfigurera queryClient */ });
  
  // Skapa wrapper för att tillhandahålla QueryClient
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  
  it('ska uppdatera profil framgångsrikt', async () => {
    // Konfigurera mock för framgångsrikt resultat
    // Rendera hook
    // Verifiera resultat
  });
  
  it('ska hantera fel', async () => {
    // Konfigurera mock för fel
    // Rendera hook
    // Verifiera felhantering
  });
  
  // Fler testfall...
});
```

### Testfallsmönster för hooks

För varje hook bör du testa:

1. **Framgångsrikt användarfall**
2. **Valideringsfel**
3. **Nätverksfel**
4. **Laddningstillstånd**
5. **Cacheinvalidering**
6. **Optimistiska uppdateringar** (om tillämpligt)

## UI-lagertester

UI-komponenter testas med `@testing-library/react-native`. Ett typiskt test omfattar:

1. **Rendera komponenten**
2. **Interagera med komponenten**
3. **Verifiera att komponenten uppdateras**
4. **Verifiera att callback-funktioner anropas**

## Vanliga mockningsmönster

### Mocka Supabase

Använd den globala mock som tillhandahålls i `jest.setup-apptest.js`:

```typescript
jest.mock('@/infrastructure/supabase/index', () => ({
  supabase: global.__mockSupabase
}));
```

### Mocka UniqueId

Använd den globala mock som tillhandahålls i `jest.setup-apptest.js`:

```typescript
jest.mock('@/shared/domain/UniqueId', () => ({
  UniqueId: jest.fn().mockImplementation(global.__mockUniqueId)
}));
```

### Mocka EventBus

```typescript
jest.mock('@/shared/events/EventBus', () => ({
  EventBus: jest.fn().mockImplementation(() => global.__mockEventBus),
  useEventBus: jest.fn().mockReturnValue(global.__mockEventBus)
}));
```

### Mocka Result

Använd hjälpfunktionerna `ok` och `err` från Result-klassen:

```typescript
import { Result, ok, err } from '@/shared/core/Result';

// Vid behov av att ersätta Result med en mock
jest.mock('@/shared/core/Result', () => ({
  ok: (value) => global.__mockResult.ok(value),
  err: (error) => global.__mockResult.err(error),
  Result: {
    ok: (value) => global.__mockResult.ok(value),
    err: (error) => global.__mockResult.err(error),
  },
}));
```

### Mocka userRepository

```typescript
jest.mock('../useUserDependencies', () => ({
  useUserDependencies: jest.fn().mockReturnValue({
    userRepository: global.__mockUserRepository,
  })
}));
```

## Testfallsmönster

### Domänlager

1. **Enhetstest för entiteter**:
   - Testa skapande av entiteter
   - Testa validering
   - Testa affärsregler
   - Testa invarianter

2. **Enhetstest för värde-objekt**:
   - Testa skapande
   - Testa validering
   - Testa jämförelse

### Applikationslager

1. **Enhetstest för användarfall**:
   - Testa framgångsrik exekvering
   - Testa validering
   - Testa felhantering
   - Testa domänhändelser

2. **Enhetstest för hooks**:
   - Testa datahämtning
   - Testa ändringsoperationer
   - Testa felhantering
   - Testa laddningstillstånd

### UI-lager

1. **Renderingstest**:
   - Testa att komponenten renderas korrekt
   - Testa att komponenten visar korrekt data

2. **Interaktionstest**:
   - Testa att formulär validerar input
   - Testa att knappar utlöser rätt callbacks
   - Testa att komponenten reagerar på användarinteraktioner 