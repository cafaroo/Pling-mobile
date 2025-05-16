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