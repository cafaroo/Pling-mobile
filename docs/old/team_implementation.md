# Implementationsdetaljer för Teamdomänen

## Översikt

Teamdomänen i Pling-applikationen gör det möjligt för användare att organisera sig i team, bjuda in medlemmar, hantera roller och behörigheter, och samarbeta kring aktiviteter. Implementationen följer en Domain-Driven Design (DDD) arkitektur och är byggd enligt samma principer som användardomänen.

## Domänlager

### Entiteter

- **Team**: Huvudaggregat som hanterar all teamrelaterad logik
  - Har medlemmar, inbjudningar och inställningar
  - Implementerar domänhändelser för kritiska operationer
  - Validerar alla ändringar och operationer

- **TeamSettings**: Value object för teaminställningar
  - Hanterar synlighet, regler för anslutning, medlemsgränser
  - Hanterar notifieringsinställningar

### Value Objects

- **TeamMember**: Representerar en medlem i ett team med roll och anslutningstidpunkt
- **TeamInvitation**: Hanterar inbjudningar till team med statushantering
- **TeamRole**: Enumererar teamroller (OWNER, ADMIN, MEMBER) med tillhörande beskrivningar
- **TeamPermission**: Definierar behörigheter inom teamet med kategorier och rollkopplingar
- **TeamRolePermission**: Kopplar samman roller och behörigheter

### Repository

- **TeamRepository**: Interface som definierar operationer för att arbeta med team
  - Metoder för att hitta, spara, hantera medlemmar och inbjudningar

## Infrastrukturlager

### Repositories

- **SupabaseTeamRepository**: Implementerar TeamRepository med Supabase som datakälla
  - Konverterar mellan domänmodell och datamodell
  - Hanterar transaktioner och relationer mellan teamdata
  - Använder Supabase för datapersistens

### Databasschema

- **teams**: Grundläggande teamdata
- **team_members**: Medlemmar och deras roller
- **team_invitations**: Inbjudningar med status
- **team_activities**: Loggning av aktiviteter
- **team_member_permissions**: Specifika behörigheter för medlemmar

## Applikationslager

### Användarfall

- **CreateTeamUseCase**: Skapa nya team
- **InviteTeamMemberUseCase**: Bjuda in användare till team

### React Query-hooks

- **useTeam**: Centralt React Query-baserat API för teamhantering
  - useTeamById: Hämta team med ID
  - useUserTeams: Hämta användarens team
  - useCreateTeam: Skapa nya team
  - useInviteTeamMember: Bjuda in medlemmar
  - useUpdateTeam: Uppdatera team
  - useDeleteTeam: Ta bort team
  - useLeaveTeam: Lämna team
  - useUpdateTeamMemberRole: Uppdatera medlemsroller

## UI-lager

### Komponenter

- **TeamMemberList**: Listar och hanterar teammedlemmar med rollhantering
- **TeamInvite**: Formkomponent för att bjuda in medlemmar
- **TeamCreate**: Formulär för att skapa team
- **TeamList**: Visar användarens team med översiktsinformation

### Skärmar

- **Teams Overview** (`/teams`): Visar användarens team
- **Team Details** (`/teams/[id]`): Visar och hanterar ett specifikt team
- **Create Team** (`/teams/create`): Formulär för att skapa nya team

## Domänhändelser

- **TeamCreated**: När ett team skapas
- **TeamUpdated**: När teamet uppdateras
- **MemberJoined**: När en medlem ansluter
- **MemberLeft**: När en medlem lämnar
- **RoleChanged**: När en medlems roll ändras
- **InvitationSent**: När en inbjudan skickas
- **InvitationAccepted/Declined**: När en inbjudan besvaras

## Säkerhet

- Row Level Security (RLS) i Supabase garanterar att endast behöriga användare kan:
  - Visa team de är medlemmar i
  - Hantera medlemmar om de är ägare eller administratörer
  - Se inbjudningar till team de är medlemmar i
  - Acceptera/avvisa inbjudningar som är riktade till dem

## Kommande Funktionalitet

- Team-aktiviteter och händelseloggning
- Team-mål och uppföljning
- Team-statistik och rapporter
- Utökad behörighetshantering
- Real-time uppdateringar

## Integrationspunkter

- Användardomänen: Teammedlemmar är användare
- Aktivitetsdomänen: Team kan ha aktiviteter
- Måldomänen: Team kan ha mål 