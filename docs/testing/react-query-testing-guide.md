# Guide för testning med React Query

## Introduktion

React Query används för datahantering i applikationen, vilket kräver speciell setup för testning. 
Denna guide visar hur du ska testa komponenter och hooks som använder React Query.

## Standardiserad testning med QueryClientTestProvider

Vi har skapat ett standardiserat sätt att testa komponenter och hooks som använder React Query:

```tsx
import { render } from '@testing-library/react-native';
import { QueryClientTestProvider } from '@/test-utils';
import YourComponent from '../YourComponent';

describe('YourComponent', () => {
  it('ska visas korrekt', () => {
    render(
      <QueryClientTestProvider>
        <YourComponent />
      </QueryClientTestProvider>
    );
    
    // Fortsätt med dina förväntningar
  });
});
```

## Alternativ 1: Använda wrapper-funktionen

Om du föredrar testfunktionens wrapper-parameter:

```tsx
import { render } from '@testing-library/react-native';
import { createQueryClientWrapper } from '@/test-utils';
import YourComponent from '../YourComponent';

describe('YourComponent', () => {
  it('ska visas korrekt', () => {
    const wrapper = createQueryClientWrapper();
    render(<YourComponent />, { wrapper });
    
    // Fortsätt med dina förväntningar
  });
});
```

## Alternativ 2: Skapa en testhjälpare för din komponent

För mer specialiserade test-setups:

```tsx
import { render } from '@testing-library/react-native';
import { QueryClientTestProvider } from '@/test-utils';
import YourComponent from '../YourComponent';

// Skapa en anpassad render-funktion
const renderComponent = (props = {}) => {
  return render(
    <QueryClientTestProvider>
      <YourComponent {...props} />
    </QueryClientTestProvider>
  );
};

describe('YourComponent', () => {
  it('ska visas korrekt', () => {
    const { getByText } = renderComponent({ title: 'Test' });
    expect(getByText('Test')).toBeInTheDocument();
  });
});
```

## Testa React Query hooks

För att testa hooks som använder React Query:

```tsx
import { renderHook } from '@testing-library/react-hooks';
import { createQueryClientWrapper } from '@/test-utils';
import { useYourHook } from '../useYourHook';

describe('useYourHook', () => {
  it('ska returnera förväntad data', async () => {
    const wrapper = createQueryClientWrapper();
    const { result, waitFor } = renderHook(() => useYourHook(), { wrapper });
    
    // Vänta på att data laddas
    await waitFor(() => !result.current.isLoading);
    
    // Kontrollera resultatet
    expect(result.current.data).toEqual(expectedData);
  });
});
```

## Hantera testproblem

### Långsamma tester

Om tester tar för lång tid, kan du anpassa timeouts:

```tsx
import { renderHook } from '@testing-library/react-hooks';
import { createQueryClientWrapper, WAIT_FOR_OPTIONS } from '@/test-utils';

// Använd förkonfigurerade options
await waitFor(() => !result.current.isLoading, WAIT_FOR_OPTIONS);
```

### Mockad data

För att testa med mockad data:

```tsx
import { QueryClient } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test-utils';

// Skapa en anpassad QueryClient
const mockQueryClient = createTestQueryClient();

// Förinställ data i cachen
mockQueryClient.setQueryData(['key', 'subKey'], mockData);

// Använd den anpassade klienten
const wrapper = createQueryClientWrapper(mockQueryClient);
```

## Bästa praxis

1. **Använd alltid QueryClientTestProvider**: Varje test som involverar React Query behöver en Provider.

2. **Isolera tester**: Skapa en ny QueryClient för varje test.

3. **Mockdata först**: Förinställ mock-data för att undvika faktiska API-anrop.

4. **Testa laddningstillstånd**: Verifiera både laddnings- och färdiga tillstånd.

5. **Hantera asynkronitet**: Använd `waitFor` för att vänta på att Query-resultat blir tillgängliga.

## Exempel på integrerade tester

### Testa komponent med databehandling

```tsx
import { render, screen, waitFor } from '@testing-library/react-native';
import { QueryClientTestProvider, WAIT_FOR_OPTIONS } from '@/test-utils';
import TeamList from '../TeamList';
import { mockTeamRepository } from '@/test-utils/mocks';

// Mocka repository
jest.mock('@/application/team/hooks/useTeamDependencies', () => ({
  useTeamDependencies: () => ({
    teamRepository: mockTeamRepository
  })
}));

describe('TeamList', () => {
  beforeEach(() => {
    // Förbered mockdata
    mockTeamRepository.findAll.mockResolvedValue(
      Result.ok([{ id: '1', name: 'Team 1' }, { id: '2', name: 'Team 2' }])
    );
  });
  
  it('ska visa laddningsindikator och sedan data', async () => {
    render(
      <QueryClientTestProvider>
        <TeamList />
      </QueryClientTestProvider>
    );
    
    // Kontrollera laddningstillstånd
    expect(screen.getByText('Laddar...')).toBeInTheDocument();
    
    // Vänta på att data laddas
    await waitFor(() => screen.getByText('Team 1'), WAIT_FOR_OPTIONS);
    
    // Verifiera att data visas korrekt
    expect(screen.getByText('Team 1')).toBeInTheDocument();
    expect(screen.getByText('Team 2')).toBeInTheDocument();
  });
});
```

## Felsökning

### Vanliga problem

| Problem | Lösning |
|---------|---------|
| Timeout när vi väntar på data | Öka timeout i WAIT_FOR_OPTIONS eller förkonfigurera mockad data |
| Query körs inte i test | Säkerställ att QueryClientProvider omsluter komponenten |
| "TypeError: window is not defined" | Testa med Jest JSDOM-miljö, addera `@jest-environment jsdom` i testfilen |
| Data uppdateras inte | Använd `mockQueryClient.invalidateQueries()` före waitFor | 