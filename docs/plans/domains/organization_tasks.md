# Organization Förbättringsplan

## Översikt

Detta dokument beskriver strukturen och implementationen av organizations-domänen i Pling-applikationen. Organizations-domänen hanterar all organisationsrelaterad funktionalitet och integrerar med team, användare, behörigheter och onboarding.

## Innehållsförteckning

1. [Nulägesanalys](#nulägesanalys)
2. [Domänstruktur](#domänstruktur)
3. [Datamodell](#datamodell)
4. [Integrationer](#integrationer)
5. [Implementation](#implementation)
6. [Testning](#testning)
7. [Tidplan](#tidplan)
8. [Ej inkluderat i denna domän](#ej-inkluderat-i-denna-domän)

## Implementationsstatus

### Färdiga komponenter

- **Domänlager - Core**
  - ✅ Organization Entity - Huvudentitet för organisationsdomänen
  - ✅ OrganizationMember Value Object - Representation av medlemskap
  - ✅ OrganizationRole Value Object - Rollstruktur och behörigheter
  - ✅ OrganizationPermission Value Object - Behörighetsdefinitioner
  - ✅ OrgSettings Value Object - Organisationsinställningar
  - ✅ OrganizationInvitation Value Object - Inbjudningshantering
  - ✅ Domänhändelser - OrganizationEvents
  - ✅ Permissions Rules - Behörighetsregler för domänen
  - ✅ Repository Interface - Kontrakt för datåtkomst

- **Infrastrukturlager**
  - ✅ OrganizationMapper - Mapping mellan domän och persistence
  - ✅ SupabaseOrganizationRepository - Supabase implementation av repository
  - ✅ SQL-migration för databastabeller
  - ✅ SQL-migration för inbjudningstabeller
  - ✅ Row-Level Security för databasåtkomst
  - ✅ Integrering med InfrastructureFactory
  - ✅ Körd databas-migration i testmiljö
  - ✅ Körd databas-migration i produktionsmiljö

- **UI-lager**
  - ✅ OrganizationProvider - Kontext för att hantera organisationsdata
  - ✅ CreateOrganizationForm - Formulär för att skapa organisation
  - ✅ OrganizationList - Lista för att visa och välja organisationer
  - ✅ OrganizationInvitationList - Lista för att visa och hantera inbjudningar
  - ✅ InviteUserForm - Formulär för att bjuda in användare
  - ✅ OrganizationMembersList - Lista för att visa medlemmar
  - ✅ OrganizationDashboard - Sammansatt UI för organisationer

### Förbättringsområden / Råd

- **Subscription-integration:**
  - Organization-domänen ska ha en `hasActiveSubscription`-check eller delegatfunktion för att avgöra om organisationen har en aktiv prenumeration (men ingen billinglogik här).
  - All logik kring feature flags, limits och tillgång till premiumfunktioner ska hämtas via ett kontrakt/interface från subscription-domänen.
  - Subscription-domänen ansvarar för att exponera ett tydligt kontrakt/interface för dessa behov.

- **Team/Org dubbla medlemskap:**
  - En användare kan vara medlem i både organization_members och team_members. Organisationens roller sätter en "policy baseline" som team kan ärva eller begränsa.
  - Det ska finnas ett enkelt sätt att lista alla team som tillhör en organisation och som en användare har access till.

### Pågående arbete 🚧

#### Domänlager
- ✅ Grundläggande domänmodell implementerad
- ✅ Implementera inbjudningssystem
- Förbättra domänregler och validering 🚧
- Utöka testning för domänhändelser 🚧

#### Infrastrukturlager
- ✅ Implementera Supabase Repository
- ✅ Skapa databasschema för organisationer
- ✅ Skapa databasschema för inbjudningar
- ✅ Implementera OrganizationMapper med stöd för inbjudningar
- ✅ Implementera SupabaseOrganizationRepository med inbjudningsfunktionalitet
- Optimera SQL-frågor för medlemskap och behörigheter 🚧
- Implementera caching för organisationsdata ✅

#### Applikationslager
- Skapa use cases för grundläggande CRUD-operationer 🚧
- Integrera med team- och användardomän 🚧
- Implementera e2e-testers för händelseflöden 🚧

#### UI-lager
- ✅ Grundläggande användargränssnitt för organisationshantering
- Utveckla inbjudningshantering i användargränssnittet 🚧
- Utveckla onboarding-flöde för nya organisationer 🚧
- Skapa organisationsadministrationsskärm 🚧

### Kommande arbete 📋

#### Domänlager
- Organisationsresurser och avancerad behörighetshantering 📋

#### Applikationslager
- Use cases för organisationsresurser 📋

#### UI-lager
- Komponenter för organisationsresurser 📋

## Domänstruktur

### Mappstruktur

```
src/
└─ domain/
   └─ organization/
       ├─ entities/
       │  └─ Organization.ts ✅
       ├─ value-objects/
       │  ├─ OrgSettings.ts ✅
       │  ├─ OrganizationMember.ts ✅
       │  ├─ OrganizationInvitation.ts ✅
       │  ├─ OrganizationRole.ts ✅
       │  └─ OrganizationPermission.ts ✅
       ├─ events/
       │  └─ OrganizationEvents.ts ✅
       ├─ repositories/
       │  └─ OrganizationRepository.ts ✅
       └─ rules/
          └─ permissions.ts ✅

src/
└─ infrastructure/
   └─ supabase/
       ├─ mappers/
       │  └─ OrganizationMapper.ts ✅
       ├─ repositories/
       │  └─ SupabaseOrganizationRepository.ts ✅
       └─ migrations/
          ├─ organization_tables.sql ✅
          └─ organization_invitations.sql ✅

src/
└─ components/
   └─ organization/
       ├─ OrganizationProvider.tsx ✅
       ├─ OrganizationList.tsx ✅
       ├─ CreateOrganizationForm.tsx ✅
       └─ index.ts ✅
```

## Datamodell

### Domänentiteter

```typescript
interface OrganizationProps {
  id: UniqueId;
  name: string;
  ownerId: UniqueId;
  settings: OrgSettings;
  members: OrganizationMember[];
  invitations: OrganizationInvitation[];
  teamIds: UniqueId[];
  createdAt: Date;
  updatedAt: Date;
}

interface OrganizationInvitationProps {
  id?: UniqueId;
  organizationId: UniqueId;
  userId: UniqueId;
  invitedBy: UniqueId;
  email?: string;
  status: InvitationStatus; // 'pending' | 'accepted' | 'declined' | 'expired'
  expiresAt?: Date;
  createdAt: Date;
  respondedAt?: Date;
}
```

### Databasschema

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE organization_members (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role organization_role_enum NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, user_id)
);

CREATE TABLE organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  email TEXT,
  status invitation_status_enum NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(organization_id, user_id, status)
);

CREATE TABLE team_organizations (
  team_id UUID NOT NULL REFERENCES v2_teams(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (team_id, organization_id)
);

CREATE TYPE organization_role_enum AS ENUM ('owner', 'admin', 'member', 'invited');
CREATE TYPE invitation_status_enum AS ENUM ('pending', 'accepted', 'declined', 'expired');
```

## Implementation

### Prioriterade användarfall

1. Organization Creation och Setup
   - ✅ Skapa ny organisation
   - ✅ Konfigurera grundinställningar
   - ✅ Sätta upp roller och behörigheter
   - ✅ Kontrollera och visa om organisationen har aktiv prenumeration (`hasActiveSubscription`)

2. Medlemshantering
   - ✅ Bjuda in medlemmar
   - ✅ Hantera roller och behörigheter (policy baseline från organisation)
   - ✅ Hantera medlemskapsstatus
   - ✅ Hantera inbjudningsflöden (accept, avböj, utgångna)

3. Team-hantering
   - ✅ Koppla team till organisation
   - ✅ Visa och hantera organisationens team (inklusive access per användare)

4. Behörigheter och säkerhet
   - ✅ Rollbaserad åtkomstkontroll (med policy baseline)
   - ✅ Validering av användarrättigheter
   - ✅ Integrera med subscription-kontrakt för feature flags och limits

## Testning

- Enhetstester för domänhändelser och regler 🚧
- Integrationstester för repository och use cases 🚧

## Tidplan

### Sprint 1: Grundläggande Implementation (✅ Slutförd)
- ✅ Implementera Organization-entitet och value objects
- ✅ Sätta upp repository-struktur
- ✅ Implementera Supabase-integration
- ✅ Skapa grundläggande UI-komponenter för organisationer

### Sprint 2: Medlemshantering (✅ Slutförd)
- ✅ Implementera inbjudningssystem
- ✅ Utveckla rollhantering
- ✅ Skapa databastabell för inbjudningar
- ✅ Implementera domänhändelser för inbjudningar
- ✅ Köra databas-migrationer för organisationsdomänen
- ✅ Implementera UI-komponenter för inbjudningshantering

### Sprint 3: Team-hantering och Behörigheter (🚧 Pågående)
- ✅ Implementera koppling mellan organisation och team
- Utveckla UI för att visa och hantera organisationens team 🚧
- Utveckla UI för att visa och hantera inbjudningar 🚧
- Förbättra behörighetshantering 🚧

### Sprint 4: Avancerade Funktioner (📋 Planerad)
- Implementera organisationsresurser 📋
- Utveckla onboarding-flöde 📋

## Ej inkluderat i denna domän

All fakturering, prenumerationer och relaterad logik (t.ex. OrganizationBilling, Subscription, betalningsflöden, feature flags, limits) hanteras i en framtida subscription-domän och ingår inte i scope för organization-domänen. Organization-domänen konsumerar endast status och rättigheter via ett kontrakt/interface mot subscription-domänen. 