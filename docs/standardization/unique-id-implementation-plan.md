# Plan för standardisering av UniqueId

## Bakgrund och problem

Vi har identifierat att kodbasen använder tre olika implementationer av `UniqueId` som orsakar typkonfliktproblem i TypeScript:

1. `src/shared/core/UniqueId.ts` - Huvudimplementation
2. `src/shared/domain/UniqueId.ts` - Brygga till huvudimplementation
3. `src/domain/core/UniqueId.ts` - Brygga som använder Result-API

Även om dessa klasser implementerar samma funktionalitet betraktar TypeScript dem som olika typer, vilket orsakar kompatibilitetsproblem i integrationstester och när koden från olika moduler interagerar.

## Standardiseringsstrategi

Vi kommer att standardisera alla UniqueId-användningar till en enda implementation i `shared/core/UniqueId.ts` genom följande steg:

### Fas 1: Förberedelser (Omedelbart)

1. **Förbättra huvudimplementationen**:
   - Utöka dokumentationen för `shared/core/UniqueId.ts`
   - Lägga till flera hjälpmetoder som `isUniqueId()`, `fromString()` etc.
   - Säkerställa robust typhantering med typguarder

2. **Uppdatera bryggimplementationer**:
   - Säkerställa att `shared/domain/UniqueId.ts` använder `extends CoreUniqueId`
   - Uppdatera `domain/core/UniqueId.ts` för att delegera till huvudimplementationen
   - Lägga till tydliga @deprecated-markeringar och konsolvarningar

3. **Dokumentera**:
   - Skapa detaljerad dokumentation om standardiseringen (redan påbörjad i `docs/standardization/unique-id-standardization.md`)
   - Skapa hjälpverktyg för att identifiera platser där förlegade implementationer används

### Fas 2: Tester och verifiering (Vecka 1-2)

1. **Identifiera problemområden**:
   - Köra tester för att identifiera specifika integrationsproblem
   - Skapa testfall som verifierar korrekt typkompatibilitet mellan domäner
   - Fokusera på team-organization och user-team-interaktioner

2. **Uppdatera mockimplementationer**:
   - Säkerställa att alla test-mocks använder standardiserad UniqueId
   - Uppdatera mockEntityFactory för konsistent användning
   - Lägga till typkonverteringar i kritiska testscenarier

3. **Verifiera bryggimplementationer**:
   - Testa att bakåtkompatibilitet fungerar korrekt
   - Säkerställa att alla existerande tester fortfarande passerar

### Fas 3: Stegvis migration (Vecka 3-6)

1. **Prioritera i följande ordning**:
   - Börja med domän-entiteter (Team, User, Organization)
   - Fortsätt med värde-objekt (TeamMember, TeamRole, etc.)
   - Uppdatera repositories och services
   - Slutför med application-lagret (hooks, controllers)

2. **Domän för domän**:
   - Migrera Team-domänen först
   - Fortsätt med User-domänen
   - Slutför med Organization-domänen
   - Uppdatera övriga domäner

3. **Tester kontinuerligt**:
   - Kör tester efter varje domän-migrering
   - Fokusera särskilt på integrationstester mellan domäner

### Fas 4: Borttagning av bryggimplementationer (Vecka 7-8)

1. **Stegvis borttagning**:
   - Ta bort @deprecated-markeringar när migration är klar
   - Ersätta importer en fil i taget
   - Verifiera och fixa eventuella kvarvarande problem
   - Slutligen ta bort bryggimplementationer helt

2. **Slutlig verifiering**:
   - Köra alla tester för att säkerställa korrekt funktionalitet
   - Verifiera att inga typkonfliktproblem kvarstår

## Specifika implementationsuppgifter

### Vecka 1

- [ ] Identifiera och lägga till saknade hjälpmetoder i huvudimplementationen
- [ ] Uppdatera typguards och robusthet i bryggimplementationer
- [ ] Skapa skriptet för att hitta alla användningar av förlegade implementationer
- [ ] Uppdatera dokumentationen med migreringsexempel

### Vecka 2-3

- [ ] Uppdatera Team-entiteten och TeamMember
- [ ] Uppdatera Team-testfiler
- [ ] Säkerställa att Team-domänen använder standardiserad UniqueId
- [ ] Verifiera med teamspecifika tester

### Vecka 4-5

- [ ] Uppdatera User- och Organization-domänerna
- [ ] Säkerställa konsekvent användning i repositories
- [ ] Fixa eventpublicering för standardiserade ID-typer
- [ ] Köra alla integrationstest och fixa fel

### Vecka 6-7

- [ ] Uppdatera alla återstående användningar
- [ ] Verifiera med fullständig testkörning
- [ ] Förbered för borttagning av bryggimplementationer

### Vecka 8+

- [ ] Ta bort bryggimplementationer när alla migreringar är klara
- [ ] Slutlig testhelhetsanalys
- [ ] Utvärdera framgång och dokumentera lärdomar

## Teststrategier

1. **Identifiera problemtester först**:
   - Kör `organization-team-integration.test.tsx` och liknande
   - Hitta specifika typfel relaterade till UniqueId

2. **Stegvis testmigration**:
   - Migrera en testfil i taget
   - Prioritera integrationstester mellan domäner

3. **Specifika testmönster att implementera**:
   - Testa kompatibilitet mellan entiteter från olika domäner
   - Verifiera att värdeöverföringar fungerar korrekt över domängränser

## Risker och utmaningar

1. **Bakåtkompatibilitet**:
   - Kodbasen använder flera olika mönster för ID-hantering
   - Vissa delar förväntar sig Result-API medan andra använder direkta objekt

2. **Odokumenterade beroenden**:
   - Det kan finnas implicita beroenden till specifika UniqueId-beteenden
   - Thorough testing is essential

3. **Kaskadeffekter**:
   - Ändringar i UniqueId kan påverka många delar av systemet
   - Kräver noggrann testning för att hitta oväntade fel

## Slutmål

Efter denna standardisering kommer vi ha:

1. **En enda UniqueId-implementation**:
   - Konsekvent beteende och API för hela systemet
   - Inga typkonfliktproblem mellan olika delar av koden

2. **Förbättrad testbarhet**:
   - Enklare testuppsättning för entitetsintegrationer
   - Mer robusta integrationstester

3. **Förenklade domän-interaktioner**:
   - Sömlös integration mellan Team, User och Organization
   - Bättre möjligheter att bygga komplexa cross-domain-funktioner

## Uppföljning

Efter slutförd migration bör vi:

1. Dokumentera processen och lärdomar
2. Skapa riktlinjer för framtida implementationer
3. Övervaka eventuella kvarvarande problem 

## Framsteg och status

### Slutförda delar

1. **Fas 1: Förberedelser**
   - ✅ Förbättrade huvudimplementationen i `shared/core/UniqueId.ts`
   - ✅ Lagt till hjälpmetoder som `isUniqueId()`, `fromString()`, `from()`
   - ✅ Uppdaterade bryggimplementationerna med tydlig delegering till huvudimplementation
   - ✅ Implementerade robust typhantering med typguarder

2. **Fas 2: Specifika domäner**
   - ✅ Team-domänen
     - Uppdaterade alla Team-entiteter att använda standardiserad UniqueId
     - Standardiserade alla team-events med parameterobjekt-konstruktorer
     - Förbättrade mock-implementations för teststöd
     - Fixade Team.test.ts och Team.invariants.test.ts
     
   - ✅ Organization-domänen
     - Uppdaterade Organization-entiteten
     - Standardiserade alla organization-events med parameterobjekt-konstruktorer
     - Förbättrade integrationstester med Team-domänen
   
   - ✅ User-domänen
     - Uppdaterade User-entiteten att använda standardiserad UniqueId
     - Standardiserade alla user-events (11 klasser) med parameterobjekt-konstruktorer
     - Förbättrade konsekvent eventdata-hantering i entiteten
     - Implementerade robust konvertering mellan string/object

### Pågående arbete

1. **Subscription-domänen** (Nästa i fokus)
   - Standardisera Subscription-events
   - Uppdatera Subscription-entiteten
   - Fixa integrationstester med User- och Organization-domänerna

2. **Integrationstest**
   - Standardisera integrationstestning mellan domäner

### Kvarvarande arbete

1. **Fas 4: Borttagning av bryggimplementationer**
   - Ta bort @deprecated-markeringar när migration är klar
   - Ersätta importer en fil i taget
   - Ta bort bryggimplementationer helt när allt annat är klart

### Följande har återstår att göra:

1. Standardisera Subscription-domänen med samma mönster
2. Slutföra integrationstestning över domängränser
3. Uppdatera mockimplementationer för att helt stödja de standardiserade eventklasserna
4. Gradvis ta bort bryggimplementationer

## Framgångsmått

- ✅ Team-domänen: 82/82 tester passerar
- ✅ User-domänen: 48/48 tester passerar
- ⚠️ Organization-domänen: 68/75 tester passerar 
- ⏳ Subscription-domänen: Standardisering ännu ej slutförd
- ⏳ Cross-domain integrationstester: Pågående arbete 