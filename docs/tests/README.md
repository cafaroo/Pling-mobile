# Teststrategi för Pling Mobile

## Översikt

Pling Mobile använder en uppdelad teststrategi med separat konfiguration för domäntester och UI-testers. Detta ökar både prestandan och underhållbarheten.

Efter övergången till React Native 0.76+ och ESM har vi genomfört omfattande förändringar i testuppsättningen för att hantera de nya utmaningarna.

## Dokumentation

| Fil | Beskrivning |
|-----|-------------|
| [Test-översikt](./test-overview.md) | Övergripande teststrategi |
| [Testuppsättningsguide](./test-setup-guide.md) | Teknisk dokumentation av testmiljön |
| [Domäntestprinciper](./domain-testing-principles.md) | Principer för domänlogiktester |
| [UI-testprinciper](./ui-testing-principles.md) | Principer för komponenttester |
| [Domäntest av hooks](./domain-test-hooks.md) | Speciell guide för hooks i domäntestmiljö |
| [UI-testfixar](./ui_testing_fixes.md) | Praktiska lösningar för vanliga UI-testproblem |

## Testkommandon

| Kommando | Beskrivning |
|----------|-------------|
| `npm run test` | Kör alla tester |
| `npm run test:domain` | Kör enbart domäntester (node-miljö) |
| `npm run test:ui` | Kör enbart UI-tester (jsdom-miljö) |
| `npm run test:clear-cache` | Rensar Jest-cachen |
| `npm run test:watch` | Kör tester i watch-läge |

## Uppnått

1. **Separata testkonfigurationer**
   - Domäntester konfigurerade i `jest.domain.config.js`
   - UI-tester konfigurerade i `jest.ui.config.js`

2. **Förbättrad mockstrategi**
   - Globala mockar för React Native, React Query m.m.
   - Specifikation för mockstruktur i dokumentationen

3. **Exempel på testimplementation**
   - Exempel på domäntester och UI-tester
   - Specialiserade exempel för React hook-tester

4. **Omfattande dokumentation**
   - Testuppsättningsguide
   - Principer för olika typer av tester
   - Strategier för att hantera problematiska testfall

5. **Stöd för kontinuerlig integration**
   - Skript för clean-cache och olika testkategorier
   - Batch-filer för Windows-miljö
   
6. **Lösta UI-test problem**
   - Robust hantering av nullvärden i React Hook Form
   - Förbättrade zod-mockar som hanterar form-validering
   - Användning av testID för att hitta element konsekvent
   - Förenklad testmetodik med fokus på resultat, inte implementation

## Återstående uppgifter

1. **Konvertera existerande hooks-tester**
   - Ersätt JSX med React.createElement i domäntester
   - Använd direktanropsmetoden för React hooks enligt dokumentationen
   - Konvertera .tsx-filer till .ts för domäntester

2. **Fixa queryClient.clear()**
   - Ersätt `queryClient.clear()` med `queryClient.resetQueries()`
   - Uppdatera tester som förlitar sig på denna metod

3. **Åtgärda integrationstester**
   - Fixa importsökvägar för moduler som useSupabase
   - Skapa mockstrategier för API-integrationer

4. **Öka testprestanda**
   - Optimera mockningar
   - Minska testtid

## Bidra till testerna

För att lägga till nya tester, följ dessa steg:

1. **Bestäm testtyp**
   - Domäntest: Lägg till i en lämplig mapp med `.test.ts` ändelse
   - UI-test: Lägg till med `.test.tsx` ändelse

2. **Referera till exempeltester**
   - Domäntester: `src/domain/examples/TestDomainExample.test.ts`
   - UI-tester: `components/examples/TestExample.test.tsx`
   - Hooks i domäntester: `src/application/team/hooks/__tests__/useTeamStatistics.example.ts`

3. **Följ principer i dokumentationen**
   - Domäntestprinciper
   - UI-testprinciper
   - Domäntest av hooks

## Mappstruktur för tester

```
/
├── __mocks__/                     # Globala mockar
├── src/
│   ├── domain/                    # Domänobjekt
│   │   └── **/__tests__/*.test.ts # Domäntester
│   ├── application/               # Applikationslogik
│   │   └── **/__tests__/*.test.ts # Applikationstester
│   └── test-utils/                # Gemensamma testhjälpare
├── components/
│   └── **/__tests__/*.test.tsx    # UI-tester
└── jest.*.config.js               # Testkonfigurationer
```

## Nyckelprinciper

1. **Separera domäntester från UI-tester** - Domäntester körs i node-miljö och UI-tester i jsdom-miljö
2. **Använd domänspecifik testning** - Testa enligt DDD-principer med entiteter, värdesobjekt och aggregat
3. **Använd mockade beroenden** - Externa beroenden som API:er och databaser mockas alltid
4. **Skriv deterministiska tester** - Undvik att tester påverkar varandra 
5. **Följ AAA-mönstret** - Arrange, Act, Assert för tydliga tester

## Exempeltest

```typescript
// Domäntest exempel
describe('Email', () => {
  it('ska validera e-postadressen', () => {
    // Arrange
    const email = 'test@example.com';
    
    // Act
    const result = Email.create(email);
    
    // Assert
    expect(result.isOk()).toBe(true);
    expect(result.value.toString()).toBe(email);
  });
});

// UI-test exempel
describe('Button', () => {
  it('ska anropa onPress när den trycks', () => {
    // Arrange
    const onPress = jest.fn();
    const { getByText } = render(<Button onPress={onPress} title="Klicka" />);
    
    // Act
    fireEvent.press(getByText('Klicka'));
    
    // Assert
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

## Verktyg vi använder

- **Jest** - Testramverk
- **@testing-library/react-native** - UI-testning
- **@testing-library/react-hooks** - Testning av React-hooks
- **jest-expo** - Expo-specifik testkonfiguration

## Testprocessen

1. **Enhetstest** - Domänlagret, enskilda klasser och funktioner
2. **Integrationstester** - Applikationslagret, use cases, repositories
3. **UI-tester** - Komponenter och användargränssnitt
4. **Manuell testning** - Flöden och känslan i appen 