# Testning av organisationsinbjudningssystem

## Översikt

Detta dokument beskriver testningen av inbjudningssystemet för organisationer i Pling-applikationen. Testningen omfattar olika delar av systemet, inklusive domänmodeller, infrastruktur och användargränssnitt.

## Innehållsförteckning

1. [Domäntester](#domäntester)
2. [Infrastrukturtester](#infrastrukturtester)
3. [UI-tester](#ui-tester)
4. [Köra testerna](#köra-testerna)
5. [Manuella tester](#manuella-tester)
6. [Testmiljö](#testmiljö)
7. [Lösningar för tidigare problem](#lösningar-för-tidigare-problem)

## Domäntester

### OrganizationInvitation

Tester för `OrganizationInvitation` värdesobjektet finns i filen `src/domain/organization/value-objects/__tests__/OrganizationInvitation.test.ts`. Dessa tester verifierar:

- Att inbjudningar kan skapas korrekt
- Validering av e-postadress
- Korrekt hantering av olika statusar (pending, accepted, declined, expired)
- Korrekt beteende vid accepterande/avböjande av inbjudningar
- Korrekt hantering av utgångna inbjudningar

### Organization-entitet med inbjudningsfunktionalitet

Tester för inbjudningsfunktionaliteten i `Organization`-entiteten finns i filen `src/domain/organization/entities/__tests__/Organization.test.ts`. Dessa tester verifierar:

- Att användare kan bjudas in till en organisation
- Att dubbla inbjudningar förhindras
- Att befintliga medlemmar inte kan bjudas in igen
- Korrekt hantering av accepterade inbjudningar
- Korrekt hantering av avböjda inbjudningar
- Korrekt hantering av utgångna inbjudningar

Dessa tester använder den förbättrade versionen av `DomainEventTestHelper` för att verifiera att korrekt domänhändelser utlöses.

### Domänhändelser

Tester för domänhändelser relaterade till inbjudningar finns i filen `src/domain/organization/events/__tests__/OrganizationEvents.test.ts`. Dessa tester verifierar:

- Korrekt skapande av `MemberInvitedToOrganization`-händelse
- Korrekt skapande av `OrganizationInvitationAccepted`-händelse
- Korrekt skapande av `OrganizationInvitationDeclined`-händelse

## Infrastrukturtester

Tester för `SupabaseOrganizationRepository` med fokus på inbjudningsfunktionalitet finns i filen `src/infrastructure/supabase/repositories/__tests__/SupabaseOrganizationRepository.test.ts`. Dessa tester verifierar:

- Att inbjudningar kan sparas korrekt i databasen
- Att inbjudningsstatus uppdateras korrekt vid accepterande
- Att inbjudningsstatus uppdateras korrekt vid avböjande
- Att inbjudningar kan hämtas via användar-ID

Dessa tester använder den förbättrade testhelper `setup.ts` för att konfigurerade en korrekt testmiljö med Supabase.

## UI-tester

Tester för UI-komponenter som hanterar inbjudningar finns i följande filer:

- `src/components/organization/__tests__/OrganizationInvitationList.test.tsx` - Testar listan över inbjudningar
- `src/components/organization/__tests__/InviteUserForm.test.tsx` - Testar formuläret för att bjuda in användare

Dessa UI-tester verifierar:

- Korrekt rendering av komponenter under olika förhållanden (laddning, tomma listor, med data)
- Korrekt hantering av användarinteraktioner (acceptera/avböja inbjudningar)
- Korrekt anrop av underliggande funktioner från OrganizationProvider
- Felhantering vid misslyckade operationer

UI-testerna har förbättrats med mer robusta mockar för `useOrganization`-hook.

## Köra testerna

För att köra testerna används Jest. Tester kan köras med följande kommandon:

### Körning av alla tester

```bash
npm test
```

### Körning av specifika tester

För att köra tester för en specifik fil:

```bash
npm test -- [sökväg-till-testfil]
```

Exempel:

```bash
npm test -- src/domain/organization/value-objects/__tests__/OrganizationInvitation.test.ts
```

För att köra alla tester relaterade till inbjudningssystemet:

```bash
npm test -- --testPathPattern=Organization
```

## Manuella tester

Förutom automatiserade tester bör följande manuella tester utföras:

1. **Bjuda in användare**
   - Skapa en organisation
   - Bjud in en användare via e-post
   - Verifiera att inbjudan visas i användarens lista

2. **Acceptera inbjudan**
   - Logga in som den inbjudna användaren
   - Visa listan över inbjudningar
   - Acceptera en inbjudan
   - Verifiera att användaren nu är medlem i organisationen

3. **Avböja inbjudan**
   - Logga in som den inbjudna användaren
   - Visa listan över inbjudningar
   - Avböj en inbjudan
   - Verifiera att inbjudan försvinner från listan

4. **Utgångna inbjudningar**
   - Skapa en inbjudan med ett nära utgångsdatum
   - Vänta tills inbjudan går ut
   - Verifiera att inbjudan markeras som utgången och inte kan accepteras

## Testmiljö

För detaljerad information om testmiljön, se [test_environment_setup.md](./test_environment_setup.md).

Testmiljön inkluderar:

- Lokal Supabase-instans för infrastrukturtester
- Konfiguration av miljövariabler
- Testhjälpare för domänhändelser och databasanslutningar

## Lösningar för tidigare problem

Vi har löst följande tidigare problem med testerna:

### DomainEventTestHelper

**Problem:** DomainEventTestHelper krävde en explicit mockad EventBus-instans, vilket gjorde det svårt att använda i entitetstester.

**Lösning:** DomainEventTestHelper har helt skrivits om för att använda en statisk lagring av händelser. Den patchar även DomainEvent för att automatiskt fånga utlösta händelser, vilket eliminerar behovet av en explicit EventBus-instans.

### Testmiljö för Supabase

**Problem:** Integrationstester mot Supabase krävde en korrekt konfigurerad testmiljö.

**Lösning:** Vi har skapat en robust setup.ts-fil som:
- Ansluter till en lokal Supabase-instans
- Använder miljövariabler för konfiguration
- Innehåller hjälpfunktioner för att rensa testdata
- Ger en isolerad testmiljö för varje testsvit

### UI-tester med mocks

**Problem:** UI-testerna använde inkonsistenta och svårunderhållna mockar för OrganizationProvider.

**Lösning:** Vi har förbättrat mockningen av useOrganization-hook med:
- En standarduppsättning av mockade värden
- En hjälpfunktion för att enkelt anpassa mockade värden för specifika testfall
- Tydligare tester för olika tillstånd, inklusive felhantering
- Bättre isolering mellan tester genom att återställa mockar i beforeEach 