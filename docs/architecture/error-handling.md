# Felhanteringsstrategi

Detta dokument beskriver den övergripande strategin för felhantering i Pling Mobile-applikationen. En konsekvent och robust felhantering är avgörande för att skapa en användarvänlig och pålitlig applikation.

## Innehåll

1. [Principer](#principer)
2. [Nivåer av felhantering](#nivåer-av-felhantering)
3. [Result-klassen](#result-klassen)
4. [HookErrorTypes](#hookerrortypes)
5. [Domänfel vs Tekniska fel](#domänfel-vs-tekniska-fel)
6. [Loggning av fel](#loggning-av-fel)
7. [Användaråterkoppling](#användaråterkoppling)
8. [Återförsöksstrategier](#återförsöksstrategier)
9. [Implementationsexempel](#implementationsexempel)

## Principer

Vår felhanteringsstrategi bygger på följande principer:

1. **Explicita fel**: Fel ska alltid vara explicita och aldrig tysta
2. **Konsekvent struktur**: Samma felhanteringsmönster används i hela applikationen
3. **Nivåspecifika hanteringar**: Olika lager i systemet hanterar fel på olika sätt
4. **Användarvänlighet**: Tekniska fel översätts till användarvänliga meddelanden
5. **Återställbarhet**: Där möjligt erbjuds återförsök eller åtgärder för att hantera fel

## Nivåer av felhantering

Felhantering sker på olika nivåer i applikationen:

### 1. Domännivå

På domännivån används `Result<T>`-klassen för att hantera resultatet av operationer. Domänregler valideras och returnerar passande felmeddelanden vid validering eller andra affärsregelbrott.

### 2. Applikationsnivå

Use Cases fångar tekniska och domänfel, loggar dem och returnerar explicita felobjekt. Dessa kan delas in i specifika kategorier för att hjälpa UI att bestämma korrekta åtgärder.

### 3. UI-nivå

UI-komponenter används för att visa användarvänliga felmeddelanden och ge användare möjlighet att åtgärda eller återförsöka vid fel.

## Result-klassen

Kärnan i vår felhanteringsstrategi är `Result<T>`-klassen som följer "Railway Oriented Programming"-mönstret:

```typescript
export class Result<T> {
  private readonly _isSuccess: boolean;
  private readonly _error: any;
  private readonly _value: T;

  private constructor(isSuccess: boolean, error?: any, value?: T) {
    this._isSuccess = isSuccess;
    this._error = error;
    this._value = value as T;
  }

  public static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, undefined, value);
  }

  public static fail<U>(error: any): Result<U> {
    return new Result<U>(false, error);
  }

  public isSuccess(): boolean {
    return this._isSuccess;
  }

  public isFailure(): boolean {
    return !this._isSuccess;
  }

  public getValue(): T {
    if (!this._isSuccess) {
      throw new Error('Kan inte hämta värdet från ett misslyckat resultat');
    }
    return this._value;
  }

  public getError(): any {
    if (this._isSuccess) {
      throw new Error('Kan inte hämta fel från ett lyckat resultat');
    }
    return this._error;
  }
}
```

## HookErrorTypes

För att standardisera felhantering i hooks och UI använder vi `HookErrorTypes`:

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
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
}

export interface ErrorConfig {
  retryable: boolean;
  userFriendly: boolean;
  messages: Record<string, string>;
}

export const ERROR_CONFIG: Record<HookErrorCode, ErrorConfig> = {
  [HookErrorCode.UNKNOWN_ERROR]: {
    retryable: false,
    userFriendly: true,
    messages: {
      'sv': 'Ett oväntat fel inträffade',
      'en': 'An unexpected error occurred'
    }
  },
  [HookErrorCode.VALIDATION_ERROR]: {
    retryable: false,
    userFriendly: true,
    messages: {
      'sv': 'Ogiltig inmatning',
      'en': 'Invalid input'
    }
  },
  // ... fler felkonfigurationer
};
```

## Domänfel vs Tekniska fel

Vi skiljer mellan domänfel och tekniska fel:

### Domänfel

Domänfel representerar brott mot affärsregler och är typiskt validerings- eller logiska fel:

```typescript
// Domänfel - returneras från värde-objekt
const emailResult = Email.create(input);
if (emailResult.isFailure()) {
  return Result.fail('E-postadressen är ogiltig');
}

// Domänfel - returneras från entiteter
const canUserJoinTeam = team.canAddMember(userId);
if (!canUserJoinTeam) {
  return Result.fail('Användaren kan inte läggas till i teamet');
}
```

### Tekniska fel

Tekniska fel uppstår från infrastrukturproblem som nätverksfel, databasfel, etc:

```typescript
async findById(id: string): Promise<Result<Team>> {
  try {
    const { data, error } = await this.supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      this.logger.error('Databasfel vid hämtning av team', { error, id });
      return Result.fail(error);
    }
    
    return this.teamMapper.toDomain(data);
  } catch (error) {
    this.logger.error('Oväntat fel vid hämtning av team', { error, id });
    return Result.fail(error);
  }
}
```

## Loggning av fel

En konsekvent loggningsstrategi används för att förenkla felsökning:

```typescript
// Skapa en logger för en specifik komponent
const logger = createLogger('TeamRepository');

// Logga fel med kontext
logger.error('Kunde inte hämta team', { 
  error,
  teamId, 
  userId, 
  context: 'findById' 
});

// Logga varningar
logger.warn('Team saknar medlemmar', { teamId });
```

## Användaråterkoppling

För att ge användarvänlig återkoppling översätts tekniska fel till begripliga meddelanden:

```typescript
// I hooks
export function createHookError(
  error: unknown, 
  statusCode?: number
): HookError {
  const errorCode = categorizeError(error, statusCode);
  const isRetryable = isRetryableError(errorCode);
  const message = getErrorMessage(errorCode);
  
  return {
    code: errorCode,
    message,
    originalError: error,
    retryable: isRetryable
  };
}

// I UI
function ErrorDisplay({ error }: { error: HookError }) {
  if (!error) return null;
  
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error.message}</Text>
      {error.retryable && (
        <Button title="Försök igen" onPress={onRetry} />
      )}
    </View>
  );
}
```

## Återförsöksstrategier

För återställbara fel (t.ex. nätverksfel) tillhandahåller vi återförsöksstrategier:

```typescript
// Hjälpfunktion för att avgöra om ett fel kan återförsökas
export function isRetryableError(errorCode: HookErrorCode): boolean {
  const config = ERROR_CONFIG[errorCode] || DEFAULT_ERROR_CONFIG;
  return config.retryable;
}

// Återförsökbar operation med exponentiell backoff
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

## Implementationsexempel

### Use Case-implementation

```typescript
export class GetTeamUseCase {
  private teamRepository: TeamRepository;
  private logger: Logger;

  constructor(teamRepository: TeamRepository) {
    this.teamRepository = teamRepository;
    this.logger = createLogger('GetTeamUseCase');
  }

  async execute(dto: GetTeamDTO): Promise<Result<Team>> {
    try {
      this.logger.info('Hämtar team', { teamId: dto.teamId });
      
      // Validering av indata
      if (!dto.teamId) {
        return Result.fail('Team ID är obligatoriskt');
      }
      
      // Anropa repository
      const teamResult = await this.teamRepository.findById(dto.teamId);
      
      if (teamResult.isFailure()) {
        this.logger.error('Kunde inte hämta team', { 
          error: teamResult.getError(), 
          teamId: dto.teamId 
        });
        return teamResult;
      }
      
      const team = teamResult.getValue();
      
      // Affärsregel: Kontrollera åtkomst om userId finns
      if (dto.userId && !team.canViewBy(dto.userId)) {
        this.logger.warn('Åtkomst nekad till team', { 
          teamId: dto.teamId, 
          userId: dto.userId 
        });
        return Result.fail('Användaren har inte åtkomst till detta team');
      }
      
      return Result.ok(team);
    } catch (error) {
      this.logger.error('Oväntat fel i GetTeamUseCase', { 
        error, 
        dto 
      });
      return Result.fail(error);
    }
  }
}
```

### Hook-implementation

```typescript
export function useGetTeam() {
  const { getTeamUseCase } = useTeamContext();
  const logger = useMemo(() => createLogger('useGetTeam'), []);
  
  return useStandardizedRetryableOperation<GetTeamDTO, Team>(
    async (params) => {
      try {
        logger.info('Hämtar team', params);
        return await getTeamUseCase.execute(params);
      } catch (error) {
        logger.error('Fel vid hämtning av team', { error, params });
        return Result.fail(error);
      }
    },
    { maxRetries: 3, baseRetryDelay: 1000 }
  );
}
```

### UI-implementation

```tsx
function TeamDetailScreen({ route }) {
  const { teamId } = route.params;
  const getTeam = useGetTeam();
  
  useEffect(() => {
    getTeam.execute({ teamId });
  }, [teamId]);
  
  if (getTeam.isLoading) {
    return <LoadingSpinner />;
  }
  
  if (getTeam.isError) {
    return (
      <ErrorView 
        error={getTeam.error}
        onRetry={getTeam.retry}
      />
    );
  }
  
  if (!getTeam.data) {
    return <EmptyState message="Inget team hittades" />;
  }
  
  return (
    <TeamDetail team={getTeam.data} />
  );
}
```

## Slutsats

Genom att konsekvent implementera denna felhanteringsstrategi i hela applikationen skapar vi en robustare och mer användarvänlig upplevelse. Det hjälper oss att:

1. Snabbt identifiera och diagnostisera problem genom strukturerad loggning
2. Ge användarna förståelig återkoppling när saker går fel
3. Hantera återställbara fel automatiskt där möjligt
4. Skapa en mer förutsägbar kodstruktur för utvecklare att arbeta med

Denna strategi är en viktig del av vår övergripande applikationsarkitektur och bidrar till långsiktig hållbarhet och kvalitet. 