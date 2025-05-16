# Container/Presentation-mönstret i Pling Mobile

Detta dokument beskriver vår implementation av container/presentation-mönstret i Pling-mobilappen, ett arkitekturmönster som separerar presentationslogik (UI) från affärslogik och datahämtning.

## Översikt

Container/presentation-mönstret (även känt som "smart/dumb components") är en strategi för att organisera React-komponenter som främjar separation av ansvar, återanvändbarhet och testbarhet.

I Pling-mobilappen har vi implementerat detta mönster för alla större skärmar och komponenter, vilket resulterar i:

1. **Presentation-komponenter**: Ansvariga för hur saker ser ut
   - Tar emot data via props
   - Renderar UI baserat på denna data
   - Har ingen affärslogik eller API-anrop
   - Kommunicerar uppåt via callback-funktioner
   - Stateless i största möjliga utsträckning

2. **Container-komponenter**: Ansvariga för hur saker fungerar
   - Hanterar affärslogik och datahämtning
   - Använder hooks för att hämta data och hantera tillstånd
   - Implementerar callback-funktionerna för användarinteraktioner
   - Hanterar navigationslogik
   - Förbereder och injicerar data i presentation-komponenter

## Exempel på implementation

Som exempel på detta mönster kan vi se på `TeamMembersScreen`:

### Presentation-komponent

```tsx
// TeamMembersScreenPresentation.tsx
export interface TeamMembersScreenPresentationProps {
  // Data
  teamId: string;
  teamName: string;
  members: TeamMember[];
  
  // Tillstånd
  isLoading: boolean;
  error?: { message: string; retryable?: boolean };
  isFormVisible: boolean;
  
  // Callbacks
  onBack: () => void;
  onMemberPress: (memberId: string) => void;
  onAddMember: () => void;
  onRemoveMember: (memberId: string) => void;
  onToggleForm: () => void;
  onMemberAdd: (memberData: NewMemberData) => void;
  onRetry: () => void;
}

export const TeamMembersScreenPresentation: React.FC<TeamMembersScreenPresentationProps> = ({
  teamId,
  teamName,
  members,
  isLoading,
  error,
  isFormVisible,
  onBack,
  onMemberPress,
  onAddMember,
  onRemoveMember,
  onToggleForm,
  onMemberAdd,
  onRetry,
}) => {
  // Presentationslogik och rendering
  return (
    <Screen>
      <Appbar.Header>
        <Appbar.BackAction onPress={onBack} />
        <Appbar.Content title={`${teamName} - Medlemmar`} />
      </Appbar.Header>
      
      {/* Innehåll baserat på tillstånd (laddning, fel, data) */}
      {isLoading && <ActivityIndicator />}
      {error && <ErrorMessage message={error.message} onRetry={error.retryable ? onRetry : undefined} />}
      {!isLoading && !error && (
        <>
          <TeamMemberList 
            members={members} 
            onMemberPress={onMemberPress} 
            onRemove={onRemoveMember} 
          />
          
          <AddMemberForm 
            teamId={teamId}
            visible={isFormVisible}
            onClose={onToggleForm}
            onSubmit={onMemberAdd}
          />
          
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

### Container-komponent

```tsx
// TeamMembersScreenContainer.tsx
export interface TeamMembersScreenContainerProps {
  teamId?: string;
}

export const TeamMembersScreenContainer: React.FC<TeamMembersScreenContainerProps> = ({ 
  teamId: propTeamId 
}) => {
  const router = useRouter();
  const params = useLocalSearchParams<{ teamId: string }>();
  
  // Använd teamId från props om det finns, annars från URL-parametrar
  const teamId = propTeamId || params.teamId || '';
  
  // State management
  const [isFormVisible, setIsFormVisible] = useState(false);
  
  // Data fetching med hooks
  const { getTeam, getTeamMembers, addTeamMember, removeTeamMember } = useTeamWithStandardHook();
  
  // Hämta team-information när komponenten laddas
  useEffect(() => {
    if (teamId) {
      getTeam.execute({ teamId });
      getTeamMembers.execute({ teamId });
    }
  }, [teamId]);
  
  // Hantera navigering tillbaka
  const handleBack = () => {
    router.back();
  };
  
  // Hantera klick på medlem
  const handleMemberPress = (memberId: string) => {
    router.push(`/teams/${teamId}/members/${memberId}`);
  };
  
  // Hantera visning av formulär
  const handleToggleForm = () => {
    setIsFormVisible(!isFormVisible);
  };
  
  // Hantera borttagning av medlem
  const handleRemoveMember = async (memberId: string) => {
    const result = await removeTeamMember.execute({
      teamId,
      userId: memberId
    });
    
    if (result.isOk()) {
      // Uppdatera medlemslistan
      getTeamMembers.execute({ teamId });
    }
  };
  
  // Hantera tillägg av medlem
  const handleMemberAdd = async (memberData: NewMemberData) => {
    const result = await addTeamMember.execute({
      teamId,
      email: memberData.email,
      role: memberData.role
    });
    
    if (result.isOk()) {
      // Uppdatera medlemslistan och dölj formuläret
      getTeamMembers.execute({ teamId });
      setIsFormVisible(false);
    }
  };
  
  // Kombinera laddningstillstånd
  const isLoading = getTeam.isLoading || getTeamMembers.isLoading;
  
  // Kombinera felmeddelanden
  const error = getTeamMembers.error || getTeam.error;
  
  return (
    <TeamMembersScreenPresentation
      teamId={teamId}
      teamName={getTeam.data?.name || 'Team'}
      members={getTeamMembers.data || []}
      isLoading={isLoading}
      error={error}
      isFormVisible={isFormVisible}
      onBack={handleBack}
      onMemberPress={handleMemberPress}
      onAddMember={() => setIsFormVisible(true)}
      onRemoveMember={handleRemoveMember}
      onToggleForm={handleToggleForm}
      onMemberAdd={handleMemberAdd}
      onRetry={() => {
        getTeam.execute({ teamId });
        getTeamMembers.execute({ teamId });
      }}
    />
  );
};
```

## Bakåtkompatibilitet

För att tillhandahålla enkel migration och bakåtkompatibilitet med befintlig kod, skapar vi en wrapper-fil som exporterar container-komponenten:

```tsx
// TeamMembersScreen.tsx
import { TeamMembersScreenContainer } from './TeamMembersScreen';
export { TeamMembersScreenContainer as TeamMembersScreen };
```

## Mapphierarkier

För varje större skärm eller komponent följer vi en standardiserad mappstruktur:

```
ComponentName/
  ├── ComponentNamePresentation.tsx   # Presentationskomponent
  ├── ComponentNameContainer.tsx      # Container-komponent
  ├── index.tsx                       # Exporterar både container och presentation
  ├── __tests__/                      # Testfiler
  │   ├── ComponentNamePresentation.test.tsx
  │   └── ComponentNameContainer.test.tsx
  └── integration-tests/              # Integrationstester
      └── ComponentName.integration.test.tsx
```

## Fördelar

Detta mönster ger oss flera viktiga fördelar:

1. **Förbättrad testbarhet**
   - Presentationskomponenter kan testas isolerat utan att mocka komplext tillstånd eller data-fetching
   - Container-komponenter kan testas för korrekt datahantering, oberoende av UI

2. **Ökad återanvändbarhet**
   - Presentationskomponenter kan återanvändas med olika datakällor
   - Container-komponenter kan återanvändas med olika UI-representationer

3. **Tydliga ansvarsområden**
   - Presentation: Hur saker ser ut (UI)
   - Container: Hur saker fungerar (affärslogik)

4. **Enklare refaktorering**
   - UI kan ändras utan att påverka affärslogik
   - Affärslogik kan ändras utan att påverka UI

5. **Bättre samarbete**
   - UI-utvecklare kan fokusera på presentationskomponenter
   - Backend-orienterade utvecklare kan fokusera på container-komponenter

## Dataflödesdiagram

```
┌─────────────────────────────────┐
│         Domain Layer            │
│  (Entities, Value Objects)      │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│      Infrastructure Layer       │
│  (Repositories, Services)       │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│      Application Layer          │
│  (Use Cases, DTOs)              │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│        React Query              │
│  (Cache, Data Fetching)         │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│    Container Component          │
│  (Data & Logic)                 │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│   Presentation Component        │
│  (UI Rendering)                 │
└─────────────────────────────────┘
```

## Standarder för container-komponenter

Container-komponenter bör:

1. Importera och använda hooks för datahämtning
2. Hantera all affärslogik och datahämtning
3. Definiera callback-funktioner för användarinteraktioner
4. Hantera navigationslogik med `useRouter` eller liknande
5. Förbereda data för presentation-komponenten
6. Hantera lämpliga tillståndshanteringsstrategier
7. Konvertera domänmodeller till presentation-vänliga format
8. Implementera felhanteringslogik och återhämtning

## Standarder för presentation-komponenter

Presentation-komponenter bör:

1. Importera UI-komponenter och stilar
2. Ta emot all data via props
3. Definiera specifika typer för props
4. Implementera ren renderingslogik
5. Hantera lokala UI-tillstånd (t.ex. fokus, animationer)
6. Inte innehålla API-anrop eller affärslogik
7. Vara stateless eller innehålla endast UI-relaterat tillstånd
8. Kommunicera uppåt via callback-funktioner

## Best Practices

### För container-komponenter:

1. **Håll dem fokuserade**: En container bör ansvara för en väldefinierad funktionalitet.
2. **Använd hooks effektivt**: Samla relaterade datahämtningsoperationer i anpassade hooks.
3. **Hantera fel konsekvent**: Implementera standardiserad felhantering.
4. **Hantera laddningstillstånd**: Ge meningsfull feedback under laddning.
5. **Optimera prestanda**: Använd React Query:s caching och optimistiska uppdateringar.

### För presentation-komponenter:

1. **Dokumentera props**: Använd typning och JSDoc för att dokumentera förväntade props.
2. **Dela upp stora komponenter**: Bryt ned komplexa UI i mindre återanvändbara delar.
3. **Använd konsekvent stilsättning**: Följ designsystemet och stilguiden.
4. **Hantera alla tillstånd**: Designa för alla möjliga tillstånd (laddning, fel, tom data, etc.).
5. **Tillgänglighet**: Implementera lämpliga tillgänglighetsstöd.

## Slutsats

Container/presentation-mönstret utgör en central del av Pling-mobilappens arkitektur. Det möjliggör en tydlig separation av ansvar som förbättrar kodens testbarhet, underhållbarhet och återanvändbarhet. Genom att konsekvent följa detta mönster kan vi bygga en robust och skalbar kodstruktur som är enkel att utveckla och underhålla. 