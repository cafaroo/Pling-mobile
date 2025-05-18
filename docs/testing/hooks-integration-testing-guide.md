# Guide för integrationstestning av hooks

Denna guide beskriver hur man skapar effektiva integrationstester för hooks i Pling-mobile-projektet. Till skillnad från enhetstester, som fokuserar på en enskild hook, syftar integrationstester till att verifiera samspelet mellan flera hooks och repositories.

## Principer för integrationstestning

När man testar hooks i integration är flera viktiga principer att tänka på:

1. **Testa realistiska flöden** - Testa flöden som motsvarar verkliga användarinteraktioner
2. **Testa domängränser** - Fokusera på interaktioner mellan domäner (t.ex. team och user)
3. **Verifiera events** - Kontrollera att domänevents publiceras och hanteras korrekt
4. **Testa caching** - Verifiera att React Query-caching fungerar korrekt mellan hooks
5. **Testa felhantering** - Verifiera att fel i ett lager propageras korrekt genom hooks

## Teststruktur

En effektiv struktur för integrationstester följer vanligtvis detta mönster:

```typescript
describe('Domain Integration', () => {
  // Mockade dependencies
  let mockRepositoryA: MockRepositoryA;
  let mockRepositoryB: MockRepositoryB;
  let mockEventPublisher: MockEventPublisher;
  
  beforeEach(() => {
    // Skapa mocks och testdata
    
    // Konfigurera mock-implementationer för context hooks
    (useContextA as jest.Mock).mockReturnValue({
      repositoryA: mockRepositoryA,
      eventPublisher: mockEventPublisher
    });
    
    (useContextB as jest.Mock).mockReturnValue({
      repositoryB: mockRepositoryB,
      eventPublisher: mockEventPublisher
    });
  });
  
  it('should handle cross-domain operation correctly', async () => {
    // Arrange - Skapa hooks
    const { result: hookA } = renderHook(() => useHookA(), { wrapper });
    const { result: hookB } = renderHook(() => useHookB(), { wrapper });
    
    // Act - Utför en operation i en domän
    await act(async () => {
      // Utför operation
    });
    
    // Assert - Verifiera resultat i båda domäner
  });
});
```

## Mocking-strategier

För effektiv integrationstestning använder vi flera olika mocking-strategier:

### 1. Repository-mocking

Istället för att mocka enskilda metoder med jest.fn(), använder vi kompletta mock-implementationer:

```typescript
class MockTeamRepository implements TeamRepository {
  private teams: Map<string, Team> = new Map();
  
  async findById(id: UniqueId): Promise<Result<Team>> {
    const team = this.teams.get(id.toString());
    if (!team) return Result.err(new Error('Team not found'));
    return Result.ok(team);
  }
  
  async save(team: Team): Promise<Result<boolean>> {
    this.teams.set(team.id.toString(), team);
    return Result.ok(true);
  }
  
  // Övriga metoder
}
```

Detta ger en mer realistisk testmiljö och möjliggör komplexa testscenarier.

### 2. Context-mocking

Vi mockar context-hooks för att injicera våra mockade repositories:

```typescript
jest.mock('@/application/team/hooks/useTeamContext');
jest.mock('@/application/user/hooks/useUserContext');

// I beforeEach
(useTeamContext as jest.Mock).mockReturnValue({
  teamRepository: mockTeamRepository,
  eventPublisher: mockEventPublisher
});
```

### 3. QueryClient wrapper

För att testa React Query-hooks korrekt använder vi en wrapper som tillhandahåller QueryClient:

```typescript
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
    },
  });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
```

## Exempel på testscenarier

### 1. Team och User integration

Testar hur en användare läggs till i ett team och hur båda domänerna uppdateras:

```typescript
it('ska lägga till en användare i ett team och uppdatera användarens teamlista', async () => {
  // Arrange - Skapa hooks
  const { result: teamHookResult } = renderHook(() => useTeamWithStandardHook(), { wrapper });
  const { result: userHookResult } = renderHook(() => useUserWithStandardHook(), { wrapper });
  
  // Act - Lägg till användaren i teamet
  await act(async () => {
    await teamHookResult.current.addTeamMember({
      teamId: testTeamId,
      userId: testUserId,
      role: TeamRole.MEMBER
    });
  });
  
  // Assert - Kontrollera att både team och user uppdaterades
  // ...team-kontroller
  // ...user-kontroller
  
  // Kontrollera events
  const publishedEvents = mockEventPublisher.getPublishedEvents();
  // ...event-kontroller
});
```

### 2. Subscription och Feature Flag integration

Testar hur prenumerationsbegränsningar påverkar funktionalitet:

```typescript
it('ska begränsa antal teammedlemmar baserat på prenumerationsplan', async () => {
  // Arrange
  mockFeatureFlagService.setUsage('org-free', 'teamMembers', 5); // Vid gränsen
  
  // Act - Försök lägga till en till medlem
  const result = await teamHookResult.current.addTeamMemberWithFeatureCheck({
    teamId: testTeamId,
    userId: 'new-user',
    role: TeamRole.MEMBER,
    organizationId: 'org-free'
  });
  
  // Assert - Detta bör misslyckas pga prenumerationsbegränsning
  expect(result.isErr()).toBe(true);
  expect(result.error.message).toContain('subscription');
});
```

### 3. Caching och invalidering

Testar att caching och cache-invalidering fungerar korrekt:

```typescript
it('ska uppdatera cachen konsekvent mellan hooks', async () => {
  // Arrange - Spionera på repository-anrop
  const repositorySpy = jest.spyOn(mockRepository, 'findById');
  
  // Act - Hämta data, göra en ändring, hämta igen
  await act(async () => {
    await hookResult.current.getData(id);
  });
  
  repositorySpy.mockClear();
  
  await act(async () => {
    await hookResult.current.getData(id); // Bör använda cache
  });
  
  // Assert - Repository ska inte ha anropats igen
  expect(repositorySpy).not.toHaveBeenCalled();
});
```

## Implementerade integrationstester

Vi har framgångsrikt implementerat flera integrationstester som täcker viktiga interaktioner mellan domäner:

### 1. Team-User hooks integration

Implementerad i `src/application/team/hooks/integration-tests/team-user-hooks-integration.test.tsx`, fokuserar på:
- Hur användare läggs till i och tas bort från team
- Hur datasynkronisering sker mellan team- och användarentiteter
- Cache-hantering mellan hooks
- Felhantering över domängränser

### 2. Subscription-Feature integration

Implementerad i `src/application/subscription/hooks/integration-tests/subscription-feature-integration.test.tsx`, testar:
- Tillgång till funktioner baserat på prenumerationsplan
- Begränsningar för teamstorlek och andra resurser
- Spårning och uppdatering av användningsstatistik
- Prenumerationsplans-specifik funktionalitet

### 3. Organization-Team integration

Implementerad i `src/application/organization/hooks/integration-tests/organization-team-integration.test.tsx`, verifierar:
- Medlemshantering över organisationer och team
- Behörighetsmodell mellan olika domäner
- Resursåtkomst baserat på organisationstillhörighet
- Cache-koordinering mellan organisationer och team

## Användning av DomainServiceTestHelper

Våra integrationstester drar nytta av `DomainServiceTestHelper` för att förenkla testning av domäntjänster:

```typescript
// Skapa testdata för integration
const testData = DomainServiceTestHelper.createTestDomainData();

// Skapa mockade repositories med testdata
const mockTeamRepository = DomainServiceTestHelper.createMockRepositoryWithEntity(testData.teams.main);
const mockUserRepository = DomainServiceTestHelper.createMockRepositoryWithEntity(testData.users.admin);

// Validera resultat
const result = await someOperation();
DomainServiceTestHelper.validateSuccessResult(result, expectedValue);
```

Detta hjälper oss att:
- Skapa konsekvent testdata för olika tester
- Förenkla mockning av repositories och tjänster
- Standardisera verifiering av Result-objekts utfall
- Testa olika scenarier med anpassade mockar

## Vanliga fallgropar

1. **Glömma await eller act** - Saknade await eller act() kan göra att tester är ostabila
2. **Otillräcklig mock-data** - Inte tillräckligt realistisk mock-data kan missa viktiga edge cases
3. **Otillräckliga assertions** - Kontrollera alla relevanta tillstånd, inte bara direkta resultat
4. **Isolerade tester** - Integrationstester bör fokusera på interaktionen, inte isolerad funktionalitet

## Rekommenderade mönster

1. **Skapa testdata med MockEntityFactory** - Använd fabriksmetoder för att skapa konsekvent testdata
2. **Spionera med jest.spyOn snarare än mockImplementation** - Gör det enklare att verifiera anrop
3. **Dela upp komplex uppsättning** - Använd hjälpfunktioner för att skapa komplex testuppsättning
4. **Verifiera domänevents** - Kontrollera att rätt events publiceras med rätt data

## Slutsatser och nästa steg

Våra integrationstester täcker nu de viktigaste interaktionerna mellan domäner och tillhandahåller god testtäckning för komplexa dataflöden. Framtida förbättringar kan inkludera:

1. Utöka testning med fler edge cases och felscenarier
2. Implementera prestandatestning för att säkerställa effektiv cache-användning
3. Utöka testning av domänevents för att säkerställa korrekt händelseflöde mellan domäner

## Referenser

- [Team-User hooks integration test](../application/team/hooks/integration-tests/team-user-hooks-integration.test.tsx)
- [Subscription-Feature hooks integration test](../application/subscription/hooks/integration-tests/subscription-feature-integration.test.tsx)
- [Organization-Team hooks integration test](../application/organization/hooks/integration-tests/organization-team-integration.test.tsx)
- [DomainServiceTestHelper](../../src/test-utils/helpers/DomainServiceTestHelper.ts)
- [Testing Library dokumentation](https://testing-library.com/docs/react-testing-library/intro/)
- [React Query testning](https://tanstack.com/query/latest/docs/react/guides/testing)

## Lösningar för JSDOM-miljö och React Query-hooks

När man testar hooks som använder React Query tillsammans med React DOM-funktionalitet kan man stöta på flera problem. Här beskriver vi de lösningar vi implementerat för att få stabila och pålitliga tester.

### JSDOM-konfiguration

För hooks-tester som kräver DOM-funktionalitet har vi skapat en separat Jest-konfiguration:

```javascript
// jest.config.jsdom.js
module.exports = {
  rootDir: '.',
  displayName: 'hooks-jsdom',
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/src/application/shared/hooks/__tests__/createStandardizedHook.test.tsx',
    '<rootDir>/src/application/subscription/hooks/__tests__/useSubscriptionStandardized.test.tsx'
    // Lägg till fler test-matcher här
  ],
  // ... övrig konfiguration ...
  setupFilesAfterEnv: [
    '<rootDir>/jest.hooks.setup.js'
  ],
  // ... transformIgnorePatterns, etc ...
}
```

### Mock-implementationer för DOM

För att stödja DOM-relaterade funktioner i hooks-tester har vi skapat en specialiserad setup-fil:

```javascript
// jest.hooks.setup.js
// Sätt upp DOM-miljö för hook-tester
if (typeof document === 'undefined') {
  global.document = {
    createElement: jest.fn(() => ({})),
    createTextNode: jest.fn(() => ({})),
    querySelector: jest.fn(() => ({})),
  };
  global.window = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    document: global.document,
  };
}

// Mocka react-native komponenter som används i testerna
jest.mock('react-native', () => ({ /* ... mockar för RN ... */ }));

// Lägg till DOM-testning matchers
expect.extend({
  toBeInTheDocument(received) {
    const pass = !!received;
    if (pass) {
      return {
        message: () => `expected element not to be in the document`,
        pass: true
      };
    } else {
      return {
        message: () => `expected element att finnas i dokumentet`,
        pass: false
      };
    }
  },
  // ... fler matchers ...
});
```

### Säker mockning av hooks

När man använder `jest.mock()` för att mocka hooks har vi upptäckt att React inte kan användas inuti mockimplementationen. En lösning är att använda separata mock-funktioner:

```typescript
// Mock för hooks utanför jest.mock
const mockUseOrganizationSubscription = jest.fn();
const mockUseFeatureFlag = jest.fn();
const mockUseUpdateSubscriptionStatus = jest.fn();
const mockUseTrackUsage = jest.fn();

// Mock för context som returnerar våra mockade hooks
jest.mock('../useSubscriptionContext', () => {
  return {
    __esModule: true,
    useSubscriptionContext: () => ({
      subscriptionRepository: mockSubscriptionRepository,
      featureFlagService: { /* ... mockad service ... */ },
      usageTrackingService: { /* ... mockad service ... */ }
    }),
    useSubscription: () => ({
      useOrganizationSubscription: mockUseOrganizationSubscription,
      useFeatureFlag: mockUseFeatureFlag,
      useUpdateSubscriptionStatus: mockUseUpdateSubscriptionStatus,
      useTrackUsage: mockUseTrackUsage
    })
  };
});
```

Sedan implementerar vi beteendet för varje mockad hook i testets setup:

```typescript
beforeEach(() => {
  // ... övrig setup ...
  
  // Reset mocks
  mockUseOrganizationSubscription.mockReset();
  mockUseFeatureFlag.mockReset();
  // ... reset för andra mockar ...
  
  // Implementera beteende för specifika test
  mockUseOrganizationSubscription.mockImplementation((id) => {
    return {
      data: id === orgId ? mockSubscription : null,
      isLoading: false,
      error: null
    };
  });
  // ... implementera andra hooks ...
});
```

### Batch-filer för att köra testerna

För att enkelt kunna köra hooks-tester med rätt konfiguration har vi skapat batch-filer:

```batch
@echo off
echo Kör subscription hook-tester med JSDOM-miljö

REM Sätt testmiljövariabel
set TEST_ENV=jsdom

REM Kör alla subscription-tester med JSDOM-miljö och konfiguration
node --no-warnings node_modules/jest/bin/jest.js src/application/subscription/hooks/__tests__ --testTimeout=10000 --testEnvironment=jsdom --config=jest.config.jsdom.js

REM Visa resultat
echo Testresultat:
echo Avslutningskod: %errorlevel%

if %errorlevel% NEQ 0 (
  echo Testningen misslyckades!
) else (
  echo Alla tester passerade.
)

pause
```

### Exempel: Test för React Query hooks

Här är ett exempel på hur man kan testa en React Query-hook:

```typescript
describe('useOrganizationSubscription', () => {
  it('should load a subscription by organization id', async () => {
    // Arrange
    const orgId = 'test-org-id';
    const mockSubscription = {
      id: 'sub-1',
      organizationId: orgId,
      status: 'active',
      planId: 'premium',
      currentPeriodEnd: new Date().toISOString()
    };
    
    // Implementera mockad hook-beteende
    mockUseOrganizationSubscription.mockImplementation((id) => {
      return {
        data: id === orgId ? mockSubscription : null,
        isLoading: false,
        error: null
      };
    });

    // Act
    const OrganizationSubscriptionTest = () => {
      const { useOrganizationSubscription } = useSubscription();
      const { data: subscription, isLoading } = useOrganizationSubscription(orgId);
      
      return (
        <div>
          {isLoading ? (
            'Laddar...'
          ) : subscription ? (
            `Prenumeration: ${subscription.planId}`
          ) : (
            'Ingen prenumeration hittades'
          )}
        </div>
      );
    };

    render(
      <QueryClientProvider client={queryClient}>
        <OrganizationSubscriptionTest />
      </QueryClientProvider>
    );
    
    // Assert
    expect(screen.getByText(/Prenumeration/)).toBeInTheDocument();
    expect(mockUseOrganizationSubscription).toHaveBeenCalledWith(orgId);
  });
});
```

### Learnings och best practices

1. **Undvik React i jest.mock()**: Använd aldrig React-hooks eller andra React-funktioner direkt inom en jest.mock()-implementation.

2. **Separera mockning från test-logik**: Implementera mock-beteende i beforeEach() eller direkt i testet, inte i mock-deklarationen.

3. **Använd dedikerad JSDOM-konfiguration**: Separata konfigurationsfiler för DOM-beroende tester ger bättre kontroll och isolering.

4. **Implementera DOM-matchers**: Tillhandahåll egna implementationer av .toBeInTheDocument() och andra DOM-relaterade matchers.

5. **Hantera React Query-specifik testning**: Använd mockning för React Query-tester istället för att förlita dig på faktiska anrop.

Genom att följa dessa riktlinjer har vi kunnat skapa robusta tester för våra React Query-hooks som tidigare misslyckades på grund av JSDOM-miljöfel och andra problem.

## Lösningar för timing-problem i React Query-hook tester

Under vårt arbete med att fixa hooks-tester har vi upptäckt flera återkommande problem med asynkrona tester och React Query, särskilt i JSDOM-miljön. Här är de problem vi har stött på och de lösningar vi har implementerat:

### Problem 1: batchNotifyFn-felet

Ett vanligt fel i React Query-tester i JSDOM-miljö är:

```
TypeError: batchNotifyFn is not a function
```

Detta beror på att React Query:s notifyManager implementerar batchNotifyFn annorlunda i olika miljöer.

**Lösningen** vi implementerade var att mocka React Query:s notifyManager:

```javascript
// I jest.hooks.setup.js
jest.mock('@tanstack/react-query', () => {
  const originalModule = jest.requireActual('@tanstack/react-query');
  
  // Skapa en anpassad notifierare som löser batchNotifyFn-problemet
  const createNotifyManager = () => {
    let queue = [];
    let transactions = 0;
    
    const batch = (callback) => {
      transactions++;
      try {
        callback();
      } finally {
        transactions--;
        if (transactions === 0) {
          const originalQueue = [...queue];
          queue = [];
          originalQueue.forEach(callback => {
            callback();
          });
        }
      }
    };
    
    const schedule = (callback) => {
      if (transactions > 0) {
        queue.push(callback);
      } else {
        callback();
      }
    };
    
    const batchNotifyFn = (callback) => {
      batch(() => {
        callback();
      });
    };
    
    return {
      batch,
      schedule,
      batchNotifyFn,
    };
  };
  
  // Ersätt med den anpassade notifieraren
  const notifyManager = createNotifyManager();
  
  return {
    ...originalModule,
    // Överskrid QueryClient för att använda den anpassade notifieraren
    QueryClient: class CustomQueryClient extends originalModule.QueryClient {
      constructor(config) {
        super({
          ...config,
          // Förhindra återförsök i tester
          defaultOptions: {
            ...config?.defaultOptions,
            queries: {
              retry: false,
              cacheTime: 0,
              staleTime: 0,
              ...config?.defaultOptions?.queries,
            },
          },
        });
        
        // Ersätt om notifyManager används internt
        this.notifyManager = notifyManager;
      }
    },
    // Gör notifieraren tillgänglig
    notifyManager,
  };
});
```

### Problem 2: Timing-problem med asynkrona tillstånd

Ett annat vanligt problem är att hooks förblir i `loading`-tillstånd i testerna trots att de borde ha ändrats till `success` eller `error`. Detta inträffar när React inte hinner uppdatera komponenttillståndet mellan asynkrona operationer.

**Lösningen** vi implementerade använder en kombination av `sleep` och `rerender`:

```typescript
// Hjälpfunktion för att vänta på asynkrona uppdateringar
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// I testet
it('should load data correctly', async () => {
  // Arrangera
  mockRepository.findById.mockImplementation(async () => {
    // Simulera nätverksfördröjning
    await sleep(50);
    return Result.ok(mockData);
  });
  
  // Act
  const { rerender } = render(
    <QueryClientProvider client={queryClient}>
      <TestComponent id="test-id" />
    </QueryClientProvider>
  );
  
  // Verifiera initial loading
  expect(screen.getByTestId('loading')).toBeInTheDocument();
  
  // Vänta på datahämtning och uppdatera komponenten
  await sleep(500); // Tillräckligt lång tid för asynkron operation
  rerender(
    <QueryClientProvider client={queryClient}>
      <TestComponent id="test-id" />
    </QueryClientProvider>
  );
  
  // Extra tid för att stateuppdatering ska ske
  await sleep(500);
  
  // Nu kontrollera att rätt data visas
  expect(screen.getByTestId('data')).toHaveTextContent('Expected content');
});
```

Nyckelinsikter:
1. **Använd rimliga sleep-värden** - 100-500ms är ofta tillräckligt
2. **Kalla på rerender efter varje betydande asynkron operation** - Detta tvingar React att uppdatera vyn
3. **Använd data-testid attribut** - Detta gör testerna mer robusta mot UI-förändringar
4. **Gör defensiva kontroller** - Använd `queryByTestId` istället för `getByTestId` för att undvika fel om element inte finns

### Problem 3: Problem med waitFor och findBy

Ett tredje problem är att `waitFor` och `findBy*`-metoderna från testing-library kan time-outa innan React Query har uppdaterat tillståndet.

**Lösningen** vi implementerade ersätter dessa med manuella kontroller:

```typescript
// Istället för detta (som kan time-outa)
await waitFor(() => {
  expect(screen.getByTestId('data')).toBeInTheDocument();
});

// Använd detta mönster
await sleep(300);
rerender(/* samma komponent */);
await sleep(300);

// Sen gör en defensiv kontroll
const loadingElement = screen.queryByTestId('loading');
const errorElement = screen.queryByTestId('error');
const dataElement = screen.queryByTestId('data');

if (dataElement) {
  // Förväntad framgång - data visas
  expect(dataElement).toHaveTextContent('Expected content');
  expect(loadingElement).toBeNull(); // Säkerställ att vi inte är i loading
} else if (loadingElement) {
  // Fortfarande i loading-tillstånd - detta är ett fel
  throw new Error('Testet förblev i laddningsstate efter timeout');
} else if (errorElement) {
  // Fel uppstod när vi förväntade oss data
  throw new Error(`Oväntat fel: ${errorElement.textContent}`);
} else {
  // Inget av de förväntade elementen hittades
  throw new Error('Ingen förväntad rendering hittades');
}
```

### Problem 4: Retry-operationer i hooks

Ett fjärde problem är specifikt för tester som involverar retry-funktionalitet, där tillståndet inte uppdateras korrekt efter ett anrop till `retry()`.

**Lösningen** vi implementerade:

```typescript
// Testa retry-funktionalitet
it('ska kunna utföra återförsök för nätverksfel', async () => {
  // Arrangera - första anropet misslyckas, andra lyckas
  mockUseCase.execute
    .mockImplementationOnce(async () => {
      await sleep(50);
      return Result.fail({ message: 'Network error', statusCode: 500 });
    })
    .mockImplementationOnce(async () => {
      await sleep(50);
      return Result.ok(mockData);
    });
  
  // Act - första anropet
  const { result, waitForNextUpdate } = renderHook(() => useMyStandardHook());
  
  act(() => {
    result.current.execute({ id: 'test-id' });
  });
  
  // Vänta på första operationens resultat
  await waitForNextUpdate();
  await act(async () => { await sleep(100); });
  
  // Verifiera att första anropet misslyckades
  expect(result.current.status).toBe('error');
  
  // Utför återförsök och se till att state uppdateras direkt
  await act(async () => {
    result.current.retry();
    // Kort väntan för att låta statusuppdateringen ske
    await sleep(10);
  });
  
  // Verifiera att vi nu är i loading state
  expect(result.current.status).toBe('loading');
  
  // Vänta på det andra anropets resultat
  await waitForNextUpdate();
  await act(async () => { await sleep(100); });
  
  // Verifiera slutresultatet
  expect(result.current.status).toBe('success');
  expect(result.current.data).toEqual(mockData);
});
```

### Bästa praxis för testning av React Query hooks

Baserat på våra erfarenheter rekommenderar vi följande bästa praxis:

1. **Isolera QueryClient i varje test** - Skapa en ny QueryClient i `beforeEach` med rätt konfiguration:
   ```typescript
   let queryClient: QueryClient;
   
   beforeEach(() => {
     queryClient = new QueryClient({
       defaultOptions: {
         queries: {
           retry: false,
           cacheTime: 0,
           staleTime: 0,
         },
       },
     });
   });
   ```

2. **Använd explicit mock-implementation** - Använd `mockImplementation` med asynkrona funktioner istället för `mockResolvedValue`:
   ```typescript
   // Bättre
   mockRepository.findById.mockImplementation(async () => {
     await sleep(50);
     return Result.ok(mockData);
   });
   
   // Sämre
   mockRepository.findById.mockResolvedValue(Result.ok(mockData));
   ```

3. **Testa både initial rendering och slutligt tillstånd** - Verifiera att komponenten börjar i loading-läge:
   ```typescript
   // Först verifiera loading
   expect(screen.getByTestId('loading')).toBeInTheDocument();
   
   // Sedan vänta och verifiera slutresultatet
   ```

4. **Använd act och sleep i kombination**:
   ```typescript
   await act(async () => {
     await sleep(200);
   });
   ```

5. **Verifiera att mockar anropas med rätt parametrar**:
   ```typescript
   expect(mockRepository.findById).toHaveBeenCalledWith(
     expect.objectContaining({ id: expectedId })
   );
   ```

Genom att följa dessa mönster har vi kunnat lösa de flesta av våra timing-problem med React Query hooks-tester och skapat mer robusta och pålitliga tester.