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

För att visualisera och hantera resursbegränsningar har vi följande komponenter:

1. **ResourceLimitError** - Komponent för att visa felmeddelanden när resursgränser nås.
2. **ResourceLimitDisplay** - Generell komponent för att visa resursbegränsningar.
3. **ResourceUsageOverview** - Dashboard-widget för att visa resursbegränsning per organisation.
4. **ResourceManagementTab** - Dedikerad flik för att hantera olika resurstyper och deras begränsningar.

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

## Teknisk implementation

### Domänevents

Systemet använder följande domänevents för att hålla olika delar av applikationen synkroniserade:
- ResourceLimitReachedEvent
- ResourceUsageUpdatedEvent
- SubscriptionChangedEvent

### Testning

Testerna för systemet inkluderar:
- Enhetstester för varje strategi
- Integrationstester för ResourceUsageTrackingService
- UI-tester för ResourceManagementTab
- End-to-end tester för uppgraderingsflöden

## Framtida förbättringar

### Planerade förbättringar

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