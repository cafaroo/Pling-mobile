# Standardiserad React Query-användning

## Bakgrund

Detta dokument beskriver standardiserad användning av React Query i Pling-mobile. Vi har implementerat en konsekvent metodik för att hantera dataaccess, cachning och felhantering med hjälp av React Query och våra egna abstraktioner.

## Nya React Query-hooks

Vi har implementerat två standardiserade sätt för hooks att interagera med data:

1. **Standardiserade queries** - För datahämtning, med cachning och automatisk felhantering
2. **Standardiserade mutations** - För datamodifiering, med optimistisk uppdatering och felhantering

## Att använda standardiserade team-hooks

### Exempel på queries (datahämtning)

```tsx
import { useTeamWithStandardHook } from '@/application/team/hooks/useTeamWithStandardHook';

function TeamDetails({ teamId }) {
  const { useGetTeam } = useTeamWithStandardHook();
  const { data: team, isLoading, error } = useGetTeam(teamId);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <TeamDetailView team={team} />;
}
```

### Exempel på mutations (datamodifiering)

```tsx
import { useTeamWithStandardHook } from '@/application/team/hooks/useTeamWithStandardHook';

function CreateTeamForm() {
  const { useCreateTeam } = useTeamWithStandardHook();
  const { mutate, isLoading, error } = useCreateTeam();
  
  const handleSubmit = (data) => {
    mutate({
      name: data.name,
      description: data.description,
      ownerId: currentUser.id
    });
  };
  
  return (
    <Form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Skapar...' : 'Skapa team'}
      </Button>
      {error && <ErrorMessage error={error} />}
    </Form>
  );
}
```

## Testningsmetoder för React Query hooks

Vid testning av React Query-hooks har vi identifierat flera metoder som fungerar för olika scenarier. Här dokumenterar vi dessa metoder så att teamet kan välja rätt approach beroende på testningens syfte.

### 1. Enkla Query-tester

För att testa grundläggande query-funktionalitet (datahämtning) rekommenderar vi följande mönster:

```typescript
test('Kan hämta team med ID', async () => {
  // Konfigurera mockar
  mockGetTeamUseCase.execute.mockReturnValue(Result.ok(mockTeam));
  
  // Rendera hooken
  const { result, waitFor } = renderHookWithQueryClient(() => {
    const { useGetTeam } = useTeamWithStandardHook();
    return useGetTeam('team-123');
  });

  // Vänta på att data har laddats
  await waitFor(() => !result.current.isLoading);

  // Verifiera resultat
  expect(mockGetTeamUseCase.execute).toHaveBeenCalledWith({ teamId: 'team-123' });
  expect(result.current.data).toEqual(mockTeam);
  expect(result.current.isLoading).toBe(false);
  expect(result.current.isError).toBe(false);
});
```

Denna metod fungerar väl eftersom queries automatiskt körs när komponenten renderas och vi kan vänta på att laddningen slutförs innan vi verifierar resultatet.

### 2. Direkta Mutation-tester

För mutations rekommenderar vi att använda mutateAsync-metoden direkt, vilket ger bättre kontroll över testflödet och undviker problem med React Query's asynkrona beteende:

```typescript
test('createTeam anropar use case med korrekta parametrar', async () => {
  // Konfigurera mock
  mockCreateTeamUseCase.execute.mockResolvedValue(Result.ok(mockTeam));
  
  // Rendera hook
  const { result } = renderHookWithQueryClient(() => {
    const { useCreateTeam } = useTeamWithStandardHook();
    return useCreateTeam();
  });

  // Förbered input data
  const createTeamInput = {
    name: 'Test Team',
    description: 'Ett testteam',
    ownerId: 'user-123'
  };

  // Anropa mutateAsync direkt istället för mutate
  await result.current.mutateAsync(createTeamInput);

  // Verifiera att use case anropades med rätt parametrar
  expect(mockCreateTeamUseCase.execute).toHaveBeenCalledWith(createTeamInput);
});
```

Denna metod är överlägsen för mutations jämfört med att använda mutate + act, eftersom den väntar tills mutationen är klar, vilket ger mer förutsägbara tester.

### 3. Testning av optimistiska uppdateringar

För att testa optimistiska uppdateringar behöver vi en mer avancerad approach:

```typescript
test('addTeamMember utför optimistisk uppdatering', async () => {
  // Skapa en QueryClient med förfylld cache
  const initialTeam = { 
    ...mockTeam, 
    members: [{ id: 'user-1', role: 'admin' }] 
  };
  
  // Rendera hook med förfylld cache
  const { result } = renderHookWithQueryClient(() => {
    const { useAddTeamMember } = useTeamWithStandardHook();
    return useAddTeamMember();
  }, { 
    initialQueryData: { 
      'team,team-123': initialTeam 
    } 
  });

  // Input för att lägga till medlem
  const newMember = {
    teamId: 'team-123',
    userId: 'user-2',
    role: 'member'
  };
  
  // Starta mutation men låt den inte slutföras än
  const mutationPromise = result.current.mutateAsync(newMember);
  
  // Kontrollera cache direkt efter att mutation startats (optimistisk uppdatering)
  const queryClient = result.current.client;
  const cachedData = queryClient.getQueryData(['team', 'team-123']);
  
  // Verifiera optimistisk uppdatering
  expect(cachedData.members).toHaveLength(2);
  expect(cachedData.members).toContainEqual({
    id: 'user-2',
    role: 'member'
  });
  
  // Nu kan vi låta mutationen slutföras
  await mutationPromise;
});
```

### 4. Testning av felhantering

För att testa felhantering i hooks:

```typescript
test('useGetTeam hanterar API-fel korrekt', async () => {
  // Konfigurera mock att returnera fel
  mockGetTeamUseCase.execute.mockReturnValue(
    Result.fail({
      message: 'Server error',
      statusCode: 500
    })
  );
  
  // Rendera hooken
  const { result, waitFor } = renderHookWithQueryClient(() => {
    const { useGetTeam } = useTeamWithStandardHook();
    return useGetTeam('team-123');
  });
  
  // Vänta på att laddningen slutförs med error
  await waitFor(() => !result.current.isLoading);
  
  // Verifiera felresultat
  expect(result.current.isError).toBe(true);
  expect(result.current.error).toBeDefined();
  expect(result.current.error?.code).toBe(HookErrorCode.API_ERROR);
  expect(result.current.error?.message).toContain('Server error');
});
```

## Best Practices för React Query-hooks

### 1. Strukturera hooks konsekvent

- Håll alla team-relaterade hooks i en enda exporterad funktion
- Följ samma mönster för query- och mutation-skapande
- Gruppera hooks efter domän (team, user, organization, etc.)

### 2. Felhantering

- Använd alltid `HookErrorCode` för enhetlig felrapportering
- Inkludera domän och operation i felkontexten
- Exponera detaljerade felmeddelanden för UI-lagret

### 3. Cache-hantering

- Definiera lämpliga `staleTime`-värden baserat på data-typ
- Använd `invalidateQueries` konsekvent för att uppdatera relaterad data
- Definiera tydliga `queryKey`-strukturer för bättre debugging

### 4. Optimistisk uppdatering

- Implementera optimistisk uppdatering för alla mutations som ändrar befintlig data
- Använd `updateFn` för att modifiera cachad data optimistiskt
- Verifiera att rollback fungerar korrekt vid fel

## Övergångsstrategi

För att migrera existerande hooks till det standardiserade formatet:

1. Identifiera befintliga hooks som använder React Query
2. Skapa nya hooks med `createStandardizedQuery` och `createStandardizedMutation`
3. Implementera enkla tester för grundläggande funktionalitet
4. Uppdatera komponenter att använda de nya standardiserade hooksen
5. Utöka testerna med mer avancerade scenarier (optimistisk uppdatering, felhantering, etc.)

## Testningsutmaningar och lösningar

Under implementationen av standardiserade React Query hooks har vi stött på flera utmaningar:

### Problem: `act`-varningar i konsolen

**Lösning:** Använd `waitFor` från `@testing-library/react-hooks` istället för direkt assertions efter operationer. För mutations, föredra `mutateAsync` över `mutate`.

### Problem: Laddningstillstånd flimrar i tester

**Lösning:** Använd `initialQueryData` i `renderHookWithQueryClient` för att förfylla cachen, och observera tydligt övergången från laddat till framgångsrikt tillstånd.

### Problem: Mockade use cases anropas inte

**Lösning:** För query-hooks är detta sällan ett problem eftersom de körs automatiskt. För mutation-hooks, använd `mutateAsync` direkt och vänta på resultatet innan assertions görs.

### Problem: Hantering av optimistisk uppdatering i tester

**Lösning:** Använd vår specifika optimistic-update testmetod som granskar cache-innehåll före och efter mutation. Se avsnittet "Testning av optimistiska uppdateringar" ovan.

## Vanliga felmeddelanden och vad de betyder

| Felmeddelande | Orsak | Lösning |
|---------------|-------|---------|
| "Warning: An update to TestComponent inside a test was not wrapped in act(...)" | React-uppdateringar i testkomponenten sker utanför `act` | Använd `mutateAsync` och `await` eller explicit `act(async () => { ... })` |
| "Cannot destructure property 'data' of undefined" | Hook inte korrekt renderad eller initialiserad | Kontrollera att hooken returnerar rätt struktur och att du använder rätt mock-data |
| "Timed out in waitFor" | Villkoret i `waitFor` uppfylls aldrig | Kontrollera att mockad data returneras korrekt och att villkoret är rimligt |
| "A component suspended" | React Query suspense-läge aktiverat utan Suspense-wrapper | Inaktivera suspense i testmiljö eller omslut med `<Suspense fallback={...}>` |

## Nästa steg för React Query-standardisering

1. Slutför standardiseringen av `useUserWithStandardHook`
2. Skapa standardhooks för Organization-domänen
3. Förbättra TestHelper för mer specialiserade testscenarier
4. Integrera med serverstatus-hantering för offline-funktionalitet 