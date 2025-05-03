# Team-modul dokumentation

## Översikt

Team-modulen är en central komponent i Pling-applikationen som hanterar alla aspekter av teamfunktionalitet. Modulen tillåter användare att skapa, hantera och samarbeta i team, med funktioner för medlemshantering, inbjudningar, behörighetshantering och teamkommunikation.

## Innehållsförteckning

1. [Datamodell](#datamodell)
2. [Komponenter](#komponenter)
3. [Hooks](#hooks)
4. [Tjänster](#tjänster)
5. [Prestandaoptimering](#prestandaoptimering)
6. [Workflow](#workflow)
7. [Best Practices](#best-practices)

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
  notification_settings?: TeamNotificationPreferences;
  privacy_settings?: TeamPrivacySettings;
}
```

### TeamMember

```typescript
interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  role: TeamRole; // 'owner' | 'admin' | 'member'
  created_at: string;
  joined_at: string;
  status: TeamMemberStatus; // 'active' | 'inactive' | 'pending'
  user?: TeamUser;
}
```

### TeamInvitation

```typescript
interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: TeamRole;
  token: string;
  expires_at: string;
  created_at: string;
  accepted_at?: string;
  team?: {
    id: string;
    name: string;
    description?: string;
    profile_image?: string;
  };
}
```

### TeamNotificationPreferences

```typescript
interface TeamNotificationPreferences {
  mentions: boolean;
  messages: boolean;
  events: boolean;
  invites: boolean;
}
```

### TeamPrivacySettings

```typescript
interface TeamPrivacySettings {
  visibility: 'public' | 'private';
  join_mode: 'open' | 'approval' | 'invite';
  member_list_visibility: 'public' | 'members';
}
```

## Komponenter

### TeamScreen

Huvudskärmen för team-funktionalitet som samordnar alla underkomponenter.

**Fil**: `app/(tabs)/team/index.tsx`
**Beroenden**: TeamHeader, TeamActions, TeamMembers, TeamLoadingState
**State Management**: Använder useTeamQueries och useTeamState för datahantering

```typescript
function TeamScreen() {
  // Hanterar laddning av teamdata, användarroll och behörigheter
  // Renderar olika vyer baserat på tillstånd (laddning, fel, inga team, teamvy)
}
```

### TeamHeader

Visar teamnamn och ger navigeringsfunktionalitet.

**Fil**: `components/team/TeamHeader.tsx`
**Props**:
- team: Team
- onBack?: () => void
- onSettings?: () => void

### TeamMembers

Visar teammedlemmar och hanteringsalternativ.

**Fil**: `components/team/TeamMembers.tsx`
**Props**:
- team: Team
- isLeader: boolean
- currentUserId?: string
- subscription: Subscription | null

### TeamMemberList

Listar teammedlemmar med rollhantering.

**Fil**: `components/team/TeamMemberList.tsx`
**Funktioner**:
- Stöder både automatisk datahämtning via React Query och manuell datahantering
- Diskriminerande union-typer för olika användningsfall
- Optimerad för prestanda med FlatList och React.memo

**Props**: (Diskriminerande union av följande typer)
```typescript
// För användning med React Query
interface TeamMemberListQueryProps {
  teamId: string;
  currentUserRole: TeamRole;
  // ...andra props
}

// För manuell medlemshantering
interface TeamMemberListManualProps {
  members: TeamMember[];
  currentUserRole: TeamRole;
  // ...andra props
}
```

### MemberItem

Enskild medlemsrad med behörighetsbaserade åtgärder.

**Fil**: `components/team/MemberItem.tsx`
**Props**:
- member: TeamMember
- currentUserRole: TeamRole
- onChangeRole?: (userId: string, newRole: TeamRole) => void
- onRemove?: (userId: string) => void
- onStatusChange?: (userId: string, newStatus: TeamMemberStatus) => void
- onSelect?: (member: TeamMember) => void
- variant?: 'default' | 'compact' | 'detailed'
- showRoleBadge?: boolean
- showStatusBadge?: boolean

### TeamSettings

Hanterar teaminstallningar inklusive profilbild, namn och beskrivning.

**Fil**: `components/team/TeamSettings.tsx`
**Funktioner**:
- Bilduppladdning till Supabase Storage med laddningsindikator
- Formulärhantering för teaminformation
- Abonnemangshantering

**Props**:
- team: Team
- subscription: Subscription | null

## Hooks

### useTeamQueries

Centraliserad hook för React Query-förfrågningar relaterade till team.

**Fil**: `hooks/useTeamQueries.ts`
**Funktioner**:
- useTeams: Hämtar användarens team
- useTeam: Hämtar ett specifikt team
- useTeamMembers: Hämtar medlemmar för ett specifikt team
- useTeamInvitations: Hämtar inbjudningar för ett team

**Exempel**:
```typescript
const { data: team, isLoading, error } = useTeam(teamId);
```

### useTeamMutations

Hook för hantering av mutationer (uppdateringar) av teamdata.

**Fil**: `hooks/useTeamMutations.ts`
**Funktioner**:
- useCreateTeam: Skapar ett nytt team
- useUpdateTeam: Uppdaterar teaminformation
- useDeleteTeam: Tar bort ett team
- useAddTeamMember: Lägger till en ny medlem
- useRemoveMember: Tar bort en medlem
- useUpdateMemberRole: Ändrar en medlems roll
- useUpdateMemberStatus: Ändrar en medlems status

**Exempel**:
```typescript
const { mutate: updateTeam, isLoading } = useUpdateTeam();
updateTeam({ teamId, data: { name: 'Nytt namn' } });
```

### useTeamState

Hook för komplex tillståndshantering i teamkomponenter med useReducer.

**Fil**: `hooks/useTeamState.ts`
**Funktioner**:
- Hanterar komplext teamtillstånd
- Tillhandahåller actions för tillståndsförändring
- Kontrollerar behörigheter baserat på användarroll

**Exempel**:
```typescript
const [state, dispatch] = useTeamState(team, currentUserId);
```

### useImageUpload

Hook för hantering av bilduppladdning till Supabase Storage.

**Fil**: `hooks/useImageUpload.ts`
**Funktioner**:
- Hanterar val av bild från enhetens galleri
- Laddar upp bild till Supabase Storage
- Hanterar laddningstillstånd och fel
- Returnerar publika URL:er

**Exempel**:
```typescript
const { uploadImage, uploading, error } = useImageUpload('team-avatars');
const handleUpload = async () => {
  const url = await uploadImage();
  if (url) {
    updateTeam({ ...team, profile_image: url });
  }
};
```

## Tjänster

### teamService

Huvudtjänst för interaktion med team-relaterad data i databasen.

**Fil**: `services/teamService.ts`
**Funktioner**:
- createTeam: Skapar ett nytt team
- getTeam: Hämtar teamdata
- updateTeam: Uppdaterar teaminformation
- deleteTeam: Tar bort ett team
- getUserTeams: Hämtar en användares team
- getTeamMembers: Hämtar medlemmar för ett specifikt team
- addTeamMember: Lägger till en medlem
- updateTeamMemberRole: Uppdaterar en medlems roll
- removeTeamMember: Tar bort en medlem från teamet
- createTeamInviteCode: Skapar en inbjudningskod
- getTeamInvitation: Hämtar en inbjudan baserat på e-post
- acceptTeamInvitation: Accepterar en inbjudan
- declineTeamInvitation: Avböjer en inbjudan

**Exempel**:
```typescript
const { data, error } = await teamService.getTeam(teamId);
```

**Felhantering**:
Alla metoder returnerar ett standardiserat svar:

```typescript
interface TeamServiceResponse<T> {
  data: T | null;
  error: string | null;
  status: 'success' | 'error';
}
```

## Prestandaoptimering

### Virtualisering

TeamMemberList använder FlatList för effektiv rendering av stora listor:

```typescript
<FlatList
  data={members}
  renderItem={renderItem}
  // Prestandaoptimering
  removeClippedSubviews={true}
  windowSize={5}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
/>
```

### Memoization

Komponenter använder React.memo och useMemo för att förhindra onödiga omrenderingar:

```typescript
// i TeamMemberList.tsx
const renderItem = useMemo(() => ({ item }: { item: TeamMember }) => (
  <MemberItem ... />
), [dependencies]);

// i MemberItem.tsx
export const MemberItem = React.memo(function MemberItem(props: MemberItemProps) {
  // ...
});
```

### React Query Caching

Skräddarsydd cachehantering för teamdata:

```typescript
// i useTeamQueries.ts
const useTeam = (teamId: string) => {
  return useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamService.getTeam(teamId),
    staleTime: 60000, // 1 minut innan refetch
    cacheTime: 300000, // 5 minuter innan cache rensas
  });
};
```

## Workflow

### Typisk användarflöde

1. **Navigering till Team-skärmen**:
   - Om användaren inte har något team: visas skapa team-formulär
   - Om användaren har team: visar teamet med TeamHeader, TeamMembers, etc.

2. **Medlemshantering**:
   - Användare med rollen 'admin' eller 'owner' kan bjuda in/ta bort/ändra roller för teammedlemmar
   - Alla användare kan se teammedlemmar via TeamMemberList

3. **Teaminställningar**:
   - Teamägare kan redigera teaminformation via TeamSettings
   - Ladda upp teamprofilbild

4. **Teamkommunikation**:
   - Medlemmar kan kommunicera via teamchatt
   - Stöd för mentions och bilagor

### Behörighetsflöde

Beslut om åtgärder baseras på användarroll:

```typescript
// Exempel från en komponent
{currentUserRole === 'owner' && <Button onPress={deleteTeam}>Ta bort team</Button>}
{['owner', 'admin'].includes(currentUserRole) && <Button onPress={inviteMember}>Bjud in</Button>}
```

## Best Practices

### Typsäkerhet

- Använd specificerade typer (undvik 'any')
- Använd diskriminerande unions för olika tillstånd

### State Management

- Använd React Query för serverstate
- useReducer för komplex lokal state
- useState för enkel lokal state

### Felhantering

- Standardiserat felhanteringsmönster i alla tjänster
- Visning av användarvänliga felmeddelanden

### Optimering

- Använd memoization för att förhindra onödiga omrenderingar
- Virtualiserade listor för stora datamängder
- Optimistiska uppdateringar för bättre användarupplevelse

### Lokalisering

- All användargränssnittstext på svenska
- Formatera datum och tid enligt svensk konvention 