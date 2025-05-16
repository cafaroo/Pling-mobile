# Dataflödesmönster i Pling-mobile

Detta dokument beskriver de standardiserade dataflödesmönstren i Pling-mobile applikationen, med fokus på hur data flödar från domänlagret genom applikationslagret till användargränssnittet, samt tillbaka.

## Innehåll

1. [Övergripande arkitektur](#övergripande-arkitektur)
2. [Dataflödesmodell](#dataflödesmodell)
3. [Domänlager till UI](#domänlager-till-ui)
4. [UI till Domänlager](#ui-till-domänlager)
5. [Hooks-integration i skärmar](#hooks-integration-i-skärmar)
6. [React Query-implementering](#react-query-implementering)
7. [Container/Presentation-mönstret](#containerpresentation-mönstret)
8. [Felhantering och laddningstillstånd](#felhantering-och-laddningstillstånd)
9. [Exempelimplementationer](#exempelimplementationer)

## Övergripande arkitektur

Pling-mobile följer Domain-Driven Design (DDD) principer med en tydlig separation mellan:

1. **Domänlager** - Innehåller domänmodellen, entiteter, värde-objekt och domäntjänster
2. **Applikationslager** - Innehåller use cases, DTOs, hooks och queries
3. **Infrastrukturlager** - Innehåller repositorier, API-klienter och externa integrationer
4. **UI-lager** - Innehåller React Native komponenter, skärmar och presentationslogik

Dataflödet mellan dessa lager följer principer för enkelriktad dataflöde och ren arkitektur.

## Dataflödesmodell

Dataflödet i applikationen följer huvudsakligen denna modell:

```
┌────────────────┐         ┌────────────────┐         ┌────────────────┐         ┌────────────────┐
│                │         │                │         │                │         │                │
│   UI-Lager     │◄────────│ Applikations-  │◄────────│ Infrastruktur- │◄────────│ Externa        │
│                │         │   lager        │         │   lager        │         │ tjänster       │
│                │────────►│                │────────►│                │────────►│                │
└────────────────┘         └────────────────┘         └────────────────┘         └────────────────┘
       ▲                          ▲                          ▲
       │                          │                          │
       │                          │                          │
       │                          │                          │
       │                          │                          │
       ▼                          ▼                          ▼
┌────────────────┐         ┌────────────────┐         ┌────────────────┐
│                │         │                │         │                │
│  UI-komponenter│         │    Hooks       │         │   Repositorier │
│  & screens     │         │    & use cases │         │   & mappers    │
│                │         │                │         │                │
└────────────────┘         └────────────────┘         └────────────────┘
```

## Domänlager till UI

### 1. Datahämtningsflöde

```
Domänentitet → Repository → Use Case → DTO → Hook → Container → Presentation
```

Exempel med `TeamActivitiesScreen`:

1. `TeamActivity`-entitet lagras i databasen
2. `TeamActivityRepository` hämtar rådata från databasen
3. `GetTeamActivitiesUseCase` anropar repository och konverterar till DTOs
4. `useTeamActivities`-hook exponerar data och operationer till UI-lagret
5. `TeamActivitiesScreenContainer` använder hook och förbereder data för UI
6. `TeamActivitiesScreenPresentation` renderar data

### 2. Cachingstrategier

Data cache hanteras via React Query på flera nivåer:

- **Standardcaching** - Cachedata med inställd `staleTime` och `cacheTime`
- **Optimistisk uppdatering** - Uppdatera cache innan serveroperationer slutförs
- **Validering** - Automatisk eller manuell invalidering av cache vid uppdateringar
- **Prefetching** - Förhandshämtning av data för att förbättra användarupplevelsen

## UI till Domänlager

### 1. Mutation och uppdateringsflöde

```
Användaråtgärd → Presentation → Container → Hook → Use Case → Repository → Domänentitet
```

Exempel med skapande av aktivitet:

1. Användaren initierar en åtgärd i `TeamActivitiesScreenPresentation`
2. Callback skickas till `TeamActivitiesScreenContainer`
3. Container anropar `createActivity`-funktionen från `useTeamActivities`
4. Hooken anropar `CreateTeamActivityUseCase`
5. Use case validerar data och anropar `TeamActivityRepository`
6. Repositoryn skapar och sparar en ny `TeamActivity`-entitet

### 2. Domänevents och sidobehövningar

Efter en mutation kan domänevents utlösas:

```
Repository → Domänevents → EventHandlers → Ytterligare Repositories → Cache-invalidering → UI-uppdatering
```

## Hooks-integration i skärmar

Standardiserad hooks-integration för skärmar följer detta mönster:

### 1. Standardiserade hooks

Alla domänspecifika operationer är kapslade i standardiserade hooks:

- `useTeamWithStandardHook` - Hantering av team-relaterade operationer
- `useUserWithStandardHook` - Hantering av användarrelaterade operationer
- `useOrganizationWithStandardHook` - Hantering av organisationsrelaterade operationer

Specialiserade hooks för specifika funktioner:
- `useTeamActivities` - För hantering av team-aktiviteter
- `useTeamMembers` - För hantering av teammedlemmar
- etc.

### 2. Hook-användning i containers

Container-komponenter använder hooks för att:

1. Hämta data via query-funktioner
2. Tillhandahålla mutations för datamodifiering
3. Hantera laddnings- och feltillstånd
4. Transformera domändata till UI-modeller

```typescript
// Exempel från TeamActivitiesScreenContainer
const { 
  activities, 
  total, 
  hasMore, 
  activityStats,
  isLoading, 
  error, 
  refetch, 
  fetchNextPage 
} = useTeamActivities({
  teamId,
  activityTypes: filteredActivityTypes,
  startDate,
  endDate,
  limit,
  useLazyLoading: true,
  enabled: !!teamId,
  staleTime: 5 * 60 * 1000, // 5 minuter
});
```

## React Query-implementering

React Query används genomgående för datahantering med följande standardmönster:

### 1. Query-konfiguration

```typescript
// Standardparametrar för queries
const {
  data,
  isLoading,
  error,
  refetch
} = useQuery({
  queryKey: ['uniqueQueryKey', id],
  queryFn: async () => {
    const useCase = new SomeUseCase(repository);
    const result = await useCase.execute({ id });
    if (result.isErr()) throw new Error(result.error);
    return result.value;
  },
  staleTime: 5 * 60 * 1000, // 5 minuter standard staleTime
  gcTime: 30 * 60 * 1000,   // 30 minuter standard cacheTime
  retry: 3,                  // Standard återförsök
  refetchOnWindowFocus: false,
  refetchOnMount: true
});
```

### 2. Mutation-konfiguration

```typescript
const mutation = useMutation({
  mutationFn: async (data) => {
    const useCase = new SomeUseCase(repository);
    const result = await useCase.execute(data);
    if (result.isErr()) throw new Error(result.error);
    return result.value;
  },
  onSuccess: (newData) => {
    // Optimistisk uppdatering
    queryClient.setQueryData(['queryKey', id], (oldData) => {
      return { ...oldData, ...newData };
    });
    
    // Eller invalidera cache
    queryClient.invalidateQueries({ queryKey: ['queryKey', id] });
  }
});
```

### 3. Oändlig scrollning

För datalistor med paginering används `useInfiniteQuery`:

```typescript
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage
} = useInfiniteQuery({
  queryKey: ['infiniteQueryKey', id],
  queryFn: ({ pageParam = 0 }) => fetchPage(id, pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  initialPageParam: 0
});
```

## Container/Presentation-mönstret

UI-implementationen följer strikt Container/Presentation-mönstret:

### 1. Container-komponent

Ansvarig för:
- Datahämtning via hooks
- Tillståndshantering
- Data-transformation
- Callback-logik

```typescript
// Containerkomponentens ansvar
const SomeScreenContainer = () => {
  // 1. Datahämtning med hooks
  const { data, isLoading, error } = useSomeHook();
  
  // 2. Tillståndshantering
  const [state, setState] = useState();
  
  // 3. Callback-implementationer
  const handleAction = useCallback(() => {
    // Utför åtgärd
  }, [dependencies]);
  
  // 4. Data-transformation för UI
  const transformedData = useMemo(() => {
    return data?.map(item => ({
      ...item,
      displayValue: formatValue(item.value)
    }));
  }, [data]);
  
  // 5. Rendera presentationskomponent
  return (
    <SomeScreenPresentation
      data={transformedData}
      isLoading={isLoading}
      error={error}
      onAction={handleAction}
    />
  );
};
```

### 2. Presentationskomponent

Ansvarig för:
- Rendering av UI-element
- Användarinteraktion
- Ren UI-logik
- Ingen direkt datahämtning

```typescript
// Presentationskomponentens ansvar
const SomeScreenPresentation = memo(({
  data,
  isLoading,
  error,
  onAction
}) => {
  // Endast UI-logik här, ingen datahämtning
  return (
    <View>
      {isLoading && <LoadingIndicator />}
      {error && <ErrorMessage message={error.message} />}
      <List
        data={data}
        renderItem={({ item }) => (
          <ListItem
            title={item.title}
            onPress={() => onAction(item.id)}
          />
        )}
      />
    </View>
  );
});
```

## Felhantering och laddningstillstånd

### 1. Standardiserad felhantering

Alla hooks exponerar ett konsekvent felmönster:

```typescript
// I hook:
return {
  data,
  isLoading,
  error: queryError ? new Error(queryError.message) : null,
  // ...andra värden
};

// I container:
const { data, isLoading, error } = useSomeHook();

// Hantera fel
const errorInfo = useMemo(() => 
  error ? { message: error.message, retryable: true } : null,
[error]);

// Skicka till presentation
return (
  <SomePresentation
    data={data}
    isLoading={isLoading}
    error={errorInfo}
    onRetry={refetch}
  />
);
```

### 2. Laddningstillstånd

Standardiserade laddningstillstånd hanteras:

```typescript
// Kombination av flera laddningstillstånd
const isAnyLoading = useMemo(() => 
  isLoadingA || isLoadingB || isInitializing,
[isLoadingA, isLoadingB, isInitializing]);

// Skicka till presentation
return (
  <SomePresentation
    isLoading={isAnyLoading}
    isLoadingMore={isLoadingMore}
    // ...andra props
  />
);
```

## Exempelimplementationer

### TeamActivitiesScreen

TeamActivitiesScreen är ett komplett exempel på mönstret:

#### 1. Hook (`useTeamActivities`)

- Tillhandahåller datahämtning med filter och paginering
- Hanterar caching med React Query
- Tillhandahåller optimistisk uppdatering
- Exponerar operationer för att skapa aktiviteter

#### 2. Container (`TeamActivitiesScreenContainer`)

- Använder hooks för datahämtning
- Hanterar filtrering och tillstånd
- Transformerar domändata till UI-modell
- Implementerar callbacks för användarinteraktioner

#### 3. Presentation (`TeamActivitiesScreenPresentation`)

- Renderar aktivitetslista med virtualisering
- Hanterar filtrering och sökning i UI
- Visar korrekt laddnings- och feltillstånd
- Implementerar oändlig scrollning för datalistor

För detaljer, se implementations-koden i:
- `src/application/team/hooks/useTeamActivities.ts`
- `src/ui/team/screens/TeamActivitiesScreen/TeamActivitiesScreenContainer.tsx`
- `src/ui/team/screens/TeamActivitiesScreen/TeamActivitiesScreenPresentation.tsx`

## Bästa praxis

1. **Använd hooks för all datahämtning** - Utför aldrig direkt datahämtning från container-komponenter
2. **Separera presentation från logik** - Håll presentationskomponenter rena från affärslogik
3. **Optimera renderingar** - Använd `useMemo`, `useCallback` och `memo` för att minska onödiga renderingar
4. **Standardisera felhantering** - Använd konsekvent felhanteringsmönster i alla komponenter
5. **Implementera caching strategiskt** - Anpassa staleTime och cacheTime baserat på datatyp
6. **Använd optimistisk uppdatering** - För bättre användarupplevelse vid uppdateringar
7. **Testa dataflödet** - Implementera integrationstester som verifierar hela dataflödet 