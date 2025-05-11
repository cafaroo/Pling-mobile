# Testlösningssituation för Pling Mobile

## Vad som fungerar

Efter våra ändringar fungerar nu följande tester:

1. **Domänlagertester**:
   - `src/domain/organization/events/__tests__/OrganizationEvents.test.ts`
   - `src/domain/user/value-objects/__tests__/Email.test.ts`
   - `src/domain/user/value-objects/__tests__/Language.test.ts`

2. **Tillämpningslagertester**:
   - `src/application/user/hooks/__tests__/useUpdateProfile.test.tsx`
   - `components/team/__tests__/hooks/useTeam.test.tsx`

3. **Hjälptester**:
   - `src/utils/env.test.ts`
   - `env.test.js`

## Vad som fortfarande inte fungerar

Följande typer av tester fortsätter att misslyckas:

1. **React Native UI-tester**:
   - Alla tester som importerar från `@testing-library/react-native`
   - Exempel: `components/team/__tests__/TeamCard.test.jsx`
   - Exempel: `src/ui/user/components/__tests__/UserFeedback.test.tsx`

2. **Import-problem**:
   - Vissa tester kan inte hitta moduler med @-prefix
   - Exempel: `@/shared/core/Result`
   - Exempel: `@/shared/core/UniqueId`

## Huvudproblem

Det grundläggande problemet är att React Native 0.76+ använder ES-moduler (ESM), medan Jest är CommonJS-baserat. Detta orsakar följande specifika problem:

1. **SyntaxError: Cannot use import statement outside a module**
   - Detta fel uppstår när Jest försöker ladda ES-moduler som `react-native` eller `@testing-library/react-native`
   - Trots våra transformIgnorePatterns-inställningar fungerar det inte helt

2. **Module not found**
   - Jest hittar inte alla moduler som importeras med @ alias

## Vad vi har gjort

1. **jest.config.js**
   - Återgått till att använda `jest-expo` preset
   - Utökat transformIgnorePatterns för att inkludera alla nödvändiga moduler
   - Lagt till moduleNameMapper för @ alias

2. **babel.config.js**
   - Återgått till att använda `babel-preset-expo`
   - Lagt till `@babel/plugin-transform-modules-commonjs` plugin

3. **jest.setup.js**
   - Lagt till `@testing-library/jest-native/extend-expect`
   - Lagt till mockar för problematiska moduler

4. **__mocks__/**
   - Skapat mockar för `react-native-toast-message`, `fileMock.js` och `styleMock.js`

## Rekommenderade nästa steg

För att lösa återstående problem rekommenderas följande:

1. **Fullständig npm-ominstallation**
   ```bash
   rm -rf node_modules
   npm install --legacy-peer-deps
   ```

2. **Skapa eller uppdatera manuella mockar**
   - Skapa manuella mockar för alla problematiska moduler i `__mocks__/` katalogen
   - Särskilt skapa en mock för `react-native` som returnerar mockade komponenter

3. **Använd dynamic import() i UI-tester**
   - Överväg att konvertera UI-tester till att använda dynamic import() för problematiska moduler

4. **Separat preset för UI-tester**
   - Överväg att skapa en separat Jest-konfiguration specifikt för UI-tester

5. **Uppdatera till Jest 29**
   - Jest 29 har bättre stöd för ES-moduler
   - Detta kan kräva större ändringar i projektets beroenden

## Långsiktiga lösningar

1. **Migrera till Vitest**
   - Vitest har inbyggt stöd för ES-moduler och är betydligt snabbare
   - Detta kräver en större omstrukturering av testmiljön

2. **Konvertera testkomponenter till JSX**
   - Ändra tester som använder .tsx till .jsx för att minska TypeScript-kompatibilitetsproblem

3. **React Native Testing Library alternatives**
   - Överväg alternativ till `@testing-library/react-native` som har bättre stöd för ES-moduler 