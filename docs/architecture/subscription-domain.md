# Subscription Domain

## Översikt

Subscription-domänen hanterar alla aspekter relaterade till prenumerationer i applikationen, inklusive:

- Hantering av feature flags baserade på prenumerationsnivå
- Spårning av användning av prenumerationsbaserade funktioner
- Hantering av prenumerationsstatus (aktiv, pausad, avslutad)
- Stöd för freemium- och betalda funktioner

Domänen är uppbyggd enligt Domain-Driven Design (DDD) principer och följer samma strukturella mönster som övriga domäner i applikationen.

## Domänmodell

### Entiteter

1. **Subscription** - Huvudentitet som representerar en prenumeration
   - Tillhör en specifik organisation
   - Har en status (aktiv, pausad, avslutad, etc.)
   - Har startdatum och slutdatum
   - Innehåller prenumerationsnivå och inkluderade funktioner
   - Spårar användning av funktioner

### Värde-objekt

1. **SubscriptionTypes** - Definierar olika typer och status för prenumerationer
   - `SubscriptionStatus` (ACTIVE, PAUSED, CANCELLED, EXPIRED)
   - `SubscriptionTier` (FREE, BASIC, PREMIUM, ENTERPRISE)
   - `FeatureFlag` (UNLIMITED_TEAMS, ADVANCED_ANALYTICS, CUSTOM_BRANDING, etc.)
   - `SubscriptionUsage` (spårning av användning: messageCount, storageUsed, etc.)

2. **SubscriptionPeriod** - Tidperiod för prenumeration
   - Startdatum, slutdatum
   - Förnyelseintervall (månadsvis, årsvis)

## Repository

`SubscriptionRepository` hanterar dataåtkomst för prenumerationer och implementeras av `SupabaseSubscriptionRepository`:

```typescript
interface SubscriptionRepository {
  getById(id: UniqueId): Promise<Result<Subscription | null>>;
  getActiveByOrganizationId(orgId: UniqueId): Promise<Result<Subscription | null>>;
  getAllByOrganizationId(orgId: UniqueId): Promise<Result<Subscription[]>>;
  save(subscription: Subscription): Promise<Result<Subscription>>;
  delete(id: UniqueId): Promise<Result<boolean>>;
}
```

## Tjänster

1. **DefaultSubscriptionService** - Hanterar grundläggande prenumerationsfunktionalitet
   - Hämtar aktiva prenumerationer
   - Tillhandahåller högre ordningens funktioner för prenumerationshantering

2. **DefaultFeatureFlagService** - Kontrollerar tillgång till funktioner baserat på prenumerationsnivå
   - Kontrollerar om en specifik funktion är tillgänglig för en organisation
   - Tillhandahåller funktioner för standardvärdeskontroll

3. **UsageTrackingService** - Spårar användning av prenumerationsbaserade funktioner
   - Registrerar meddelandeanvändning, lagringsanvändning, etc.
   - Kontrollerar användningsgränser

## Application Layer

### Context Provider

`SubscriptionContextProvider` tillhandahåller alla nödvändiga beroenden för prenumerationsrelaterade funktioner:

```typescript
<SubscriptionContextProvider
  subscriptionRepository={subscriptionRepository}
  eventPublisher={eventPublisher}
>
  {children}
</SubscriptionContextProvider>
```

Den tillhandahåller följande beroenden:
- `subscriptionRepository`: Dataåtkomst för prenumerationer
- `subscriptionService`: Hantering av prenumerationer
- `featureFlagService`: Kontroll av funktioner
- `usageTrackingService`: Spårning av användning
- `eventPublisher`: Publicering av domänevents

### Standardiserade Hooks

`useSubscriptionStandardized` tillhandahåller standardiserade React Query-baserade hooks för att interagera med prenumerationsdomänen:

```typescript
const {
  useOrganizationSubscription,
  useAllOrganizationSubscriptions,
  useFeatureFlag,
  useTrackUsage,
  useUpdateSubscriptionStatus,
  useSubscriptionControls
} = useSubscriptionStandardized();
```

#### Data Hämtning

1. **useOrganizationSubscription** - Hämtar aktiv prenumeration för en organisation
   ```typescript
   const { data: subscription, isLoading, error } = useOrganizationSubscription(organizationId);
   ```

2. **useAllOrganizationSubscriptions** - Hämtar alla prenumerationer för en organisation
   ```typescript
   const { data: subscriptions, isLoading, error } = useAllOrganizationSubscriptions(organizationId);
   ```

#### Feature Kontroll

3. **useFeatureFlag** - Kontrollerar om en funktion är tillgänglig
   ```typescript
   const { data: isEnabled, isLoading } = useFeatureFlag({
     organizationId: 'org-123',
     featureFlag: FeatureFlag.UNLIMITED_TEAMS
   });

   if (isEnabled) {
     // Användaren har tillgång till obegränsade team
   }
   ```

#### Användningsspårning

4. **useTrackUsage** - Spårar användning av funktioner
   ```typescript
   const { mutate: trackUsage } = useTrackUsage();

   // När användaren skickar ett meddelande
   trackUsage({
     subscriptionId: 'sub-123',
     usage: { messageCount: 1 }
   });
   ```

#### Statusändringar

5. **useUpdateSubscriptionStatus** - Uppdaterar status för en prenumeration
   ```typescript
   const { mutate: updateStatus } = useUpdateSubscriptionStatus();

   // När användaren pausar sin prenumeration
   updateStatus({
     subscriptionId: 'sub-123',
     status: SubscriptionStatus.PAUSED
   });
   ```

#### Kombinerad Kontroll

6. **useSubscriptionControls** - Kombinerad hook för vanliga prenumerationskontroller
   ```typescript
   const {
     subscription,
     isLoading,
     error,
     hasFeature,
     trackFeatureUsage,
     isActive
   } = useSubscriptionControls(organizationId);

   // Kontrollera om funktionen är tillgänglig
   if (hasFeature(FeatureFlag.ADVANCED_ANALYTICS)) {
     // Visa avancerade analysfunktioner
   }

   // Spåra användning
   trackFeatureUsage({ messageCount: 1 });
   ```

## Integration med DomainProvidersComposer

Subscription-domänen integreras med övriga domäner genom `DomainProvidersComposer`:

```typescript
<DomainProvidersComposer supabaseClient={supabaseClient}>
  <App />
</DomainProvidersComposer>
```

Denna komponent initierar alla nödvändiga repositories och providers för alla domäner, inklusive subscription-domänen.

## Användning i UI

För att använda subscription-funktionalitet i en komponent:

```tsx
import React from 'react';
import { useSubscriptionStandardized } from '@/application/subscription/hooks/useSubscriptionStandardized';
import { FeatureFlag } from '@/domain/subscription/value-objects/SubscriptionTypes';

export function PremiumFeatureComponent({ organizationId }) {
  const { useFeatureFlag, useTrackUsage } = useSubscriptionStandardized();
  
  const { data: hasAdvancedFeature, isLoading } = useFeatureFlag({
    organizationId,
    featureFlag: FeatureFlag.ADVANCED_ANALYTICS
  });
  
  const { mutate: trackUsage } = useTrackUsage();
  
  const handleFeatureUse = () => {
    // Spåra användning när funktionen används
    trackUsage({
      subscriptionId: 'sub-123', // Hämtas normalt från subscription-objektet
      usage: { analyticsQueries: 1 }
    });
    
    // Implementera funktionen...
  };
  
  if (isLoading) return <LoadingSpinner />;
  
  if (!hasAdvancedFeature) {
    return <UpgradePrompt feature="Advanced Analytics" />;
  }
  
  return (
    <div>
      <h2>Advanced Analytics</h2>
      <button onClick={handleFeatureUse}>Run Analysis</button>
    </div>
  );
}
```

## Testning

Subscription-domänen inkluderar omfattande tester:

1. **Unit Tests** - Tester för entiteter, värde-objekt och tjänster
2. **Repository Tests** - Tester för repository-implementationen
3. **Hook Tests** - Tester för standardiserade hooks och context
4. **Integration Tests** - Tester för integration med andra domäner

## Slutsats

Subscription-domänen är en kritisk del av applikationen som hanterar prenumerationer, funktionsåtkomst och användningsspårning. Genom att följa DDD-principer och standardiserade mönster är domänen väl integrerad med resten av applikationen och erbjuder tydliga gränssnitt för användning i UI-lagret.

Domänen säkerställer att:
- Användare bara har tillgång till funktioner som ingår i deras prenumeration
- Användning spåras korrekt för gränser och fakturering
- Prenumerationsstatus hanteras korrekt genom hela applikationen
- UI-lagret enkelt kan kontrollera funktionsåtkomst och visa lämpliga uppgraderingsuppmaningar