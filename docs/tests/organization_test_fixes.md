# Lösningar för testproblem i organisationsinbjudningssystemet

## Översikt

Detta dokument beskriver de problem som identifierats med testerna för organisationsinbjudningssystemet och de lösningar som implementerats för att åtgärda dem.

## Problem och lösningar

### 1. DomainEventTestHelper behövde anpassas för entitetstester

**Problem:** DomainEventTestHelper krävde en explicit mockad EventBus-instans, vilket gjorde det svårt att använda i entitetstester.

**Lösning:**
- Implementerat en statisk `StaticEventStore` för att lagra händelser under tester
- Patchat `DomainEvent.dispatch()` för att automatiskt fånga alla utlösta händelser
- Uppdaterat API:t med nya metoder: `expectEventDispatched`, `expectEventNotDispatched` och `expectEventCount`

```typescript
// Exempel på användning i test
DomainEventTestHelper.clearEvents();
const result = organization.inviteUser(userId, 'test@exempel.se', ownerId);
DomainEventTestHelper.expectEventDispatched(MemberInvitedToOrganization, {
  organizationId: organization.id,
  userId: userId
});
```

### 2. Testmiljön för Supabase behövde konfigureras korrekt

**Problem:** Integrationstester mot Supabase krävde en korrekt konfigurerad testmiljö.

**Lösning:**
- Skapad en robust `setup.ts` för Supabase-tester
- Lagt till stöd för miljövariabler via process.env
- Implementerat hjälpfunktioner för att rensa testdata mellan tester
- Skapat en guide för konfiguration av testmiljön i `test_environment_setup.md`

### 3. UI-tester hade inkonsistenta mockar

**Problem:** UI-testerna använde inkonsistenta och svårunderhållna mockar för OrganizationProvider.

**Lösning:**
- Skapat en standardmock för useOrganization-hook 
- Lagt till hjälpfunktion för att enkelt anpassa mock-värden
- Förbättrat testisolering genom att återställa mockar i beforeEach
- Utökat UI-testerna med felhanteringsscenarier

### 4. Inkompatibla ändringar i OrganizationPermission

**Problem:** OrganizationPermission-enum uppdaterades utan att anpassa alla beroende komponenter.

**Lösning:**
- Uppdaterat `OrganizationPermissionLabels` för att matcha de nya enum-värdena
- Omarbetat `hasOrganizationPermission` för att använda den nya behörighetsmodellen
- Säkerställt att alla tester använder uppdaterade behörighetstyper

### 5. DomainEvent.dispatch saknade koppling till EventBus i produktion

**Problem:** Vi lade till `dispatch()`-anrop i domänhändelser men kopplade inte detta till EventBus i produktionskod.

**Lösning:**
- Implementerat en koppling mellan DomainEvent.dispatch och EventBus för produktion
- Separerat beteendet för test- och produktionsmiljöer
- Uppdaterat relevanta händelser för att konsekvent använda dispatch-metoden

## Implementationsdetaljer

### Uppdaterad behörighetsmodell

Vi har uppdaterat behörighetsmodellen för att separera grundläggande behörigheter tydligare:

```typescript
export enum OrganizationPermission {
  // Läsbehörigheter
  VIEW_ORGANIZATION = 'view_organization',
  VIEW_MEMBERS = 'view_members',
  VIEW_TEAMS = 'view_teams',
  VIEW_INVITATIONS = 'view_invitations',

  // Administrativa behörigheter
  INVITE_MEMBERS = 'invite_members',
  REMOVE_MEMBERS = 'remove_members',
  UPDATE_MEMBER_ROLES = 'update_member_roles',
  
  // Teambehörigheter
  CREATE_TEAMS = 'create_teams',
  UPDATE_TEAMS = 'update_teams',
  DELETE_TEAMS = 'delete_teams',
  
  // Organisationsbehörigheter
  UPDATE_ORGANIZATION = 'update_organization',
  DELETE_ORGANIZATION = 'delete_organization',
}
```

### Koppling mellan domänhändelser och EventBus

Vi har implementerat en produktionskoppling mellan domänhändelser och EventBus:

```typescript
// I EventBusProvider
export function setupDomainEventDispatcher(eventBus: EventBus) {
  const originalDispatch = DomainEvent.prototype.dispatch;
  DomainEvent.prototype.dispatch = function() {
    const result = originalDispatch.call(this);
    eventBus.publish(this);
    return result;
  };
}
```

## Återstående arbete

1. Fortsätt att förbättra testmiljön för infrastrukturtester
2. Implementera tester för saknande komponenter
3. Integrera testmiljön med CI/CD-pipeline

## Slutsats

Genom dessa ändringar har vi skapat en robust testmiljö för organisationsinbjudningssystemet. Domäntesterna körs nu utan problem, och vi har en god grund för fortsatt testning av systemet.

För mer detaljerad information om testmiljön, se [test_environment_setup.md](./test_environment_setup.md) och [organization_tests.md](./organization_tests.md). 