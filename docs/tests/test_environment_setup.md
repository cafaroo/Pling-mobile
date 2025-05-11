# Konfiguration av testmiljö för organisationsinbjudningssystemet

## Översikt

Detta dokument beskriver hur man konfigurerar testmiljön för att köra testerna för organisationsinbjudningssystemet i Pling-applikationen. Korrekt konfiguration är nödvändig för att kunna köra alla tester, särskilt integrationstester mot Supabase.

## Innehållsförteckning

1. [Förutsättningar](#förutsättningar)
2. [Konfiguration av lokal Supabase-miljö](#konfiguration-av-lokal-supabase-miljö)
3. [Miljövariabler](#miljövariabler)
4. [Testdatabas](#testdatabas)
5. [Testverktyg och hjälpfunktioner](#testverktyg-och-hjälpfunktioner)
6. [Köra testerna](#köra-testerna)
7. [Felsökning](#felsökning)

## Förutsättningar

För att köra testerna behöver du följande:

- Node.js (v14 eller senare)
- npm/yarn
- Docker (för lokal Supabase-instans)
- Supabase CLI

## Konfiguration av lokal Supabase-miljö

För infrastrukturtester används en lokal Supabase-instans. Detta ger en isolerad testmiljö som inte påverkar produktionsdata.

### 1. Installera Supabase CLI

```bash
npm install -g supabase
```

### 2. Starta lokal Supabase

```bash
supabase start
```

Detta kommando startar en lokal Supabase-instans med Docker. Efter att kommandot har körts visas URL och API-nycklar som behövs för testmiljön.

### 3. Kör databasmigrationer

För att förbereda testdatabasen med rätt schema:

```bash
supabase db reset
```

## Miljövariabler

Skapa en `.env.test` fil i projektets rot med följande innehåll:

```
SUPABASE_TEST_URL=http://localhost:54321
SUPABASE_TEST_ANON_KEY=<anon-key-från-supabase-start>
SUPABASE_TEST_SERVICE_ROLE_KEY=<service-key-från-supabase-start>
```

Dessa miljövariabler används av testhelpers för att ansluta till den lokala Supabase-instansen.

## Testdatabas

Testmiljön använder en dedikerad databas i den lokala Supabase-instansen. För att separera testdata från annan data, använder testverktygen prefixet `test_` för allt testdata.

### Manuell rensning av testdata

Om du behöver rensa testdata manuellt:

```bash
supabase db execute 'DELETE FROM organizations WHERE id LIKE '\''test\_%'\'';'
supabase db execute 'DELETE FROM organization_invitations WHERE id LIKE '\''test\_%'\'';'
supabase db execute 'DELETE FROM organization_members WHERE id LIKE '\''test\_%'\'';'
```

## Testverktyg och hjälpfunktioner

### DomainEventTestHelper

`DomainEventTestHelper` har förbättrats för att fungera utan beroende av en explicit EventBus-instans. Detta förenklar testningen av domänhändelser i entity-tester.

Exempel på användning:

```typescript
import { DomainEventTestHelper } from '@/test-utils/DomainEventTestHelper';
import { MemberInvitedToOrganization } from '@/domain/organization/events/OrganizationEvents';

// Återställ händelselistan före testet
DomainEventTestHelper.clearEvents();

// Utför operation som genererar händelser
const result = organization.inviteUser(userId, 'test@exempel.se', ownerId);

// Verifiera att korrekt händelse har genererats
DomainEventTestHelper.expectEventDispatched(MemberInvitedToOrganization, {
  organizationId: organization.id,
  userId: userId
});
```

### Supabase testhelpers

För infrastrukturtester finns en förbättrad `setup.ts` som skapar en korrekt konfigurerad testmiljö:

```typescript
import { setup, teardown, clearTestData } from '@/infrastructure/supabase/repositories/__tests__/setup';

describe('SupabaseOrganizationRepository', () => {
  let supabase;
  let repository;
  
  beforeAll(async () => {
    const setupResult = await setup();
    supabase = setupResult.supabase;
    // ...
  });
  
  afterAll(async () => {
    await teardown();
  });
  
  afterEach(async () => {
    await clearTestData(supabase, 'organizations');
    await clearTestData(supabase, 'organization_invitations');
  });
  
  // Tester...
});
```

## Köra testerna

### Alla tester

```bash
npm test
```

### Endast domäntester

```bash
npm test -- src/domain
```

### Endast UI-tester

```bash
npm test -- src/components
```

### Endast infrastrukturtester

```bash
npm test -- src/infrastructure
```

## Felsökning

### Problem: Supabase-tester misslyckas med anslutningsfel

1. Kontrollera att den lokala Supabase-instansen körs:
   ```bash
   supabase status
   ```

2. Kontrollera att miljövariabler är korrekt konfigurerade i `.env.test`

3. Återställ Supabase-instansen:
   ```bash
   supabase stop
   supabase start
   ```

### Problem: Domänhändelser registreras inte korrekt i tester

1. Kontrollera att `DomainEventTestHelper.clearEvents()` anropas i `beforeEach`

2. Verifiera att entiteten faktiskt utlöser domänhändelser med `dispatch()`

3. Kontrollera att domäntesterna inte påverkas av parallell körning av tester 