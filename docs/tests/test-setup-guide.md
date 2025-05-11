# Testuppsättning för Pling Mobile

Detta dokument beskriver hur testerna är uppsatta i Pling Mobile-projektet efter övergången till React Native 0.76+ och ESM.

## Testmiljöer

Vi använder två separata testmiljöer för olika typer av tester:

1. **Domäntester** (Node-miljö)
   - Testar domänlogik, applikationslogik och utilities
   - Körs i Node.js för bättre prestanda
   - Konfigurerade i `jest.domain.config.js`

2. **UI-tester** (jsdom-miljö)
   - Testar UI-komponenter och interaktioner
   - Körs i jsdom för att simulera en webbläsarmiljö
   - Konfigurerade i `jest.ui.config.js`

## Testkommandon

```bash
# Kör alla tester
npm run test

# Kör bara domäntester
npm run test:domain

# Kör bara UI-tester
npm run test:ui

# Rensa Jest-cachen
npm run test:clear-cache

# Kör tester i watch-läge
npm run test:watch
```

## Mappstruktur

```
/
├── __mocks__/                 # Globala mock-implementationer
│   ├── react-native.js        # Mock för React Native
│   ├── @tanstack/             # Mock för externa bibliotek
│   └── ...
├── src/
│   ├── test-utils/            # Gemensamma testhjälpare
│   │   └── index.ts           # Exporterar alla testhjälpare
│   ├── domain/                # Domäntester
│   │   └── **/__tests__/*.test.ts
│   └── application/           # Applikationstester
│       └── **/__tests__/*.test.ts
├── components/                # UI-komponenter
│   └── **/__tests__/*.test.tsx
├── jest.domain.config.js      # Konfiguration för domäntester
├── jest.ui.config.js          # Konfiguration för UI-tester
├── jest.setup.node.js         # Setup för domäntester
└── jest.setup-apptest.js      # Setup för UI-tester
```

## Domäntester

Domäntester konfigureras med `jest.domain.config.js` och använder `jest.setup.node.js` för setup. De körs i Node-miljö och fokuserar på:

- Värdesobjekt (Value Objects)
- Entiteter (Entities)
- Use Cases
- Domäntjänster (Services)
- Repositories
- Applikationshooks (utan UI-rendrering)

### Exempel på domäntest

```typescript
// src/domain/user/value-objects/__tests__/Email.test.ts
import { Email } from '../Email';

describe('Email', () => {
  describe('create', () => {
    it('ska skapa ett giltigt Email-objekt', () => {
      const result = Email.create('test@example.com');
      expect(result.isOk()).toBe(true);
      expect(result.value.toString()).toBe('test@example.com');
    });
    
    it('ska returnera fel för ogiltig e-postadress', () => {
      const result = Email.create('invalid-email');
      expect(result.isErr()).toBe(true);
    });
  });
});
```

### Testning av hooks i domänmiljö

För att testa hooks i domänmiljö använder vi specialmockade React Query-funktioner:

```typescript
// src/application/user/hooks/__tests__/useUser.test.tsx
import { renderHook } from '@testing-library/react-hooks';
import { useUser } from '../useUser';
import { createWrapper } from '@/test-utils';
import { mockResultOk } from '@/test-utils';

// Mock beroenden
jest.mock('@/infrastructure/InfrastructureFactory', () => ({ ... }));

describe('useUser', () => {
  it('ska returnera användardata', async () => {
    const { result, waitFor } = renderHook(() => useUser('test-id'), {
      wrapper: createWrapper()
    });
    
    // Testa hook-resultat
    expect(result.current.isLoading).toBeDefined();
  });
});
```

## UI-Tester

UI-tester konfigureras med `jest.ui.config.js` och använder `jest.setup-apptest.js` för setup. De körs i jsdom-miljö och fokuserar på:

- React komponenter
- Användarinteraktioner
- Visuell rendering
- Navigering

### Exempel på UI-test

```typescript
// components/Button/__tests__/Button.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('ska rendera med korrekt text', () => {
    const { getByText } = render(<Button title="Tryck här" />);
    expect(getByText('Tryck här')).toBeTruthy();
  });
  
  it('ska anropa onPress när den trycks', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button title="Tryck här" onPress={onPressMock} />);
    
    fireEvent.press(getByText('Tryck här'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
});
```

## Hjälpverktyg för testning

Vi har flera hjälpfunktioner i `src/test-utils/index.ts`:

### createWrapper

Skapar en React Query Provider wrapper för hooks:

```typescript
const { result } = renderHook(() => useMyHook(), {
  wrapper: createWrapper()
});
```

### mockResultOk och mockResultErr

Skapar mockade Result-objekt:

```typescript
// Mocka lyckade resultat
const mockOk = mockResultOk({ data: 'test' });

// Mocka felresultat
const mockErr = mockResultErr('Ett fel inträffade');
```

### renderWithProviders

Renderar en komponent med alla nödvändiga providers:

```typescript
const { getByText } = renderWithProviders(<MinKomponent />);
```

## Vanliga problem och lösningar

### 1. JSX i tester

För att undvika problem med JSX i tester, använd `React.createElement`:

```typescript
// Istället för detta:
render(<MinKomponent />);

// Använd detta:
render(React.createElement(MinKomponent));
```

### 2. React Query i domäntester

För att undvika problem med React Query i domäntester:

- Använd alltid `createWrapper` från test-utils
- Mocka alltid `useQueryClient`-funktionen
- Undvik att använda `waitFor` med för kort timeout

### 3. Asynkrona tester

För att hantera asynkrona tester korrekt:

```typescript
it('ska hantera asynkrona operationer', async () => {
  // Använd act för asynkrona operationer
  await act(async () => {
    // Utför asynkron operation
    await someAsyncFunction();
  });
  
  // Testa resultat efter asynkron operation
  expect(result).toBe(expectedValue);
});
```

### 4. Mockning av beroenden

Använd jest.mock för att mocka externa beroenden:

```typescript
jest.mock('@/infrastructure/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    data: null
  }
}));
```

## Debugging av tester

För att felsöka tester:

1. Använd `--verbose` flaggan för att se detaljerad utdata:
   ```bash
   npm run test:domain -- --verbose
   ```

2. Använd `console.log` för att logga värden under testkörning

3. Kör enskilda testfiler:
   ```bash
   npm run test:domain -- path/to/test/file.test.ts
   ```

4. Använd `debugger` nyckelordet tillsammans med Node-inspektor:
   ```bash
   node --inspect-brk node_modules/.bin/jest --runInBand path/to/test/file.test.ts
   ```

## Prestandaförbättringar

För att förbättra testprestanda:

1. Separera domän- och UI-tester - domäntester kör mycket snabbare
2. Använd mock-implementationer för tunga beroenden
3. Använd `--maxWorkers=4` för att begränsa antalet parallella processer
4. Rensa testcachen regelbundet med `npm run test:clear-cache` 