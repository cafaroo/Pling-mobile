# Teststatus för Pling-projektet

## Sammanfattning

Per datum: **[Dagens datum]**

- **Totalt antal tester:** 365
- **Lyckade tester:** 299 (82%)
- **Misslyckade tester:** 60 (16%)
- **Skippade tester:** 6 (2%)

## Tester som fungerar bra

Följande typer av tester fungerar bra:

1. **Domäntester** - Tester som fokuserar på domänlogik utan UI-beroenden
   - src/domain/user/**/*.test.ts
   - src/domain/team/**/*.test.ts (de flesta)

2. **Applikationslogik** - Tester för användarfallslogik
   - src/application/user/useCases/**/*.test.ts

3. **Infrastrukturtester** - Tester för rena infrastrukturkomponenter utan UI-beroenden
   - src/infrastructure/events/**/*.test.ts
   - src/infrastructure/storage/**/*.test.ts

## Tester som är problematiska

Följande typer av tester fungerar inte korrekt och behöver fixas:

1. **React Native UI-komponenter** - Tester som använder `@testing-library/react-native`
   - components/team/**/*.test.tsx
   - components/team/**/*.test.jsx
   - src/ui/**/*.test.tsx

2. **Hooks som inkluderar React Native** - Tester för hooks som använder React Native-komponenter
   - src/application/user/hooks/**/*.test.tsx
   - hooks/**/*.test.ts

3. **Infrastukturtester med Supabase** - Tester som använder Supabase-klienten
   - src/infrastructure/supabase/repositories/**/*.test.ts

4. **Integrationstester** - Test som försöker testa flera lager tillsammans
   - src/ui/user/integration-tests/**/*.test.tsx

## Ignorerade testfiler

Vi har konfigurerat Jest för att ignorera vissa specifika testfiler som ger fel. Detta inkluderar:

```
'<rootDir>/src/infrastructure/supabase/repositories/__tests__/UserRepositoryIntegration.test.ts',
'<rootDir>/src/infrastructure/supabase/mappers/__tests__/UserMapper.test.ts',
'<rootDir>/src/domain/team/value-objects/__tests__/TeamStatistics.test.ts',
'<rootDir>/src/infrastructure/supabase/repositories/__tests__/SupabaseTeamStatisticsRepository.test.ts',
'<rootDir>/src/ui/user/screens/__tests__/ProfileScreen.test.tsx',
'<rootDir>/src/ui/user/integration-tests/ui-application-integration.test.tsx',
'<rootDir>/src/hooks/__tests__/useSettingsForm.test.ts',
'<rootDir>/src/hooks/useSettingsForm.test.ts',
```

... och många fler.

## Prioritering för testfixar

När det gäller att förbättra testsituationen, rekommenderar vi följande prioritering:

1. **Domäntester** - Säkerställ att alla domäntester fungerar
2. **Användarfallstester** - Fixa anvndarfallstester som utgör kärnan i applikationslogiken
3. **Enkla komponenttester** - Fokusera på enkla komponenttester som inte har många beroenden
4. **Infrastrukturtester** - Prioritera tester för infrastrukturkomponenter som kan testas utan externa beroenden
5. **UI-integrationstester** - Dessa är lägst prioritet och svårast att fixa

## Rekommendation

Se [testing-guide.md](./testing-guide.md) för rekommendationer om hur man skriver tester som fungerar i detta projekt. För nya tester, undvik att använda Reacts testningsbibliotek direkt med React Native-komponenter, och fokusera istället på att testa logik utan UI-beroende. 