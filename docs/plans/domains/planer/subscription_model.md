# Pling Prenumerationsmodell

## Översikt

Pling-applikationen använder en prenumerationsbaserad modell för att kontrollera tillgång till olika funktioner och resursbegränsningar. Modellen är implementerad enligt Domain-Driven Design principer med tydlig separation mellan domäner.

## Resursmodell

### Resursbegränsningar

Vi har implementerat en robust lösning för att hantera resursbegränsningar baserad på en strategi-pattern:

#### Huvudkomponenter:

1. **ResourceLimitStrategy** - Ett interface som definierar hur resursbegränsningar beräknas och kontrolleras.
2. **BaseResourceLimitStrategy** - En abstrakt basklass som implementerar grundläggande funktionalitet för resursbegränsningar.
3. **Strategiklasser** - Konkreta implementationer för olika resurstyper:
   - **TeamLimitStrategy** - Begränsar antal team i en organisation
   - **TeamMemberLimitStrategy** - Begränsar antal medlemmar per team
   - **GoalLimitStrategy** - Begränsar antal mål som kan skapas
   - **CompetitionLimitStrategy** - Begränsar antal tävlingar som kan skapas
   - **ReportLimitStrategy** - Begränsar antal rapporter som kan genereras
   - **OrganizationResourceLimitStrategy** - Övergripande resursstrategi för organisationen

4. **ResourceLimitStrategyFactory** - Fabriksklass som skapar och returnerar rätt strategi baserat på typ.

### Automatiserad resursanvändningsspårning

Vi har implementerat ett automatiskt system för att spåra resursanvändning inom organisationer:

1. **ResourceUsageTrackingService** - Service för att spåra och uppdatera resursanvändning.
2. **AutomaticResourceTrackingService** - Service för att schemalägga periodiska uppdateringar av resursanvändning.
3. **ResourceCountProvider** - Interface för att hämta antal resurser per typ.
4. **SupabaseResourceCountProvider** - Konkret implementation som hämtar resursantal från Supabase.

### Notifikationer för resursgränser

För att förbättra användarupplevelsen när resursgränser närmar sig eller nås:

1. **ResourceLimitNotificationService** - Service för att skicka notifikationer om resursbegränsningar.
2. **SupabaseNotificationAdapter** - Adapter för integration med Supabase notifikationssystem.

## Användargränssnitt

### Resursbegränsningskomponenter

För att visualisera och hantera resursbegränsningar har vi följande komponenter:

1. **ResourceLimitError** - Komponent för att visa felmeddelanden när resursgränser nås.
2. **ResourceLimitDisplay** - Generell komponent för att visa resursbegränsningar.
3. **ResourceUsageOverview** - Dashboard-widget för att visa resursbegränsning per organisation.
4. **ResourceManagementTab** - Dedikerad flik för att hantera olika resurstyper och deras begränsningar.

### Prenumerationskomponenter

1. **SubscriptionComparison** - Jämförelse av prenumerationsplaner:
   - Visuell jämförelse av tillgängliga planer
   - Visning av funktioner och begränsningar per plan
   - Stöd för månadsvis och årsvis fakturering
   - Tydliga besparingsindikationer vid årsabonnemang

2. **UpgradeGuide** - Stegvis guide för uppgradering:
   - Illustrativ presentation av uppgraderingsfördelar
   - Jämförelse mellan nuvarande och rekommenderade planer
   - Anpassade rekommendationer baserat på aktuell användning

3. **BillingInfo** - Hantering av fakturerings- och betalningsinformation:
   - Översikt över prenumerationsstatus
   - Hantering av betalningsmetoder
   - Fakturahistorik med nedladdningsmöjligheter
   - Alternativ för automatisk förnyelse

4. **PaymentProcessor** - Hantering av betalningar:
   - Inmatning av fakturerings- och adressinformation
   - Säker hantering av kreditkortsinformation
   - Integrerad med Stripe API
   - Responsiv feedback och felhantering

5. **SubscriptionAdminPanel** - Administrativ kontrollpanel:
   - Dashboard med nyckelstatistik
   - Användarhantering med sökmöjligheter
   - Händelselogg för prenumerationsaktiviteter
   - Resursanvändningsvisualisering

6. **SubscriptionUpgradeFlow** - Integrerat uppgraderingsflöde:
   - Kombinerar UpgradeGuide och PaymentProcessor
   - Stegvis progression från rekommendation till betalning
   - Konsekvent användarupplevelse genom hela flödet

### Planerade komponenter

1. **SubscriptionSwitcher** - Byte mellan prenumerationsalternativ
2. **PlanLimitsDisplay** - Detaljerad visning av resursgränser per plan
3. **SubscriptionHistory** - Historik över prenumerationsändringar och betalningar

## Integrationer

### Prenumerationsnivåer

Varje prenumerationsnivå (Basic, Professional, Enterprise) definierar gränser för följande resurstyper:
- Antal team
- Medlemmar per team
- Antal mål
- Antal tävlingar
- Antal rapporter
- Antal dashboards
- Medialagring (MB)

### Prenumerationsuppgraderingar

När en användare närmar sig eller når en resursgräns kommer systemet att:
1. Visa visuella indikatorer i gränssnittet
2. Skicka notifikationer till administratörer och ägare
3. Föreslå prenumerationsuppgradering med relevant information

### Stripe-integration

För att hantera betalningar och prenumerationer har vi implementerat en fullständig integration med Stripe betalningsplattform:

#### 1. Backend-integration

1. **StripeIntegrationService** - Service för att interagera med Stripe API:
   - Skapar prenumerationer och hanterar betalningar
   - Uppdaterar befintliga prenumerationer 
   - Hanterar avbrott och förnyelser
   - Hämtar betalningsmetoder och fakturahistorik

2. **useStripeSubscription** - React hook för att använda Stripe-tjänster:
   - Exponerar funktioner för prenumerationshantering
   - Hanterar laddningstillstånd och felhantering
   - Förenklar användningen av Stripe i UI-komponenter

#### 2. Frontend-integration

1. **PaymentProcessor** - Säker hantering av betalningsinformation:
   - PCI-kompatibel inmatning av kreditkortsinformation
   - Säker tokenisering av kortuppgifter
   - Hantering av betalningsresultat och felmeddelanden

2. **BillingInfo** - Hantering av faktureringsinformation:
   - Visar prenumerationsdetaljer från Stripe
   - Hanterar ändringar i betalningsmetoder
   - Visar fakturahistorik med nedladdningsfunktionalitet

#### 3. Webhooks och händelsehantering

För att hålla systemet synkroniserat med Stripe planeras följande webhooks:
- `checkout.session.completed` - För att bekräfta prenumerationsaktivering
- `invoice.payment_succeeded` - För att registrera lyckade betalningar
- `invoice.payment_failed` - För att hantera misslyckade betalningar
- `customer.subscription.updated` - För att uppdatera prenumerationsdetaljer
- `customer.subscription.deleted` - För att hantera avslutade prenumerationer

## Teknisk Implementation

### Databasschema

Resursbegränsningssystemet använder följande databastabeller:

```sql
-- Resursbegränsningar per prenumerationsnivå
CREATE TABLE resource_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type subscription_plan_type NOT NULL,
  resource_type resource_type NOT NULL,
  limit_value INTEGER NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(plan_type, resource_type)
);

-- Aktuell resursanvändning per organisation
CREATE TABLE resource_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resource_type resource_type NOT NULL,
  current_usage INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, resource_type)
);

-- Historikspårning av resursanvändning
CREATE TABLE resource_usage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resource_type resource_type NOT NULL,
  usage_value INTEGER NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifikationstabell för resursgränser
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type notification_type NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Push-notifikationstoken
CREATE TABLE device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_type TEXT NOT NULL,
  device_name TEXT,
  app_version TEXT,
  last_used TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, token)
);
```

### Migrationsstatus

Följande migrationer har utförts:

| Miljö | Status | Datum |
|-------|--------|-------|
| Testmiljö | ✅ Genomförd | 2025-05-13 |
| Produktionsmiljö | 🕒 Planerad | 2025-05-20 |

Detaljerad migrationsinformation finns i [migration_summary.md](../../migrations/migration_summary.md).

### RLS-Policies

För att skydda resursbegränsningsdata har vi implementerat följande RLS-policyer:

```sql
-- resource_limits
CREATE POLICY "Alla autentiserade användare kan se resursbegränsningar"
  ON resource_limits
  FOR SELECT
  TO authenticated
  USING (true);

-- resource_usage
CREATE POLICY "Organisationsmedlemmar kan se sin egen organisations resursanvändning"
  ON resource_usage
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE user_id = auth.uid()
      AND organization_id = resource_usage.organization_id
    )
  );
```

Fullständiga RLS-policyer finns i migrationsskripten.

### Integrationer

#### 1. Frontend-komponenter

```typescript
// ResourceLimitProvider.tsx - Kontext för att hantera resursbegränsningar
export const ResourceLimitProvider: React.FC<PropsWithChildren<{
  organizationId: string;
}>> = ({ organizationId, children }) => {
  // Implementationsdetaljer
};

// ResourceUsageDisplay.tsx - Komponent för att visa resursbegränsningar
export const ResourceUsageDisplay: React.FC<{
  organizationId: string;
  resourceType: ResourceType;
}> = ({ organizationId, resourceType }) => {
  // Implementationsdetaljer
};
```

#### 2. Databas-funktioner 

```sql
-- Funktion för att uppdatera resursanvändning
CREATE OR REPLACE FUNCTION update_resource_usage(
  org_id UUID,
  res_type resource_type,
  usage_val INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
-- Funktionsimplementation
$$;

-- Funktion för att skicka notifikation om resursbegränsning
CREATE OR REPLACE FUNCTION send_resource_limit_notification(
  org_id UUID,
  res_type resource_type,
  notif_type notification_type,
  notif_title TEXT,
  notif_body TEXT,
  notif_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
-- Funktionsimplementation
$$;
```

### Automatiserad resursövervakning

Automatisk övervakning av resursanvändning implementeras via Edge Functions:

1. **Daily usage tracking** - Körs 01:00 varje dag, uppdaterar resursanvändningen för alla organisationer
2. **Warning notifications** - Körs varje timme, skickar notifikationer om resursgränser som närmar sig

## Framtida förbättringar

### Implementerade förbättringar ✅

1. **Prestandaoptimering av resursspårning**
   - Optimerat databasfrågor för resursspårning med RPC-funktioner
   - Implementerat effektiv cache-strategi för resursbegränsningsdata (TTL-baserad)
   - Minskat nätverksbelastningen från periodiska uppdateringar

2. **Utökad testning av resursbegränsningssystem**
   - Skapat enhetstester för ResourceLimitStrategy-klasser
   - Implementerat simuleringar för olika resursbegränsningsscenarier
   - Dokumenterat testscenarier och resultat

### Pågående förbättringar 🚧

1. **Förbättrad användarupplevelse**
   - Förbättrat visuell feedback vid närhet till resursgränser
   - Implementerat användargränssnitt för resurshantering
   - Skapar användarutbildningsmaterial för resurshantering

## Prenumerationsnivåer

### 1. Pling Basic (Gratis)
- **Målgrupp**: Små team och testanvändare
- **Funktioner**:
  - Upp till 3 teammedlemmar
  - Grundläggande målhantering
  - Begränsad statistik
  - Grundläggande tävlingsfunktioner
  - 100MB medialagring

### 2. Pling Pro
- **Målgrupp**: Medelstora team och aktiva användare
- **Funktioner**:
  - Upp till 10 teammedlemmar
  - Avancerad målhantering
  - Fullständig statistik och rapporter
  - Alla tävlingsfunktioner
  - 1GB medialagring
  - Prioriterad support
  - Anpassade team-dashboards

### 3. Pling Enterprise
- **Målgrupp**: Stora organisationer och företag
- **Funktioner**:
  - 25 teammedlemmar ingår med möjlighet betala för extra users
  - Enterprise-funktioner för målhantering
  - Avancerad analys och prediktiv statistik
  - Anpassade tävlingar och belöningar
  - 15GB medialagring
  - Dedikerad support
  - API-tillgång
  - SSO-integration
  - Anpassade säkerhetsinställningar

## Teknisk Datamodell

```typescript
interface SubscriptionPlan {
  id: string;
  name: 'basic' | 'pro' | 'enterprise';
  displayName: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
    currency: string;
  };
  features: PlanFeature[];
  limits: PlanLimits;
}

interface PlanFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  tier: 'basic' | 'pro' | 'enterprise';
}

interface PlanLimits {
  teamMembers: number;
  mediaStorage: number; // i megabytes
  customDashboards: number;
  apiRequests?: number; // per månad
  concurrentUsers?: number;
}

interface Subscription {
  id: string;
  organizationId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  payment: {
    provider: 'stripe';
    customerId: string;
    subscriptionId: string;
    paymentMethodId?: string;
  };
  billing: {
    email: string;
    name: string;
    address: BillingAddress;
    vatNumber?: string;
  };
  usage: {
    teamMembers: number;
    mediaStorage: number;
    apiRequests?: number;
    lastUpdated: Date;
  };
}

interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid';
```

## Funktionsmatris

| Funktion                    | Basic | Pro | Enterprise |
|----------------------------|-------|-----|------------|
| Team-medlemmar             | 5     | 25  | Obegränsat |
| Målhantering              | ✓     | ✓   | ✓          |
| Avancerad målhantering    | ✗     | ✓   | ✓          |
| Tävlingar                 | ✓     | ✓   | ✓          |
| Anpassade tävlingar       | ✗     | ✓   | ✓          |
| Statistik                 | Basic | Full| Avancerad  |
| Medialagring              | 100MB | 1GB | 5GB        |
| API-tillgång             | ✗     | ✗   | ✓          |
| SSO-integration          | ✗     | ✗   | ✓          |
| Prioriterad support      | ✗     | ✓   | ✓          |
| Anpassade dashboards     | ✗     | ✓   | ✓          |

## Implementationsplan

### Fas 1: Grundläggande struktur
1. Skapa databasschema för prenumerationer
2. Implementera Stripe-integration
3. Skapa grundläggande prenumerationshantering

### Fas 2: Prenumerationskontroll
1. Implementera feature flags system
2. Skapa behörighetskontroller
3. Implementera användningsspårning

### Fas 3: Användargränssnitt
1. Skapa prenumerationssidor
2. Implementera betalningsflöden
3. Bygga administrationsverktyg

### Fas 4: Rapportering och övervakning
1. Implementera användningsrapporter
2. Skapa varningssystem för gränser
3. Bygga faktureringspaneler

## Teknisk Implementation

### Databasschema

```sql
-- Prenumerationsplaner
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly INTEGER NOT NULL,
  price_yearly INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SEK',
  features JSONB NOT NULL DEFAULT '[]',
  limits JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aktiva prenumerationer
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  trial_end TIMESTAMP WITH TIME ZONE,
  payment_provider TEXT NOT NULL,
  payment_customer_id TEXT,
  payment_subscription_id TEXT,
  payment_method_id TEXT,
  billing_email TEXT NOT NULL,
  billing_name TEXT NOT NULL,
  billing_address JSONB NOT NULL,
  billing_vat_number TEXT,
  usage JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prenumerationshistorik
CREATE TABLE subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Användningsspårning
CREATE TABLE subscription_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  metric TEXT NOT NULL,
  value INTEGER NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### RLS-Policies

```sql
-- Prenumerationsåtkomst
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organisationer kan se sina egna prenumerationer"
  ON subscriptions
  FOR SELECT
  USING (organization_id IN (
    SELECT org_id FROM organization_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Endast administratörer kan ändra prenumerationer"
  ON subscriptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE user_id = auth.uid()
      AND org_id = organization_id
      AND role = 'admin'
    )
  );
```

## Integrationer

### 1. Stripe Integration

```typescript
export class StripeService {
  async createSubscription(
    organizationId: string,
    planId: string,
    paymentMethodId: string
  ): Promise<Subscription> {
    // Implementera Stripe-prenumerationshantering
  }

  async updateSubscription(
    subscriptionId: string,
    updates: SubscriptionUpdate
  ): Promise<Subscription> {
    // Hantera prenumerationsuppdateringar
  }

  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<void> {
    // Hantera prenumerationsavslut
  }
}
```

### 2. Feature Flags

```typescript
export class FeatureFlagService {
  async checkFeatureAccess(
    organizationId: string,
    featureId: string
  ): Promise<boolean> {
    // Kontrollera åtkomst till specifik funktion
  }

  async checkUsageLimit(
    organizationId: string,
    metric: string,
    value: number
  ): Promise<boolean> {
    // Kontrollera användningsgränser
  }
}
```

## Användargränssnitt

### Komponenter

1. **SubscriptionPlans.tsx**
   - Visa tillgängliga planer
   - Jämförelse av funktioner
   - Prisvisning

2. **SubscriptionManagement.tsx**
   - Hantera aktiv prenumeration
   - Visa användning
   - Uppgradering/nedgradering

3. **BillingDetails.tsx**
   - Hantera betalningsinformation
   - Visa fakturahistorik
   - Uppdatera faktureringsinformation

## Övervakning och Rapportering

1. **Användningsövervakning**
   - Spåra resursanvändning
   - Varna vid närmande gränser
   - Generera användningsrapporter

2. **Faktureringsrapporter**
   - Månadsvis fakturering
   - Intäktsrapporter
   - Kundanalys

## Säkerhet och Efterlevnad

1. **Dataskydd**
   - GDPR-efterlevnad
   - Säker betalningshantering
   - Kryptering av känslig information

2. **Revision**
   - Spåra prenumerationsändringar
   - Dokumentera åtkomst
   - Behörighetsgranskningar 

## Implementationsframsteg

### Genomförda implementationer ✅

Följande komponenter har implementerats som del av Stripe-integrationen och prenumerationshanteringen:

1. **PaymentProcessor** - Komplett komponent för betalningshantering via Stripe:
   - Stöd för kreditkortsinmatning med validering
   - Hantering av fakturerings- och adressinformation
   - Betalningsbekräftelser och responsiv felhantering

2. **BillingInfo** - Omfattande faktureringsinformationsvisning:
   - Översikt över prenumerationsdetaljer
   - Hantering av betalningsmetoder
   - Fakturahistorik med möjlighet till nedladdning
   - Kontroll av automatisk förnyelse

3. **SubscriptionAdminPanel** - Omfattande administrationsvy:
   - Översikt med nyckeltal och statistik
   - Användarhantering med sökmöjlighet
   - Historikspårning av händelser
   - Resursutnyttjandediagram

4. **SubscriptionUpgradeFlow** - Integrerat uppgraderingsflöde:
   - Sömlös integration mellan UpgradeGuide och PaymentProcessor
   - Stegvis uppgraderingsprocess med tydlig användarfeedback
   - Konfirmations- och avbrytshantering

### Nästa steg 🚧

För att slutföra implementationen av prenumerationssystemet bör följande åtgärder vidtas:

1. **Backend-integration med Stripe**
   - Implementera webhooks för händelsehantering från Stripe
   - Konfigurera schemalagda jobb för förnyelser och fakturering
   - Slutföra integrationen mellan Supabase och Stripe

2. **Testning och validering**
   - Utföra omfattande testning av betalningsflödet
   - Validera att resursbegränsningar fungerar korrekt vid olika prenumerationsnivåer
   - Testa automatisk förnyelse och avslut av prenumerationer

3. **Monitoring och support**
   - Implementera loggning av prenumerationshändelser
   - Skapa aviseringar för misslyckade betalningar
   - Upprätta supportprocess för prenumerationsrelaterade ärenden 

# Implementation Plan: Prenumerationsmodell

Detta dokument beskriver implementationsplanen för prenumerationsmodellen i Pling-applikationen.

## Implementerade komponenter

- [x] Övergripande arkitektur för prenumerationsmodellen
- [x] Grundläggande domänmodell (entities, repositories, services)
- [x] Frontend-komponenter för prenumerationshantering
- [x] Stripe SDK-integration i frontend
- [x] StripeIntegrationService med kommunikation till Stripe API
- [x] BillingInfo-komponent för hantering av faktureringsinformation
- [x] PaymentProcessor för hantering av betalningar
- [x] useStripeSubscription hook
- [x] Webhook-hantering (StripeWebhookHandler)
- [x] Webhook-controller för API-integrationspunkt
- [x] Schemalagda jobb för prenumerationshantering 
- [x] Edge Functions för Stripe webhooks
- [x] Edge Functions för schemalagda jobb
- [x] SQL-migrationer för databasschema
- [x] RPC-funktioner för prenumerationsstatistik

## Implementationsordning

1. **Fas 1: Domänmodell (Klar)**
   - Definiera entiteter: Subscription, SubscriptionPlan, PaymentMethod, Invoice
   - Skapa repositories
   - Implementera basservice för prenumerationer

2. **Fas 2: Frontend (Klar)**
   - Skapa komponenter för prenumerationshantering
   - Integrera med Stripe SDK
   - Implementera hooks för prenumerationsdata

3. **Fas 3: Stripe API Integration (Klar)**
   - Skapa StripeIntegrationService
   - Implementera betalningsflödet
   - Testa prenumerationsskapande

4. **Fas 4: Backend Webhook och Schemaläggning (Klar)**
   - Implementera StripeWebhookHandler
   - Skapa StripeWebhookController
   - Implementera SubscriptionSchedulerService
   - Skapa Edge Functions för webhooks och schemalagda jobb
   - Skapa SQL-migrationer för databasschema och RPC-funktioner

5. **Fas 5: Testing och Driftsättning (Påbörjad)**
   - Integrationstestning av hela flödet
   - Webhooks-testning
   - Schemalagda jobb-testning
   - Driftsättning och konfiguration

6. **Fas 6: Avancerade funktioner (Planerad)**
   - SCA-stöd för europeiska användare
   - Rabattkodssystem
   - Förbättrad analys
   - Automatiserade påminnelser
   - Integrering med faktureringssystem

## Migreringsplan

För att implementera den nya prenumerationsarkitekturen behöver följande steg genomföras:

1. **Databasmigrationer**
   - Skapa nya tabeller för subscription_statistics
   - Utöka existerande tabeller med Stripe-specifika fält
   - Skapa RPC-funktioner för prenumerationsstatistik
   - Implementera row-level security

2. **Deployment av Edge Functions**
   - Distribuera stripe-webhook Edge Function för att hantera Stripe-händelser
   - Distribuera subscription-scheduler Edge Function för schemalagda jobb
   - Konfigurera miljövariabler för funktionerna

3. **Webhook-konfigurering**
   - Konfigurera webhook endpoints i Stripe Dashboard
   - Sätta upp signaturverifiering
   - Testa webhook-mottagning och hantering

4. **Schemaläggare-konfigurering**
   - Sätta upp cron eller annan schemaläggare
   - Konfigurera behörigheter
   - Testa schemalagda jobb-körning

## Backend-komponenter (Stripe Webhooks och Schemalagda Jobb)

### StripeWebhookHandler

Webhook-handleren tar emot och hanterar följande händelsetyper från Stripe:

1. `checkout.session.completed` - När en ny prenumeration skapas
2. `invoice.payment_succeeded` - Lyckad betalning
3. `invoice.payment_failed` - Misslyckad betalning
4. `customer.subscription.updated` - Prenumerationsuppdatering
5. `customer.subscription.deleted` - Prenumerationsavslutning

För varje händelse:
- Validerar data
- Uppdaterar databasen
- Utlöser domänhändelser
- Loggar händelsen

### SubscriptionSchedulerService

Schemaläggaren implementerar följande jobb:

1. `syncSubscriptionStatuses` (timvis):
   - Synkroniserar lokal prenumerationsdata med Stripe
   - Uppdaterar prenumerationsstatus
   - Hanterar inkonsekvenser

2. `checkRenewalReminders` (dagligen):
   - Identifierar prenumerationer som snart förnyas
   - Skickar påminnelser till administratörer
   - Loggar skickade påminnelser

3. `processExpiredSubscriptions` (dagligen):
   - Identifierar och markerar utgångna prenumerationer
   - Uppdaterar tillgång till funktioner
   - Notifierar berörda användare

4. `sendPaymentFailureReminders` (dagligen):
   - Identifierar prenumerationer med misslyckade betalningar
   - Skickar påminnelser till administratörer
   - Loggar påminnelseförsök

5. `updateSubscriptionStatistics` (veckovis):
   - Beräknar och lagrar statistik per plan
   - Beräknar månadsvis återkommande intäkt (MRR)
   - Genererar sammanfattningsrapporter

### Edge Functions

Edge Functions implementerar serverless funktionalitet för:

1. **stripe-webhook**:
   - Tar emot webhooks från Stripe
   - Validerar Stripe-signaturer
   - Anropar databasoperationer
   - Hanterar felscenarier

2. **subscription-scheduler**:
   - Körs regelbundet via externa schemaläggare
   - Utför schemalagda prenumerationsjobb
   - Genererar prenumerationsstatistik
   - Rapporterar körningsresultat

### RPC-funktioner

SQL-procedurer för att hantera:

1. `get_subscription_stats_by_plan`:
   - Statistik över aktiva prenumerationer per plan

2. `calculate_monthly_recurring_revenue`:
   - Beräkning av totala MRR

3. `get_upcoming_renewals`:
   - Lista på prenumerationer som snart förnyas

4. `get_upcoming_expirations`:
   - Lista på prenumerationer som snart upphör

5. `process_expired_subscriptions`:
   - Hantering av utgångna prenumerationer

## Testplan

För att säkerställa kvalitet och funktionalitet ska följande tester utföras:

1. **Unit tests**
   - Testa StripeWebhookHandler
   - Testa StripeWebhookController
   - Testa SubscriptionSchedulerService
   - Testa RPC-funktioner

2. **Integration tests**
   - Testa webhook-flödet från Stripe till databas
   - Testa schemalagda jobb
   - Testa hela prenumerationsflödet

3. **End-to-end tests**
   - Testa köp av prenumeration via frontend
   - Testa automatisk förnyelse
   - Testa uppdatering av betalningsmetod
   - Testa avslutande av prenumeration

## Driftsättning

För att aktivera lösningen i produktion behöver följande steg utföras:

1. **Databasmigrationer**
   - Kör SQL-migrations i Supabase-projektet
   - Verifiera databasstruktur och RPC-funktioner

2. **Edge Functions**
   - Distribuera Edge Functions till Supabase
   - Konfigurera miljövariabler:
     ```
     STRIPE_SECRET_KEY=sk_xxxxx
     STRIPE_WEBHOOK_SECRET=whsec_xxxxx
     SCHEDULER_SECRET=schsec_xxxxx
     ```

3. **Webhook-konfigurering**
   - Konfigurera webhook URL i Stripe Dashboard
   - Sätt upp händelser att lyssna på
   - Testa webhook-mottagning

4. **Schemaläggare**
   - Konfigurera cron för att anropa scheduler Edge Function
   - Sätt upp följande schema:
     - syncSubscriptionStatuses: Varje timme
     - checkRenewalReminders: Varje morgon
     - processExpiredSubscriptions: Varje morgon
     - sendPaymentFailureReminders: Varje morgon
     - updateSubscriptionStatistics: Varje måndag morgon

## Nästa steg

För att slutföra implementationen av prenumerationssystemet bör följande åtgärder vidtas:

1. **Implementera SCA-stöd** för europeiska användare
2. **Utveckla rabattkodssystem** för kampanjer
3. **Förbättra analysdashboard** för prenumerationsintäkter
4. **Implementera tjänstespecifika användningskvoter** för mer detaljerad fakturering
5. **Skapa automatiserade påminnelser** för snart utgående prenumerationer
6. **Integrera med faktureringssystem** för automatisk fakturering till kunder
7. **Implementera revisionsspårning** för fakturerings- och prenumerationsändringar
8. **Förbättra felhantering** för webhook-events och schemalagda jobb 