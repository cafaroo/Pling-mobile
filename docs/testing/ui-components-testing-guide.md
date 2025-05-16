# Guide för UI-komponenttestning

Denna guide beskriver standardiserade mönster och best practices för att testa UI-komponenter i Pling-mobile, med fokus på container/presentation-mönstret.

## Principer för UI-testning

När vi testar UI-komponenter i Pling-mobile följer vi dessa grundläggande principer:

1. **Separera tester mellan presentation och container** - Testa presentations- och container-komponenter separat för att isolera ansvar
2. **Testa realistiska användarinteraktioner** - Simulera verkliga användarflöden och interaktioner
3. **Bekräfta hela UI-cykeln** - Testa laddning, rendering, interaktion, uppdatering och felhantering 
4. **Mockad datahantering** - Använd mockade data och hooks istället för verkliga API-anrop
5. **Standardiserad verktygsanvändning** - Använd samma testverktyg och mönster konsekvent

## Teststrukturer

### 1. Presentation-komponenttester

Presentationskomponenter testas med fokus på rendering, props-hantering och användarinteraktioner:

```typescript
describe('ComponentNamePresentation', () => {
  it('renderar korrekt med minimala props', () => {
    // Testa med minsta möjliga props
  });
  
  it('visar all data korrekt när fullständiga props tillhandahålls', () => {
    // Testa att all data visas korrekt
  });
  
  it('hanterar callback-anrop korrekt vid interaktioner', () => {
    // Testa att callbacks anropas korrekt
  });
  
  it('visar laddningstillstånd korrekt', () => {
    // Testa rendering i laddningstillstånd
  });
  
  it('visar feltillstånd korrekt', () => {
    // Testa rendering i feltillstånd
  });
  
  it('visar tomt tillstånd korrekt', () => {
    // Testa rendering när ingen data finns
  });
});
```

### 2. Container-komponenttester

Container-komponenter testas med fokus på dataflöde, hook-interaktioner och tillståndshantering:

```typescript
describe('ComponentNameContainer', () => {
  beforeEach(() => {
    // Konfigurera mocks för hooks och API-anrop
  });
  
  it('hämtar data vid montering', () => {
    // Testa att rätt fetch-funktioner anropas
  });
  
  it('skickar rätt data till presentationskomponenten', () => {
    // Testa att data skickas korrekt till presentation
  });
  
  it('hanterar användarinteraktioner korrekt', () => {
    // Testa att callbacks hanterar datamutationer korrekt
  });
  
  it('hanterar laddningstillstånd korrekt', () => {
    // Testa laddningstillstånd i container
  });
  
  it('hanterar felhantering korrekt', () => {
    // Testa felhantering i container
  });
});
```

### 3. Integrationstester

Integrationstester testar kombinationen av container och presentation samt interaktionen med hooks och tjänster:

```typescript
describe('ComponentName Integration', () => {
  beforeEach(() => {
    // Skapa QueryClient och konfigurera mocks
  });
  
  it('genomför ett komplett användarflöde', async () => {
    // Rendera komponenten
    // Utför en serie av användarinteraktioner
    // Verifiera att UI och data uppdateras korrekt
  });
  
  it('hantera felscenarion korrekt genom hela stacken', async () => {
    // Simulera fel i datahämtning eller mutation
    // Verifiera korrekt hantering och UI-uppdatering
  });
});
```

## Mock-strategier

För att effektivt testa UI-komponenter använder vi flera mock-strategier:

### 1. Mockning av hooks

Hooks som `useTeamWithStandardHook` och `useUserWithStandardHook` mockas för att returnera kontrollerade testdata:

```typescript
// Mock useTeamWithStandardHook
jest.mock('@/application/team/hooks/useTeamWithStandardHook');

// I beforeEach
(useTeamWithStandardHook as jest.Mock).mockReturnValue({
  getTeam: {
    data: mockTeam,
    isLoading: false,
    error: null,
    execute: mockGetTeam,
  },
  updateTeam: {
    isLoading: false,
    error: null,
    execute: mockUpdateTeam.mockImplementation(() => Promise.resolve(Result.ok(true))),
  },
});
```

### 2. Mockning av React Native-komponenter

React Native och externa bibliotekskomponenter mockas för att förenkla testmiljön:

```typescript
// Mock React Native Paper komponenter
jest.mock('react-native-paper', () => ({
  Button: ({ onPress, children }: any) => (
    <button data-testid={`button-${children}`} onClick={onPress}>
      {children}
    </button>
  ),
  ActivityIndicator: () => <div data-testid="loading-indicator" />,
  // Övriga komponenter...
}));

// Mock native komponenter
jest.mock('react-native', () => {
  const original = jest.requireActual('react-native');
  return {
    ...original,
    FlatList: ({ data, renderItem, keyExtractor }: any) => (
      <div data-testid="flat-list">
        {data.map((item: any) => (
          <div key={keyExtractor(item)} data-testid={`item-${item.id}`}>
            {renderItem({ item })}
          </div>
        ))}
      </div>
    ),
  };
});
```

### 3. Mockning av navigering

Navigeringsfunktioner och -hooks mockas för att isolera komponenten från navigeringslogik:

```typescript
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'test-id' }),
  useRouter: () => ({
    back: jest.fn(),
    push: mockNavigationPush,
  }),
}));
```

## Testverktyg och hjälpfunktioner

Vi använder följande standardverktyg och hjälpfunktioner för UI-tester:

### 1. Testing Library

React Testing Library används för att rendera komponenter och interagera med dem:

```typescript
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';

// Rendera komponent
const { getByText, getByTestId, queryByText } = render(<MyComponent />);

// Interagera med element
fireEvent.press(getByText('Spara'));
fireEvent.changeText(getByTestId('input'), 'Ny text');

// Vänta på asynkrona uppdateringar
await waitFor(() => {
  expect(getByText('Sparat!')).toBeTruthy();
});
```

### 2. React Query Provider

För komponenter som använder React Query behöver vi wrappa dem i en provider:

```typescript
// Skapa en QueryClient för test
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
      staleTime: 0,
    },
  },
});

// Rendera komponenten med provider
const { getByText } = render(
  <QueryClientProvider client={queryClient}>
    <MyComponent />
  </QueryClientProvider>
);
```

### 3. UITestHelper

Vi har skapat ett UITestHelper-objekt för att förenkla vanliga testoperationer:

```typescript
// src/test-utils/helpers/UITestHelper.ts
export const UITestHelper = {
  /**
   * Hjälpmetod för att rendera en komponent med React Query provider
   */
  renderWithQueryClient: (component: React.ReactElement) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0,
          staleTime: 0,
        },
      },
    });
    
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  },
  
  /**
   * Hjälpmetod för att mocka standardbeteenden för hooks
   */
  mockStandardHooks: () => {
    // Implementera standardmockningar för ofta använda hooks
  },
  
  /**
   * Hjälpmetod för att mocka olika tillstånd (laddning, fel, tom data)
   */
  createMockState: (type: 'loading' | 'error' | 'empty' | 'data', data?: any) => {
    // Skapa standardiserade mocktillstånd
  },
};
```

## Testcasetäckning

För att säkerställa omfattande testning av UI-komponenter bör följande testcases täckas:

### 1. Grundläggande rendering
- Test med minimala props
- Test med fullständiga props
- Test för att verifiera att all data visas korrekt

### 2. Tillståndstester
- Laddningstillstånd (isLoading = true)
- Feltillstånd (error = { message: '...' })
- Tomt tillstånd (data = [] eller data = null)
- Standardtillstånd (data finns)

### 3. Interaktionstester
- Klickhändelser för knappar och länkar
- Textinmatning i fält
- Formulärinskickning
- Hover/fokus-tillstånd (om relevant)
- Dragning/svepning (om relevant)

### 4. Callback-tester
- Verifiering att callbacks anropas med rätt parametrar
- Verifiering att callbacks anropas vid rätt händelser
- Hantering av asynkrona callbacks

### 5. Container-specifika tester
- Test av datainhämtning/fetching
- Test av datamutationer (skapa, uppdatera, ta bort)
- Test av felhantering i datamutationer
- Test av tillståndsförvaltning

## Snapshot-testning

Vi använder snapshot-testning selektivt för att fånga oväntade UI-ändringar:

```typescript
it('matchar senaste snapshot', () => {
  const { toJSON } = render(<ComponentPresentation {...mockProps} />);
  expect(toJSON()).toMatchSnapshot();
});
```

Riktlinjer för snapshot-testning:
- Använd för stabila, presentationsfokuserade komponenter
- Håll snapshots så små som möjligt, fokusera på specifika delar
- Uppdatera snapshots medvetet, inte automatiskt utan granskning
- Föredra explicita assertions framför snapshots för kritisk funktionalitet

## Att testa container/presentation-mönstret

För att effektivt testa komponenter som följer container/presentation-mönstret:

### Presentation-komponenter

1. **Fokusera på rendering och props-validering**
   - Testa att komponenten renderar korrekt med olika props-kombinationer
   - Verifiera att callbacks anropas korrekt
   - Testa olika datastrukturer för att säkerställa robust rendering

2. **Isolera rendering från affärslogik**
   - Undvik att testa affärslogik i presentationskomponenter
   - Fokusera på visuell rendering och användarinteraktioner

3. **Testa alla visuella tillstånd**
   - Laddning
   - Tomt
   - Fel
   - Standardtillstånd
   - Aktivt/inaktivt
   - Validering (för formulär)

### Container-komponenter

1. **Fokusera på dataflöde och hook-interaktioner**
   - Testa att rätt hooks anropas med rätt parametrar
   - Verifiera att data flödar korrekt från hooks till presentation
   - Testa att callbacks hanterar hook-anrop korrekt

2. **Skapa tydliga mocks för hooks**
   - Mocka hooks för att simulera olika datascenarier
   - Testa laddnings-, fel- och dataflödesscenarier

3. **Testa tillståndshantering**
   - Verifiera korrekt hantering av internt tillstånd
   - Testa tillståndsövergångar mellan olika UI-tillstånd

## Exempel på strukturerat test

Här är ett komplett exempel på ett strukturerat test för en container/presentation-komponent:

```typescript
// TeamMembersScreen.test.tsx
import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { TeamMembersScreenPresentation } from '../TeamMembersScreenPresentation';
import { TeamMembersScreenContainer } from '../TeamMembersScreenContainer';
import { useTeamWithStandardHook } from '@/application/team/hooks/useTeamWithStandardHook';
import { UITestHelper } from '@/test-utils/helpers/UITestHelper';

// Mocks
jest.mock('@/application/team/hooks/useTeamWithStandardHook');

describe('TeamMembersScreen', () => {
  // Gemensam testdata
  const mockTeamId = 'team-123';
  const mockTeamName = 'Test Team';
  const mockMembers = [
    { id: 'user-1', name: 'User 1', role: 'admin' },
    { id: 'user-2', name: 'User 2', role: 'member' },
  ];
  
  // Presentation tests
  describe('TeamMembersScreenPresentation', () => {
    const mockCallbacks = {
      onBack: jest.fn(),
      onMemberPress: jest.fn(),
      onAddMember: jest.fn(),
      onRemoveMember: jest.fn(),
      onToggleForm: jest.fn(),
      onMemberAdd: jest.fn(),
      onRetry: jest.fn(),
    };
    
    it('renderar medlemslistan korrekt', () => {
      const { getByText } = render(
        <TeamMembersScreenPresentation
          teamId={mockTeamId}
          teamName={mockTeamName}
          members={mockMembers}
          isLoading={false}
          error={undefined}
          isFormVisible={false}
          {...mockCallbacks}
        />
      );
      
      expect(getByText('User 1')).toBeTruthy();
      expect(getByText('User 2')).toBeTruthy();
    });
    
    it('visar laddningsindikator', () => {
      const { getByTestId } = render(
        <TeamMembersScreenPresentation
          teamId={mockTeamId}
          teamName={mockTeamName}
          members={[]}
          isLoading={true}
          error={undefined}
          isFormVisible={false}
          {...mockCallbacks}
        />
      );
      
      expect(getByTestId('loading-indicator')).toBeTruthy();
    });
    
    it('visar felmeddelande', () => {
      const { getByText } = render(
        <TeamMembersScreenPresentation
          teamId={mockTeamId}
          teamName={mockTeamName}
          members={[]}
          isLoading={false}
          error={{ message: 'Test error', retryable: true }}
          isFormVisible={false}
          {...mockCallbacks}
        />
      );
      
      expect(getByText('Test error')).toBeTruthy();
    });
    
    it('anropar onMemberPress när medlem klickas', () => {
      const { getByText } = render(
        <TeamMembersScreenPresentation
          teamId={mockTeamId}
          teamName={mockTeamName}
          members={mockMembers}
          isLoading={false}
          error={undefined}
          isFormVisible={false}
          {...mockCallbacks}
        />
      );
      
      fireEvent.press(getByText('User 1'));
      expect(mockCallbacks.onMemberPress).toHaveBeenCalledWith('user-1');
    });
  });
  
  // Container tests
  describe('TeamMembersScreenContainer', () => {
    const mockGetTeamMembers = jest.fn();
    const mockRemoveTeamMember = jest.fn();
    
    beforeEach(() => {
      jest.clearAllMocks();
      
      (useTeamWithStandardHook as jest.Mock).mockReturnValue({
        getTeamMembers: {
          data: mockMembers,
          isLoading: false,
          error: null,
          execute: mockGetTeamMembers,
        },
        removeTeamMember: {
          isLoading: false,
          error: null,
          execute: mockRemoveTeamMember.mockImplementation(() => Promise.resolve(Result.ok(true))),
        },
      });
    });
    
    it('hämtar medlemmar vid montering', () => {
      UITestHelper.renderWithQueryClient(
        <TeamMembersScreenContainer teamId={mockTeamId} />
      );
      
      expect(mockGetTeamMembers).toHaveBeenCalledWith({ teamId: mockTeamId });
    });
    
    it('ändrar isFormVisible vid onToggleForm', async () => {
      const { getByTestId } = UITestHelper.renderWithQueryClient(
        <TeamMembersScreenContainer teamId={mockTeamId} />
      );
      
      const fab = getByTestId('add-button');
      await act(async () => {
        fireEvent.press(fab);
      });
      
      // Form bör nu vara synligt
      expect(getByTestId('add-member-form')).toBeTruthy();
    });
    
    it('anropar removeTeamMember när en användare tas bort', async () => {
      const { getByTestId } = UITestHelper.renderWithQueryClient(
        <TeamMembersScreenContainer teamId={mockTeamId} />
      );
      
      const removeButton = getByTestId('remove-user-1-button');
      await act(async () => {
        fireEvent.press(removeButton);
      });
      
      // Bekräfta
      const confirmButton = getByTestId('confirm-button');
      await act(async () => {
        fireEvent.press(confirmButton);
      });
      
      expect(mockRemoveTeamMember).toHaveBeenCalledWith({
        teamId: mockTeamId,
        userId: 'user-1',
      });
    });
  });
  
  // Integration tests
  describe('TeamMembersScreen Integration', () => {
    // Se separata integrationstestfiler...
  });
});
```

## Rekommenderad filstruktur

Följ denna standardfilstruktur för tester:

```
ComponentName/
  ├── ComponentNamePresentation.tsx   # Presentationskomponent
  ├── ComponentNameContainer.tsx      # Container-komponent
  ├── index.tsx                       # Exporterar både container och presentation
  ├── __tests__/                      # Enhetstester
  │   ├── ComponentNamePresentation.test.tsx
  │   └── ComponentNameContainer.test.tsx
  └── integration-tests/              # Integrationstester
      └── ComponentName.integration.test.tsx
```

## Slutsats

Genom att följa dessa riktlinjer för UI-komponenttestning kan vi säkerställa att vår UI-kod är robust, underhållbar och fungerar som förväntat. Mönstret med separata tester för container- och presentationskomponenter, tillsammans med integrationstester, ger oss heltäckande testning på flera nivåer.

## Referenser

- [Testing Library dokumentation](https://testing-library.com/docs/react-testing-library/intro/)
- [React Testing Library för React Native](https://callstack.github.io/react-native-testing-library/)
- [React Query testning](https://tanstack.com/query/v4/docs/react/guides/testing)
- [Jest dokumentation](https://jestjs.io/docs/getting-started) 