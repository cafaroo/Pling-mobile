# Sammanfattning av testproblem i Pling Mobile

## Huvudproblem

Huvudproblemet är att React Native 0.76+ använder ES-moduler (ESM), men Jest är baserat på CommonJS. Det skapar konflikter som gör att testerna inte kan köras.

## Åtgärder vi har provat

1. **Uppdaterat jest.config.js**
   - Ändrat preset från 'jest-expo' till 'react-native'
   - Lagt till transform-konfiguration för babel-jest
   - Utökat transformIgnorePatterns för att inkludera alla nödvändiga moduler som använder ES-moduler

2. **Uppdaterat babel.config.js**
   - Ändrat preset från 'babel-preset-expo' till 'module:metro-react-native-babel-preset'
   - Lagt till @babel/plugin-transform-modules-commonjs för att konvertera ES-moduler till CommonJS

3. **Uppdaterat jest.setup.js**
   - Lagt till @testing-library/jest-native/extend-expect
   - Lagt till mockar för problematiska moduler som react-native-safe-area-context, react-native-toast-message, expo-clipboard, etc.

4. **Skapat mockar för externa moduler**
   - Skapat __mocks__/react-native-toast-message.js
   - Skapat __mocks__/fileMock.js och __mocks__/styleMock.js

5. **Konfigurerat moduleNameMapper**
   - Lagt till mappning för @-prefix i importer
   - Mappat reaktiv-native-moduler till mockar

## Kvarstående problem

1. **Import-problem med @-prefix**
   - Många tester kan inte hitta moduler som importeras med @-prefix, t.ex. @/shared/core/Result

2. **React Native ESM-problem**
   - `SyntaxError: Cannot use import statement outside a module` från react-native/index.js
   - Detta indikerar att transformIgnorePatterns inte korrekt hanterar alla moduler som använder ES-moduler

3. **Testing Library-problem**
   - @testing-library/react-native kan inte parsas korrekt eftersom det också använder ES-moduler

## Förslag till lösning

1. **Fullständig ominstallation**
   - Rensa hela node_modules och installera om alla beroenden
   - Använd endast exakta versioner i package.json för att undvika versionsrelaterade problem

2. **Mer omfattande transformIgnorePatterns**
   - Inkludera mer specifika moduler i transformIgnorePatterns
   - Överväg att använda 'node_modules/' (utan något ignorerat) och sedan lägga till specifika transformers för specifika filer

3. **Specifika mockar för problematiska moduler**
   - Skapa mer detaljerade mockar för problematiska moduler
   - Använd jest.setMock() i setup-filen istället för att förlita sig på moduleNameMapper

4. **Alternativt testsätt**
   - Överväg att använda en annan testramverk som stöder ES-moduler nativt
   - Överväg att använda en annan React-testbibliotek som är mer kompatibelt med React Native 0.76+

## Rekommenderad åtgärd

Baserat på det vi har provat, rekommenderas följande:

1. Skapa en separat branch för testfixar
2. Rensa node_modules och installera om alla beroenden
3. Testa ett mer minimalistiskt test-setup som endast använder grundläggande funktioner
4. Fokusera först på att få domäntester att fungera, sedan infrastrukturtester, och sist UI-tester
5. Använd commonjs-format för tester om möjligt (require istället för import)
6. Överväg att helt migrera till Jest 28+ och jest-expo som har bättre stöd för ES-moduler

## Nästa steg

1. Dokumentera alla ändringar och deras effekter
2. Testa en konfiguration baserad på jest-expo i stället för react-native preset
3. Skapa en tydlig inkrementell plan för att få alla tester att fungera
4. Kommunicera med teamet om kritiska komplikationer som kan uppstå i CI-miljö 