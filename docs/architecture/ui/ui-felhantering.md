# Felhantering i UI-lagret

Detta dokument beskriver strategier och mönster för felhantering i UI-lagret i Pling-mobilappen, med fokus på att ge en konsekvent och användarvänlig upplevelse även när fel uppstår.

## Översikt

En robust felhanteringsstrategi är avgörande för att skapa en positiv användarupplevelse även när något går fel. I Pling-mobilappen har vi implementerat en konsekvent och heltäckande felhanteringsstrategi som adresserar olika typer av fel som kan uppstå:

1. **Nätverksfel**: När enheten saknar internetanslutning eller har dålig anslutning
2. **Serverfel**: När servern inte kan hantera förfrågan korrekt
3. **Valideringsfel**: När användarinmatad data inte uppfyller kraven
4. **Auktoriseringsfel**: När användaren saknar behörighet för en åtgärd
5. **Affärslogikfel**: När en åtgärd inte kan utföras på grund av affärsregler
6. **Oväntade fel**: När ett oväntat fel uppstår i applikationen

Vår strategi fokuserar på att:
- Fånga fel så nära källan som möjligt
- Omvandla tekniska felmeddelanden till användarvänliga meddelanden
- Ge tydlig feedback om vad som gick fel
- Erbjuda möjligheter till återhämtning när det är möjligt
- Bevara användarens data och kontext

## Feltyper

Vi har definierat en hierarki av feltyper för att kategorisera och hantera fel på ett konsekvent sätt:

```typescript
// Bas-feltyp för UI-relaterade fel
export class UIError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean = false,
    public readonly errorCode?: string
  ) {
    super(message);
    this.name = 'UIError';
  }
}

// Nätverksrelaterade fel
export class NetworkError extends UIError {
  constructor(message: string = 'Kunde inte ansluta till servern') {
    super(message, true, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

// Serverrelaterade fel
export class ServerError extends UIError {
  constructor(message: string = 'Ett serverfel uppstod') {
    super(message, true, 'SERVER_ERROR');
    this.name = 'ServerError';
  }
}

// Valideringsfel
export class ValidationError extends UIError {
  constructor(
    message: string = 'Verifieringsfel', 
    public readonly fieldErrors?: Record<string, string>
  ) {
    super(message, false, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

// Auktoriseringsfel
export class AuthorizationError extends UIError {
  constructor(message: string = 'Du har inte behörighet att utföra denna åtgärd') {
    super(message, false, 'AUTH_ERROR');
    this.name = 'AuthorizationError';
  }
}

// Affärslogikfel
export class BusinessRuleError extends UIError {
  constructor(message: string) {
    super(message, false, 'BUSINESS_RULE_ERROR');
    this.name = 'BusinessRuleError';
  }
}

// Data Not Found-fel
export class NotFoundError extends UIError {
  constructor(message: string = 'Den begärda resursen kunde inte hittas') {
    super(message, false, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}
```

## Felhantering i olika lager

### 1. Repository-lager

Fel som uppstår i repository-lagret (t.ex. databas- eller API-fel) fångas och returneras som `Result.err()`:

```typescript
async findById(id: UniqueId): Promise<Result<Team>> {
  try {
    const { data, error } = await this.supabase
      .from('teams')
      .select('*')
      .eq('id', id.toString())
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return Result.err(new EntityNotFoundError('Team', id.toString()));
      }
      return Result.err(new DatabaseError(error.message));
    }
    
    return TeamMapper.toDomain(data);
  } catch (error) {
    if (error instanceof NetworkError) {
      return Result.err(error);
    }
    
    return Result.err(new UnexpectedError(error.message));
  }
}
```

### 2. Use Case-lager

Use cases hanterar fel från repositories och returnerar domänspecifika feltyper:

```typescript
async execute({ teamId, userId, role }: AddTeamMemberRequest): Promise<Result<boolean>> {
  try {
    // Validera input
    const validationResult = this.validateInput(teamId, userId, role);
    if (validationResult.isErr()) {
      return Result.err(new ValidationError(validationResult.error.message));
    }
    
    // Kontrollera om användaren redan är medlem
    const isMemberResult = await this.teamRepository.isMember(
      UniqueId.create(teamId).value, 
      UniqueId.create(userId).value
    );
    
    if (isMemberResult.isErr()) {
      return Result.err(isMemberResult.error);
    }
    
    if (isMemberResult.value) {
      return Result.err(new BusinessRuleError('Användaren är redan medlem i teamet'));
    }
    
    // Utför operation
    const result = await this.teamRepository.addMember(
      UniqueId.create(teamId).value, 
      UniqueId.create(userId).value, 
      TeamRole.create(role).value
    );
    
    return result;
  } catch (error) {
    return Result.err(new UnexpectedError(`Failed to add team member: ${error.message}`));
  }
}
```

### 3. Hook-lager

Hooks konverterar domänfel till UI-vänliga fel via React Query:

```typescript
const addTeamMemberMutation = useMutation({
  mutationFn: async ({ teamId, userId, role }: AddTeamMemberParams) => {
    const useCase = new AddTeamMemberUseCase(teamRepository);
    const result = await useCase.execute({ teamId, userId, role });
    
    if (result.isOk()) {
      return result.value;
    }
    
    // Konvertera domänfel till UI-fel
    if (result.error instanceof ValidationError) {
      throw new UIValidationError(result.error.message, result.error.fieldErrors);
    } else if (result.error instanceof BusinessRuleError) {
      throw new UIBusinessRuleError(result.error.message);
    } else if (result.error instanceof EntityNotFoundError) {
      throw new UINotFoundError(result.error.message);
    } else if (result.error instanceof DatabaseError) {
      throw new UIServerError(result.error.message);
    } else {
      throw new UIError(result.error.message, true);
    }
  },
  onError: (error: UIError) => {
    // Global felhantering, t.ex. visa toast för vissa feltyper
    if (error instanceof UIServerError) {
      Toast.show({
        type: 'error',
        text1: 'Serverfel',
        text2: error.message,
      });
    }
  }
});
```

### 4. Container-komponent

Container-komponenter hanterar felmeddelanden från hooks och förbereder dem för presentation:

```typescript
const TeamMembersScreenContainer: React.FC<Props> = ({ teamId }) => {
  // Hooks
  const { getTeamMembers, addTeamMember } = useTeamWithStandardHook();
  
  // Hantera tillägg av medlem
  const handleAddMember = async (data: AddMemberFormData) => {
    try {
      await addTeamMember.execute({
        teamId,
        email: data.email,
        role: data.role
      });
      
      // Visa framgångsmeddelande
      Toast.show({
        type: 'success',
        text1: 'Framgång',
        text2: 'Medlem har lagts till',
      });
      
      // Uppdatera medlemslistan
      getTeamMembers.execute({ teamId });
    } catch (error) {
      // Här hanteras specifika felvisningar om det behövs,
      // men mycket av det hanteras automatiskt av onError i mutationen
    }
  };
  
  // Formatera fel för presentationskomponenten
  const formattedError = useMemo(() => {
    if (!getTeamMembers.error) return undefined;
    
    return {
      message: getTeamMembers.error.message,
      retryable: getTeamMembers.error instanceof NetworkError || 
                 getTeamMembers.error instanceof ServerError,
    };
  }, [getTeamMembers.error]);
  
  return (
    <TeamMembersScreenPresentation
      members={getTeamMembers.data || []}
      isLoading={getTeamMembers.isLoading}
      error={formattedError}
      onRetry={() => getTeamMembers.execute({ teamId })}
      onAddMember={handleAddMember}
      // ... andra props
    />
  );
};
```

### 5. Presentations-komponent

Presentations-komponenter visar felmeddelanden och tillhandahåller återhämtningsåtgärder:

```tsx
const TeamMembersScreenPresentation: React.FC<Props> = ({
  members,
  isLoading,
  error,
  onRetry,
  // ... andra props
}) => {
  return (
    <Screen>
      <Appbar.Header>
        {/* ... */}
      </Appbar.Header>
      
      {isLoading && <LoadingIndicator />}
      
      {error && (
        <ErrorMessage 
          message={error.message}
          onRetry={error.retryable ? onRetry : undefined}
          icon={error.retryable ? 'refresh' : 'alert-circle'}
        />
      )}
      
      {!isLoading && !error && members.length === 0 && (
        <EmptyState 
          title="Inga medlemmar"
          description="Det finns inga medlemmar i detta team ännu."
          actionLabel="Lägg till medlem"
          onAction={onAddMember}
        />
      )}
      
      {!isLoading && !error && members.length > 0 && (
        <MemberList members={members} onMemberPress={onMemberPress} />
      )}
      
      {/* ... */}
    </Screen>
  );
};
```

## Återanvändbara UI-komponenter för felhantering

För att säkerställa en konsekvent felhantering har vi skapat flera återanvändbara UI-komponenter:

### ErrorMessage

En generell komponent för att visa felmeddelanden:

```tsx
interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  icon?: string;
  testID?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  icon = 'alert-circle',
  testID = 'error-message',
}) => (
  <View style={styles.container} testID={testID}>
    <Icon name={icon} size={48} color="#f44336" />
    <Text style={styles.message}>{message}</Text>
    
    {onRetry && (
      <Button
        mode="contained"
        onPress={onRetry}
        style={styles.retryButton}
        testID="retry-button"
      >
        Försök igen
      </Button>
    )}
  </View>
);
```

### QueryErrorHandler

En komponent för att standardisera felhantering i React Query:

```tsx
interface QueryErrorHandlerProps<T> {
  query: UseQueryResult<T>;
  onRetry?: () => void;
  children: (data: T) => React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: (error: UIError, retry?: () => void) => React.ReactNode;
  emptyComponent?: React.ReactNode;
  isEmpty?: (data: T) => boolean;
}

export function QueryErrorHandler<T>({
  query,
  onRetry,
  children,
  loadingComponent = <LoadingIndicator />,
  errorComponent,
  emptyComponent,
  isEmpty = (data) => !data || (Array.isArray(data) && data.length === 0),
}: QueryErrorHandlerProps<T>): React.ReactElement {
  const { isLoading, error, data, refetch } = query;
  
  // Visa laddningsindikator
  if (isLoading) {
    return <>{loadingComponent}</>;
  }
  
  // Visa felmeddelande om det finns
  if (error) {
    const uiError = error instanceof UIError
      ? error
      : new UIError(error.message || 'Ett fel uppstod', true);
    
    if (errorComponent) {
      return <>{errorComponent(uiError, onRetry || refetch)}</>;
    }
    
    return (
      <ErrorMessage
        message={uiError.message}
        onRetry={uiError.retryable ? (onRetry || refetch) : undefined}
      />
    );
  }
  
  // Visa tom tillstånd om det är tomt
  if (data && isEmpty(data) && emptyComponent) {
    return <>{emptyComponent}</>;
  }
  
  // Visa data om allt är bra
  return <>{children(data as T)}</>;
}
```

### ErrorBoundary

En komponent för att fånga oväntade fel i React-komponentträdet:

```tsx
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Logga fel till felrapporteringstjänst
    console.error('Uncaught error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }
  
  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Något gick fel</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'Ett oväntat fel uppstod i appen.'}
          </Text>
          <Button
            mode="contained"
            onPress={() => this.setState({ hasError: false })}
            style={styles.resetButton}
          >
            Försök igen
          </Button>
        </View>
      );
    }
    
    return this.props.children;
  }
}
```

## Hantering av specifika feltyper

### Nätverksfel

Vi använder React Querys inbyggda retry-funktionalitet tillsammans med nätverksdetektering:

```tsx
const useNetworkAwareQuery = <T,>(
  queryKey: QueryKey,
  queryFn: QueryFunction<T>,
  options?: UseQueryOptions<T>
) => {
  const { isConnected } = useNetInfo();
  
  return useQuery<T>({
    queryKey,
    queryFn,
    ...options,
    retry: (failureCount, error) => {
      // Gör inga återförsök om enheten är offline
      if (!isConnected) return false;
      
      // Mer generös återförsökspolicy för nätverksfel
      if (error instanceof NetworkError) {
        return failureCount < 5;
      }
      
      // Standardåterförsök för andra typer av fel
      return failureCount < 3;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponentiell backoff
  });
};
```

### Formulärvalideringsfel

För formulärvalideringsfel använder vi en specifik hantering som visar fel för specifika fält:

```tsx
const AddMemberForm: React.FC<AddMemberFormProps> = ({ onSubmit }) => {
  const { control, handleSubmit, setError, formState: { errors } } = useForm<FormData>();
  
  const onFormSubmit = async (data: FormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      if (error instanceof UIValidationError && error.fieldErrors) {
        // Mappa fältfel till formulärfält
        Object.entries(error.fieldErrors).forEach(([field, message]) => {
          setError(field as keyof FormData, { type: 'manual', message });
        });
      } else {
        // Visa generellt felmeddelande
        Toast.show({
          type: 'error',
          text1: 'Fel',
          text2: error.message,
        });
      }
    }
  };
  
  return (
    <View>
      <Controller
        control={control}
        name="email"
        rules={{ required: 'E-post är obligatoriskt', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Ogiltig e-postadress' } }}
        render={({ field }) => (
          <TextField
            label="E-post"
            value={field.value}
            onChangeText={field.onChange}
            error={!!errors.email}
            errorText={errors.email?.message}
          />
        )}
      />
      
      {/* Övriga fält */}
      
      <Button mode="contained" onPress={handleSubmit(onFormSubmit)}>
        Lägg till
      </Button>
    </View>
  );
};
```

### Auktoriseringsfel

För auktoriseringsfel har vi en global hantering som kan omdirigera till inloggningsskärmen:

```tsx
// I ApplicationProvider
const errorHandler = (error: unknown) => {
  if (error instanceof UIAuthorizationError) {
    // Användaren är inte behörig, kan behöva logga in igen
    if (error.errorCode === 'SESSION_EXPIRED') {
      // Rensa autentiseringsuppgifter
      authStore.clearAuth();
      
      // Visa en dialog
      uiStore.showDialog({
        title: 'Sessionen har gått ut',
        message: 'Din session har gått ut. Du måste logga in igen.',
        confirmText: 'Logga in',
        onConfirm: () => {
          // Navigera till inloggningsskärmen
          router.replace('/auth/login');
        }
      });
    } else {
      // Visa ett toast-meddelande för andra auktoriseringsfel
      Toast.show({
        type: 'error',
        text1: 'Behörighetsfel',
        text2: error.message,
      });
    }
  }
};

// Injicera i React Query-konfigurationen
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      onError: errorHandler,
    },
    mutations: {
      onError: errorHandler,
    },
  },
});
```

## Offline-hantering

För att hantera offline-läge använder vi en kombination av lokal lagring och synkroniseringsstrategier:

```tsx
const useOfflineAwareOperation = <T, R>(
  mutationFn: (data: T) => Promise<R>,
  options: {
    onSuccess?: (result: R, data: T) => void;
    onError?: (error: Error, data: T) => void;
    syncKey: string;
  }
) => {
  const { isConnected } = useNetInfo();
  const syncQueue = useSyncQueue();
  
  return async (data: T) => {
    if (isConnected) {
      try {
        // Online: utför operation direkt
        const result = await mutationFn(data);
        options.onSuccess?.(result, data);
        return result;
      } catch (error) {
        options.onError?.(error, data);
        throw error;
      }
    } else {
      // Offline: lägg till i synkroniseringskö
      syncQueue.add({
        key: options.syncKey,
        data,
        operation: mutationFn,
      });
      
      // Visa meddelande om att åtgärden kommer att synkroniseras senare
      Toast.show({
        type: 'info',
        text1: 'Offline-läge',
        text2: 'Din ändring kommer att sparas när du är online igen.',
      });
      
      // Returnera en placeholder-respons
      return null;
    }
  };
};
```

## Best Practices

För att säkerställa konsekvent felhantering följer vi dessa best practices:

### 1. Centraliserade feltyper och meddelanden

```typescript
// ErrorMessages.ts
export const ErrorMessages = {
  network: {
    offline: 'Du är offline. Kontrollera din internetanslutning.',
    timeout: 'Anslutningen tog för lång tid. Försök igen.',
    serverUnreachable: 'Kunde inte ansluta till servern. Försök igen senare.',
  },
  auth: {
    sessionExpired: 'Din session har gått ut. Logga in igen.',
    unauthorized: 'Du har inte behörighet att utföra denna åtgärd.',
    invalidCredentials: 'Felaktigt användarnamn eller lösenord.',
  },
  team: {
    notFound: 'Teamet kunde inte hittas.',
    alreadyMember: 'Användaren är redan medlem i teamet.',
    maxMembersReached: 'Teamet har redan nått max antal medlemmar.',
  },
  // ... fler domänspecifika felmeddelanden
};
```

### 2. Lokaliserade felmeddelanden

```typescript
// FelMessagesTranslations.ts
export const ErrorMessagesTranslations = {
  sv: {
    network: {
      offline: 'Du är offline. Kontrollera din internetanslutning.',
      // ... andra översättningar
    },
    // ... andra kategorier
  },
  en: {
    network: {
      offline: 'You are offline. Check your internet connection.',
      // ... andra översättningar
    },
    // ... andra kategorier
  },
};

// Användning
const { t } = useTranslation();
const errorMessage = t(`errors.network.offline`);
```

### 3. Enhetlig loggtjänst

```typescript
// ErrorLogger.ts
export class ErrorLogger {
  static log(error: Error, context?: any): void {
    // Skicka till analytiksystem eller fjärrloggning
    if (process.env.NODE_ENV === 'production') {
      // Skicka till Sentry, LogRocket, etc.
      // sentryClient.captureException(error, { extra: context });
    }
    
    // Lokal loggning för utveckling
    console.error('[ErrorLogger]', error.message, error.stack, context);
  }
  
  static logApiError(endpoint: string, error: Error, request?: any): void {
    this.log(error, { 
      type: 'api_error',
      endpoint,
      request,
      timestamp: new Date().toISOString(),
    });
  }
  
  // ... fler specialiserade loggningsmetoder
}
```

### 4. Automatisk återhämtning

```typescript
// AutoRecoveryHook.ts
export const useAutoRecovery = () => {
  const { isConnected } = useNetInfo();
  const queryClient = useQueryClient();
  const syncQueue = useSyncQueue();
  
  // Övervaka nätverksändringar
  useEffect(() => {
    if (isConnected) {
      // När enheten är online igen:
      
      // 1. Uppdatera cachad data
      queryClient.invalidateQueries();
      
      // 2. Bearbeta väntande operationer
      syncQueue.processQueue();
    }
  }, [isConnected, queryClient, syncQueue]);
};
```

## Slutsats

Vår felhanteringsstrategi i UI-lagret är utformad för att skapa en robust och användarvänlig upplevelse även när fel uppstår. Genom att:

1. Identifiera och kategorisera feltyper
2. Hantera fel konsekvent genom alla lager
3. Visa användbara och handlingsbara felmeddelanden
4. Erbjuda återhämtningsmekanismer
5. Stödja offline-arbete med synkronisering

kan vi säkerställa att användarupplevelsen förblir positiv även när tekniska problem uppstår. 