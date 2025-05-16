# UI-dataflöde i Pling Mobile

Detta dokument beskriver dataflödet i UI-lagret i Pling-mobilappen, vilket illustrerar hur data rör sig från domänlagret till användargränssnittet.

## Översikt

Pling-mobilappen följer en Clean Architecture-inspirerad struktur med tydliga lager:

1. **Domänlager**: Entiteter, värde-objekt, domäntjänster
2. **Infrastrukturlager**: Repositories, externa tjänster
3. **Applikationslager**: Use cases, DTOs, queries
4. **UI-lager**: Skärmar, komponenter, presentationslogik

Dataflödet följer typiskt dessa steg:

1. Användaren interagerar med UI (presentationskomponenter)
2. Container-komponenter fångar dessa interaktioner
3. Container-komponenter anropar hooks från applikationslagret
4. Hooks kör use cases eller queries
5. Use cases/queries interagerar med repositories
6. Repositories hämtar/skickar data till datakällor
7. Data flödar tillbaka genom samma lager i omvänd ordning

## Detaljerat flödesdiagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                               Användare                                 │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     UI-lager (Presentationskomponent)                   │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │  Användarinput  │  │ Renderingslogik │  │  Callback-funktioner    │  │
│  └────────┬────────┘  └─────────────────┘  └────────────┬────────────┘  │
└───────────┼─────────────────────────────────────────────┼───────────────┘
            │                                             │
            ▼                                             │
┌───────────────────────────────────────────────┐         │
│         UI-lager (Containerkomponent)         │         │
│                                               │         │
│  ┌─────────────────┐  ┌─────────────────┐     │         │
│  │ Tillståndslogik │  │ Callback-impl.  │◄────┼─────────┘
│  └────────┬────────┘  └────────┬────────┘     │
│           │                    │              │
│  ┌────────▼────────┐           │              │
│  │  React Query    │◄──────────┘              │
│  └────────┬────────┘                          │
└───────────┼──────────────────────────────────┬┘
            │                                  │
            ▼                                  │
┌───────────────────────────────────┐          │
│        Applikationslager          │          │
│                                   │          │
│  ┌─────────────────┐              │          │
│  │      Hooks      │              │          │
│  └────────┬────────┘              │          │
│           │                       │          │
│  ┌────────▼────────┐              │          │
│  │   Use Cases     │              │          │
│  └────────┬────────┘              │          │
│           │                       │          │
│  ┌────────▼────────┐              │          │
│  │      DTOs       │◄─────────────┼──────────┘
│  └────────┬────────┘              │
└───────────┼──────────────────────┬┘
            │                      │
            ▼                      │
┌───────────────────────────────────┐
│       Infrastrukturlager          │
│                                   │
│  ┌─────────────────┐              │
│  │   Repositories  │              │
│  └────────┬────────┘              │
│           │                       │
│  ┌────────▼────────┐              │
│  │  API/Databas    │              │
│  └────────┬────────┘              │
└───────────┼──────────────────────┬┘
            │                      │
            ▼                      │
┌───────────────────────────────────┐
│          Domänlager               │
│                                   │
│  ┌─────────────────┐              │
│  │    Entiteter    │              │
│  └────────┬────────┘              │
│           │                       │
│  ┌────────▼────────┐              │
│  │  Värde-objekt   │              │
│  └────────┬────────┘              │
│           │                       │
│  ┌────────▼────────┐              │
│  │  Domäntjänster  │◄─────────────┘
│  └─────────────────┘              │
└───────────────────────────────────┘
```

## Exempel: Hämta och visa teammedlemmar

Detta exempel visar det konkreta dataflödet när en användare navigerar till TeamMembersScreen.

### 1. Navigationshantering

```tsx
// I någon annan skärm
const router = useRouter();
router.push(`/teams/${teamId}/members`);
```

### 2. Container-komponent initierar datahämtning

```tsx
// TeamMembersScreenContainer.tsx
export const TeamMembersScreenContainer: React.FC<TeamMembersScreenContainerProps> = ({ 
  teamId: propTeamId 
}) => {
  const router = useRouter();
  const params = useLocalSearchParams<{ teamId: string }>();
  
  // Använd teamId från props om det finns, annars från URL-parametrar
  const teamId = propTeamId || params.teamId || '';
  
  // Data fetching med hooks
  const { getTeamMembers } = useTeamWithStandardHook();
  
  // Hämta team-information när komponenten laddas
  useEffect(() => {
    if (teamId) {
      getTeamMembers.execute({ teamId });
    }
  }, [teamId]);
  
  // ... (övrig logik)
  
  return (
    <TeamMembersScreenPresentation
      // ... (props)
      members={getTeamMembers.data || []}
      isLoading={getTeamMembers.isLoading}
      error={getTeamMembers.error}
      // ... (övriga props)
    />
  );
};
```

### 3. Hook (Applikationslager)

```tsx
// useTeamWithStandardHook.ts
export const useTeamWithStandardHook = () => {
  const { teamRepository, eventPublisher } = useTeamContext();
  const queryClient = useQueryClient();
  
  // GetTeamMembers
  const getTeamMembersQuery = useQuery({
    queryKey: ['team', 'members', teamId],
    queryFn: async () => {
      const getTeamMembersUseCase = new GetTeamMembersUseCase(teamRepository);
      const result = await getTeamMembersUseCase.execute({ teamId });
      
      if (result.isOk()) {
        return result.value;
      }
      
      throw new Error(result.error.message);
    },
    enabled: !!teamId
  });
  
  // ... (övriga queries/mutations)
  
  return {
    getTeamMembers: {
      data: getTeamMembersQuery.data,
      isLoading: getTeamMembersQuery.isLoading,
      error: getTeamMembersQuery.error ? { message: getTeamMembersQuery.error.message } : null,
      execute: ({ teamId }) => {
        getTeamMembersQuery.refetch();
      }
    },
    // ... (övriga operationer)
  };
};
```

### 4. Use Case (Applikationslager)

```tsx
// GetTeamMembersUseCase.ts
export class GetTeamMembersUseCase {
  constructor(private teamRepository: TeamRepository) {}
  
  async execute({ teamId }: { teamId: string }): Promise<Result<TeamMember[]>> {
    try {
      // Validera input
      if (!teamId) {
        return Result.err(new Error('Team ID is required'));
      }
      
      // Konvertera till domän-ID
      const teamIdVO = UniqueId.create(teamId);
      if (teamIdVO.isErr()) {
        return Result.err(teamIdVO.error);
      }
      
      // Hämta teammedlemmar från repository
      const teamMembersResult = await this.teamRepository.getTeamMembers(teamIdVO.value);
      if (teamMembersResult.isErr()) {
        return Result.err(teamMembersResult.error);
      }
      
      // Konvertera domänobjekt till DTOs för UI-lagret
      const teamMemberDTOs = teamMembersResult.value.map(member => ({
        id: member.id.toString(),
        name: member.name,
        email: member.email.value,
        role: member.role.value
      }));
      
      return Result.ok(teamMemberDTOs);
    } catch (error) {
      return Result.err(new Error(`Failed to get team members: ${error.message}`));
    }
  }
}
```

### 5. Repository (Infrastrukturlager)

```tsx
// SupabaseTeamRepository.ts
export class SupabaseTeamRepository implements TeamRepository {
  constructor(private supabase: SupabaseClient, private eventPublisher: DomainEventPublisher) {}
  
  async getTeamMembers(teamId: UniqueId): Promise<Result<TeamMember[]>> {
    try {
      // Hämta medlemmar från Supabase
      const { data, error } = await this.supabase
        .from('team_members')
        .select('id, user_id, role, users:user_id(id, name, email)')
        .eq('team_id', teamId.toString());
      
      if (error) {
        return Result.err(new Error(`Database error: ${error.message}`));
      }
      
      if (!data || data.length === 0) {
        return Result.ok([]);
      }
      
      // Konvertera databasposter till domänentiteter
      const membersResult = data.map(member => {
        // Skapa domänobjekt med validering
        const idResult = UniqueId.create(member.user_id);
        const emailResult = Email.create(member.users.email);
        const roleResult = TeamRole.create(member.role);
        
        // Verifiera att alla värden är giltiga
        if (idResult.isErr() || emailResult.isErr() || roleResult.isErr()) {
          return null;
        }
        
        // Skapa TeamMember-objektet
        return TeamMember.create({
          id: idResult.value,
          name: member.users.name,
          email: emailResult.value,
          role: roleResult.value
        });
      })
      .filter(Boolean)
      .map(result => result.isOk() ? result.value : null)
      .filter(Boolean);
      
      return Result.ok(membersResult);
    } catch (error) {
      return Result.err(new Error(`Repository error: ${error.message}`));
    }
  }
  
  // ... (övriga metoder)
}
```

### 6. Presentations-komponent (UI-lager)

```tsx
// TeamMembersScreenPresentation.tsx
export const TeamMembersScreenPresentation: React.FC<TeamMembersScreenPresentationProps> = ({
  teamId,
  teamName,
  members,
  isLoading,
  error,
  // ... (övriga props)
}) => {
  return (
    <Screen>
      <Appbar.Header>
        <Appbar.BackAction onPress={onBack} />
        <Appbar.Content title={`${teamName} - Medlemmar`} />
      </Appbar.Header>
      
      {/* Visa laddningsindikator */}
      {isLoading && <ActivityIndicator size="large" color="#0066cc" />}
      
      {/* Visa felmeddelande */}
      {error && (
        <ErrorMessage 
          message={error.message} 
          onRetry={error.retryable ? onRetry : undefined} 
        />
      )}
      
      {/* Visa medlemslista */}
      {!isLoading && !error && (
        <>
          {members.length === 0 ? (
            <EmptyState 
              title="Inga medlemmar" 
              description="Det finns inga medlemmar i detta team ännu." 
              icon="account-group"
              actionLabel="Lägg till medlem"
              onAction={onAddMember}
            />
          ) : (
            <FlatList
              data={members}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <MemberCard 
                  member={item} 
                  onPress={() => onMemberPress(item.id)}
                  onRemove={() => onRemoveMember(item.id)}
                />
              )}
            />
          )}
          
          {/* Formulär för att lägga till medlemmar */}
          <AddMemberForm 
            teamId={teamId}
            visible={isFormVisible}
            onClose={onToggleForm}
            onSubmit={onMemberAdd}
          />
          
          {/* FAB för att lägga till medlemmar */}
          <FAB
            icon="plus"
            onPress={onToggleForm}
            style={styles.fab}
          />
        </>
      )}
    </Screen>
  );
};
```

## Query caching med React Query

React Query spelar en central roll i applikationens dataflöde:

### Cachelägen och staleTime

```tsx
// I en hook
const teamQuery = useQuery({
  queryKey: ['team', teamId],
  queryFn: () => fetchTeam(teamId),
  staleTime: 5 * 60 * 1000,  // Data anses "färsk" i 5 minuter
  cacheTime: 30 * 60 * 1000,  // Data sparas i cachen i 30 minuter
  retryOnMount: true,  // Försök hämta data igen när komponenten monteras
  retryOnWindowFocus: true,  // Försök hämta data igen när fönstret får fokus
});
```

### Cache-invalidering efter mutation

```tsx
// I en hook
const addTeamMemberMutation = useMutation({
  mutationFn: (data) => addMemberToTeam(data),
  onSuccess: () => {
    // Invalidera alla queries som berör teammedlemmar
    queryClient.invalidateQueries(['team', 'members', teamId]);
    
    // Invalidera potentiellt påverkade användardata
    queryClient.invalidateQueries(['user', 'teams']);
  }
});
```

### Optimistisk uppdatering

```tsx
// I en hook
const removeTeamMemberMutation = useMutation({
  mutationFn: (data) => removeTeamMember(data),
  
  // Optimistiskt uppdatera UI innan servern svarar
  onMutate: async ({ teamId, userId }) => {
    // Avbryt pågående queries för att undvika race conditions
    await queryClient.cancelQueries(['team', 'members', teamId]);
    
    // Spara tidigare data för återställning vid fel
    const previousData = queryClient.getQueryData(['team', 'members', teamId]);
    
    // Optimistiskt uppdatera cachen
    queryClient.setQueryData(['team', 'members', teamId], (old) => 
      old.filter(member => member.id !== userId)
    );
    
    return { previousData };
  },
  
  // Hantera fel genom att återställa data
  onError: (err, variables, context) => {
    if (context?.previousData) {
      queryClient.setQueryData(['team', 'members', teamId], context.previousData);
    }
  },
  
  // Slutligen uppdatera cachen med färsk data
  onSettled: () => {
    queryClient.invalidateQueries(['team', 'members', teamId]);
  }
});
```

## Felhanteringsflöde

Felhantering är en viktig del av dataflödet:

### 1. Repository-nivå

```tsx
async findById(id: UniqueId): Promise<Result<Team>> {
  try {
    const { data, error } = await this.supabase
      .from('teams')
      .select('*')
      .eq('id', id.toString())
      .single();
    
    if (error) {
      // Hantera databasfel
      if (error.code === 'PGRST116') {
        // Ingen träff hittades
        return Result.err(new EntityNotFoundError('Team', id.toString()));
      }
      return Result.err(new DatabaseError(error.message));
    }
    
    // Konvertera till domänentitet
    return TeamMapper.toDomain(data);
  } catch (error) {
    // Hantera oväntade fel
    return Result.err(new UnexpectedError(error.message));
  }
}
```

### 2. Use Case-nivå

```tsx
async execute(request: GetTeamRequest): Promise<Result<TeamDTO>> {
  try {
    // Validera input
    const teamIdResult = UniqueId.create(request.teamId);
    if (teamIdResult.isErr()) {
      return Result.err(new ValidationError(teamIdResult.error.message));
    }
    
    // Anropa repository
    const teamResult = await this.teamRepository.findById(teamIdResult.value);
    if (teamResult.isErr()) {
      // Hantera specifika feltyper
      if (teamResult.error instanceof EntityNotFoundError) {
        return Result.err(new NotFoundError('Team not found'));
      }
      return Result.err(new ApplicationError(teamResult.error.message));
    }
    
    // Konvertera till DTO
    return Result.ok(TeamDTOMapper.fromDomain(teamResult.value));
  } catch (error) {
    // Hantera oväntade fel
    return Result.err(new UnexpectedError('Unexpected error in GetTeamUseCase'));
  }
}
```

### 3. Hook-nivå

```tsx
const getTeamQuery = useQuery({
  queryKey: ['team', teamId],
  queryFn: async () => {
    const useCase = new GetTeamUseCase(teamRepository);
    const result = await useCase.execute({ teamId });
    
    if (result.isOk()) {
      return result.value;
    }
    
    // Konvertera domänfel till UI-vänliga fel
    if (result.error instanceof NotFoundError) {
      throw new UIError('Team kunde inte hittas', true); // Retryable
    } else if (result.error instanceof ValidationError) {
      throw new UIError('Ogiltigt team-ID', false); // Inte retryable
    } else if (result.error instanceof ApplicationError) {
      throw new UIError('Ett fel uppstod vid hämtning av team', true);
    } else {
      throw new UIError('Ett oväntat fel uppstod', true);
    }
  }
});
```

### 4. Container-nivå

```tsx
// I container-komponenten
return (
  <TeamScreenPresentation
    // ... andra props
    error={getTeamQuery.error ? {
      message: getTeamQuery.error.message,
      retryable: getTeamQuery.error instanceof UIError ? getTeamQuery.error.retryable : true
    } : undefined}
    onRetry={() => getTeamQuery.refetch()}
  />
);
```

### 5. Presentations-nivå

```tsx
// I presentationskomponenten
{error && (
  <ErrorMessage 
    message={error.message}
    onRetry={error.retryable ? onRetry : undefined}
  />
)}
```

## Användning av DTOs

DTOs (Data Transfer Objects) används för att strukturerat överföra data mellan lager:

```tsx
// DTO-definition
export interface TeamDTO {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  ownerId: string;
  memberCount: number;
}

// Mapper för konvertering mellan domänobjekt och DTOs
export class TeamDTOMapper {
  static fromDomain(team: Team): TeamDTO {
    return {
      id: team.id.toString(),
      name: team.name.value,
      description: team.description.value,
      createdAt: team.createdAt.toISOString(),
      ownerId: team.ownerId.toString(),
      memberCount: team.memberCount
    };
  }
  
  static toDomain(dto: TeamDTO): Result<Team> {
    const idResult = UniqueId.create(dto.id);
    const nameResult = TeamName.create(dto.name);
    const descriptionResult = TeamDescription.create(dto.description);
    const ownerIdResult = UniqueId.create(dto.ownerId);
    
    // Validera alla värden
    if (idResult.isErr()) return Result.err(idResult.error);
    if (nameResult.isErr()) return Result.err(nameResult.error);
    if (descriptionResult.isErr()) return Result.err(descriptionResult.error);
    if (ownerIdResult.isErr()) return Result.err(ownerIdResult.error);
    
    // Skapa Team-entitet
    return Team.create({
      id: idResult.value,
      name: nameResult.value,
      description: descriptionResult.value,
      createdAt: new Date(dto.createdAt),
      ownerId: ownerIdResult.value,
      memberCount: dto.memberCount
    });
  }
}
```

## Best practices

Följande best practices säkerställer ett korrekt och effektivt dataflöde:

1. **Konsekvent felhantering**
   - Använd Result-typen genom hela applikationen
   - Inkapsla felmeddelanden i specifika feltyper
   - Konvertera tekniska felmeddelanden till användarvänliga meddelanden

2. **Caching-strategi**
   - Definiera lämpliga staleTime-värden baserat på datatyp
   - Invalidera cachen strategiskt efter mutationer
   - Använd optimistisk uppdatering för bättre användarupplevelse

3. **Datakonvertering**
   - Använd mappers för att konvertera mellan domänobjekt och DTOs
   - Validera data i varje lager
   - Använd specifika värde-objekt för domändata

4. **Prestandaoptimering**
   - Hämta endast den data som behövs
   - Använd paginering för stora datamängder
   - Implementera laddningsindikatorer för transparent feedback

5. **Testbarhet**
   - Testa dataflödet i varje lager (enhetstester)
   - Använd integrationstester för att verifiera hela dataflödet
   - Simulera nätverksproblem för att testa felhantering

## Slutsats

Dataflödet i Pling-mobilappen följer en tydlig och strukturerad modell som säkerställer separation av ansvar, testbarhet och underhållbarhet. Genom att konsekvent följa denna modell kan vi bygga robusta och användarvänliga funktioner med ett transparent dataflöde. 