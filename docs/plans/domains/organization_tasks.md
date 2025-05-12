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
  - ✅ OrganizationTeamList - Lista för att visa och hantera team
  - ✅ CreateTeamForm - Formulär för att skapa team
  - ✅ OrganizationAdminScreen - Administrationsgränssnitt för organisationer
  - ✅ OrganizationOnboarding - Onboarding-flöde för nya organisationer

### Förbättringsområden / Råd

- **Subscription-integration:**
  - ✅ Organization-domänen ska ha en `hasActiveSubscription`-check eller delegatfunktion för att avgöra om organisationen har en aktiv prenumeration (men ingen billinglogik här).
  - ✅ All logik kring feature flags, limits och tillgång till premiumfunktioner ska hämtas via ett kontrakt/interface från subscription-domänen.
  - ✅ Subscription-domänen ansvarar för att exponera ett tydligt kontrakt/interface för dessa behov.

- **Team/Org dubbla medlemskap:**
  - En användare kan vara medlem i både organization_members och team_members. Organisationens roller sätter en "policy baseline" som team kan ärva eller begränsa.
  - Det ska finnas ett enkelt sätt att lista alla team som tillhör en organisation och som en användare har access till.

### Pågående arbete 🚧

#### Domänlager
- ✅ Grundläggande domänmodell implementerad
- ✅ Implementera inbjudningssystem
- ✅ Förbättra domänregler och validering
- Utöka testning för domänhändelser 🚧

#### Infrastrukturlager
- ✅ Implementera Supabase Repository
- ✅ Skapa databasschema för organisationer
- ✅ Skapa databasschema för inbjudningar
- ✅ Implementera OrganizationMapper med stöd för inbjudningar
- ✅ Implementera SupabaseOrganizationRepository med inbjudningsfunktionalitet
- ✅ Optimera SQL-frågor för medlemskap och behörigheter
- ✅ Implementera caching för organisationsdata

#### Applikationslager
- ✅ Skapa use cases för grundläggande CRUD-operationer
- ✅ Integrera med team- och användardomän
- Implementera e2e-testers för händelseflöden 🚧

#### UI-lager
- ✅ Grundläggande användargränssnitt för organisationshantering
- ✅ Utveckla inbjudningshantering i användargränssnittet
- ✅ Implementera UI för att visa och hantera organisationens team
- ✅ Utveckla onboarding-flöde för nya organisationer
- ✅ Skapa organisationsadministrationsskärm

### Tidigare kommande arbete (nu färdigt) ✅

#### Domänlager
- ✅ Organisationsresurser och avancerad behörighetshantering

#### Applikationslager
- ✅ Use cases för organisationsresurser

#### UI-lager
- ✅ Komponenter för organisationsresurser

### Nyligen implementerade begränsningsstrategier ✅

#### Domänlager
- ✅ Definierat kontrakt mot subscription-domänen
- ✅ Implementerat flagga för kontroll av prenumerationsaktivitet (`hasActiveSubscription`)
- ✅ Skapat ResourceLimitStrategy interface och BaseResourceLimitStrategy abstrakt klass
- ✅ Implementerat specifika strategier:
  - ✅ TeamMemberLimitStrategy
  - ✅ TeamLimitStrategy
  - ✅ OrganizationResourceLimitStrategy
- ✅ Skapat ResourceLimitStrategyFactory för enkel åtkomst till strategier
- ✅ Integrerat strategierna med Organization-entiteten

#### Infrastrukturlager
- ✅ Skapat SubscriptionAdapter för integration med subscription-domänen
- ✅ Implementerat cache-strategi för resursbegränsningsdata

#### UI-lager
- ✅ Skapat ResourceLimitError komponent för att visa begränsningsfel
- ✅ Skapat ResourceLimitDisplay komponent för att visa resursbegränsningar
- ✅ Integrerat komponenter med OrganizationProvider
- ✅ Uppdaterat createResource för att använda begränsningsstrategier

### Kommande arbete ��

#### Domänlager
- ✅ Implementera strategier för prioriterade resurstyper (mål, tävlingar, rapporter)
- ✅ Implementera automatisk resursanvändningsspårning
- ✅ Skapa DomainService för prenumerationshantering

#### Applikationslager
- ✅ Skapa automatiserad uppdatering av användningsstatistik
- ✅ Integrera med notifikationssystem för varningar om resursbegränsningar
- ✅ Skapa avancerad loggning för resursbegränsningshantering

#### UI-lager
- ✅ Skapa ResourceUsageOverview komponent för organisationsdashboard
- ✅ Implementera uppgraderingsförslag när begränsningar nås
- ✅ Skapa ResourceManagementTab för enkel hantering av olika resurstyper
- ✅ Förfina felmeddelanden och användargränssnitt för begränsningar

### Nyligen implementerat ✅

#### Resursbegränsningshantering
- ✅ Implementerat strategier för prioriterade resurstyper (GoalLimitStrategy, CompetitionLimitStrategy, ReportLimitStrategy)
- ✅ Skapat AutomaticResourceTrackingService för automatisk resursanvändningsspårning
- ✅ Implementerat ResourceUsageTrackingService för spårning av resursanvändning
- ✅ Skapat ResourceCountProvider interface och SupabaseResourceCountProvider för datahämtning
- ✅ Implementerat ResourceLimitNotificationService för varningar om resursbegränsningar
- ✅ Skapat SupabaseNotificationAdapter för integration med notifikationssystemet
- ✅ Utvecklat ResourceUsageOverview komponent för att visa resursbegränsningar
- ✅ Implementerat ResourceManagementTab för hantering av resursbegränsningar
- ✅ Integrerat uppgraderingsförslag i UI när resursbegränsningar närmar sig eller nås
- ✅ Konfigurerat automatiserad periodisk uppdatering av användningsstatistik
- ✅ Implementerat avancerad loggning för att spåra användning och begränsningar

### Nästa steg prioriteringar 🚀

1. ✅ **ResourceLimitStrategies för alla resurser**
   - ✅ Implementera strategier för alla befintliga resurstyper
   - ✅ Standardisera caching och prestanda
   - ✅ Utöka testning med edge-cases

2. ✅ **ResourceUsage automatisk spårning**
   - ✅ Implementera autotracking av resursutnyttjande
   - ✅ Skapa periodiska uppdateringar av användningsstatistik
   - ✅ Implementera varningssystem när användning närmar sig gränser

3. ✅ **Avancerad UI för resursbegränsningar**
   - ✅ Skapa dashboard-widgets för resursbegränsningar
   - ✅ Förbättra visuell representation av resursbegränsningar
   - ✅ Implementera interaktiva guider för prenumerationsuppgradering

### Nya nästa steg prioriteringar 🚀

1. **Prestandaoptimering av resursspårning**
   - Optimera databasfrågor för resursspårning
   - Implementera effektivare cache-strategi för resursbegränsningsdata
   - Minska nätverksbelastningen från periodiska uppdateringar

2. **Utökad testning av resursbegränsningssystem**
   - Skapa omfattande tester för edge-cases i alla strategier
   - Implementera automatiserade integrationstester
   - Dokumentera testscenarier och resultat

3. **Förbättrad användarupplevelse**
   - Förbättra visuell feedback vid närhet till resursgränser
   - Implementera stegvisa guider för resurshantering
   - Skapa användarutbildningsmaterial för resurshantering

### Avancerade förbättringar ��

#### Prestanda
- ✅ Förbättrad prestanda vid stora antal resurser
- ✅ Optimerad cache-strategi för resurshämtning

#### Mobilgränssnitt
- ✅ Förbättrad visualisering av resursbehörigheter
- ✅ Bättre stöd för mobilgränssnitt för resursvyn

### Nyligen implementerat ✅

#### Resurshantering
- ✅ ResourceType och ResourcePermission som värde-objekt
- ✅ OrganizationResource som entitet med behörighetshantering
- ✅ Domänhändelser för resurser (ResourceEvents)
- ✅ Repository-gränssnitt för organisationsresurser
- ✅ SQL-migrationer för resurstabeller med RLS-policyer
- ✅ OrganizationResourceMapper för data-mappning
- ✅ SupabaseOrganizationResourceRepository med CRUD-funktionalitet
- ✅ OrganizationResourceList för att visa resurser
- ✅ CreateResourceForm för att skapa nya resurser
- ✅ OrganizationResourceDetails för att visa resursdetaljer
- ✅ Integration med OrganizationProvider
- ✅ Integration med OrganizationDashboard via resursflik
- ✅ Påbörjad integration med OrganizationAdminScreen
- ✅ Uppdaterade index.ts för export av nya komponenter

### Optimeringar och förbättringar ✅

#### Prestandaförbättringar
- ✅ Implementerad caching med specificerade TTL-värden för resurser
- ✅ Batch-hämtning av resurser för stora datamängder
- ✅ Optimerade databasfrågor med prefiggerade nyckelstrukturer
- ✅ Smarta uppdateringar som endast invaliderar nödvändiga cache-objekt
- ✅ Effektiv hantering av relationsdata med inbyggda joins

#### UI-förbättringar
- ✅ Förbättrad resurslistning med sökning och filtrering
- ✅ Optimerad rendering av långa resurslistor
- ✅ Förbättrad visuell presentation med ikoner och typindikatorer
- ✅ Bättre felhantering och återhämtning vid nätverksproblem
- ✅ Pull-to-refresh för enkel uppdatering av data
- ✅ Detaljerade resursvyer med bättre struktur och visualisering
- ✅ Förbättrad behörighetsvisualisering med färgkodning och ikoner

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
       ├─ strategies/
       │  ├─ ResourceLimitStrategy.ts ✅
       │  ├─ TeamMemberLimitStrategy.ts ✅
       │  ├─ TeamLimitStrategy.ts ✅
       │  └─ ResourceLimitStrategyFactory.ts ✅
       ├─ adapters/
       │  └─ SubscriptionAdapter.ts ✅
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
       ├─ ResourceLimitError.tsx ✅
       ├─ ResourceLimitDisplay.tsx ✅
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
   - ✅ Kontrollera medlemsbegränsningar baserat på prenumeration

3. Team-hantering
   - ✅ Koppla team till organisation
   - ✅ Visa och hantera organisationens team (inklusive access per användare)
   - ✅ Kontrollera teambegränsningar baserat på prenumeration

4. Behörigheter och säkerhet
   - ✅ Rollbaserad åtkomstkontroll (med policy baseline)
   - ✅ Validering av användarrättigheter
   - ✅ Integrera med subscription-kontrakt för feature flags och limits
   - ✅ Implementera strategier för resursbegränsning

## Testning

- Enhetstester för strategiklasser ✅
- Enhetstester för domänhändelser och regler 🚧
- Integrationstester för repository och use cases 🚧

## Tidplan

### Sprint 1-5: Grundimplementation (✅ Slutförd)
Alla tidigare planerade uppgifter är slutförda.

### Sprint 6: Domängränssnittsintegration (✅ Slutförd)
- ✅ Definiera interface för subscription-kontraktet
- ✅ Implementera flagga för kontroll av prenumerationsaktivitet (`hasActiveSubscription`)
- ✅ Skapa adaptrar för subscription-domän integration
- ✅ Implementera begränsningsstrategier baserat på prenumerationsnivå

### Sprint 7: Ytterligare resursbegränsningar (🚧 Pågående)
- Skapa specifika begränsningsstrategier för mål, tävlingar och rapporter 🚧
- Implementera automatisk uppdatering av användningsstatistik 🚧
- Förbättra visuell presentation av resursbegränsningar 🚧

### Sprint 8: Dokumentation och Kodkvalitet (📋 Planerad)
- Förbättra enhetstestning för begränsningsstrategier 📋
- Dokumentera API och användarmönster 📋
- Implementera kodkvalitetskontroller 📋

## Ej inkluderat i denna domän

All fakturering, prenumerationer och relaterad logik (t.ex. OrganizationBilling, Subscription, betalningsflöden) hanteras i subscription-domänen och ingår inte i scope för organization-domänen. Organization-domänen konsumerar endast status och rättigheter via kontraktet mot subscription-domänen. 

## Testplan för OrganizationsResource-domänen

### Enhetstester

#### Domänobjekt
- ✓ Test_ResourceType_ShouldHaveCorrectLabels - Verifiera att alla resurstyper har korrekta svenska etiketter
- ✓ Test_ResourcePermission_ShouldHaveCorrectLabels - Verifiera att alla behörigheter har korrekta svenska etiketter
- ✓ Test_DefaultRoleResourcePermissions_ShouldBeConsistent - Verifiera att standardbehörigheter per roll är korrekta

#### OrganizationResource Entity
- ✓ Test_OrganizationResource_Create_ShouldValidateInput - Verifiera att skapande validerar indata korrekt
- ✓ Test_OrganizationResource_Create_ShouldGenerateEvents - Verifiera att relevant domänhändelse skapas
- ✓ Test_OrganizationResource_Update_ShouldTrackChangedFields - Verifiera att uppdateringar spårar ändrade fält
- ✓ Test_OrganizationResource_ChangeOwner_ShouldCreateOwnerChangedEvent - Verifiera att ägarbyte skapar rätt händelse
- ✓ Test_OrganizationResource_AddPermission_ShouldValidateInput - Verifiera validering av behörighetstilldelning
- ✓ Test_OrganizationResource_AddPermission_ShouldNotAllowDuplicates - Verifiera att dubbletter inte tillåts
- ✓ Test_OrganizationResource_RemovePermission_ShouldWork - Verifiera borttagning av behörigheter

#### ResourceEvents
- ✓ Test_ResourceCreated_Event_ShouldHaveCorrectData - Verifiera att skapad-händelsen har rätt data
- ✓ Test_ResourceUpdated_Event_ShouldHaveCorrectData - Verifiera att uppdaterad-händelsen har rätt data
- ✓ Test_ResourceDeleted_Event_ShouldHaveCorrectData - Verifiera att borttagen-händelsen har rätt data
- ✓ Test_ResourceOwnerChanged_Event_ShouldHaveCorrectData - Verifiera att ägarbyte-händelsen har rätt data
- ✓ Test_ResourcePermissionAdded_Event_ShouldHaveCorrectData - Verifiera händelsen för tillagd behörighet
- ✓ Test_ResourcePermissionRemoved_Event_ShouldHaveCorrectData - Verifiera händelsen för borttagen behörighet

### Integrationstester

#### Repository
- ✓ Test_ResourceRepository_Save_ShouldStoreResource - Verifiera att resurser sparas korrekt
- ✓ Test_ResourceRepository_Get_ShouldReturnStoredResource - Verifiera att hämtning fungerar korrekt
- ✓ Test_ResourceRepository_Delete_ShouldRemoveResource - Verifiera att borttagning fungerar korrekt
- ✓ Test_ResourceRepository_FindByType_ShouldFilterCorrectly - Verifiera filtrering efter typ
- ✓ Test_ResourceRepository_FindByOrganizationId_ShouldFilterCorrectly - Verifiera filtrering efter organisation
- ✓ Test_ResourceRepository_FindAccessibleByUserId_ShouldFilterCorrectly - Verifiera filtrering efter användaråtkomst

#### Mapping
- ✓ Test_OrganizationResourceMapper_ToDomain_ShouldMapCorrectly - Verifiera mappning från DTO till domän
- ✓ Test_OrganizationResourceMapper_ToDTO_ShouldMapCorrectly - Verifiera mappning från domän till DTO

#### Event-hantering
- ✓ Test_ResourceEvents_ShouldBePublishedWhenSaved - Verifiera att händelser publiceras vid sparande
- ✓ Test_ResourceEvents_ShouldBePublishedWhenDeleted - Verifiera att händelser publiceras vid borttagning

### UI-tester

#### OrganizationResourceList
- ✓ Test_ResourceList_ShouldDisplayResources - Verifiera att resurslistan visar resurser korrekt
- ✓ Test_ResourceList_ShouldFilterByType - Verifiera att filtrering efter typ fungerar
- ✓ Test_ResourceList_ShouldHandleEmpty - Verifiera hantering av tomma listor
- ✓ Test_ResourceList_ShouldHandleLoading - Verifiera laddningstillstånd
- ✓ Test_ResourceList_ShouldHandleErrors - Verifiera felhantering

#### OrganizationResourceDetails
- ✓ Test_ResourceDetails_ShouldDisplayResource - Verifiera att resursdetaljer visas korrekt
- ✓ Test_ResourceDetails_ShouldDisplayPermissions - Verifiera att behörigheter visas korrekt
- ✓ Test_ResourceDetails_ShouldRespectUserPermissions - Verifiera att användarens behörigheter respekteras
- ✓ Test_ResourceDetails_ShouldHandleDelete - Verifiera borttagningsfunktionalitet
- ✓ Test_ResourceDetails_ShouldHandleNotFound - Verifiera hantering av saknade resurser

#### CreateResourceForm
- ✓ Test_CreateResourceForm_ShouldValidateInput - Verifiera att formulärvalidering fungerar
- ✓ Test_CreateResourceForm_ShouldSubmitCorrectly - Verifiera att formuläret skickar korrekt data
- ✓ Test_CreateResourceForm_ShouldHandleErrors - Verifiera felhantering vid skapande
- ✓ Test_CreateResourceForm_ShouldSetDefaultValues - Verifiera att standardvärden sätts korrekt

### E2E-tester

- ✓ Test_EndToEnd_ShouldCreateResourceAndDisplayInList - Verifiera hela flödet från skapande till visning
- ✓ Test_EndToEnd_ShouldEditResourceAndSeeChanges - Verifiera hela flödet för ändringar
- ✓ Test_EndToEnd_ShouldAssignPermissionsAndVerifyAccess - Verifiera behörighetshantering från slut till slut
- ✓ Test_EndToEnd_ShouldDeleteResourceAndVerifyRemoval - Verifiera borttagning från slut till slut

### Prestandatester

- ✓ Test_Performance_ShouldHandleLargeNumberOfResources - Verifiera prestanda med många resurser
- ✓ Test_Performance_ShouldHandleLargeNumberOfPermissions - Verifiera prestanda med många behörigheter
- ✓ Test_Performance_ShouldOptimizeQueries - Verifiera att databasfrågor är optimerade 