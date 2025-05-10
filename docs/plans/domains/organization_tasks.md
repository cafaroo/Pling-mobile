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

_Inga komponenter är ännu implementerade i denna domän._

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
- Förbättra domänregler och validering 🚧
- Utöka testning för domänhändelser 🚧

#### Infrastrukturlager
- Optimera SQL-frågor för medlemskap och behörigheter 🚧
- Implementera caching för organisationsdata 🚧

#### Applikationslager
- Integrera med team- och användardomän 🚧
- Implementera e2e-testers för händelseflöden 🚧

#### UI-lager
- Förbättra användargränssnittet för organisationshantering 🚧
- Utveckla onboarding-flöde för nya organisationer 🚧

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
       ├─ entities/Organization.ts
       ├─ value-objects/OrgSettings.ts
       ├─ value-objects/OrganizationMember.ts
       ├─ value-objects/OrganizationRole.ts
       ├─ value-objects/OrganizationPermission.ts
       ├─ events/OrganizationCreated.ts
       ├─ events/MemberInvitedToOrganization.ts
       ├─ repositories/OrganizationRepository.ts
       └─ rules/permissions.ts
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
  teamIds: UniqueId[];
  createdAt: Date;
  updatedAt: Date;
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

CREATE TYPE organization_role_enum AS ENUM ('owner', 'admin', 'member', 'invited');
```

## Implementation

### Prioriterade användarfall

1. Organization Creation och Setup
   - Skapa ny organisation
   - Konfigurera grundinställningar
   - Sätta upp roller och behörigheter
   - Kontrollera och visa om organisationen har aktiv prenumeration (`hasActiveSubscription`)

2. Medlemshantering
   - Bjuda in medlemmar
   - Hantera roller och behörigheter (policy baseline från organisation)
   - Hantera medlemskapsstatus

3. Team-hantering
   - Koppla team till organisation
   - Visa och hantera organisationens team (inklusive access per användare)

4. Behörigheter och säkerhet
   - Rollbaserad åtkomstkontroll (med policy baseline)
   - Validering av användarrättigheter
   - Integrera med subscription-kontrakt för feature flags och limits

## Testning

- Enhetstester för domänhändelser och regler
- Integrationstester för repository och use cases

## Tidplan

### Sprint 1: Grundläggande Implementation
- Implementera Organization-entitet och value objects
- Sätta upp repository-struktur
- Implementera Supabase-integration
- Skapa grundläggande behörighets-UI-komponenter

### Sprint 2: Medlemshantering
- Implementera inbjudningssystem
- Utveckla rollhantering
- Skapa medlemshanterings-UI

### Sprint 3: Team-hantering och Behörigheter
- Implementera koppling mellan organisation och team
- Utveckla UI för att visa och hantera organisationens team
- Förbättra behörighetshantering

### Sprint 4: Avancerade Funktioner
- Implementera organisationsresurser
- Utveckla onboarding-flöde

## Ej inkluderat i denna domän

All fakturering, prenumerationer och relaterad logik (t.ex. OrganizationBilling, Subscription, betalningsflöden, feature flags, limits) hanteras i en framtida subscription-domän och ingår inte i scope för organization-domänen. Organization-domänen konsumerar endast status och rättigheter via ett kontrakt/interface mot subscription-domänen. 