# Prenumerationsmodell

Denna dokumentation beskriver prenumerationsmodellen och dess implementering i Pling-appen.

## Översikt

Pling erbjuder en SaaS-prenumerationsmodell med flera nivåer för att passa olika typer av team och organisationer. Prenumerationer hanteras via Stripe och erbjuder både månads- och årliga betalningsalternativ.

## Prenumerationsnivåer

Vi erbjuder följande prenumerationsnivåer:

### Free

- Upp till 3 teammedlemmar
- 50 försäljningar per månad
- Grundläggande analyser
- Enkel leaderboard

### Pro

- Upp till 10 teammedlemmar
- Obegränsade försäljningar
- Avancerade analyser och rapporter
- Fullständig leaderboard
- Export av data
- Team-chatt
- Anpassade tävlingar

### Business

- Upp till 25 teammedlemmar
- Alla Pro-funktioner
- API-åtkomst
- Avancerad hierarki
- Flera team
- Anpassade rapporter
- SSO (Single Sign-On)
- Avancerade behörigheter
- Försäljningsprognoser
- CRM-integration

### Enterprise

- Obegränsade teammedlemmar
- Alla Business-funktioner
- Anpassad utveckling
- Lokal hosting möjlig
- Anpassad analytik
- Anpassade integrationer
- Omfattande utbildning
- SLA (Service Level Agreement)

## Implementerade komponenter

### Kärnkomponenter

1. **SubscriptionService** - Hanterar prenumerationslogik och kommunikation med Stripe
   - `getTeamSubscription`: Hämtar prenumerationsinformation för ett team
   - `checkFeatureAccess`: Kontrollerar om ett team har tillgång till en specifik funktion
   - `recordUsage`: Registrerar användningen av en funktion
   - `getFeatureUsage`: Hämtar nuvarande användning av en funktion

2. **StripeIntegrationService** - Hanterar kommunikation med Stripe API
   - `createSubscription`: Skapar en ny prenumeration
   - `updateSubscription`: Uppdaterar en befintlig prenumeration
   - `cancelSubscription`: Avbryter en prenumeration
   - `getPaymentMethods`: Hämtar betalningsmetoder för en användare
   - `syncSubscriptionStatus`: Synkroniserar prenumerationsstatus med Stripe

3. **SupabaseSubscriptionRepository** - Lagrar prenumerationsinformation i Supabase
   - `getSubscriptionById`: Hämtar en specifik prenumeration
   - `saveSubscription`: Sparar eller uppdaterar en prenumeration
   - `getSubscriptionUsageHistory`: Hämtar användningshistorik för en prenumeration

4. **StripeWebhookHandler** - Hanterar webhook-händelser från Stripe
   - `handleCheckoutSessionCompleted`: Hanterar när en ny prenumeration skapas
   - `handleInvoicePaymentSucceeded`: Hanterar lyckade betalningar
   - `handleInvoicePaymentFailed`: Hanterar misslyckade betalningar
   - `handleSubscriptionUpdated`: Hanterar prenumerationsuppdateringar
   - `handleSubscriptionDeleted`: Hanterar prenumerationsborttagningar

5. **SubscriptionSchedulerService** - Hanterar schemalagda jobb
   - `syncSubscriptionStatuses`: Synkroniserar prenumerationsstatus med Stripe
   - `checkRenewalReminders`: Skickar påminnelser om kommande förnyelser
   - `processExpiredSubscriptions`: Stänger av utgångna prenumerationer
   - `sendPaymentFailureReminders`: Skickar påminnelser om misslyckade betalningar
   - `updateSubscriptionStatistics`: Genererar prenumerationsstatistik

### Frontend-komponenter

1. **PaymentProcessor** - Hanterar betalningsflödet
   - Samlar in faktureringsuppgifter
   - Hanterar kreditkortsinformation via Stripe SDK
   - Visar betalningsstatus och bekräftelse

2. **BillingInfo** - Visar faktureringsinformation
   - Visar prenumerationsdetaljer
   - Hanterar betalningsmetoder
   - Visar fakturahistorik
   - Hanterar inställningar för automatisk förnyelse

3. **SubscriptionUpgradeFlow** - Guidar användaren genom uppgradering
   - Visar tillgängliga planer
   - Jämför funktioner mellan planer
   - Hanterar uppgradering/nedgradering

4. **SubscriptionAdminPanel** - Administratörsvy för prenumerationer
   - Översikt över prenumerationer
   - Statistik och användning
   - Användarhantering
   - Händelselogg

### React Hooks

1. **useSubscription** - Enkel hook för prenumerationsdata
   - Laddar prenumerationsinformation
   - Kontrollerar funktionsåtkomst

2. **useStripeSubscription** - Avancerad hook för Stripe-operationer
   - Skapar och uppdaterar prenumerationer
   - Hanterar betalningar
   - Hanterar automatisk förnyelse
   - Hämtar fakturahistorik

### Backend-komponenter

1. **StripeWebhookController** - Exponerar webhook-endpoints för Stripe
   - Validerar Stripe-signatur
   - Parserar webhook-data
   - Delegerar hantering till StripeWebhookHandler

2. **Edge Functions**
   - **stripe-webhook** - Serverless funktion för att hantera webhook-händelser
   - **subscription-scheduler** - Serverless funktion för schemalagda jobb

3. **Hjälpmoduler för felhantering**
   - **error-handler.ts** - Centraliserad felhantering
     - Specialiserade felklasser (WebhookError, AuthenticationError, etc.)
     - Standardiserade felkoder via ErrorCode-enum
     - Strukturerad loggning med kontext
     - Automatiska återförsök (retry) med exponentiell backoff
     - Spårning av funktionsexekvering med tidsrapportering

   - **db-helper.ts** - Säkra databasoperationer
     - Felhantering för databasanrop
     - Centraliserade funktioner för prenumerationshantering
     - Säker hantering av servicerollen

   - **stripe-helper.ts** - Stripe API-integration
     - Säker hantering av Stripe API-anrop
     - Automatiska återförsök för Stripe-operationer
     - Webhook-verifiering och signaturvalidering

4. **RPC Functions** - Databasprocedurer för prenumerationshantering
   - `get_subscription_stats_by_plan` - Återger statistik per plan
   - `calculate_monthly_recurring_revenue` - Beräknar MRR
   - `get_upcoming_renewals` - Listar prenumerationer som snart förnyas
   - `get_upcoming_expirations` - Listar prenumerationer som snart upphör
   - `process_expired_subscriptions` - Hanterar utgångna prenumerationer

## Datamodell

### Databasentiteter

1. **subscriptions**
   - id: string (primärnyckel)
   - team_id: string (främmande nyckel)
   - stripe_subscription_id: string
   - stripe_customer_id: string
   - tier: string (free, pro, business, enterprise)
   - status: string (active, past_due, canceled, incomplete)
   - current_period_start: timestamp
   - current_period_end: timestamp
   - cancel_at_period_end: boolean
   - created_at: timestamp
   - updated_at: timestamp

2. **subscription_plans**
   - id: string (primärnyckel)
   - stripe_price_id: string
   - stripe_product_id: string
   - name: string
   - description: string
   - price_monthly: number
   - price_yearly: number
   - currency: string
   - features: json
   - active: boolean

3. **subscription_usage**
   - id: string (primärnyckel)
   - subscription_id: string (främmande nyckel)
   - metric: string
   - value: number
   - recorded_at: timestamp

4. **subscription_history**
   - id: string (primärnyckel)
   - subscription_id: string (främmande nyckel)
   - event_type: string
   - event_data: json
   - created_at: timestamp

5. **subscription_statistics**
   - id: string (primärnyckel)
   - timestamp: timestamp
   - statistics: json
   - created_at: timestamp

6. **payment_methods**
   - id: string (primärnyckel)
   - team_id: string (främmande nyckel)
   - stripe_payment_method_id: string
   - type: string
   - last_four: string
   - exp_month: number
   - exp_year: number
   - is_default: boolean
   - created_at: timestamp

## Flöden

### Prenumerationsflöde

1. Användaren väljer en prenumerationsplan
2. Användaren fyller i faktureringsuppgifter
3. Användaren anger betalningsinformation
4. Systemet skapar prenumerationen via Stripe
5. Stripe skickar en webhook om förloppet
6. Webhook-hanteraren uppdaterar databasen
7. Användaren får tillgång till nya funktioner omedelbart

### Förnyelsesflöde

1. Stripe skickar en webhook när förnyelsedatumet närmar sig
2. Schemalagt jobb identifierar prenumerationer nära förnyelse
3. Systemet skickar påminnelser till administratören
4. På förnyelsedatumet försöker Stripe debitera den sparade betalningsmetoden
5. Webhook-hanteraren uppdaterar prenumerationsstatus
6. Användaren meddelas om förnyelsen

### Uppgraderingsflöde

1. Användaren väljer att uppgradera sin plan
2. Systemet beräknar proraterad kostnad för återstående period
3. Användaren bekräftar uppgraderingen
4. Systemet uppdaterar prenumerationen i Stripe
5. Webhook-hanteraren registrerar förändringen
6. Användaren får omedelbar tillgång till nya funktioner

### Webhooks hanteringsflöde

1. Stripe skickar en webhook-händelse till vår endpoint
2. StripeWebhookController validerar signaturen
3. Controller parserar händelsedata
4. StripeWebhookHandler behandlar händelsen
5. Databasen uppdateras
6. Domänhändelser utlöses för ytterligare hantering

### Schemalagda jobb flöde

1. Cron-jobb eller schemaläggare anropar Edge Function
2. SubscriptionSchedulerService körs för specifikt jobb
3. Tjänsten hämtar nödvändig data från databasen
4. Tjänsten utför begärd operation (t.ex. skicka påminnelser)
5. Databasen uppdateras med resultatet

## Migreringsplan

För att implementera den nya prenumerationsarkitekturen behöver följande migrationer genomföras:

1. **Migration av databastabeller**
   - Skapa nya tabeller för subscription_statistics
   - Utöka existerande tabeller med Stripe-specifika fält
   - Skapa RPC-funktioner för prenumerationsstatistik
   - Implementera row-level security

2. **Deployment av Edge Functions**
   - Distribuera stripe-webhook Edge Function för att hantera Stripe-händelser
   - Distribuera subscription-scheduler Edge Function för schemalagda jobb

3. **Konfigurationsinställningar**
   - Konfigurera Stripe-webhooks i Stripe Dashboard
   - Konfigurera miljövariabler för Edge Functions
   - Konfigurera schemalagda jobb med cron

4. **Validering och testplan**
   - Verifiera att webhooks tas emot korrekt
   - Kontrollera att databastabeller uppdateras
   - Testa schemalagda jobb
   - Testa felscenarier

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
