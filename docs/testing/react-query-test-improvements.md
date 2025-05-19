# React Query Testförbättringar

Detta dokument beskriver de förbättringar som gjorts för att förbättra testbarheten av React Query i Pling-mobile projektet.

## Sammanfattning av förbättringar

1. **ReactQueryTestProvider** - En ny provider som löser vanliga problem med React Query i tester
2. **Förbättrad HooksIntegrationTestWrapper** - Uppdaterad för att konsekvent använda ReactQueryTestProvider
3. **Förbättrad jest-konfiguration** - Särskild konfiguration för JSDOM-baserade hooks-tester
4. **Robusta hjälpfunktioner** - Nya verktyg för att rendera hooks med hjälpmetoder

## Användningsguide

### 1. Använda ReactQueryTestProvider direkt

När du behöver testa komponenter som använder React Query:

```tsx
import { ReactQueryTestProvider, createTestQueryClient } from '@/test-utils/ReactQueryTestProvider';
import { render } from '@testing-library/react-native';

describe('Min komponent', () => {
  it('bör rendera korrekt', () => {
    const queryClient = createTestQueryClient();
    
    const { getByText } = render(
      <ReactQueryTestProvider queryClient={queryClient}>
        <MinKomponent />
      </ReactQueryTestProvider>
    );
    
    expect(getByText('Förväntat innehåll')).toBeDefined();
  });
});
```

### 2. Testa hooks med renderHookWithQueryClient

När du behöver testa custom hooks med React Query:

```tsx
import { renderHookWithQueryClient } from '@/test-utils/helpers/ReactQueryIntegrationTest';
import { act } from '@testing-library/react-hooks';

describe('useMinHook', () => {
  it('bör hantera data korrekt', async () => {
    // Skapa mockade repositories
    const mockTeamRepo = new MockTeamRepository();
    
    // Förbereda testdata
    await mockTeamRepo.save(createTestTeam('test-id', 'Test Team', 'Beskrivning', 'owner-id', 'org-id'));
    
    // Rendera hooken med alla beroenden
    const { result, waitFor } = renderHookWithQueryClient(
      () => useMinHook('test-id'),
      {
        teamRepository: mockTeamRepo
      }
    );
    
    // Vänta på att data har laddats
    await waitFor(() => result.current.isSuccess);
    
    // Verifiera resultatet
    expect(result.current.data).toBeDefined();
    expect(result.current.data.name).toBe('Test Team');
  });
});
```

### 3. Testa integrationer mellan domäner

För mer komplexa integrationstester mellan olika delar av appen:

```tsx
import { 
  renderHookWithQueryClient, 
  createTestOrganization, 
  createTestTeam, 
  populateTestData 
} from '@/test-utils/helpers/ReactQueryIntegrationTest';

describe('Organization och Team integration', () => {
  it('bör uppdatera team när organisation ändras', async () => {
    // Konfigurera mock repositories
    const orgRepo = new MockOrganizationRepository();
    const teamRepo = new MockTeamRepository();
    
    // Skapa testdata
    const testOrg = createTestOrganization('org-1', 'Test Org', 'owner-1');
    const testTeam = createTestTeam('team-1', 'Test Team', 'Beskrivning', 'owner-1', 'org-1');
    
    // Populera repositories
    await populateTestData({
      organizationRepository: orgRepo,
      teamRepository: teamRepo,
      testData: {
        organizations: [testOrg],
        teams: [testTeam]
      }
    });
    
    // Rendera hooks som ska testas
    const { result: orgHook } = renderHookWithQueryClient(
      () => useOrganizationWithStandardHook(),
      { organizationRepository: orgRepo, teamRepository: teamRepo }
    );
    
    const { result: teamHook } = renderHookWithQueryClient(
      () => useTeamWithStandardHook(),
      { organizationRepository: orgRepo, teamRepository: teamRepo }
    );
    
    // Testa integration...
  });
});
```

## Felsökning och vanliga problem

### Problem: batchNotifyFn-fel

React Query har problem med batchNotifyFn i vissa miljöer, särskilt i tester. Detta är nu automatiskt åtgärdat i ReactQueryTestProvider.

### Problem: invalidateQueries-fel

När du försöker använda queryClient.invalidateQueries() i tester kan du få fel om det inte finns någon query med det angivna nyckeln. Detta är nu åtgärdat med förbättrad felhantering.

### Problem: Testning med olika wrapper-komponenter

Om du behöver kombinera flera providers i ett test, kan du använda customWrapper-parametern i renderHookWithQueryClient:

```tsx
const CustomWrapper = ({ children }) => (
  <AuthProvider initialUser={testUser}>
    {children}
  </AuthProvider>
);

const { result } = renderHookWithQueryClient(
  () => useMyHook(),
  { 
    wrapper: CustomWrapper,
    teamRepository: mockTeamRepo
  }
);
```

## Framtida förbättringar

För att ytterligare förbättra testbarheten bör vi:

1. Skapa en dedikerad React Query Provider för E2E-tester
2. Förbättra mock-repositoriens typning och funktionalitet
3. Utveckla mer robusta datagenereringshjälpare för mer komplex testdata

## Hur man kör hooks-integrationstester

För att köra hooks-integrationstester, använd detta kommando:

```bash
npm run test:jsdom
```

Detta använder den specialiserade jest.config.jsdom.js konfigurationen som är optimerad för React hooks-tester. 