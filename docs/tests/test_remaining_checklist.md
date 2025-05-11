# Checklista för kvarvarande testfixar

Denna checklista innehåller tester som fortfarande behöver åtgärdas för att standardisera Result-API-användningen i hela kodbasen.

## Senaste genomförda förbättringar (2024-06-XX)

Vi har implementerat följande förbättringar:

1. **Korrekt Result-implementation**:
   - ✅ Tagit bort duplicerad Result-implementation i domain/core/Result.ts
   - ✅ Standardiserat importer till @/shared/core/Result överallt i kodbasen
   - ✅ Uppdaterat UniqueId.ts för att använda den korrekta Result-implementationen

2. **Repository-förbättringar**:
   - ✅ Standardiserat SupabaseTeamRepository att använda Result-objekt konsekvent
   - ✅ Förbättrat typning i OptimizedTeamActivityRepository för att använda rätt Result-typer
   - ✅ Uppdaterat TeamActivity för att använda korrekta imports och Result-metoder
   - ✅ Säkerställt att repository-interfaces har konsekventa mönster för Result-användning

3. **TeamStatistics förbättringar**:
   - ✅ Implementerat korrekt getCompletionRate-metod som beräknar andelen slutförda mål
   - ✅ Implementerat korrekt getTotalGoals-metod som summerar alla mål från goalsByStatus

## Åtgärdade tester

Följande tester har standardiserats med det nya Result-API:et:

- [x] src/infrastructure/supabase/repositories/__tests__/SupabaseTeamRepository.test.ts
- [x] src/domain/team/entities/__tests__/Team.test.ts (löst problem med domänevents och fixat tester för medlemsgränser)
- [x] src/domain/user/rules/__tests__/statsCalculator.test.ts (fixat problem med achievement-objekt)
- [x] src/application/user/useCases/__tests__/updatePrivacySettings.test.ts (fixat UserPrivacySettingsChanged-struktur)
- [x] src/shared/core/__tests__/DomainEventTestHelper.ts (fixat DomainEvent-structure så testerna kan köras)
- [x] src/shared/core/DomainEvent.ts (uppdaterad för att matcha verklig användning)
- [x] src/domain/team/entities/__tests__/Team.test.ts (verifierat att den redan använder korrekt Result-API)
- [x] src/components/team/__tests__/TeamStatisticsCard.test.tsx (verifierat att den redan använder korrekt Result-API)
- [x] src/application/team/hooks/__tests__/useTeamCache.test.tsx (verifierat att den redan använder korrekt Result-API)
- [x] src/application/team/hooks/__tests__/useTeamStatistics.test.tsx (verifierat att den redan använder korrekt Result-API)
- [x] src/domain/team/entities/__tests__/TeamActivity.test.ts (verifierat att den redan använder korrekt Result-API)
- [x] src/domain/__tests__/user-team-integration.test.ts (verifierat att den redan använder korrekt Result-API)
- [x] src/infrastructure/supabase/repositories/__tests__/SupabaseTeamStatisticsRepository.test.ts (verifierat att den redan använder korrekt Result-API)
- [x] src/application/user/hooks/__tests__/useUpdateProfile.test.tsx (verifierat att den redan använder korrekt Result-API)
- [x] mock-TeamStatistics.test.ts (fixat från isSuccess/isFailure till isOk/isErr och värde.value/värde.error)
- [x] src/domain/team/value-objects/TeamStatistics.ts (implementerat korrekt getCompletionRate och getTotalGoals)
- [x] src/application/user/useCases/__tests__/activateUser.test.ts (fixat Result-API och förbättrat typning)
- [x] src/ui/user/components/__tests__/UserFeedback.test.tsx (fixat problem med setImmediate)

## Tester att åtgärda

Följande tester behöver fortfarande standardiseras:

- [ ] src/infrastructure/supabase/repositories/__tests__/SupabaseTeamGoalRepository.test.ts
- [ ] src/infrastructure/supabase/repositories/__tests__/SupabaseTeamMemberRepository.test.ts 
- [ ] src/application/user/hooks/__tests__/useUpdateUserSettings.test.tsx
- [ ] src/application/user/hooks/__tests__/useUserSettings.test.tsx (markerad som skipped)
- [ ] src/application/team/hooks/__tests__/useCreateTeam.test.tsx
- [ ] src/application/team/hooks/__tests__/useTeamMembers.test.tsx
- [ ] src/components/user/__tests__/UserPreferencesForm.test.tsx

## Lärdomar från testfixar

Under arbetet med att standardisera Result-API-användningen har vi identifierat följande lärdomar:

1. **Konsekvent metodik för testning av Result-objekt**:
   - Alltid kontrollera `result.isOk()` eller `result.isErr()` innan åtkomst av värden
   - Använd alltid explicit åtkomst via direkt egenskapsåtkomst med `.value`/`.error`
   - Undvik `unwrap()`/`unwrapOr()` eftersom de kastar exception eller använder implicit fallback

2. **Explicit felhantering är viktig**:
   - Använd alltid `if (result.isOk()) { ... }` före åtkomst till result.value
   - Använd alltid `if (result.isErr()) { ... }` före åtkomst till result.error
   - Ersätt `unwrapOr(defaultValue)` med `result.isOk() ? result.value : defaultValue`

3. **Konsekvens i skapande av mockade objekt**:
   - Skapa mockade Result med `ok(värde)` och `err(fel)` istället för anpassade constructors
   - För typade mockar, använd jest.fn<ReturnType, Parameters>() för bättre typning

## Nästa steg

1. **Standardisera kvarvarande tester**:
   - Undersök vilka av de resterande testerna som faktiskt finns i kodbasen
   - Prioritera viktiga tester som används aktivt

2. **Skapa testguide för team-domänen**:
   - Skapa en standardiserad guide för att testa team-relaterade funktioner
   - Inkludera best practices för att hantera Result-objekt i tester

3. **Uppdatera utvecklingsdokumentation**:
   - Uppdatera dokumentation för utvecklare om hur Result-API ska användas
   - Skapa exempel på rätt användning i olika användningsfall och testscenarier

# Kvarvarande tester att åtgärda

## Infrastrukturlager
- [x] SupabaseTeamRepository.test.ts - Problem med Result-API (getValue/getError vs value/error)
- [x] SupabaseTeamStatisticsRepository.test.ts - Problem med Result-API och mocking
- [ ] UserRepositoryIntegration.test.ts - Problem med Result-API och felaktigt mockade repositories (Behöver omfattande refaktorering - mockarna och de typer som används matchar inte aktuell implementation)
- [x] SupabaseUserRepository.test.ts - Fixat problem med toDomain-metoden

## Tester att implementera
- [ ] SupabaseTeamGoalRepository.test.ts - Saknas helt, behöver implementeras
- [ ] Medlemsrelaterade metoder i SupabaseTeamRepository.test.ts - Team.getMembers(), addMember(), removeMember(), updateMember() och isMember() saknar detaljerade tester
- [ ] useTeam/useCreateTeam.test.tsx - Testa useCreateTeam-metoden som finns i useTeam-hooken
- [ ] useTeamMember.test.tsx - Implementera test för useTeamMember-hooken
- [ ] useUserSettings/useUpdateUserSettings.test.tsx - Implementera test för användar-hooks i samband med inställningar

## Applikationslager
- [x] updateSettings.test.ts - Problem med Result-API och struktur på funktionen
- [x] activateUser.test.ts - Problem med Result-API och UserActivated-händelsen
- [ ] useUserSettings.test.tsx - Markerad som skipped på grund av komplex React Query-integration
- [ ] useUpdateProfile.test.tsx - Problem med toast och React Query-states

## Domän-lager
- [x] TeamStatistics.test.ts - Implementerat saknade metoder getCompletionRate och getTotalGoals. Uppdaterat aktivitetstrend-tester.

## UI-lager
- [ ] UserPreferencesForm.test.tsx - Problem med komponentrendering
- [ ] UserFeedback.test.tsx - Problem med React Native Animated och setImmediate
- [ ] ProfileScreen.test.tsx - Problem med testIDs och komponentstruktur

## Team-komponent-tester
- [ ] TeamForm.test.tsx/jsx - Problem med importsökvägar
- [ ] TeamScreen.test.tsx/jsx - Problem med importsökvägar
- [ ] TeamList.test.tsx - Problem med importsökvägar
- [ ] TeamMemberList.test.tsx - Problem med importsökvägar
- [ ] TeamSettings.test.jsx - Problem med importsökvägar
- [ ] TeamInviteSection.test.tsx - Problem med importsökvägar
- [ ] hooks/useTeam.test.tsx - Problem med importsökvägar
- [ ] services/teamService.test.jsx - Problem med miljövariabler

## Åtgärdade tester
- [x] Team.test.ts - Fixat problem med .getValue() vs .value och medlemsgränser
- [x] statsCalculator.test.ts - Fixat problem med achievement-objekt i UserAchievementUnlocked
- [x] updatePrivacySettings.test.ts - Åtgärdat UserPrivacySettingsChanged-struktur

## Standardisering av Result-API
Följande inconsistenser har identifierats i Result-API-användningen:

1. **Metoder för kontroll av result-status**:
   - `.isOk()`/`.isErr()` eller `.isSuccess()`/`.isFailure()`

2. **Åtkomst till result-värden**:
   - Direkta egenskaper `.value`/`.error` eller 
   - Metodanrop `.getValue()`/`.getError()` eller 
   - Omslagsmetoder `.unwrap()`/`.unwrapOr()`

Vald standard:
- `.isOk()`/`.isErr()` för att kontrollera status
- `.value`/`.error` för att komma åt värden
- Explicit felhantering istället för `.unwrap()`/`.unwrapOr()`

## Lärdomar från testfixar
1. **Konsistens i mock-objekt**: Det är viktigt att mockar följer samma API som de verkliga objekten.
2. **Hantering av references**: Vid testning med objekt är det viktigt att skapa kopior av objekten för att undvika referensproblem.
3. **Djup vs grund kopiering**: För objekt med nästlade strukturer måste djupa kopior användas.
4. **Factory-metoder kan ändras**: createTestUser() ändrades från att returnera Result<User> till att returnera User direkt.
5. **Gradvisa ändringar**: Att fixa ett test i taget och verifiera att det fungerar innan man fortsätter är mer effektivt än att försöka fixa allt på en gång.

## Prioritet för åtgärder
1. UserFeedback.test.tsx - Fixa problem med React Native Animated
2. hooks/useTeam.test.tsx - Implementera test för useCreateTeam och andra metoder från useTeam-hooken
3. Implementera testning av nya/saknade komponenter och hooks 

## Kvarvarande uppgifter

1. **UserRepository-standardisering**:
   - ⬜ Standardisera UserRepository-interfacet för att returnera Result konsekvent
   - ⬜ Uppdatera SupabaseUserRepository-implementationen
   - ⬜ Fixa UserRepositoryIntegration.test.ts att använda rätt Result-metoder

2. **User Events-problemlösning**:
   - ⬜ Åtgärda "Cannot read properties of undefined (reading 'userId')" i event-handling.test.ts
   - ⬜ Fixa deactivateUser.test.ts att använda rätt event-struktur
   - ⬜ Se till att alla events har konsistent datastruktur

3. **UI-lager förbättringar**:
   - ⬜ Åtgärda toast.show-problemet i useUpdateProfile.ts
   - ⬜ Fixa avsaknade mock-komponenter i TeamTests
   - ⬜ Uppdatera UserFeedback.test.tsx för att hantera animationer korrekt

## Tester som behöver fixas

### Prio 1 (Kritiska fel)
- ⬜ src/application/user/useCases/__tests__/event-handling.test.ts (userId undefined)
- ⬜ src/application/user/useCases/__tests__/deactivateUser.test.ts (event.name undefined)
- ⬜ src/infrastructure/supabase/repositories/__tests__/UserRepositoryIntegration.test.ts (Result-API)
- ⬜ src/application/user/hooks/__tests__/useUpdateProfile.test.tsx (toast.show undefined)

### Prio 2 (Viktiga för utveckling)
- ⬜ src/ui/user/components/__tests__/UserFeedback.test.tsx (animation timer issues)
- ⬜ src/application/team/useCases/__tests__/createTeam.test.ts (typkonverteringsfel)

### Prio 3 (Kan fixas senare)
- ⬜ src/ui/user/screens/__tests__/ProfileScreen.test.tsx (saknad testID)
- ⬜ src/ui/user/integration-tests/ui-application-integration.test.tsx (modulimportfel)

## Rekommenderad ordning för åtgärder

1. Åtgärda repository-lager först för att säkerställa att Result används konsekvent
2. Fixa event-hanteringen i applikations-lagret 
3. Åtgärda UI-lager med mock-problem
4. Uppdatera resterande tester i icke-kritiska moduler

## Tips för implementering

1. **Result-API konsekvent användning**:
   - Använd alltid `isOk()` och `isErr()` för statuskontroll
   - Använd `.value` och `.error` för att hämta värden (efter statuskontroll)
   - Undvik att använda `.unwrap()` eller `.unwrapOr()` som kan dölja fel

2. **MockResult i tester**:
   - Använd `jest.fn<ReturnType, Parameters>()` för att mocka funktioner med korrekt typning
   - Använd `ok(mockData)` och `err(mockError)` för att skapa testdata
   - Kontrollera alltid `isOk()` före åtkomst till värden i tester 