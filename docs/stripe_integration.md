# Stripe Integration i Pling App

Detta dokument beskriver hur Stripe-integrationen är implementerad i Pling-mobilappen för hantering av prenumerationer.

## Arkitektur

Vi använder en kombination av frontend-klienter och en säker backend för att integrera med Stripe. Detta ger oss både säkerhet för känslig betalningsinformation och en bra användarupplevelse.

### Komponenter

1. **Frontend (React Native / Web)**
   - Presentationslager som hanterar UI för betalningsformulär
   - Använder Stripe SDK för insamling av kortinformation
   - Kommunicerar med vår egen backend via API

2. **Backend API (Node.js/Express)**
   - Hanterar känslig betalningsinformation
   - Integrerar med Stripe API
   - Lagrar prenumerationsinformation i Supabase

3. **Stripe Webhook Handler**
   - Tar emot händelser från Stripe (betalningar, förnyelser, etc.)
   - Uppdaterar databasen baserat på händelser
   - Hanterar automatiska förnyelser

4. **Supabase Databas**
   - Lagrar prenumerationsinformation
   - Spårar användning av resurser
   - Lagrar fakturahistorik

5. **Schemalagda jobb**
   - Hanterar återkommande uppgifter relaterade till prenumerationer
   - Synkroniserar prenumerationsstatus med Stripe
   - Skickar påminnelser och behandlar utgångna prenumerationer

## Domänmodell

### Entiteter

- **Subscription**: Representerar en prenumeration kopplad till en organisation
- **SubscriptionPlan**: Representerar tillgängliga prenumerationsplaner
- **PaymentMethod**: Representerar en betalningsmetod som ett kreditkort
- **Invoice**: Representerar en faktura för en prenumeration
- **SubscriptionHistory**: Spårar händelser relaterade till prenumerationer
- **SubscriptionStatistics**: Lagrar aggregerad prenumerationsstatistik

## Implementationsdetaljer

### Frontend

#### Komponenter

- **PaymentProcessor.tsx**: Hanterar insamling av betalningsinformation och skapar prenumerationer
- **BillingInfo.tsx**: Visar faktureringsinfo, hanterar betalningsmetoder och visar fakturahistorik
- **SubscriptionUpgradeFlow.tsx**: Guidar användaren genom processen att uppgradera prenumeration

#### Hooks

- **useStripeSubscription.ts**: Hook för att hantera Stripe-relaterade åtgärder
  - Skapa prenumerationer
  - Uppdatera betalningsmetoder
  - Avbryta/förnya prenumerationer
  - Hantera fakturahistorik

### Backend

#### Services

- **StripeIntegrationService**
  - Implementerar kommunikation med Stripe API
  - Abstraktion för betalningsrelaterade operationer

- **StripeWebhookHandler**
  - Hanterar alla webhook-händelser från Stripe
  - Validerar webhook-signaturer
  - Uppdaterar databaslagring
  - Publicerar domänhändelser vid statusförändringar

- **SubscriptionSchedulerService**
  - Hanterar schemalagda jobb relaterade till prenumerationer
  - Uppdaterar prenumerationsstatus baserat på tidsberoende villkor
  - Skickar påminnelser om förnyelse och misslyckade betalningar
  - Genererar prenumerationsstatistik

#### Controllers

- **StripeWebhookController**
  - Exponerar webhook endpoints för Stripe-anrop
  - Hanterar signaturvalidering och felhantering
  - Delegerar bearbetning till StripeWebhookHandler

#### Edge Functions

- **stripe-webhook**
  - Supabase Edge Function för att hantera webhook-händelser
  - Integrerar direkt med Supabase databas
  - Implementerar signaturvalidering och felhantering 

- **subscription-scheduler**
  - Supabase Edge Function för att köra schemalagda jobb
  - Kan anropas från extern schemaläggare (cron)
  - Implementerar olika jobb som sync, påminnelser och statistik

#### Databas

- **RPC Funktioner**
  - `get_subscription_stats_by_plan` - Statistik per plan
  - `calculate_monthly_recurring_revenue` - MRR beräkning
  - `get_upcoming_renewals` - Prenumerationer som snart förnyas
  - `get_upcoming_expirations` - Prenumerationer som snart upphör
  - `process_expired_subscriptions` - Markerar utgångna prenumerationer

- **Vyer**
  - `subscription_overview` - Sammanställer prenumerationsdata

### Betalningsflöde

1. Användaren väljer en prenumerationsplan
2. Användaren fyller i faktureringsuppgifter
3. Användaren anger kreditkortsinformation via Stripe Elements/CardField
4. Klientappen skickar en begäran till vår backend
5. Backenden skapar en prenumeration via Stripe API
6. Klienten får bekräftelse och uppdaterar UI
7. Webhook-hanteraren tar emot händelser från Stripe

### Webhooks

Följande Stripe-webhooks hanteras:

- `checkout.session.completed`: När en ny prenumeration skapas
- `invoice.payment_succeeded`: Prenumerationen har betalats
- `invoice.payment_failed`: Betalningen misslyckades
- `customer.subscription.updated`: Prenumerationen har uppdaterats
- `customer.subscription.deleted`: Prenumerationen har avslutats

### Schemalagda jobb

Följande schemalagda jobb implementeras:

- **syncSubscriptionStatuses** (timvis): Synkroniserar prenumerationsdata med Stripe
- **checkRenewalReminders** (dagligen): Skickar påminnelser om kommande förnyelser
- **processExpiredSubscriptions** (dagligen): Stänger av utgångna prenumerationer
- **sendPaymentFailureReminders** (dagligen): Skickar påminnelser om misslyckade betalningar
- **updateSubscriptionStatistics** (veckovis): Uppdaterar statistik för prenumerationer

## Säkerhet

- Känslig betalningsinformation (kortnummer, etc.) går aldrig via vår server
- Stripe SDK tokeniserar kortinformation
- API-nycklar lagras aldrig på klientsidan
- Webhook-signaturer valideras för att säkerställa att anrop kommer från Stripe
- RLS-policyer säkerställer att användare endast ser data relaterad till sin organisation
- Schemalagda jobb kräver hemlighet för att köras

## Förbättrad felhantering

För att säkerställa robusta edge functions har vi implementerat en omfattande felhanteringsarkitektur:

### Gemensamma moduler

1. **error-handler.ts**
   - Specialiserade felklasser för olika typer av fel (WebhookError, AuthenticationError, ValidationError, DatabaseError)
   - Standardiserade felkoder för enklare klientfelhantering
   - Strukturerad loggning med detaljerad kontextinformation
   - Automatiska återförsök med exponentiell backoff och jitter
   - Funktioner för felspårning och prestandamätning
   - Standardiserade HTTP-felresponsformat

2. **db-helper.ts**
   - Säker hantering av databasoperationer med omfattande felhantering
   - Centraliserad klienthantering med cachelagring
   - Funktioner för säker användning av servicerollen
   - Fördefinierade operationer för prenumerationshantering
   - Automatisk felkonvertering för tydliga felmeddelanden

3. **stripe-helper.ts**
   - Säker Stripe API-kommunikation med feluppfångning
   - Webhook-signaturvalidering
   - Automatiska återförsök för nätverksrelaterade fel
   - Funktioner för formatering av Stripe-data

### Implementationsstrategi

- **Trygga transaktioner**: Alla operationer körs i en kontrollerad miljö med strukturerad felhantering
- **Detaljerad loggning**: Alla fel loggas med kontext, tidsstämplar och strukturerad data för enklare felsökning
- **Intelligent återhämtning**: Tillfälliga fel hanteras med automatiska återförsök med gradvis ökande tidsfördröjning
- **Lämpliga statuskoder**: Alla HTTP-svar använder passande statuskoder baserat på feltyp
- **Transaktionsövervakning**: Operationer tidsmäts och övervakas för prestandaanalys och resursoptimering

Denna robusta felhantering ökar systemets totala tillförlitlighet, underlättar felsökning och förbättrar slutanvändarupplevelsen genom att hantera fel på ett mer elegant sätt.

## Testmiljö

Vi använder Stripe Testläge för utveckling och tester:

- Testkort: `4242 4242 4242 4242` (framgångsrik betalning)
- Testkort: `4000 0000 0000 0341` (misslyckad betalning)

## Hantering av misslyckade betalningar

1. När en betalning misslyckas, skickar Stripe en webhook-notifiering
2. Vår server markerar prenumerationen som `past_due`
3. Schemalagda jobb skickar påminnelser till organisationsadministratörer
4. Appen visar en notifiering till användaren
5. Användaren kan uppdatera sin betalningsinformation
6. Stripe försöker automatiskt igen enligt konfigurerad schema

## Automatisk förnyelse

Prenumerationer förnyas automatiskt vid slutet av faktureringsperioden. Användare kan:

1. Stänga av automatisk förnyelse (prenumeration avslutas då vid slutet av perioden)
2. Byta mellan olika prenumerationsplaner
3. Uppdatera betalningsmetoder

## Fakturor

- Fakturor genereras automatiskt av Stripe
- Fakturor är tillgängliga för nedladdning i PDF-format
- Fakturahistorik visas i appen
- Webhooks uppdaterar fakturastatusen i vår databas

## Aktivering av lösningen

För att aktivera Stripe-integrationen behöver följande steg utföras:

1. **Driftsätt databasmigrationer**:
   - Kör SQL-migrationerna i Supabase-projektet

2. **Distribuera Edge Functions**:
   - Distribuera `stripe-webhook` och `subscription-scheduler` Edge Functions

3. **Konfigurera miljövariabler**:
   ```
   STRIPE_SECRET_KEY=sk_xxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   SCHEDULER_SECRET=schsec_xxxxx
   ```

4. **Konfigurera Stripe Webhooks**:
   - Logga in på Stripe Dashboard
   - Gå till Developers > Webhooks
   - Skapa en webhook endpoint med URL: `https://<supabase-project-ref>.functions.supabase.co/stripe-webhook`
   - Välj händelser att lyssna på enligt ovan

5. **Konfigurera schemalagda jobb**:
   - Använd cron eller annan schemaläggare för att anropa API-endpoints enligt schema

## Framtida förbättringar

1. **Implementera SCA (Strong Customer Authentication)** för att följa europeiska PSD2-krav
2. **Erbjuda flera betalningsmetoder** som Swish, direktbetalning, etc.
3. **Implementera rabattkoder och kampanjer**
4. **Förbättra analys av intäkter** med detaljerade rapporter
5. **Implementera automatisk återaktivering** av prenumerationer efter uppdaterad betalningsinformation
6. **Bygga ut övervakning och larm** för kritiska prenumerationshändelser
7. **Vidareutveckla användargränssnitt för prenumerationsadministration** med fler funktioner

## Användbara resurser

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe React Native SDK](https://github.com/stripe/stripe-react-native)
- [Supabase Documentation](https://supabase.io/docs)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
