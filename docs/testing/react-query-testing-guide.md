# React Query Testningsguide

## Introduktion

Denna guide förklarar hur du testar React Query-baserade hooks och komponenter i Pling-mobil-projektet.

## Testverktygen

För att förenkla testning av React Query-koden har vi skapat några specialverktyg:

1. `QueryClientTestProvider` - En wrapper-komponent som ger dina tester tillgång till en förkonfigurerad QueryClient
2. `createTestQueryClient` - En funktion som skapar en QueryClient optimerad för tester
3. `createQueryClientWrapper` - En utility-funktion som skapar en test-wrapper med QueryClient

## Grundläggande teststruktur

En typisk test för en React Query-hook eller komponent bör följa denna struktur:

```tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientTestProvider } from '@/test-utils';
import { YourComponent } from '../YourComponent';

describe('YourComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly with data', async () => {
    // Arrange
    const mockData = { /* dina mockade data */ };
    
    // Act
    render(
      <QueryClientTestProvider>
        <YourComponent />
      </QueryClientTestProvider>
    );
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText(/förväntad text/i)).toBeInTheDocument();
    });
  });
});
```

## Mocka hooks och repositories

För att testa komponenter som använder React Query-hooks behöver du mocka dessa hooks.

### Exempel på mockning av en hook

```tsx
// Mock för useSubscription-hooken
jest.mock('@/application/subscription/hooks/useSubscriptionContext', () => {
  return {
    useSubscription: () => ({
      useOrganizationSubscription: () => ({
        data: { id: 'sub-1', planId: 'premium' },
        isLoading: false,
        error: null
      }),
      useFeatureFlag: () => ({
        data: true,
        isLoading: false,
        error: null
      })
    })
  };
});
```

### Mocka Repository-metoder

För att testa hooks som använder repositories:

```tsx
// Mock för subscription repository
const mockSubscriptionRepository = {
  findByOrganizationId: jest.fn().mockResolvedValue(
    Result.ok({ id: 'sub-1', planId: 'premium' })
  ),
  updateStatus: jest.fn().mockResolvedValue(Result.ok(true))
};

// Mock för subscription context
jest.mock('@/application/subscription/hooks/useSubscriptionContext', () => {
  return {
    useSubscriptionContext: () => ({
      subscriptionRepository: mockSubscriptionRepository
    })
  };
});
```

## Testa laddningstillstånd

För att testa laddningstillstånd:

```tsx
it('should show loading state', async () => {
  // Arrange
  // Konfigurera din mock så att isLoading är true
  mockYourHook.mockImplementation(() => ({
    data: null,
    isLoading: true,
    error: null
  }));
  
  // Act
  render(
    <QueryClientTestProvider>
      <YourComponent />
    </QueryClientTestProvider>
  );
  
  // Assert
  expect(screen.getByText(/laddar/i)).toBeInTheDocument();
});
```

## Testa fel-tillstånd

För att testa fel-hantering:

```tsx
it('should handle errors', async () => {
  // Arrange
  // Konfigurera din mock för att returnera ett fel
  mockYourHook.mockImplementation(() => ({
    data: null,
    isLoading: false,
    error: { message: 'Ett fel har inträffat' }
  }));
  
  // Act
  render(
    <QueryClientTestProvider>
      <YourComponent />
    </QueryClientTestProvider>
  );
  
  // Assert
  expect(screen.getByText(/ett fel har inträffat/i)).toBeInTheDocument();
});
```

## Testa Mutations

För att testa mutations:

```tsx
it('should call mutation correctly', async () => {
  // Arrange
  const mockMutate = jest.fn();
  
  mockYourMutationHook.mockImplementation(() => ({
    mutate: mockMutate,
    isLoading: false,
    error: null
  }));
  
  // Act
  render(
    <QueryClientTestProvider>
      <YourComponent />
    </QueryClientTestProvider>
  );
  
  // Trigga mutation genom att klicka på en knapp
  fireEvent.press(screen.getByText(/spara/i));
  
  // Assert
  expect(mockMutate).toHaveBeenCalledWith(
    expect.objectContaining({
      // förväntade parametrar
    })
  );
});
```

## Integration med Result-API

När du testar hooks som returnerar Result-objekt:

```tsx
it('should handle successful result', async () => {
  // Arrange
  mockYourRepository.yourMethod.mockResolvedValue(
    Result.ok({ /* dina data */ })
  );
  
  // Act & Assert
  // Fortsätt med testen som vanligt
});

it('should handle error result', async () => {
  // Arrange
  mockYourRepository.yourMethod.mockResolvedValue(
    Result.err('Ett fel inträffade')
  );
  
  // Act & Assert
  // Fortsätt med testen som vanligt
});
```

## Testning av sammanslagna hooks

För hooks som kombinerar flera andra hooks (som useSubscription):

```tsx
it('should combine hooks correctly', async () => {
  // Mocka individuella hooks
  mockUseOrganizationSubscription.mockImplementation(() => ({
    data: { id: 'sub-1' },
    isLoading: false
  }));
  
  mockUseFeatureFlag.mockImplementation(() => ({
    data: true,
    isLoading: false
  }));
  
  // Konfigurera huvudhooken
  mockUseSubscription.mockImplementation(() => ({
    useOrganizationSubscription: mockUseOrganizationSubscription,
    useFeatureFlag: mockUseFeatureFlag
  }));
  
  // Act & Assert
  // Fortsätt med testen
});
```

## Vanliga fel och lösningar

### Fel: "Unable to find the QueryClient"

Om du ser detta fel, saknas QueryClientTestProvider eller så är den inte korrekt konfigurerad.

**Lösning**: Se till att din komponent är inlindad i QueryClientTestProvider:

```tsx
render(
  <QueryClientTestProvider>
    <YourComponent />
  </QueryClientTestProvider>
);
```

### Fel: TypeError: Cannot read property 'value' of undefined

Detta fel uppstår ofta när Result-objekt hanteras felaktigt.

**Lösning**: Se till att du använder Result.ok och Result.err korrekt:

```tsx
// Rätt sätt
mockFunction.mockResolvedValue(Result.ok({ data }));

// Inte
mockFunction.mockResolvedValue({ 
  _value: { data }, 
  _isOk: true 
});
```

### Fel: jsdom fel - "document is not defined"

**Lösning**: Se till att köra testerna med rätt jest-konfiguration som inkluderar jsdom-miljön.

## Bästa praxis

1. **Isolera tester** - Mock alltid externa beroenden
2. **Återställ mocks** - Använd beforeEach för att återställa mocks mellan tester
3. **Testa alla tillstånd** - Testa laddning, fel, och framgång
4. **Använd waitFor** - För att vänta på asynkrona uppdateringar
5. **Testa användarinteraktioner** - Använd fireEvent för att simulera interaktioner

## Exempel på testfiler

Se dessa testfiler för praktiska exempel:

- `src/application/subscription/hooks/__tests__/useSubscriptionStandardized.test.tsx`
- `src/application/team/hooks/__tests__/useTeamMembersStandardized.test.tsx`

## Migrering av befintliga tester

Om du har befintliga tester som inte använder QueryClientTestProvider:

1. Importera `QueryClientTestProvider` från '@/test-utils'
2. Byt ut alla custom QueryClient-lösningar med denna komponent
3. Ersätt alla mockQueryClient med `createTestQueryClient()` om det behövs

## Avancerade testningsscenarion

### Skriva integration-tester

För att testa interaktioner mellan flera hooks och komponenter:

```tsx
it('should integrate correctly with other components', async () => {
  render(
    <QueryClientTestProvider>
      <ParentComponent>
        <ComponentWithHooks />
      </ParentComponent>
    </QueryClientTestProvider>
  );
  
  // Tester fortsätter...
});
```

### Testa prefetching och cache-invalidering

```tsx
it('should invalidate queries correctly', async () => {
  // Arrange
  const queryClient = createTestQueryClient();
  
  // Sätt cache-data manuellt
  queryClient.setQueryData(['key'], mockData);
  
  // Act
  render(
    <QueryClientTestProvider client={queryClient}>
      <YourComponent />
    </QueryClientTestProvider>
  );
  
  // Trigga invalidering
  fireEvent.press(screen.getByText(/uppdatera/i));
  
  // Assert cache-invalidering
  // ...
});
```

## Sammanfattning

Genom att använda QueryClientTestProvider och följa dessa mönster kan du enkelt testa React Query-baserade komponenter och hooks i Pling-mobil-projektet.

För frågor eller feedback om dessa testverktyg, kontakta teamet. 