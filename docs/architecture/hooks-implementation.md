# Standardiserad Hook-Implementation för Pling Mobile

Detta dokument beskriver den standardiserade hook-implementationen i Pling Mobile-applikationen, med fokus på konsekvent felhantering, återförsökslogik och testbarhet.

## Innehåll

1. [Översikt](#översikt)
2. [Arkitektur](#arkitektur)
3. [Felhantering](#felhantering)
4. [Återförsöksmekanismer](#återförsöksmekanismer)
5. [Domänspecifika hooks](#domänspecifika-hooks)
6. [Testning](#testning)
7. [Best practices](#best-practices)

## Översikt

Hooks-implementationen i Pling Mobile följer en strukturerad approach baserad på Domain-Driven Design (DDD) principer. Målet är att:

1. Standardisera felhantering över alla hooks
2. Förenkla testning genom konsekvent struktur
3. Tillhandahålla återförsökslogik för nätverksrelaterade operationer
4. Undvika duplicerad kod för vanliga operationer
5. Förbättra användarupplevelsen vid fel

## Arkitektur

### Hook-hierarki

Hooks-systemet är strukturerat i tre huvudnivåer:

```
useStandardizedHook (bas-level)
├── Domain-specifika hooks (useTeamWithStandardHook, useUserWithStandardHook, etc.)
│   └── UI-komponenter
```

### Huvudkomponenter

1. **HookErrorTypes**: Definierar felkoder och hjälpfunktioner för felhantering
2. **useStandardizedOperation**: Bas-hook för icke-återförsöksbara operationer
3. **useStandardizedRetryableOperation**: Bas-hook för operationer med inbyggd återförsökslogik
4. **Domänspecifika hooks**: Implementationer för specifika domäner (Team, User, Organization)
5. **ContextProviders**: Komponentträd för beroendeinjection

### Datastuktur

Operationer i hooks returnerar en konsekvent datastruktur:

```typescript
export interface StandardizedHookOperation<TParams, TResult> {
  execute: (params: TParams) => Promise<Result<TResult>>;
  status: OperationStatus;
  error: HookError | null;
  data: TResult | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  reset: () => void;
}

export interface StandardizedRetryableHookOperation<TParams, TResult> 
  extends StandardizedHookOperation<TParams, TResult> {
  retry: () => Promise<Result<TResult>>;
  retryCount: number;
}
```

## Felhantering

### HookErrorTypes

Vi använder en standardiserad felhanteringsmekanism baserad på `HookErrorTypes.ts`:

```typescript
export enum HookErrorCode {
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED_ERROR = 'UNAUTHORIZED_ERROR',
  FORBIDDEN_ERROR = 'FORBIDDEN_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  OFFLINE_ERROR = 'OFFLINE_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  // ... fler felkoder
}

export interface ErrorConfig {
  retryable: boolean;
  userFriendly: boolean;
  messages: Record<string, string>;
}
```

### Felkategorisering

Fel kategoriseras automatiskt baserat på olika faktorer:

```typescript
export function categorizeError(error: unknown, statusCode?: number): HookErrorCode {
  // Offline-kontroll
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return HookErrorCode.OFFLINE_ERROR;
  }

  // Statuskodsbaserad kategorisering
  if (statusCode) {
    if (statusCode === 401) return HookErrorCode.UNAUTHORIZED_ERROR;
    if (statusCode === 403) return HookErrorCode.FORBIDDEN_ERROR;
    if (statusCode === 404) return HookErrorCode.NOT_FOUND_ERROR;
    // ... fler statuskodshanteringar
  }

  // Felmeddelande och typbaserad kategorisering
  if (error instanceof Error) {
    // ... felklassificering baserat på felmeddelande och typ
  }

  return HookErrorCode.UNKNOWN_ERROR;
}
```

### Användarvänliga felmeddelanden

Standardiserade felmeddelanden tillhandahålls baserat på feltyp:

```typescript
export function getErrorMessage(errorCode: HookErrorCode, language: string = 'sv'): string {
  const config = ERROR_CONFIG[errorCode] || DEFAULT_ERROR_CONFIG;
  return config.messages[language] || config.messages['sv'] || 'Ett fel uppstod';
}
```

## Återförsöksmekanismer

För nätverks- och timeout-relaterade fel tillhandahåller vi automatisk eller manuell återförsökslogik:

```typescript
export function useStandardizedRetryableOperation<TParams, TResult>(
  operation: (params: TParams) => Promise<Result<TResult>>,
  options: RetryableOperationOptions = {}
): StandardizedRetryableHookOperation<TParams, TResult> {
  // ... implementation
  
  const retry = useCallback(async () => {
    setRetryCount(prev => prev + 1);
    const retryDelay = Math.min(
      options.baseRetryDelay * Math.pow(2, retryCount), 
      options.maxRetryDelay
    );
    
    await delay(retryDelay);
    return await executeOperation(lastParams);
  }, [lastParams, retryCount]);
  
  // ... more implementation
}
```

### Exponentiell backoff

För automatiska återförsök används exponentiell backoff:

```typescript
const retryDelay = Math.min(
  options.baseRetryDelay * Math.pow(2, retryCount), 
  options.maxRetryDelay
);
```

## Domänspecifika hooks

Domänspecifika hooks implementerar operationer för en specifik domän och använder en Context Provider för beroendeinjection:

### useTeamContext

```typescript
export function useTeamContext(): TeamContextProps {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeamContext måste användas inom en TeamProvider');
  }
  return context;
}
```

### useTeamWithStandardHook

```typescript
export function useTeamWithStandardHook() {
  const { 
    createTeamUseCase, 
    addTeamMemberUseCase, 
    // ... fler use cases
  } = useTeamContext();
  
  const logger = useMemo(() => createLogger('useTeamWithStandardHook'), []);
  
  // Skapa ett team
  const createTeam = useStandardizedOperation<CreateTeamDTO, Team>(
    async (params) => {
      try {
        logger.info('Skapar team', { name: params.name });
        return await createTeamUseCase.execute(params);
      } catch (error) {
        logger.error('Fel vid skapande av team', { error, params });
        return Result.fail(error);
      }
    }
  );
  
  // ... fler operationer
  
  return {
    createTeam,
    addTeamMember,
    // ... fler returnerade operationer
  };
}
```

## Testning

Hooks testas med hjälp av `@testing-library/react-hooks`:

```typescript
describe('useStandardizedOperation', () => {
  it('ska hantera lyckade operationer korrekt', async () => {
    // Arrangera
    const mockData = { id: '123', name: 'Test' };
    const mockOperation = jest.fn().mockResolvedValue(Result.ok(mockData));
    
    // Agera
    const { result, waitForNextUpdate } = renderHook(() => 
      useStandardizedOperation(mockOperation)
    );
    
    expect(result.current.status).toBe('idle');
    
    act(() => {
      result.current.execute({});
    });
    
    expect(result.current.status).toBe('loading');
    
    await waitForNextUpdate();
    
    // Hävda
    expect(result.current.status).toBe('success');
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(true);
  });
  
  // ... fler tester
});
```

## Best practices

### När du skapar nya hooks

1. **Använd standardiserade bas-hooks**: Utgå alltid från `useStandardizedOperation` eller `useStandardizedRetryableOperation`
2. **Injicera beroenden via Context**: Använd context-providers för beroendeinjection
3. **Logga riktig information**: Använd logger med relevant information som underlättar felsökning
4. **Hantera feltyper korrekt**: Kategorisera fel korrekt för att ge användarvänliga meddelanden
5. **Returnera konsekvent struktur**: Returnera alltid samma form av data för att förenkla användning i UI

### När du använder hooks i UI

1. **Destrukturera status och data**: Använd `const { data, isLoading, error } = someHook.someOperation`
2. **Hantera alla tillstånd**: Täck alltid `idle`, `loading`, `success` och `error` tillstånd i UI
3. **Visa användarvänliga felmeddelanden**: Använd `error.message` för att visa användarvänliga felmeddelanden
4. **Erbjud återförsöksmöjligheter**: För återförsöksbara operationer, ge användaren möjlighet att försöka igen
5. **Rensa vid komponentavmontering**: Använd useEffect cleanup för att förhindra minnesläckor

## Exempel på implementation

### Bas-hook användning

```typescript
// Icke-återförsöksbar operation
const submitForm = useStandardizedOperation(async (formData) => {
  return await formSubmitUseCase.execute(formData);
});

// Återförsöksbar operation (med nätverksfel)
const fetchData = useStandardizedRetryableOperation(
  async (params) => await dataFetchUseCase.execute(params),
  { maxRetries: 3, baseRetryDelay: 1000 }
);
```

### UI-användning

```tsx
function TeamCreateButton() {
  const { createTeam } = useTeamWithStandardHook();
  const [formData, setFormData] = useState({});
  
  const handleSubmit = async () => {
    const result = await createTeam.execute(formData);
    if (result.isSuccess()) {
      // Navigera eller visa bekräftelse
    }
  };
  
  return (
    <>
      <Button 
        onPress={handleSubmit} 
        disabled={createTeam.isLoading}
      >
        {createTeam.isLoading ? 'Skapar...' : 'Skapa team'}
      </Button>
      
      {createTeam.isError && (
        <ErrorMessage message={createTeam.error.message} />
      )}
    </>
  );
}
```

## Slutsats

Den standardiserade hook-implementationen i Pling Mobile ger en robust och konsekvent grund för UI-interaktion med applikationens domänlogik. Genom att standardisera felhantering, tillstånd och återförsöksmekanismer kan vi skapa en mer förutsägbar och användarvänlig upplevelse, samtidigt som vi förenklar utvecklingsprocessen och förbättrar testbarheten. 