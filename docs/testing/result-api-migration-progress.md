# Framsteg i Result-API-migrering

Detta dokument spårar framstegen i migreringen från det gamla Result-API:et (isSuccess/getValue) till det nya API:et (isOk/value).

## Slutförda uppdateringar

### Värde-objekt
- [x] `TeamName.test.ts` - Använder redan det nya API:et
- [x] `Email.test.ts` - Använder redan det nya API:et
- [x] `TeamSettings.test.ts` - Ny fil skapad med det nya API:et
- [x] `UserRolePermission.ts` - Uppdaterad från getValue till value
- [x] `UserRolePermission.test.ts` - Ny fil skapad med det nya API:et

### Event handlers
- [x] `UserStatusChangedHandler.ts` - Uppdaterad från isFailure/getValue till isErr/value
- [x] `TeamCreatedHandler.ts` - Uppdaterad från isFailure/getValue till isErr/value
- [x] `MemberJoinedHandler.ts` - Uppdaterad från isFailure/getValue till isErr/value
- [x] `UserProfileUpdatedHandler.ts` - Uppdaterad från isFailure/getValue till isErr/value
- [x] `UserTeamJoinedHandler.ts` - Uppdaterad från isFailure/getValue till isErr/value
- [x] `UserCreatedHandler.ts` - Uppdaterad från isFailure/getValue till isErr/value
- [x] `MemberLeftHandler.ts` - Uppdaterad från isFailure/getValue till isErr/value
- [x] `TeamMemberRoleChangedHandler.ts` - Uppdaterad från isFailure/getValue till isErr/value
- [x] `TeamMessageCreatedHandler.ts` - Uppdaterad från isFailure/getValue till isErr/value

### Repository-implementationer
- [x] `TeamRepository.ts` - Uppdaterad från isSuccess/getValue till isOk/value
- [x] `OptimizedUserRepository.ts` - Uppdaterad från isSuccess/getValue till isOk/value
- [x] `SupabaseTeamGoalRepository.ts` - Uppdaterad från Result.success/Result.failure till ok/err

### Grundläggande hooks
- [x] `useStandardizedHook.ts` - Uppdaterad från isSuccess/getValue till isOk/value
- [x] `createStandardizedHook.ts` - Uppdaterad från isSuccess/getValue till isOk/value
- [x] `BaseHook.ts` - Uppdaterad från isSuccess/getValue till isOk/value

### Team-hooks
- [x] `useTeamWithStandardHook.ts` - Uppdaterad från isSuccess/getValue till isOk/value
- [x] `useTeamGoals.ts` - Uppdaterad från isSuccess/getValue till isOk/value
- [x] `useTeamActivities.ts` - Uppdaterad från isSuccess/getValue till isOk/value
- [x] `useTeam.ts` - Uppdaterad från isSuccess/getValue till isOk/value

### User-hooks
- [x] `useUserCache.ts` - Uppdaterad från isSuccess/getValue till isOk/value
- [x] `useUser.ts` - Uppdaterad från getValue till value

### Organization-hooks
- [x] `useOrganizationWithStandardHook.ts` - Uppdaterad från isSuccess/getValue till isOk/value

### UI-komponenter
- [x] `TeamScreen.tsx` - Uppdaterad från isSuccess till isOk
- [x] `UserPermissionsContext.tsx` - Uppdaterad från getValue till value

## Återstående filer att uppdatera

Följande filer använder fortfarande det gamla Result-API:et och behöver uppdateras:

### Hooks och tester
- [ ] `src/application/shared/hooks/useStandardizedHook.ts` - Fortfarande använder isFailure()
- [ ] `src/application/shared/hooks/__tests__/useStandardizedHook.test.tsx` - Använder isSuccess(), isFailure(), getValue()
- [ ] `src/application/subscription/hooks/__tests__/result-mock.ts` - Använder isFailure(), getValue()
- [ ] `src/application/user/hooks/__tests__/useUserCache.test.ts` - Använder getValue()

### Tester och hjälpfiler
- [ ] `src/shared/core/__tests__/Result-new.test.ts` - Använder getValue()
- [ ] `src/shared/core/__tests__/Result.test.ts` - Använder getValue()
- [ ] `src/test-utils/userProfileTestHelper.ts` - Använder getValue()

## Strategier för uppdatering

1. **Direkt uppdatering** - Byt ut alla förekomster av gamla API:et mot nya API:et
   - isSuccess() -> isOk()
   - isFailure() -> isErr()
   - getValue() -> value
   - Result.success() -> Result.ok()
   - Result.failure() -> Result.err()

2. **Testhjälpare** - För tester, använd testhjälpare från `resultTestHelper.ts`
   - Stegvis migrering av tester
   - Bakåtkompatibilitetslager

3. **Gradvis migrering** - Om direkt uppdatering inte är möjlig, skapa en gradvis migreringsväg

## Uppgiftslista

1. ✅ Uppdatera värde-objekt
2. ✅ Uppdatera event handlers 
3. ✅ Uppdatera repository-implementationer
4. ✅ Uppdatera grundläggande hooks
5. ✅ Uppdatera teamrelaterade hooks
6. ✅ Uppdatera användarrelaterade hooks
7. ✅ Uppdatera organisationsrelaterade hooks
8. ✅ Göra tester som verifierar att API:et används konsekvent
9. 🔄 Uppdatera återstående 7 filer som identifierats av verifikationsverktyget

## Verifieringsverktyg

Vi har skapat ett verktyg för att automatiskt verifiera att Result-API används konsekvent i hela kodbasen. Verktyget finns i mappen `src/test-utils/verification/` och består av följande filer:

- `resultApiVerification.ts` - Kärnfunktioner för att skanna kodbasen och hitta användning av olika API:er
- `resultApiVerificationTest.ts` - Ett skript som kan köras direkt för att verifiera hela kodbasen
- `__tests__/resultApiConsistency.test.ts` - Jest-tester som verifierar konsekvent API-användning
- `runVerification.js` - Ett Node.js-skript för att köra verifieringen via kommandoraden
- `result-api-verification.bat` - Ett Windows batch-skript för att enkelt köra verifieringen
- `README.md` - Dokumentation om hur man använder verktygen

### Användning

För att köra verifieringen, använd något av följande kommandon:

```bash
# Via batch-skript (Windows)
.\src\test-utils\verification\result-api-verification.bat

# Via Jest
npx jest src/test-utils/verification/__tests__/resultApiConsistency.test.ts

# Via TS-Node
npx ts-node ./src/test-utils/verification/resultApiVerificationTest.ts
```

### Rapporter

Verifieringsverktyget genererar en detaljerad rapport som sparas i `docs/testing/result-api-verification-report.md`. Rapporten innehåller information om:

- Totalt antal analyserade filer
- Antal filer som använder gamla API:et
- Antal filer som använder nya API:et
- Antal filer som använder båda API:erna
- Detaljerad lista över filer som behöver migreras

### Uppdatering av package.json

För att göra det enklare att köra verifieringen regelbundet, lägg till följande skript i projektets package.json:

```json
"scripts": {
  "verify-result-api": "ts-node ./src/test-utils/verification/resultApiVerificationTest.ts"
}
```

Då kan verifieringen köras enkelt med:

```bash
npm run verify-result-api
```

### Integration med CI/CD

Detta verktyg kan också integreras med CI/CD-pipeline för att säkerställa att ny kod följer det nya API:et. Skriptet returnerar felkod 1 om det hittar förekomster av det gamla API:et, vilket gör att CI/CD-bygget misslyckas. 