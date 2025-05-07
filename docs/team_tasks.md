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
- Team-entitet med grundläggande egenskaper
- TeamMember value object med roller (owner, admin, member)
- TeamInvitation value object
- TeamRepository interface
- TeamPermission value object för teamrelaterade behörigheter ✅
- TeamRolePermission value object för rollbaserade behörigheter ✅

#### UI-lager
- TeamPermissionList-komponent ✅
- TeamRoleSelector-komponent ✅ 
- TeamPermissionManager-komponent ✅
- TeamMemberRoleScreen ✅
- TeamMemberPermissionSummary-komponent ✅

### Pågående arbete 🚧

#### Domänlager
- Implementera team-specifika domänhändelser
- Utöka team-statistik och beräkningar
- Förbättra rollhantering och behörigheter

#### Applikationslager
- Skapa användarfall för teamhantering 🚧
- Integrera med användardomän
- useUpdateTeamMemberRole hook för att uppdatera medlemsroller ✅

#### Infrastrukturlager
- Implementera SupabaseTeamRepository
- Skapa migrations för team-tabeller
- Sätta upp realtidsuppdateringar
- Skapa migrations för team_member_permissions ✅

#### UI-lager
- Utveckla teamkommunikationsgränssnitt

### Kommande arbete 📋

#### Domänlager
- Team-inställningar och konfiguration
- Team-aktivitetslogg
- Team-mål och milstolpar
- Team-statistik och rapporter
- Team-kommunikation och meddelanden
- Team-resurser och delning

#### Applikationslager
- CreateTeam användarfall
- InviteTeamMember användarfall
- ManageTeamRoles användarfall
- UpdateTeamSettings användarfall
- TeamStatistics användarfall

#### UI-lager
- TeamList komponent
- TeamDetails vy
- TeamSettings formulär
- MemberManagement komponenter

## Domänstruktur

### Mappstruktur

```
src/
├─ domain/
│   └─ team/
│       ├─ entities/           # Domänentiteter
│       │   ├─ Team.ts        ✅
│       │   ├─ TeamSettings.ts 📋
│       │   └─ TeamActivity.ts 📋
│       ├─ value-objects/      # Värde-objekt
│       │   ├─ TeamMember.ts   ✅
│       │   ├─ TeamInvitation.ts ✅
│       │   ├─ TeamRole.ts    ✅
│       │   ├─ TeamPermission.ts ✅
│       │   └─ TeamRolePermission.ts ✅
│       ├─ events/            # Domänhändelser
│       │   ├─ TeamCreated.ts 📋
│       │   ├─ MemberJoined.ts 📋
│       │   └─ RoleChanged.ts 📋
│       └─ repositories/      # Repository interfaces
│           └─ TeamRepository.ts ✅
├─ application/
│   └─ team/
│       ├─ useCases/         # Användarfall
│       │   ├─ createTeam.ts 📋
│       │   ├─ inviteMember.ts 📋
│       │   └─ updateSettings.ts 📋
│       ├─ hooks/
│       │   └─ useUpdateTeamMemberRole.ts ✅
│       ├─ queries/          # Read-model queries
│       │   ├─ getTeamDetails.ts 📋
│       │   └─ getTeamStats.ts 📋
│       └─ dto/             # Data transfer objects
│           ├─ TeamDto.ts    ✅
│           └─ StatsDto.ts   📋
└─ infrastructure/
    └─ supabase/
        ├─ repositories/
        │   └─ SupabaseTeamRepository.ts 🚧
        └─ migrations/
            ├─ teams.sql     🚧
            ├─ team_member_permissions.sql ✅
            └─ activities.sql 📋
```

## Datamodell

### Domänentiteter

```typescript
// Planerade utökningar för Team-entiteten
interface TeamProps {
  settings: TeamSettings;
  activities: TeamActivity[];
  statistics: TeamStatistics;
  goals: TeamGoal[];
  resources: TeamResource[];
}

// Ny TeamSettings value object
interface TeamSettings {
  visibility: 'public' | 'private';
  joinPolicy: 'open' | 'invite_only' | 'approval';
  memberLimit: number;
  notificationPreferences: NotificationSettings;
  customFields: Record<string, unknown>;
}

// Ny TeamActivity entity
interface TeamActivity {
  type: ActivityType;
  performedBy: UniqueId;
  timestamp: Date;
  metadata: Record<string, unknown>;
}
```

### Databasschema

```sql
-- Grundläggande team-tabell
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settings JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Team-medlemmar med roller
CREATE TABLE team_members (
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role team_role_enum NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

-- Team-inbjudningar
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  invited_by UUID REFERENCES auth.users(id),
  status invitation_status_enum DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Team-aktivitetslogg
CREATE TABLE team_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  performed_by UUID REFERENCES auth.users(id),
  activity_type activity_type_enum NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Team-medlemsbehörigheter
CREATE TABLE team_member_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id, permission_name)
);

-- Enum-typer
CREATE TYPE team_role_enum AS ENUM ('owner', 'admin', 'member');
CREATE TYPE invitation_status_enum AS ENUM ('pending', 'accepted', 'declined', 'expired');
CREATE TYPE activity_type_enum AS ENUM (
  'member_joined',
  'member_left',
  'role_changed',
  'settings_updated',
  'goal_created',
  'goal_completed'
);
```

## Implementation

### Prioriterade användarfall

1. Team Creation och Setup
   - Skapa nytt team
   - Konfigurera grundinställningar
   - Sätta upp roller och behörigheter

2. Medlemshantering
   - Bjuda in medlemmar
   - Hantera roller och behörigheter ✅
   - Hantera medlemskapsstatus

3. Team-aktiviteter
   - Spåra teamaktiviteter
   - Generera aktivitetsrapporter
   - Hantera notifieringar

4. Team-statistik
   - Beräkna team-metrics
   - Generera prestationsrapporter
   - Visualisera teamdata

### Tekniska överväganden

1. Realtidsuppdateringar
   - Använd Supabase realtime för direktuppdateringar
   - Implementera optimistic updates i UI
   - Hantera konfliktlösning

2. Prestanda
   - Implementera caching-strategi
   - Optimera databasfrågor
   - Lazy loading av teamdata

3. Säkerhet
   - Row Level Security i Supabase
   - Rollbaserad åtkomstkontroll
   - Validering av användarrättigheter

## Testning

### Enhetstester

```typescript
describe('Team', () => {
  describe('member management', () => {
    it('should handle role changes correctly');
    it('should validate member limits');
    it('should track member history');
  });

  describe('activity tracking', () => {
    it('should log member activities');
    it('should generate activity reports');
  });
});
```

### Integrationstester

```typescript
describe('TeamRepository', () => {
  it('should handle concurrent updates');
  it('should maintain referential integrity');
  it('should trigger appropriate events');
});
```

## Tidplan

### Sprint 1: Grundläggande Implementation 🚧
- ✅ Implementera grundläggande team-entiteter
- ✅ Sätta upp repository-struktur
- 🚧 Implementera Supabase-integration
- ✅ Skapa grundläggande behörighets-UI-komponenter

### Sprint 2: Medlemshantering 🚧
- Implementera inbjudningssystem
- ✅ Utveckla rollhantering
- ✅ Skapa medlemshanterings-UI för behörigheter
- Implementera notifieringar

### Sprint 3: Aktiviteter och Statistik 📋
- Implementera aktivitetsloggning
- Utveckla statistikberäkningar
- Skapa rapportgenerering
- Bygga visualiseringskomponenter

### Sprint 4: Avancerade Funktioner 📋
- Implementera team-resurser
- Utveckla målhantering
- Skapa team-kommunikation
- Implementera delningsfunktioner

## Nästa steg

1. Färdigställa SupabaseTeamRepository
2. Implementera grundläggande team-creation flow
3. Utveckla komplett medlemshanterings-UI
4. Sätta upp aktivitetsloggning

## Tekniska noteringar

### Domänhändelser
- TeamCreated
- MemberJoined
- MemberLeft
- RoleChanged
- SettingsUpdated
- GoalAchieved

### Validering
- Team-namn och beskrivning
- Medlemskapsgränser
- Rolltilldelningar
- Inbjudningsregler

### Prestanda
- Caching av teamdata
- Optimerade medlemslistor
- Effektiv aktivitetsloggning

### Säkerhet
- Rollbaserade behörigheter
- Dataåtkomstvalidering
- Användarverifiering

Legender:
✅ Implementerat och testat
🚧 Under utveckling
📋 Planerat 

## Prioriterade uppgifter denna vecka:

1. Utveckla TeamManagement komponenter ✅
   - Medlemshantering ✅
   - Teamroller ✅
   - Inbjudningar 🚧
   
2. Skapa användarfall för teamhantering 🚧
   - Skapa createTeam och joinTeam användarfall
   - Implementera inviteTeamMember funktionalitet
   - Utveckla handleMemberRole för rollhantering ✅

3. Integrera med användardomänen
   - Hantera användaråtkomst till team
   - Visa användarens team i profilen
   - Synkronisera användar- och teamändringar 