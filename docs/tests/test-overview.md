# Teststrategi för Pling Mobile

## Översikt

Efter övergången till React Native 0.76+ och ESM (ECMAScript Modules) har testuppsättningen i Pling Mobile anpassats för att hantera den nya miljön. Vi har delat upp testmiljön i två distinkta delar:

1. **Domäntester** (node-miljö)
   - Testar domänlogik, applikationslogik och utilities
   - Körs med `npm run test:domain`
   - Konfigurerade i `jest.domain.config.js`

2. **UI-tester** (jsdom-miljö)
   - Testar UI-komponenter och interaktioner
   - Körs med `npm run test:ui`
   - Konfigurerade i `jest.ui.config.js`

## Dokumentation

- [Testuppsättningsguide](./test-setup-guide.md) - Teknisk dokumentation av testmiljön
- [Domäntestprinciper](./domain-testing-principles.md) - Principer för domänlogiktester
- [UI-testprinciper](./ui-testing-principles.md) - Principer för komponenttester
- [Domäntest av hooks](./domain-test-hooks.md) - Speciell guide för hooks i domäntestmiljö

## Teststrategier

### Domäntester

Domäntesterna fokuserar på affärslogik, validering och datamodeller. Vi använder följande strategier:

1. **Enhetstest av domänobjekt**
   - Testa värdesobjekt, entiteter och aggregat separat
   - Validera att domänlogik och affärsregler upprätthålls
   - Verifiera invarianter och begränsningar

2. **Hooks i domäntester**
   - Hooks testas utan JSX/renderHook
   - React-beroenden mockas
   - Se [speciell guide](./domain-test-hooks.md)

3. **Use-case tester**
   - Testa applikationslogik och interaktioner mellan domänobjekt
   - Mocka externa beroenden (databaser, API, etc.)

### UI-tester

UI-testerna fokuserar på komponenter, UI-interaktioner och rendering. Vi använder följande strategier:

1. **Komponenttester**
   - Testa rendering med olika props och tillstånd
   - Simulera användarinteraktion (klick, swipe, etc.)
   - Verifiera att rätt komponenter renderas

2. **Hook-tester med renderHook**
   - Använd `renderHook` från `@testing-library/react-hooks`
   - Testa hooks med providers och kontext
   - Verifiera reaktioner på användarinteraktioner

## Testschema

| Testtyp | Kommando | Körningsmiljö | Omfattning |
|---------|---------|--------------|------------|
| All tester | `npm run test` | Både node & jsdom | Alla tester |
| Domäntester | `npm run test:domain` | Node.js | Domänlogik, utilities, applikationslogik |
| UI-tester | `npm run test:ui` | jsdom | Komponenter, UI-interaktioner |
| Specifika tester | `npm run test -- -t "testnamn"` | Beror på test | Specifika tester som matchar namn |
| Continuous Integration | `npm run test:ci` | Både node & jsdom | Alla tester med CI-specifika inställningar |

## Mockstrategier

### Struktur för mockar

```
__mocks__/             # Globala mockar för externa paket
  └── react-native.js  # Mock för React Native komponenter
  └── @tanstack/       # Mock för React Query
      └── react-query.js
src/
  └── test-utils/     # Gemensamma testverktyg
      └── index.ts    # Hjälputiliteter för tester 
```

### Mocktyper

1. **Globala mockar**
   - Ersätter externa paket i hela testmiljön
   - Exempel: `react-native`, `react-query`

2. **Lokala mockar**
   - Skapas med `jest.mock()` i specifika testfiler
   - Mockar för externa tjänster, API, repositories

3. **Testutiliteter**
   - Hjälpfunktioner för testning
   - Återanvändbar testlogik

## CI/CD Integration

Tester körs automatiskt:
- Vid Pull Requests 
- Vid merge till `main`
- Vid nattlig build

## Kodtäckning

Vi strävar efter hög kodtäckning:
- Domänlogik: >80%
- Applikationslogik: >70%
- UI-komponenter: >60%

## Vanliga fallgropar

1. **JSX i Node-miljö** 
   - Problem: JSX stöds inte direkt i node-miljö
   - Lösning: Använd `React.createElement` eller testa i UI-testerna

2. **React hooks i node-miljö**
   - Problem: Hooks kräver React-kontext
   - Lösning: Se [speciell guide](./domain-test-hooks.md)

3. **Asynkrona tester**
   - Problem: Timing-problem i asynkrona tester
   - Lösning: Använd `waitFor` och `act` från testing-library

4. **Felaktiga mockar**
   - Problem: Inkomplett/felaktig mockning kan ge svårlösta problem
   - Lösning: Verifiera mock-implementationen mot riktigt API

## Framtida förbättringar

1. Utöka automatiserade UI-tester med Detox
2. Förbättra end-to-end teststrategier
3. Implementera prestandatester
4. Utöka CI-pipeline med fler automatiska tester 