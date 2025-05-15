# Result API Verifieringsverktyg

Detta verktyg hjälper till att verifiera konsekvent användning av Result-API i hela kodbasen.

## Bakgrund

Vi har migrerat från det gamla Result-API:et (isSuccess/getValue) till det nya (isOk/value). Detta verktyg hjälper till att hitta kvarvarande användningar av det gamla API:et.

## Användning

### Via Jest-test

```bash
# Kör endast Result-API-konsistenstesten
npx jest src/test-utils/verification/__tests__/resultApiConsistency.test.ts
```

### Via batch-skript (Windows)

```bash
# Kör verifikationsskriptet
.\src\test-utils\verification\result-api-verification.bat
```

### Via TS-Node direkt

```bash
# Kör verifikationsskriptet direkt via ts-node
npx ts-node ./src/test-utils/verification/resultApiVerificationTest.ts
```

## Installation i package.json

För att göra det enklare att köra verifieringen, lägg till följande skript i din package.json:

```json
"scripts": {
  // ... andra skript ...
  "verify-result-api": "ts-node ./src/test-utils/verification/resultApiVerificationTest.ts"
}
```

Sedan kan du köra:

```bash
npm run verify-result-api
```

## Generera rapport

Som standard genereras en rapport till `docs/testing/result-api-verification-report.md`.

## Exkludera kataloger

Du kan anpassa vilka kataloger som ska exkluderas genom att redigera excludeDirs-arrayen i scanDirectory-anropet i resultApiVerificationTest.ts eller resultApiConsistency.test.ts.

## Att observera

Verktyget undersöker endast TypeScript-filer (.ts och .tsx). 