# Best Practices för Standardiserade React Query Hooks

Detta dokument beskriver best practices för att använda och utveckla standardiserade React Query hooks i Pling-mobile. Baserat på erfarenheter från arbetet med att standardisera Team, User och Organization domänerna.

## Grundläggande principer

### 1. Konsekvent namngivning

Använd konsekvent namngivning för alla hooks:

```typescript
// Queries (hämta data)
useGetEntity           // Hämta en enskild entitet
useGetEntities         // Hämta flera entiteter
useGetEntityByX        // Hämta entitet baserat på annan parameter

// Mutations (ändra data)
useCreateEntity        // Skapa ny entitet
useUpdateEntity        // Uppdatera existerande entitet
useDeleteEntity        // Radera entitet
useXEntity             // Annan operation på entitet (t.ex. useActivateUser)
```

### 2. Standardiserad felhantering

Använd `HookErrorCode` enum för att ge konsekvent felklassificering:

```typescript
throw {
  code: HookErrorCode.API_ERROR,  // eller annan lämplig kod
  message: `Kunde inte hämta data: ${result.error}`,
  context: { domain: 'domännamn', operation: 'operationsnamn', id: entityId }
};
```

### 3. Tydliga typdeklarationer

Var tydlig med typer för både parametrar och returvärden:

```typescript
const useGetTeam = createStandardizedQuery<Team, [string | undefined]>({
  // ... implementation
});
```

## Struktur för hooks-filer

### 1. Organisation

Samla alla relaterade hooks i en fil med tydlig namngivning:

```typescript
// useEntityWithStandardHook.ts
export function useEntityWithStandardHook() {
  // ... hooks implementation

  return {
    // Queries
    useGetEntity,
    useGetEntities,
    
    // Mutations
    useCreateEntity,
    useUpdateEntity,
    useDeleteEntity,
  };
}
```

### 2. Queries vs Mutations

Separera tydligt mellan queries och mutations med kommentarer:

```typescript
// ==================== QUERIES ====================

// Query implementations...

// ==================== MUTATIONS ====================

// Mutation implementations...
```

## Implementationsmönster

### 1. Queries (hämta data)

```typescript
const useGetEntity = createStandardizedQuery<Entity, [string | undefined]>({
  queryKeyPrefix: 'entity',
  buildQueryKey: (params) => {
    const entityId = params?.[0] ?? '';
    return ['entity', entityId];
  },
  queryFn: async (entityId) => {
    if (!entityId) return null;
    
    logger.info('Hämtar entitet', { entityId });
    const result = await entityRepository.findById(entityId);
    return unwrapResult(result);
  },
  enabled: (params) => {
    const entityId = params?.[0];
    return Boolean(entityId);
  },
  staleTime: 5 * 60 * 1000, // 5 minuter
  errorContext: (params) => {
    const entityId = params?.[0] ?? '';
    return createErrorContext('getEntity', { entityId });
  },
  retry: 2
});
```

### 2. Mutations (ändra data)

```typescript
const useCreateEntity = createStandardizedMutation<Entity, CreateEntityDTO>({
  mutationFn: async (params, updateProgress) => {
    logger.info('Skapar ny entitet', { params });
    
    updateProgress?.({ percent: 30, message: 'Validerar...' });
    
    const result = await createEntityUseCase.execute(params);
    
    updateProgress?.({ percent: 100, message: 'Klart!' });
    
    return unwrapResult(result);
  },
  invalidateQueryKey: (params) => [
    ['entities', params.ownerId]
  ],
  optimisticUpdate: {
    queryKey: ['entities', params => params.ownerId],
    updateFn: (oldData: Entity[], variables) => {
      if (!oldData) return oldData;
      
      // Optimistisk uppdatering...
      return [...oldData, { ...variables, id: 'temp-id' }];
    }
  },
  errorContext: (params) => createErrorContext('createEntity', { params })
});
```

## Testning

### 1. Testa queries och mutations separat

Skapa separata testfiler för olika typer av tester:

- `useEntityWithStandardHook.queries.test.ts` - för query-tester
- `useEntityWithStandardHook.direct.test.ts` - för mutation-tester med direkta anrop

### 2. Query-tester

Använd `waitFor` för att vänta på att queries ska slutföras:

```typescript
test('useGetEntity hämtar data korrekt', async () => {
  // Rendera hooken
  const { result, waitFor } = renderHookWithQueryClient(() => {
    const { useGetEntity } = useEntityWithStandardHook();
    return useGetEntity('entity-123');
  });

  // Vänta på att data har laddats
  await waitFor(() => !result.current.isLoading);

  // Verifiera resultatet
  expect(mockRepository.findById).toHaveBeenCalledWith('entity-123');
  expect(result.current.data).toEqual(mockEntity);
  expect(result.current.isLoading).toBe(false);
  expect(result.current.isError).toBe(false);
});
```

### 3. Mutation-tester

Använd `mutateAsync` direkt för att förenkla testning:

```typescript
test('useCreateEntity anropar repository med korrekta parametrar', async () => {
  // Rendera hook
  const { result } = renderHookWithQueryClient(() => {
    const { useCreateEntity } = useEntityWithStandardHook();
    return useCreateEntity();
  });

  // Förbered input data
  const createInput = {
    name: 'Test Entity',
    ownerId: 'user-123'
  };

  // Anropa mutateAsync direkt
  await result.current.mutateAsync(createInput);

  // Verifiera att repository-metoden anropades med rätt parametrar
  expect(mockCreateEntityUseCase.execute).toHaveBeenCalledWith(createInput);
});
```

### 4. Integrationstester

För att testa komplexa flöden som involverar flera domäner:

```typescript
test('Kan skapa entitet och uppdatera relaterad entitet', async () => {
  // 1. Skapa hooks för varje steg i flödet
  const createEntityHook = renderHookWithQueryClient(() => {
    const { useCreateEntity } = useEntityWithStandardHook();
    return useCreateEntity();
  });
  
  const updateRelatedHook = renderHookWithQueryClient(() => {
    const { useUpdateRelated } = useRelatedWithStandardHook();
    return useUpdateRelated();
  });

  // 2. Utför stegen i sekvens
  await createEntityHook.result.current.mutateAsync(createInput);
  await updateRelatedHook.result.current.mutateAsync(updateInput);
  
  // 3. Verifiera att båda operationerna utfördes korrekt
  expect(mockCreateEntityUseCase.execute).toHaveBeenCalledWith(createInput);
  expect(mockUpdateRelatedUseCase.execute).toHaveBeenCalledWith(updateInput);
});
```

## Optimistisk uppdatering

### 1. Grundläggande mönster

```typescript
optimisticUpdate: {
  queryKey: ['entity', params => params.entityId],
  updateFn: (oldData: Entity, variables) => {
    if (!oldData) return oldData;
    
    return {
      ...oldData,
      // Uppdatera relevanta fält baserat på variables
      name: variables.name ?? oldData.name,
      // ...andra fält
    };
  }
}
```

### 2. Uppdatera listor

```typescript
optimisticUpdate: {
  queryKey: ['entities'],
  updateFn: (oldData: Entity[], variables) => {
    if (!oldData) return oldData;
    
    // Lägga till i lista
    return [...oldData, newEntity];
    
    // Eller uppdatera i lista
    return oldData.map(item => 
      item.id === variables.id 
        ? { ...item, ...variables } 
        : item
    );
    
    // Eller ta bort från lista
    return oldData.filter(item => item.id !== variables.id);
  }
}
```

## Cache-hantering

### 1. StaleTime

Välj lämplig `staleTime` baserat på hur ofta data ändras:

```typescript
// Data som sällan ändras
staleTime: 10 * 60 * 1000, // 10 minuter

// Data som ändras ofta
staleTime: 30 * 1000, // 30 sekunder

// Kritisk data som behöver vara uppdaterad
staleTime: 0, // Alltid hämta ny data
```

### 2. Invalidering av cache

Invalidera relaterad data när en mutation har slutförts:

```typescript
invalidateQueryKey: (variables) => [
  ['entity', variables.id],            // Den specifika entiteten
  ['entities'],                        // Listan med alla entiteter
  ['related', variables.relatedId]     // Relaterad data
]
```

## Felhantering

### 1. Error Retry

Konfigurera retry-beteende baserat på operationstyp:

```typescript
// För queries som kan misslyckas pga nätverksproblem
retry: 2,

// För viktiga queries
retry: 3,

// För mutations eller queries som inte bör försökas igen
retry: false,
```

### 2. Error logging

Använd konsekvent loggning vid fel:

```typescript
if (result.isFailure) {
  logger.error('Operationen misslyckades', {
    domain: 'entity',
    operation: 'getEntity',
    error: result.error,
    params: { entityId }
  });
  
  throw { /* error object */ };
}
```

## Prestandaoptimering

### 1. Selective Re-rendering

Använd `useMemo` för att förhindra onödiga omskapanden av hooks:

```typescript
return useMemo(() => ({
  useGetEntity,
  useCreateEntity,
  // ...
}), [
  useGetEntity,
  useCreateEntity,
  // ...
]);
```

### 2. Deaktivera queries när de inte behövs

```typescript
enabled: (params) => {
  const entityId = params?.[0];
  return Boolean(entityId) && otherCondition;
},
```

## Versionshantering och kompabilitet

När hooks behöver ändras:

1. Skapa en ny version av hooken (t.ex. `useEntityWithStandardHookV2`)
2. Fortsätt att stödja den gamla versionen tills all kod har migrerats
3. Dokumentera skillnader mellan versionerna och migreringsväg
4. När all användning har migrerats, markera den gamla versionen som deprecated

## Dokumentation

För nya hooks, dokumentera:

1. Parametrar och returvärden
2. Exempel på användning
3. Felhantering
4. Caching-beteende
5. Optimistiska uppdateringar (om tillämpligt)

## Verktyg för code generation

För att förenkla skapandet av nya standardiserade hooks, överväg att bygga code generation-verktyg som:

1. Genererar grundläggande hook-struktur
2. Skapar tillhörande testfiler
3. Håller reda på beroenden
4. Genererar typdeklarationer

---

Genom att följa dessa best practices kan vi säkerställa att alla hooks i applikationen är konsekventa, testbara och underhållbara. 