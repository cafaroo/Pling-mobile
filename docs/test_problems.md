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