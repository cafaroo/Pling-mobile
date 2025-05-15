# Implementationsguide för Team-modulen

## Introduktion

Denna guide är avsedd för utvecklare som ska arbeta med Team-modulen i Pling-applikationen. Guiden går igenom hur man implementerar nya funktioner, rättar till fel och utökar befintlig funktionalitet på ett sätt som följer projektets konventioner och arkitektur.

## Förutsättningar

För att arbeta med Team-modulen bör du ha följande:

- Grundläggande förståelse för React Native och Expo
- Kunskap om TypeScript
- Förståelse för React Query och serverstate-hantering
- Kännedom om Supabase-plattformen

## Projektstruktur

Team-modulens kod är organiserad enligt följande struktur:

```
/app
  /(tabs)
    /team
      index.tsx              # Huvudskärm för team
      [id].tsx               # Detaljvy för team
      /components            # Skärmspecifika komponenter
/components
  /team                      # Delade team-komponenter
    TeamHeader.tsx
    TeamMemberList.tsx
    MemberItem.tsx
    TeamSettings.tsx
    ... fler komponenter ...
/hooks
  useTeamQueries.ts          # React Query för team-data
  useTeamMutations.ts        # Team-mutationer
  useTeamState.ts            # Komplex state-hantering
  useImageUpload.ts          # Bilduppladdningsfunktionalitet
/services
  teamService.ts             # API-integration för team
/types
  team.ts                    # Team-relaterade typdefinitioner
```

## Att komma igång

### 1. Förstå datamodellen

Börja med att bekanta dig med de centrala datamodellerna:

- `Team` - Representerar ett team
- `TeamMember` - Representerar en medlem i ett team
- `TeamRole` - Enum för medlemsroller ('owner', 'admin', 'member')
- `TeamMemberStatus` - Enum för medlemstatus ('active', 'inactive', 'pending')

Se `types/team.ts` för fullständiga typdefinitioner.

### 2. Förstå dataflödet

För att förstå hur data flödar genom applikationen, studera [team-data-flow.md](./team-data-flow.md) som beskriver:

- Hur data hämtas från Supabase
- Hur React Query används för state management
- Hur data muteras och uppdateras
- Hur optimistiska uppdateringar fungerar

### 3. Bekanta dig med huvudkomponenterna

Övergripande komponenter:
- `TeamScreen` - Huvudcontainern som visar team-vyn
- `TeamMembers` - Visar teammedlemmar och hanteringsalternativ
- `TeamMemberList` - Listar teammedlemmar med rollhantering
- `TeamSettings` - Hanterar teaminställningar

## Vanliga utvecklingsuppgifter

### Lägga till en ny team-funktion

1. **Definiera nya typer** (om nödvändigt):
   ```typescript
   // types/team.ts
   export interface TeamFeature {
     id: string;
     name: string;
     enabled: boolean;
   }
   ```

2. **Uppdatera teamService** med nya API-metoder:
   ```typescript
   // services/teamService.ts
   
   // Hämta funktioner för ett team
   async function getTeamFeatures(teamId: string): Promise<TeamServiceResponse<TeamFeature[]>> {
     try {
       // Implementera Supabase-anrop här
       const { data, error } = await supabase
         .from('team_features')
         .select('*')
         .eq('team_id', teamId);
         
       if (error) throw error;
       
       return {
         data,
         error: null,
         status: 'success'
       };
     } catch (error) {
       return handleServiceError(error, 'Kunde inte hämta teamfunktioner');
     }
   }
   ```

3. **Skapa React Query hook** för att hantera tillstånd:
   ```typescript
   // hooks/useTeamQueries.ts
   
   export const useTeamFeatures = (teamId: string) => {
     return useQuery({
       queryKey: ['team-features', teamId],
       queryFn: () => teamService.getTeamFeatures(teamId),
       enabled: !!teamId,
     });
   };
   ```

4. **Implementera UI-komponent**:
   ```typescript
   // components/team/TeamFeatures.tsx
   import React from 'react';
   import { View, Text, Switch, StyleSheet } from 'react-native';
   import { useTeamFeatures } from '@/hooks/useTeamQueries';
   import { useUpdateTeamFeature } from '@/hooks/useTeamMutations';
   import { LoadingState } from '@/components/ui/LoadingState';
   
   interface TeamFeaturesProps {
     teamId: string;
     isAdmin: boolean;
   }
   
   export function TeamFeatures({ teamId, isAdmin }: TeamFeaturesProps) {
     const { data: featuresData, isLoading } = useTeamFeatures(teamId);
     const updateFeature = useUpdateTeamFeature();
     
     if (isLoading) return <LoadingState />;
     
     const features = featuresData?.data || [];
     
     return (
       <View style={styles.container}>
         <Text style={styles.title}>Teamfunktioner</Text>
         {features.map(feature => (
           <View key={feature.id} style={styles.featureRow}>
             <Text>{feature.name}</Text>
             <Switch
               disabled={!isAdmin}
               value={feature.enabled}
               onValueChange={(value) => {
                 updateFeature.mutate({
                   teamId,
                   featureId: feature.id,
                   enabled: value
                 });
               }}
             />
           </View>
         ))}
       </View>
     );
   }
   
   const styles = StyleSheet.create({
     container: {
       padding: 16,
     },
     title: {
       fontSize: 18,
       fontWeight: 'bold',
       marginBottom: 16,
     },
     featureRow: {
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
       paddingVertical: 8,
       borderBottomWidth: 1,
       borderBottomColor: '#eee',
     }
   });
   ```

5. **Integrera komponenten** i relevant föräldrakomponent:
   ```typescript
   // components/team/TeamScreen.tsx
   
   // Lägg till i renders
   {isLeader && (
     <TeamFeatures 
       teamId={team.id} 
       isAdmin={currentUserRole === 'owner' || currentUserRole === 'admin'}
     />
   )}
   ```

### Åtgärda ett fel i team-modulen

1. **Identifiera problemet**
   - Isolera vilken komponent, hook eller service som har felet
   - Kontrollera felmeddelanden och loggar

2. **Reproducer felet**
   - Skapa ett enkelt testfall som konsekvent kan reproducera problemet
   - Identifiera exakt när och under vilka förhållanden felet uppträder

3. **Hitta grundorsaken**
   - Kontrollera om det är ett UI-fel, state-problem eller API-fel
   - Använd konsolloggning eller debuggers för att spåra dataflödet

4. **Implementera en lösning**
   - Följ kodstilar och mönster i den befintliga koden
   - Se till att uppdatera alla relevanta komponenter

5. **Testa lösningen**
   - Verifiera att felet är löst
   - Kontrollera att inga nya fel har introducerats
   - Verifiera över olika enheter/skärmstorlekar

### Implementera ny teamroll

1. **Uppdatera typdefinitionen**:
   ```typescript
   // types/team.ts
   export type TeamRole = 'owner' | 'admin' | 'member' | 'observer';
   ```

2. **Uppdatera databasmigrering**:
   ```sql
   -- Skapa migrering för att uppdatera enumtypen
   ALTER TYPE team_member_role ADD VALUE 'observer';
   ```

3. **Uppdatera UI i MemberItem**:
   ```typescript
   // components/team/MemberItem.tsx
   
   // Uppdatera rollmenyn
   const roleOptions = [
     { label: 'Ägare', value: 'owner' },
     { label: 'Admin', value: 'admin' },
     { label: 'Medlem', value: 'member' },
     { label: 'Observatör', value: 'observer' }
   ];
   ```

4. **Uppdatera behörighetslogik**:
   ```typescript
   // hooks/useTeamState.ts
   
   // Uppdatera behörighetslogik i reducer
   const canEditTeamSettings = (role: TeamRole) => {
     return role === 'owner' || role === 'admin';
   };
   
   const canInviteMembers = (role: TeamRole) => {
     return role === 'owner' || role === 'admin';
   };
   
   const canRemoveMembers = (role: TeamRole, targetRole: TeamRole) => {
     if (role === 'owner') return true;
     if (role === 'admin') return targetRole !== 'owner';
     return false;
   };
   ```

## Best Practices

### Typsäkerhet

- Använd alltid explicita typer, undvik `any`
- Använd diskriminerande unions för olika tillstånd
- Definiera nyckeltyper i centrala typfiler

```typescript
// Föredra detta:
interface TeamMember {
  id: string;
  role: TeamRole;
}

// Istället för:
interface TeamMember {
  id: string;
  role: any; // Undvik detta
}
```

### State Management

- Använd React Query för serverdata
- Använd useReducer för komplex lokal state
- Hantera laddningstillstånd och fel konsekvent

```typescript
// Lägg till skelettkod för alla tillstånd
if (isLoading) return <LoadingState />;
if (error) return <ErrorState message={error.message} />;
if (!data) return <EmptyState />;

// Nu kan vi säkert arbeta med data
return <SuccessView data={data} />;
```

### Prestandaoptimering

- Använd React.memo för komponenter som inte ändras ofta
- Använd useMemo och useCallback för att minska onödiga omrenderingar
- Använd virtualisering (FlatList) för listor

```typescript
// Använd React.memo för rena komponenter
export const TeamMemberItem = React.memo(function TeamMemberItem({ member }: Props) {
  // Komponentlogik här
});

// Använd useMemo för beräknade värden
const sortedMembers = useMemo(() => {
  return [...members].sort((a, b) => {
    if (a.role === 'owner') return -1;
    if (b.role === 'owner') return 1;
    return 0;
  });
}, [members]);
```

### Felhantering

- Hantera fel på ett användarfokuserat sätt
- Använd konsekvent felhanteringslogik i tjänster
- Visa meningsfulla felmeddelanden till användaren

```typescript
// I tjänster
try {
  // Försök utföra operation
} catch (error) {
  return {
    data: null,
    error: 'Vänligen försök igen senare. Om problemet kvarstår, kontakta support.',
    status: 'error'
  };
}

// I komponenter
if (error) {
  return (
    <ErrorState 
      title="Något gick fel" 
      message={error.message} 
      onRetry={refetch} 
    />
  );
}
```

## Testning

### Manuell testning

Checklista för manuell testning:
- Kan användare skapa team?
- Kan användare bjuda in medlemmar?
- Kan användare ändra medlemsroller baserat på deras egna behörigheter?
- Fungerar optimistiska uppdateringar korrekt?
- Visas laddningstillstånd och fel korrekt?

### Automatiserad testning

Exempel på enkelt komponenttest:

```typescript
// tests/components/MemberItem.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MemberItem } from '@/components/team/MemberItem';

describe('MemberItem', () => {
  it('renders correctly', () => {
    const member = {
      id: '1',
      user_id: '1',
      team_id: '1',
      role: 'member',
      status: 'active',
      created_at: new Date().toISOString(),
      joined_at: new Date().toISOString(),
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        avatar_url: 'https://example.com/avatar.png'
      }
    };
    
    const { getByText } = render(
      <MemberItem 
        member={member}
        currentUserRole="admin"
        variant="default"
        showRoleBadge={true}
        showStatusBadge={true}
      />
    );
    
    expect(getByText('Test User')).toBeTruthy();
    expect(getByText('Medlem')).toBeTruthy();
  });
});
```

## Felsökning

### Vanliga problem

#### React Query cache-problem

**Problem**: Data uppdateras inte efter en mutation.
**Lösning**: Se till att invalidera rätt query-nycklar:

```typescript
// Efter en mutation
queryClient.invalidateQueries({ queryKey: ['team', teamId] });
queryClient.invalidateQueries({ queryKey: ['teams'] });
```

#### Supabase-relaterade fel

**Problem**: Fel vid databasoperationer.
**Lösning**: Kontrollera RLS-policyer och SQL-frågor:

```typescript
// Bättre felhantering i tjänster
try {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('team_id', teamId);
    
  if (error) {
    console.error('Supabase error:', error);
    throw error;
  }
  
  return data;
} catch (error) {
  console.error('Caught error:', error);
  throw new Error(`Kunde inte hämta teammedlemmar: ${error.message}`);
}
```

#### Typfel

**Problem**: TypeScript-kompileringsfel relaterade till typer.
**Lösning**: Definiera tydliga gränssnitt och använd typvakter:

```typescript
// Typvakt för att skilja mellan olika datastrukturer
function isTeamMember(obj: any): obj is TeamMember {
  return obj && 
    typeof obj === 'object' && 
    'user_id' in obj && 
    'role' in obj;
}

// Använd typvakten
if (isTeamMember(item)) {
  // Nu vet TypeScript att item är av typen TeamMember
  console.log(item.role);
} else {
  // Hantera när item inte är TeamMember
}
```

## Avslutningsvis

Denna guide är en startpunkt för att arbeta med Team-modulen. För mer detaljerad information, se:

- [team-module.md](./team-module.md) - Fullständig dokumentation av modulen
- [team-data-flow.md](./team-data-flow.md) - Detaljerat dataflöde
- Källkoden själv, som är den mest aktuella referensen

Kom ihåg att följa projektets kodningsriktlinjer och -konventioner, och använd TypeScript till dess fulla potential för att skapa säker, underhållbar kod.

## Datamodell

### Team

```typescript
interface Team {
  id: string;
  name: string;
  description?: string;
  organization_id?: string;
  created_at: string;
  updated_at: string;
  profile_image?: string;
  members?: TeamMember[];
}
```

### TeamMember och Status

```typescript
interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  status: TeamMemberStatus;
  created_at: string;
  updated_at: string;
  user?: TeamUser;
}

/**
 * Status för en teammedlem
 * Matchar databasens team_member_status enum
 */
type TeamMemberStatus = 'active' | 'pending' | 'invited' | 'inactive';
```

#### Medlemsstatus

Medlemsstatus hanteras genom en dedikerad enum i databasen och motsvarande TypeScript-typ:

1. **Status-typer**:
   - `active` - Fullt aktiv medlem med tillgång till teamets funktioner
   - `pending` - Väntar på godkännande (t.ex. efter att ha ansökt om medlemskap)
   - `invited` - Har blivit inbjuden men inte accepterat än
   - `inactive` - Pausad eller inaktiverad medlem

2. **Databasimplementation**:
   ```sql
   CREATE TYPE team_member_status AS ENUM (
     'active',    -- Aktiv medlem
     'pending',   -- Väntar på godkännande
     'invited',   -- Inbjuden men inte accepterat än
     'inactive'   -- Inaktiv/pausad medlem
   );
   ```

3. **TypeScript-konstanter**:
   ```typescript
   export const TeamMemberStatus = {
     ACTIVE: 'active' as const,
     PENDING: 'pending' as const,
     INVITED: 'invited' as const,
     INACTIVE: 'inactive' as const,
   } as const;
   ```

4. **Statusövergångar**:
   - `invited` -> `active`: När en inbjuden användare accepterar inbjudan
   - `pending` -> `active`: När en administratör godkänner en medlemskapsansökan
   - `active` -> `inactive`: När en medlem pausas eller inaktiveras
   - `inactive` -> `active`: När en inaktiv medlem återaktiveras

5. **Behörigheter per status**:
   - `active`: Full tillgång till teamets funktioner enligt roll
   - `pending`: Kan se begränsad teaminformation
   - `invited`: Kan endast acceptera/avvisa inbjudan
   - `inactive`: Kan se historisk data men inte interagera

6. **Användning i kod**:
   ```typescript
   // Exempel på statusuppdatering
   const updateMemberStatus = async (
     teamId: string,
     userId: string,
     newStatus: TeamMemberStatus
   ) => {
     await teamService.updateTeamMemberStatus(teamId, userId, newStatus);
   };

   // Exempel på statusvalidering
   const canAccessTeam = (member: TeamMember): boolean => {
     return member.status === TeamMemberStatus.ACTIVE;
   };
   ```

7. **UI-hantering**:
   ```typescript
   // Exempel på hur status visas i UI
   const getStatusLabel = (status: TeamMemberStatus): string => {
     switch (status) {
       case TeamMemberStatus.ACTIVE:
         return 'Aktiv';
       case TeamMemberStatus.PENDING:
         return 'Väntar';
       case TeamMemberStatus.INVITED:
         return 'Inbjuden';
       case TeamMemberStatus.INACTIVE:
         return 'Inaktiv';
       default:
         return 'Okänd';
     }
   };
   ```

8. **Prestandaoptimering**:
   - Index på status-kolumnen för snabbare sökningar:
     ```sql
     CREATE INDEX idx_team_members_status ON team_members(status);
     ```
   - Filtrera medlemslistor baserat på status för att minska datamängden

9. **Felhantering**:
   ```typescript
   try {
     await updateMemberStatus(teamId, userId, newStatus);
   } catch (error) {
     if (error.code === 'invalid_status_transition') {
       // Hantera ogiltiga statusövergångar
     }
     // Hantera andra fel
   }
   ``` 