# Team Förbättringsplan

## Översikt

Detta dokument beskriver strukturen och implementationen av team-domänen i Pling-applikationen. Team-domänen hanterar all teamrelaterad funktionalitet och integrerar med användare, mål, tävlingar och aktiviteter.

## Innehållsförteckning

1. [Nulägesanalys](#nulägesanalys)
2. [Domänstruktur](#domänstruktur)
3. [Datamodell](#datamodell)
4. [Integrationer](#integrationer)
5. [Implementation](#implementation)
6. [Testning](#testning)
7. [Tidplan](#tidplan)

## Implementationsstatus

### Färdiga komponenter ✅

#### Domänlager
- Team-entitet (AggregateRoot) med grundläggande egenskaper och domänhändelser ✅
- TeamSettings value object för team-inställningar ✅
- TeamMember value object med roller (owner, admin, member) ✅
- TeamInvitation value object ✅
- TeamRepository interface ✅
- TeamPermission value object för teamrelaterade behörigheter ✅
- TeamRolePermission value object för rollbaserade behörigheter ✅
- TeamRole enum med roller och behörigheter ✅
- Enhetstester för domänhändelser i Team-entiteten med DomainEventTestHelper ✅
- TeamActivity entitet för aktivitetsloggning ✅
- ActivityType enum med kategorier för strukturerad filtrering ✅
- TeamActivityRepository interface ✅
- TeamStatistics value object för statistikberäkningar ✅
- Förbättrad statistikberäkning med stöd för olika tidsperioder ✅
- Robust felhantering i statistikberäkningar ✅
- Aktivitetstrend-beräkningar med datumbaserad gruppering ✅

#### Infrastrukturlager
- SupabaseTeamRepository implementation ✅
- SQL-migreringar för teamtabeller ✅
- Row Level Security (RLS) för dataskydd ✅
- Integrationstester för SupabaseTeamRepository med MockEventBus ✅
- SupabaseTeamActivityRepository implementation ✅
- SQL-migrering för team_activities-tabell ✅
- Trigers för automatisk aktivitetsloggning ✅
- InfrastructureProvider för infrastrukturtjänster ✅
- SQL-migrering för team_goals-tabell ✅
- Optimerade SQL-frågor för statistikberäkningar ✅
- Materialized view för daglig teamstatistik ✅
- Automatisk uppdatering av statistik via triggers ✅
- Optimerade index för snabb dataåtkomst ✅

#### Applikationslager
- CreateTeamUseCase för att skapa team ✅
- InviteTeamMemberUseCase för att bjuda in medlemmar ✅
- useTeam React Query hook för att hantera team-operationer ✅
- useUserTeams för att hämta användarens team ✅
- useTeamById för att hämta team med ID ✅
- useCreateTeam för att skapa team ✅
- useInviteTeamMember för att bjuda in medlemmar ✅
- useUpdateTeam för att uppdatera team ✅
- useDeleteTeam för att ta bort team ✅
- useLeaveTeam för att lämna team ✅
- useUpdateTeamMemberRole för att uppdatera medlemsroller ✅
- Tester för CreateTeamUseCase med fokus på domänintegritet ✅
- CreateTeamActivityUseCase för att skapa aktiviteter ✅
- GetTeamActivitiesUseCase för att hämta aktiviteter ✅
- useTeamActivities hook för att hantera aktivitetsdata i UI ✅
- GetTeamStatisticsUseCase för att hämta teamstatistik ✅
- useTeamStatistics hook för att hantera statistikdata i UI ✅

#### UI-lager
- TeamMemberList komponent för att visa och hantera medlemmar ✅
- TeamInvite komponent för att bjuda in medlemmar ✅
- TeamCreate komponent för att skapa team ✅
- TeamList komponent för att visa användarens team ✅
- Teams översiktssida (/teams) ✅
- TeamDetails-vy (/teams/[id]) ✅
- CreateTeam-sida (/teams/create) ✅
- TeamPermissionList-komponent ✅
- TeamRoleSelector-komponent ✅ 
- TeamPermissionManager-komponent ✅
- TeamMemberRoleScreen ✅
- TeamMemberPermissionSummary-komponent ✅
- TeamActivityList-komponent med filtrering och paginering ✅
- Integrering av TeamActivityList i TeamDashboard med kategorifiltrering ✅
- TeamStatisticsCard-komponent för visualisering av teamstatistik ✅
- Integrering av TeamStatisticsCard i TeamDashboard ✅

#### Testning
- StandardDomainEventTestHelper för enhetlig testning av domänhändelser ✅
- MockEventBus för testning av repository-lager ✅
- Dokumentation för domänhändelsestestning (domain_events_testing.md) ✅
- TeamActivity.test.ts för testning av aktivitetsentiteten ✅
- TeamStatistics.test.ts för testning av statistikberäkningar ✅
- Omfattande testning av olika tidsperioder och aktivitetstrender ✅
- Testning av felhantering i statistikberäkningar ✅

### Pågående arbete 🚧

#### Domänlager
- Förbättra team-statistik och beräkningar 🚧
- Implementera mer detaljerade domänhändelser 🚧
- Utöka testning för domänhändelser till andra domäner 🚧

#### Infrastrukturlager
- Optimera SQL-frågor för statistikberäkningar 🚧
- Implementera caching för tunga dataoperationer 🚧

#### Applikationslager
- Integrera med activity-domänen 🚧
- Förbättra statistikberäkningar för olika tidsperioder 🚧
- Implementera e2e-testers för händelseflöden genom alla lager 🚧

#### UI-lager
- Utveckla avancerade visualiseringskomponenter för team-statistik 🚧
- Förbättra användargränssnittet för teamhantering 🚧
- Utveckla teamkommunikationsgränssnitt 🚧
- Integrera händelselyssnare i UI-komponenter 🚧

### Kommande arbete 📋

#### Domänlager
- Team-mål och milstolpar 📋
- Team-kommunikation och meddelanden 📋
- Team-resurser och delning 📋

#### Applikationslager
- TeamGoals användarfall 📋
- TeamResources användarfall 📋

#### UI-lager
- TeamGoals komponenter 📋
- TeamResources hantering 📋

## Domänstruktur

### Mappstruktur

```
src/
├─ domain/
│   └─ team/
│       ├─ entities/           # Domänentiteter
│       │   ├─ Team.ts        ✅
│       │   ├─ TeamSettings.ts ✅
│       │   ├─ TeamActivity.ts ✅
│       │   └─ TeamGoal.ts    📋
│       ├─ value-objects/      # Värde-objekt
│       │   ├─ TeamMember.ts   ✅
│       │   ├─ TeamInvitation.ts ✅
│       │   ├─ TeamRole.ts    ✅
│       │   ├─ TeamPermission.ts ✅
│       │   ├─ ActivityType.ts ✅
│       │   ├─ TeamStatistics.ts ✅
│       │   └─ TeamRolePermission.ts ✅
│       ├─ events/            # Domänhändelser
│       │   ├─ TeamCreated.ts ✅ (implementerat i Team.ts)
│       │   ├─ MemberJoined.ts ✅ (implementerat i Team.ts)
│       │   └─ RoleChanged.ts ✅ (implementerat i Team.ts)
│       └─ repositories/      # Repository interfaces
│           ├─ TeamRepository.ts ✅
│           └─ TeamActivityRepository.ts ✅
├─ application/
│   └─ team/
│       ├─ useCases/         # Användarfall
│       │   ├─ createTeam.ts ✅
│       │   ├─ inviteMember.ts ✅
│       │   ├─ createTeamActivity.ts ✅
│       │   ├─ getTeamActivities.ts ✅
│       │   ├─ getTeamStatistics.ts ✅
│       │   └─ updateSettings.ts 📋
│       ├─ hooks/
│       │   ├─ useTeam.ts ✅
│       │   ├─ useTeamActivities.ts ✅
│       │   ├─ useTeamStatistics.ts ✅
│       │   └─ useUpdateTeamMemberRole.ts ✅
│       ├─ queries/          # Read-model queries
│       │   ├─ getTeamDetails.ts ✅ (implementerat i useTeam.ts)
│       │   └─ getTeamStats.ts ✅ (implementerat i useTeamStatistics.ts)
│       └─ dto/             # Data transfer objects
│           ├─ TeamDto.ts    ✅
│           └─ StatsDto.ts   ✅
└─ infrastructure/
    └─ supabase/
        ├─ repositories/
        │   ├─ SupabaseTeamRepository.ts ✅
        │   └─ SupabaseTeamActivityRepository.ts ✅
        └─ migrations/
            ├─ teams.sql     ✅
            ├─ team_member_permissions.sql ✅
            ├─ activities.sql ✅ (implementerat i teams.sql)
            └─ team_activities.sql ✅
```

## Datamodell

### Domänentiteter

```typescript
// Team-entitet (implementerad)
interface TeamProps {
  id: UniqueId;
  name: string;
  description?: string;
  ownerId: UniqueId;
  members: TeamMember[];
  invitations: TeamInvitation[];
  settings: TeamSettings;
  createdAt: Date;
  updatedAt: Date;
}

// TeamSettings value object (implementerad)
interface TeamSettingsProps {
  visibility: 'public' | 'private' | 'unlisted';
  joinPolicy: 'open' | 'invite_only' | 'approval';
  memberLimit: number;
  notificationPreferences: NotificationPreferences;
  customFields: Record<string, unknown>;
}

// TeamActivity entitet (implementerad)
interface TeamActivityProps {
  teamId: UniqueId;
  performedBy: UniqueId;
  activityType: ActivityType;
  targetId?: UniqueId;
  metadata: Record<string, any>;
  timestamp: Date;
}

// TeamStatistics value object (implementerad)
interface TeamStatisticsProps {
  teamId: UniqueId;
  memberCount: number;
  activeMembers: number;
  activityCount: number;
  activityBreakdown: Record<keyof typeof ActivityCategories, number>;
  lastActivityDate?: Date;
  creationDate: Date;
  ageInDays: number;
  activeDaysPercentage: number;
}

// Planerad TeamGoal entity
interface TeamGoalProps {
  id: UniqueId;
  teamId: UniqueId;
  title: string;
  description: string;
  startDate: Date;
  dueDate?: Date;
  status: GoalStatus;
  progress: number;
  createdBy: UniqueId;
  assignments: TeamGoalAssignment[];
}
```

### Databasschema

```sql
-- Grundläggande team-tabell (implementerad)
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Team-medlemmar med roller (implementerad)
CREATE TABLE team_members (
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role team_role_enum NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

-- Team-inbjudningar (implementerad)
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  status invitation_status_enum NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- Team-aktivitetslogg (implementerad)
CREATE TABLE team_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  performed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Team-medlemsbehörigheter (implementerad)
CREATE TABLE team_member_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, user_id, permission_name)
);

-- Team-aktiviteter (planerat schema)
CREATE TABLE team_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  performed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Enum-typer (implementerade)
CREATE TYPE team_role_enum AS ENUM ('owner', 'admin', 'member');
CREATE TYPE invitation_status_enum AS ENUM ('pending', 'accepted', 'declined', 'expired');
CREATE TYPE team_visibility_enum AS ENUM ('public', 'private', 'unlisted');
CREATE TYPE join_policy_enum AS ENUM ('open', 'invite_only', 'approval');
```

## Implementation

### Prioriterade användarfall

1. Team Creation och Setup ✅
   - Skapa nytt team ✅
   - Konfigurera grundinställningar ✅
   - Sätta upp roller och behörigheter ✅

2. Medlemshantering ✅
   - Bjuda in medlemmar ✅
   - Hantera roller och behörigheter ✅
   - Hantera medlemskapsstatus ✅

3. Team-aktiviteter ✅
   - Spåra teamaktiviteter ✅
   - Generera aktivitetsrapporter ✅
   - Hantera aktivitetsfiltrering ✅
   - Integrera aktivitetsvy i TeamDashboard ✅

4. Team-statistik 🚧
   - Beräkna team-metrics 🚧
   - Generera prestationsrapporter 🚧
   - Visualisera teamdata 🚧

### Tekniska överväganden

1. Realtidsuppdateringar
   - Använd Supabase realtime för direktuppdaterar ✅
   - Implementera optimistic updates i UI 🚧
   - Hantera konfliktlösning ✅

2. Prestanda
   - ✅ Implementera caching-strategi med:
     - Tvånivåcaching med React Query och Supabase
     - Optimistisk uppdatering för alla mutationer
     - Konfigurerbar staleTime och cacheTime
     - Automatisk revalidering för aktiva mål
     - Selektiv cacheinvalidering
   - 🚧 Optimera databasfrågor
   - 🚧 Lazy loading av teamdata

3. Säkerhet
   - Row Level Security i Supabase ✅
   - Rollbaserad åtkomstkontroll ✅
   - Validering av användarrättigheter ✅

## Testning

### Domänhändelser och testning

Vi har nu implementerat ett standardiserat sätt att testa domänhändelser:

- DomainEventTestHelper för testning av domänentiteter ✅
- MockEventBus för testning av infrastrukturlager ✅
- Dokumentation för domänhändelsestestning ✅

### Enhetstester

```typescript
describe('Team', () => {
  describe('member management', () => {
    it('should handle role changes correctly'); // ✅
    it('should validate member limits'); // ✅
    it('should track member history'); // 🚧
  });

  describe('activity tracking', () => {
    it('should log member activities'); // ✅
    it('should generate activity reports'); // 🚧
  });
});
```

### Integrationstester

```typescript
describe('TeamRepository', () => {
  it('should handle concurrent updates'); // 🚧
  it('should maintain referential integrity'); // ✅
  it('should trigger appropriate events'); // ✅
});
```

## Tidplan

### Sprint 1: Grundläggande Implementation ✅
- ✅ Implementera grundläggande team-entiteter
- ✅ Sätta upp repository-struktur
- ✅ Implementera Supabase-integration
- ✅ Skapa grundläggande behörighets-UI-komponenter

### Sprint 2: Medlemshantering ✅
- ✅ Implementera inbjudningssystem
- ✅ Utveckla rollhantering
- ✅ Skapa medlemshanterings-UI
- ✅ Implementera behörighetsstruktur
- 🚧 Implementera notifieringar

### Sprint 3: Aktiviteter och Statistik 🚧
- ✅ Implementera aktivitetsloggning
- 🚧 Utveckla statistikberäkningar
- 🚧 Skapa rapportgenerering
- 🚧 Bygga visualiseringskomponenter

### Sprint 4: Avancerade Funktioner 📋
- 📋 Implementera team-resurser
- 📋 Utveckla målhantering
- 📋 Skapa team-kommunikation
- 📋 Implementera delningsfunktioner

## Nästa steg

1. ✅ Färdigställa SupabaseTeamRepository
2. ✅ Implementera grundläggande team-creation flow
3. ✅ Utveckla komplett medlemshanterings-UI
4. ✅ Standardisera testning av domänhändelser
5. ✅ Implementera TeamActivity entitet och hantering
6. ✅ Implementera SupabaseTeamActivityRepository
7. ✅ Integrera TeamActivityList i TeamDashboard
8. 🚧 Utveckla team-statistikfunktioner
9. 🚧 Implementera team-mål och uppföljning

## Tekniska noteringar

### Domänhändelser (Implementerade)
- TeamCreated
- TeamUpdated
- MemberJoined
- MemberLeft
- RoleChanged
- InvitationSent
- InvitationAccepted
- InvitationDeclined

### Validering (Implementerad)
- Team-namn och beskrivning
- Medlemskapsgränser
- Rolltilldelningar
- Inbjudningsregler

### Prestanda
- ✅ Implementera caching-strategi med:
  - Tvånivåcaching med React Query och Supabase
  - Optimistisk uppdatering för alla mutationer
  - Konfigurerbar staleTime och cacheTime
  - Automatisk revalidering för aktiva mål
  - Selektiv cacheinvalidering
- 🚧 Optimera databasfrågor
- 🚧 Lazy loading av teamdata

### Säkerhet
- Rollbaserade behörigheter (Implementerat)
- Dataåtkomstvalidering (Implementerat med RLS)
- Användarverifiering (Implementerat)

### Testning av domänhändelser
- Standardiserade testmönster med DomainEventTestHelper ✅
- Integrationstest mellan repository och EventBus ✅
- Dokumenterade teststrategier för olika lager ✅

### Caching och prestanda
- ✅ Implementerat tvånivåcaching med React Query och Supabase
  - Standardiserade cachenycklar genom teamGoalsKeys
  - Optimerad staleTime på 5 minuter för normal data
  - Utökad cacheTime på 30 minuter för bättre prestanda
  - Automatisk uppdatering var 30:e sekund för aktiva mål
  - Optimistisk uppdatering för alla mutationer
  - Robust felhantering med automatisk återställning
  - Selektiv revalidering baserat på användningsfall
  - Effektiv cacheinvalidering för relaterad data

### Databasoptimering
- ✅ Skapade index för vanliga sökningar:
  - team_id för teambaserade sökningar
  - status för statusfiltrering
  - due_date för förfallodatumsökningar
  - created_by för skaparbaserade sökningar
- ✅ Implementerade triggers för automatiska uppdateringar
- ✅ Optimerade RLS-policyer för säker dataåtkomst

## Optimeringar och prestanda
- [x] Implementera caching-strategi
  - Implementerat OptimizedTeamActivityRepository med CacheService
  - Lagt till React Query integration i useTeamStatistics
  - Konfigurerat TTL och invalidering för olika datatyper
- [ ] Nästa optimering...

Legender:
✅ Implementerat och testat
🚧 Under utveckling
📋 Planerat 

## Prioriterade uppgifter nästa sprint

1. ✅ Utveckla TeamStatistics-funktion
   - ✅ Skapa TeamStatistics värde-objekt för beräkningslogik
   - ✅ Implementera statistikberäkningar baserade på aktiviteter
   - ✅ Skapa databasstruktur för statistik
   - ✅ Implementera repository och hooks
   - ✅ Utveckla visualiseringskomponenter för statistik
   - ✅ Skapa tester för statistikberäkningar

2. 📋 Implementera team-kommunikation
   - Designa meddelandestruktur
   - Skapa TeamMessage entitet
   - Utveckla realtidskommunikation med Supabase
   - Implementera chattgränssnitt

3. 🚧 Optimera prestanda
   - Förbättra databasfrågor med materialized views
   - Implementera lazy loading för stora datamängder
   - Optimera realtidsuppdateringar
   - Förbättra cacheinvalidering för specifika scenarier

### Tekniska noteringar

#### TeamStatistics Implementation
- ✅ Implementerat TeamStatistics värde-objekt med:
  - Stöd för olika tidsperioder
  - Beräkning av målstatistik och trender
  - Validering av statistikdata
  - Effektiv cachehantering
- ✅ Skapat databasstruktur med:
  - Optimerade index för snabba sökningar
  - RLS-policyer för säker dataåtkomst
  - Automatisk uppdatering av timestamps
  - JSON-stöd för flexibel datalagring
- ✅ Utvecklat repository-lager med:
  - Full CRUD-funktionalitet
  - Stöd för trendanalys
  - Effektiv datahämtning
  - Felhantering med Result-typer
- ✅ Implementerat React Query hooks med:
  - Optimerad caching-strategi
  - Automatisk revalidering
  - Prefetching av relaterad data
  - Typade returvärden

#### Visualiseringskomponenter
- ✅ Implementerat TeamStatisticsCard med:
  - Responsiv layout med flexbox
  - Material Design komponenter
  - Interaktiv periodväljare
  - Realtidsuppdateringar
- ✅ Utvecklat grafer och indikatorer:
  - Linjediagram för aktivitetstrend
  - Framstegsindikator för måluppfyllelse
  - Statistikkort för nyckeltal
  - Anpassad färgpalett från temat
- ✅ Skapat container-komponent:
  - Hantering av laddningstillstånd
  - Felhantering med användarvänliga meddelanden
  - Automatisk prefetching av data
  - Optimerad prestanda med React Query

#### Testning och kvalitetssäkring
- ✅ Implementerat omfattande testsvit:
  - Enhetstester för TeamStatistics:
    - Beräkningslogik för olika perioder
    - Hantering av målstatus och framsteg
    - Aktivitetstrendberäkningar
    - Validering av statistikdata
  - Integrationstester för repository:
    - CRUD-operationer mot databasen
    - Felhantering och återhämtning
    - Datakonvertering och mappning
    - Cacheinvalidering
  - Komponenttester för visualisering:
    - Rendering av statistikkomponenter
    - Interaktiv periodväljare
    - Responsiv layout
    - Formatering och presentation
  - Prestandatester:
    - Optimerad datahämtning
    - Effektiv cacheanvändning
    - Minneshantering
    - Renderingsprestanda

#### Nästa steg
1. Implementera team-kommunikation:
   - Designa meddelandestruktur
   - Skapa TeamMessage entitet
   - Utveckla realtidskommunikation
   - Implementera chattgränssnitt

2. Optimera prestanda:
   - Implementera virtualisering för långa listor
   - Optimera databasfrågor med materialized views
   - Förbättra cacheinvalidering
   - Implementera lazy loading

### Tekniska detaljer

#### Teststrategier
- Enhetstester:
  - Jest som testramverk
  - Isolerade tester för domänlogik
  - Mockning av externa beroenden
  - Omfattande testfall för edge cases
- Integrationstester:
  - Testning mot Supabase
  - End-to-end dataflöden
  - Verifiering av RLS-policyer
  - Prestandamätningar
- Komponenttester:
  - React Native Testing Library
  - Interaktionssimuleringar
  - Tillgänglighetstester
  - Snapshot-tester för UI

#### Prestandaoptimering
- Databasoptimering:
  - Materialized views för statistik
  - Optimerade index
  - Effektiv cacheinvalidering
- Frontend-optimering:
  - Lazy loading av komponenter
  - Virtualisering av listor
  - Optimerad rendering
  - Minnesprofiling

## Nästa implementation: TeamStatistics

För att implementera TeamStatistics-funktionaliteten behöver vi:

### Domänmodell
```typescript
interface TeamStatisticsProps {
  teamId: UniqueId;
  period: StatisticsPeriod;
  activityCount: number;
  completedGoals: number;
  activeGoals: number;
  memberParticipation: number;
  averageGoalProgress: number;
}

enum StatisticsPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}
```

### Planerade komponenter
- TeamStatisticsCard
- TeamStatisticsChart
- TeamMemberParticipation
- TeamGoalProgress
- TeamActivitySummary

### Databasändringar
- Optimera queries för statistikberäkningar
- Skapa materialized views för prestandaförbättring
- Implementera caching-strategi