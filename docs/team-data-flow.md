# Team-dataflöden

## Översikt

Detta dokument beskriver dataflöden inom team-modulen i Pling-applikationen. Det täcker hur data rör sig från användargränssnittet genom hooks och tjänster till och från databasen, samt hur olika datatyper interagerar med varandra.

## Innehållsförteckning

1. [Dataflödesdiagram](#dataflödesdiagram)
2. [Hämtning av teamdata](#hämtning-av-teamdata)
3. [Mutationer av teamdata](#mutationer-av-teamdata)
4. [Medlemshantering](#medlemshantering)
5. [Inbjudningsprocess](#inbjudningsprocess)
6. [Optimistiska uppdateringar](#optimistiska-uppdateringar)
7. [Cachning och invalidering](#cachning-och-invalidering)

## Dataflödesdiagram

```
┌─────────────────┐     ┌───────────────┐     ┌────────────────┐     ┌────────────┐
│  Komponenter    │◄────┤    Hooks      │◄────┤   Tjänster     │◄────┤  Supabase  │
│  (UI-lager)     │     │ (State-lager) │     │ (Logik-lager)  │     │ (Datalager)│
└────────┬────────┘     └───────┬───────┘     └────────┬───────┘     └────────────┘
         │                      │                      │
         ▼                      ▼                      ▼
┌─────────────────┐     ┌───────────────┐     ┌────────────────┐
│ Användarinterak-│     │ React Query   │     │  API-anrop     │
│ tioner, render  │     │ useReducer    │     │  Felhantering  │
└─────────────────┘     └───────────────┘     └────────────────┘
```

## Hämtning av teamdata

### Användarens team

```
1. Komponent: TeamScreen mountas
   │
2. Hook: useTeams() aktiveras
   │
3. React Query startar förfrågan om datauppdatering
   │
4. Tjänst: teamService.getUserTeams() anropas
   │
5. Supabase API: SELECT-förfrågan till teams-tabellen
   │
6. Supabase returnerar teamdata
   │
7. Tjänst: Formaterar och validerar svaret
   │
8. React Query: Lagrar data i cache och uppdaterar isLoading/error
   │
9. Komponent: Renderar listan av team
```

### Hämtning av teammedlemmar

```
1. Komponent: TeamMemberList mountas med teamId
   │
2. Hook: useTeamMembers(teamId) aktiveras
   │
3. React Query startar förfrågan
   │
4. Tjänst: teamService.getTeamMembers(teamId) anropas
   │
5. Supabase API: JOIN mellan team_members och profiles tabeller
   │
6. Supabase returnerar medlemsdata med användarprofiler
   │
7. Tjänst: Formaterar och validerar svar
   │
8. React Query: Lagrar data i cache och uppdaterar isLoading/error
   │
9. Komponent: Renderar medlemslistan med roller och status
```

## Mutationer av teamdata

### Uppdatering av teaminformation

```
1. Användare: Ändrar teamnamn i TeamSettings
   │
2. Event handler: handleSubmit() aktiveras
   │
3. Hook: updateTeam.mutate() anropas med ny teamdata
   │
4. React Query: Utför optimistisk uppdatering av UI
   │
5. Tjänst: teamService.updateTeam() anropas
   │
6. Supabase API: UPDATE på teams-tabellen
   │
7. Supabase: Returnerar uppdaterad data eller fel
   │
8. På lyckat resultat: React Query invaliderar team-cache
   │    │
   │    └─► Komponent: UI visar bekräftelse på ändring
   │
9. Vid fel: React Query återställer till föregående data
       │
       └─► Komponent: UI visar felmeddelande
```

### Bilduppladdning

```
1. Användare: Väljer ny bild för teamet
   │
2. Hook: useImageUpload().uploadImage() aktiveras
   │
3. Expo ImagePicker: Öppnar galleri för bildval
   │
4. Tjänst: Uppladdning till Supabase Storage
   │
5. Supabase: Lagrar bild och returnerar publik URL
   │
6. Hook: updateTeam.mutate() med nya profile_image
   │
7. Tjänst: teamService.updateTeam() uppdaterar teamdatan
   │
8. Komponent: UI uppdateras med den nya bilden
```

## Medlemshantering

### Lägg till teammedlem

```
1. Användare: Fyller i e-post och roll i AddMemberModal
   │
2. Event handler: handleAddMember() aktiveras
   │
3. Hook: addTeamMember.mutate() anropas
   │
4. Tjänst: teamService.createTeamInviteCode() anropas först
   │
5. Supabase: INSERT i team_invitations-tabellen
   │
6. Tjänst: Skickar e-post med inbjudningslänk
   │
7. Komponent: UI visar bekräftelse på skickad inbjudan
```

### Ändra medlemsroll

```
1. Användare: Väljer ny roll för medlem från MemberItem
   │
2. Event handler: handleRoleChange() aktiveras
   │
3. Hook: updateMemberRole.mutate() anropas
   │
4. React Query: Utför optimistisk uppdatering av UI
   │
5. Tjänst: teamService.updateTeamMemberRole() anropas
   │
6. Supabase: UPDATE i team_members-tabellen
   │
7. Hook: Invaliderar relevanta queries vid lyckat resultat
   │
8. Komponent: UI uppdateras med nya rolldata
```

### Ta bort medlem

```
1. Användare: Väljer att ta bort medlem från MemberItem
   │
2. Event handler: handleRemove() aktiveras
   │
3. Komponent: Bekräftelsedialog visas
   │
4. Användare: Bekräftar borttagning
   │
5. Hook: removeMember.mutate() anropas
   │
6. React Query: Utför optimistisk uppdatering av UI
   │
7. Tjänst: teamService.removeTeamMember() anropas
   │
8. Supabase: DELETE eller UPDATE i team_members-tabellen
   │
9. Hook: Invaliderar teamMembers-query vid lyckat resultat
   │
10. Komponent: UI uppdateras utan den borttagna medlemmen
```

## Inbjudningsprocess

### Skapa inbjudan

```
1. Admin/Ägare: Skapar inbjudan via AddMemberModal
   │
2. Hook: useCreateInvitation() aktiveras
   │
3. Tjänst: teamService.createTeamInviteCode() anropas
   │
4. Supabase: INSERT i team_invitations-tabellen
   │
5. Tjänst: Skapar och skickar e-post med inbjudningslänk
   │
6. Komponent: UI bekräftar skickad inbjudan
```

### Acceptera inbjudan

```
1. Användare: Klickar på länk i inbjudningsmail
   │
2. Router: Navigerar till InvitationAcceptScreen med token
   │
3. Hook: useInvitation(token) aktiveras
   │
4. Tjänst: teamService.getInvitationByToken() anropas
   │
5. Supabase: SELECT från team_invitations och teams
   │
6. Komponent: Visar teaminfo och bekräftelseformulär
   │
7. Användare: Accepterar inbjudan
   │
8. Hook: acceptInvitation.mutate() anropas
   │
9. Tjänst: teamService.acceptTeamInvitation() anropas
   │
10. Supabase: Transaction som:
       - INSERT i team_members
       - UPDATE i team_invitations (accepted_at)
   │
11. Router: Navigerar användaren till teamets sida
```

## Optimistiska uppdateringar

React Query används för att omedelbart uppdatera UI innan serversvaret mottagits:

```typescript
// Exempel från useTeamMutations.ts
const useUpdateTeam = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: UpdateTeamParams) => 
      teamService.updateTeam(params.teamId, params.data),
    
    // Optimistisk uppdatering
    onMutate: async (params) => {
      // Avbryt utestående förfrågningar
      await queryClient.cancelQueries({ queryKey: ['team', params.teamId] });
      
      // Spara tidigare data
      const previousData = queryClient.getQueryData(['team', params.teamId]);
      
      // Uppdatera cache med optimistisk data
      queryClient.setQueryData(['team', params.teamId], (old) => ({
        ...old,
        data: {
          ...(old as any)?.data,
          ...params.data
        }
      }));
      
      return { previousData };
    },
    
    // Vid fel, återställ till tidigare data
    onError: (err, params, context) => {
      queryClient.setQueryData(
        ['team', params.teamId],
        context?.previousData
      );
    },
    
    // Vid lyckat resultat, invalidera relevanta queries
    onSuccess: (data, params) => {
      queryClient.invalidateQueries({ queryKey: ['team', params.teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};
```

## Cachning och invalidering

### Cachningsstrategier

```typescript
// Exempel på cachningsstrategi i useTeamQueries.ts
const useTeam = (teamId: string) => {
  return useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamService.getTeam(teamId),
    staleTime: 60000,     // Data betraktas som "färsk" i 1 minut
    cacheTime: 300000,    // Data behålls i cache i 5 minuter
    retry: 3,             // Försök 3 gånger vid fel
    retryDelay: 1000,     // Vänta 1 sekund mellan försök
  });
};
```

### Cacheinvalidering

```typescript
// Exempel på invalidering av cachade data
queryClient.invalidateQueries({ queryKey: ['team', teamId] });  // Specifikt team
queryClient.invalidateQueries({ queryKey: ['teams'] });         // Alla team
queryClient.invalidateQueries({ queryKey: ['team-members', teamId] }); // Medlemmar
```

### Datarelationer för invalidering

| Handling | Invaliderade nycklar |
|----------|----------------------|
| Skapa team | ['teams'] |
| Uppdatera team | ['team', teamId], ['teams'] |
| Ta bort team | ['teams'], ['team', teamId], ['team-members', teamId] |
| Lägg till medlem | ['team-members', teamId], ['team', teamId] |
| Uppdatera medlemsroll | ['team-members', teamId] |
| Ta bort medlem | ['team-members', teamId], ['team', teamId] | 