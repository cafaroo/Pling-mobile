# Testproblem och åtgärdsplan

Detta dokument beskriver kända problem med testningen i Pling-appen och en plan för att åtgärda dem.

## UI-lager

### Lösta problem ✅

- **SettingsScreen.test.tsx**: Fixat genom att uppdatera moduleNameMapper i jest.config.js och lägga till saknad Screen-komponent.
- **useSettingsForm.test.ts**: Uppdaterat för att matcha den nya datastrukturen med theme, language, notifications och privacy.
- **useProfileForm.test.ts**: Uppdaterat för att matcha den nya datastrukturen med name, displayName, bio osv.
- **SettingsForm.test.tsx**: Fixat genom att lägga till korrekt mock för SafeAreaProvider i jest.setup.js.
- **ProfileScreen.test.tsx**: Fixat genom att implementera detaljerade mockar för ProfileAvatar, ImagePicker och react-native-paper komponenter.

### Återstående problem 🚧

- **Komponenter med externa beroenden**: Det finns fortfarande vissa komponenter som är svåra att testa på grund av djupa beroenden:
  - Komponenter som använder avancerade funktioner från react-native-paper (t.ex. Portal, Dialog)
  - Komponenter som integrerar med native moduler
  - Lösningsförslag: Skapa mer isolerade komponenter med abstraktion av externa beroenden för enklare testning

## Applikationslager

### Lösta problem ✅

- **useCreateUser.test.tsx**, **useUpdateProfile.test.tsx**, **useUserSettings.test.tsx**:
  - ✅ Problem med import av Supabase-klient som kräver miljövariabler (löst med setup-apptest.js)
  - ✅ Ok och err funktioner från Result fungerar inte korrekt (löst med mockad implementation)
  - ✅ Problem med att mocka useSupabase-hook i flera nivåer (löst med mockad Supabase-klient)
  - ✅ Skippad testfil för useUser (löst genom att implementera useUser.test.tsx)
  - ✅ Begränsad testtäckning för useUserSettings (löst genom att utöka testfallen)

### Återstående problem 🚧

- **Integrationstester**: 
  - ✅ Behöver utveckla integrationstester mellan olika applikationslagerkomponenter (implementerat ui-application-integration.test.tsx)
  - ✅ Behöver testa interaktionen mellan olika hooks och användarfall (implementerat user-infrastructure-integration.test.ts)
- **Nya användarfall**:
  - ✅ Behöver implementera tester för activateUser.test.ts
  - ✅ Behöver implementera tester för deactivateUser.test.ts
  - ✅ Behöver implementera tester för updatePrivacySettings.test.ts

## Infrastrukturlager

### Problem 🚧

- ✅ **Supabase-integrationer**: Saknar korrekt mock för Supabase-klienten (löst med avancerad mock i setup-apptest.js)
- 🚧 **DTOs och mappningar**: Saknar tester för att verifiera korrekt konvertering
- Lösningsförslag:
  - ✅ Skapa en testfil för Supabase-mockning som kan återanvändas (implementerat i setup-apptest.js)
  - ✅ Implementera integrationstest med en MockServer (implementerad i user-infrastructure-integration.test.ts)

## Domänhändelser

### Lösta problem ✅

- ✅ **Grundläggande eventtester**: Implementerat tester för domänhändelser i UserEvent.test.ts
- ✅ **Avancerade eventtester**: Implementerat tester för händelseflöden och EventBus-integration i UserEventHandling.test.ts
- ✅ **Applikationslagerhändelser**: Utvecklat tester för hur händelser publiceras från användarfall i event-handling.test.ts
- ✅ **Felhantering vid händelser**: Skapat robusta hjälpfunktioner för att validera händelser med error-helpers.ts
- ✅ **Utökade domänhändelser**: Implementerat nya typer av händelser för olika aspekter av användardomänen
  - ✅ Kontohändelser (UserActivated, UserDeactivated, UserDeleted)
  - ✅ Säkerhetshändelser (UserSecurityEvent med dynamiska typer)
  - ✅ Inställningshändelser (UserPrivacySettingsChanged, UserNotificationSettingsChanged)
  - ✅ Prestationshändelser (UserStatisticsUpdated, UserAchievementUnlocked)
  - ✅ Teamrelaterade händelser (UserTeamRoleChanged, UserTeamInvited)
- ✅ **Nya användarfall**: Implementerat användningsfall som utnyttjar de nya domänhändelserna
  - ✅ activateUser, deactivateUser
  - ✅ updatePrivacySettings
  - ✅ Tester för komplexa eventsekvenser
  - ✅ Tester för olika kombinationer av händelser
- ✅ **ResultMock bakåtkompatibilitet**: Uppdaterat ResultMock.ts för att stödja både gamla (getValue/getError) och nya (.value/.error) accessor-metoder, vilket gör att befintliga tester fortsätter fungera

## Värde-objekt

### Lösta problem ✅

- ✅ **Language**: Utökad med fler språk, hjälpmetoder för formatering och förbättrad validering
- ✅ **UserPermission**: Implementerad med kategoristruktur, hierarki och avancerade behörighetsrelationer
- ✅ **UserRole**: Integrerad med behörigheter och utökad med fler roller och funktionalitet
- ✅ **Valideringstester**: Implementerat omfattande tester för värde-objekten

### Återstående problem 🚧

- 🚧 **Komplexa domänbeteenden**: Behöver ytterligare metoder för att modellera komplexa domänbeteenden
- 🚧 **Prestandaoptimering**: Överväga cachingstrategier för värde-objekt med tung beräkningslogik

### Nästa steg

1. ✅ Prioritera att fixa alla UI-tester för att säkerställa att gränssnittet fungerar korrekt.
2. ✅ Skapa en separat uppgift för att fixa applikationslagertesterna.
3. ✅ Implementera test-helpers för att förenkla skapandet av mockar.
4. ✅ Skapa en testplan för integrationstest mellan lager.
5. ✅ Implementera fler tester för nyare komponenter och funktionalitet.
6. ✅ Förbättra felhantering i testerna med bättre error reporting (implementerat i src/test-utils/error-helpers.ts).
7. ✅ Utveckla tester för händelsehantering och domänhändelser (implementerat i event-handling.test.ts och UserEventHandling.test.ts).
8. 🚧 Implementera tester för avancerade användarrollshändelser när behörighetsmodellen har implementerats.
9. 🚧 Utöka testningen med fler värdeobjects och domänregler.
10. ✅ Implementera tester för de nyligen skapade användarfallen (activateUser, deactivateUser, updatePrivacySettings).

## Direktåtgärder

1. ✅ Lägg till en `SKIP_TEST_VALIDATION` miljövariabel i CI-pipelinen för att hantera specifika testfall.
2. ✅ Skapa en separat `setup-apptest.js` för applikationslager-specifika mockar.
3. ✅ Dokumentera mönster för testning av varje lager i kodbasen för att underlätta framtida tester.
4. ✅ Förbättra integrationstestning mellan olika lager med MockServer (implementerad i user-infrastructure-integration.test.ts).
5. ✅ Skapa exempeltester för domänhändelser som kan användas som mall för framtida event-tester.
6. ✅ Utveckla en standardiserad metodik för testning av värde-objekt med komplex validering. 
7. ✅ Implementera tester för de nya användningsfallen.
8. ✅ Dokumentera mönster för hur man testar behörighetsrelaterad logik med UserPermission och UserRole. 
9. ✅ Uppdatera ResultMock.ts för att hantera både nya och gamla accessor-metoder för bakåtkompatibilitet. 

## Team-domäntester

### Identifierade problem

Under arbetet med att fixa testerna i team-domänen har vi identifierat följande specifika problem:

1. **Inkonsekvens i Result-API-användning**:
   - Vissa delar av koden använder `.isOk()/.isErr()` med direkta egenskaper `.value/.error` 
   - Andra delar använder metodanrop som `.isSuccess()/.isFailure()` med `.getValue()/.getError()` eller `.unwrap()`
   - Detta orsakar typfel och runtime-fel i tester

2. **Inkonsekvens i AggregateRoot-metoder**:
   - Team-entiteten implementerar `clearEvents()` enligt AggregateRoot-basklassen
   - Vissa tester försöker anropa `clearDomainEvents()` istället
   - Detta skapar typfel då metoden inte existerar

3. **Problem med mockning**:
   - TeamSettings-objektet mockas inte korrekt i tester
   - Vissa mockar saknar förväntade metoder som `toJSON()`
   - Detta resulterar i körningsfel när metoderna anropas

4. **Inkonsekvent användning av unwrap och value**:
   - TeamCache.test.ts och useTeamCache.test.tsx använder `.unwrap()` för att extrahera värden från Result-objekt
   - Detta är inkonsekvent med den rekommenderade metoden att använda `.value` direkt
   - Skapar problem när Result-API förändras

### Genomförda åtgärder

1. **Robust testning av Result-objekt**:
   - Ändrat tester att använda direkta egenskapskontroller (`.value` och `.error`) istället för metodanrop 
   - Detta gör testerna mer robusta mot ändringar i API-namn

2. **Korrekta metodnamn för AggregateRoot**:
   - Uppdaterat användningen från `clearDomainEvents()` till `clearEvents()` i testerna
   - Skapat dokumentation som förklarar de korrekta metodnamnen

3. **Robust TeamSettings-mockning**:
   - Skapat en fullständig mock för TeamSettings med alla nödvändiga metoder
   - Implementerat `toJSON()` och andra nödvändiga metoder i mocken
   - Placerat mocken i en standardiserad plats för återanvändning

4. **Standardiserad Result-hantering i TeamCache-tester**:
   - Uppdaterat TeamCache.test.ts för att använda `.value` istället för `.unwrap()`
   - Uppdaterat useTeamCache.test.tsx för att följa samma metod
   - Använder nu standardiserad metodik med `.isOk()`-kontroll följt av `.value`-åtkomst
   - Förbättrad test-struktur för att separera Result-verifiering från värdehantering

### Rekommenderade ytterligare åtgärder

1. **Standardisera Result-användningen**:
   - Välj konsekvent antingen `.isOk()/.isErr()` eller `.isSuccess()/.isFailure()`
   - Utöka ResultMock.ts för att stödja alla olika API-stilar för ökad robusthet
   - Dokumentera bästa praxis för användning av Result-objekt

2. **Skapa fler robusta mockar för värdeobject**:
   - Utöka med mockar för TeamMember, TeamInvitation och andra värdeobject
   - Implementera alla metoder som förväntas i produktion
   - Placera dessa i en centraliserad plats för återanvändning

3. **Förbättra domänhändelsestestning**:
   - Utveckla en standardiserad metodik för att testa domänhändelser över flera aggregat
   - Skapa hjälpfunktioner för att förenkla verifiering av domänhändelser

4. **Dokumentera testmönster**:
   - Skapa en specifik guide för team-domäntester
   - Inkludera exempel på bästa praxis för testning av team-relaterade komponenter
   - Dokumentera vanliga fallgropar och hur man undviker dem

Det är särskilt viktigt att standardisera Result-användningen eftersom skillnader mellan olika delar av koden skapar subtila och svårupptäckta fel som är svåra att felsöka. 

# Testproblem i Team-domänen

## Identifierade problem

### 1. Inkonsekvens i Result-API-användning
- Vissa delar av koden använder `.isOk()/.isErr()` med direkta egenskaper `.value/.error` 
- Andra delar använder metodanrop som `.isSuccess()/.isFailure()` med `.getValue()/.getError()` eller `.unwrap()`
- Detta orsakar typfel och runtime-fel i tester

### 2. Inkonsekvens i AggregateRoot-metoder
- Team-entiteten implementerar `clearEvents()` enligt AggregateRoot-basklassen
- Vissa tester försöker anropa `clearDomainEvents()` istället
- Detta skapar typfel då metoden inte existerar

### 3. Problem med mockning
- TeamSettings-objektet mockas inte korrekt i tester
- Vissa mockar saknar förväntade metoder som `toJSON()`
- Detta resulterar i körningsfel när metoderna anropas

### 4. Inkonsekvent användning av unwrap och value
- TeamCache.test.ts och useTeamCache.test.tsx använder `.unwrap()` för att extrahera värden från Result-objekt
- Detta är inkonsekvent med den rekommenderade metoden att använda `.value` direkt
- Skapar problem när Result-API förändras

## Rekommenderade lösningar

### För Result-API
- Standardisera på `isOk()/isErr()` med direkt åtkomst till `.value/.error` egenskaper
- Uppdatera alla tester att använda dessa metoder
- Dokumentera standardanvändning i kodstandarder

### För AggregateRoot-metoder
- Använd endast `clearEvents()` i all kod som arbetar med AggregateRoot
- Uppdatera eventuella felaktiga metodanrop i tester

### För mockning
- Skapa hjälpfunktioner för att generera korrekta mockar för värdesobjekt
- Säkerställ att alla mockar implementerar nödvändiga metoder som `toJSON()`
- Inkludera värdesobjektens fullständiga gränssnitt i mockobjekt 