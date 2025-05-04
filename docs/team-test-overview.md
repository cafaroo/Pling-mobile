# Översikt över tester för Team-modulen

Vi har implementerat en omfattande testsvit för team-modulen med fokus på olika aspekter av systemet:

## Komponenttester

### TeamBasic
Enkelt test som verifierar att testmiljön fungerar korrekt. Detta test använder en minimalistisk komponent för att bekräfta att grundläggande testfunktionalitet fungerar.

### TeamCard
Testar TeamCard-komponenten som visar information om ett team. Verifierar att:
- Teamnamnet visas korrekt
- Callback anropas vid klick på kortet
- Privatstatus visas korrekt
- Medlemsantal visas
- Olika varianter av kortet (compact, default, detailed) fungerar

### TeamList
Testar TeamList-komponenten som visar en lista med team. Verifierar att:
- Listan renderas korrekt
- Callback anropas vid val av team
- Markering av valt team fungerar

### TeamForm
Testar TeamForm-komponenten som används för att skapa/redigera team. Verifierar att:
- Formuläret renderas korrekt
- Fält uppdateras vid inmatning
- Validering fungerar för obligatoriska fält
- Formuläret skickar korrekt data vid validering
- Initialvärden visas korrekt

### TeamMemberList
Testar TeamMemberList-komponenten som visar teammedlemmar. Verifierar att:
- Medlemslistan renderas korrekt
- Roller visas korrekt
- Behörigheter begränsas baserat på användarroll
- Borttagning och ändring av roller är tillgängliga för rätt användare
- Sortering av medlemmar fungerar korrekt

### TeamSettings
Testar TeamSettings-komponenten för teaminställningar. Verifierar att:
- Grundläggande inställningar visas
- Teamnamn och beskrivning visas och kan ändras
- Abonnemangsinformation visas
- Ändringar sparas korrekt
- Farozon endast visas för ägare
- Borttagning av team fungerar med bekräftelsedialog

### TeamInvite
Testar TeamInvite-komponenten för att bjuda in medlemmar. Verifierar att:
- Inbjudningsformuläret renderas korrekt
- E-postfält uppdateras vid inmatning
- E-postformat valideras
- Rollval fungerar
- Inbjudan skickas med korrekt data
- Felhantering fungerar

### TeamScreen
Testar TeamScreen-komponenten som är huvudvyn för ett team. Verifierar att:
- Skärmen renderas korrekt
- Fliknavigering mellan översikt, medlemmar och inställningar fungerar
- Laddningsindikator visas när data laddas
- Felmeddelande visas vid fel
- Inbjudningsformulär visas i medlemsfliken
- Behörigheter begränsas baserat på användarroll

## Hook-tester

### useTeam
Testar useTeam-hooken som hanterar teamdata. Verifierar att:
- Teamdata laddas korrekt
- Fel hanteras korrekt
- Omladdning av data via refetch fungerar
- Användarroller fungerar korrekt

## Service-tester

### teamService
Testar teamService som hanterar API-anrop för team. Verifierar att:
- Hämtning av team fungerar
- Hämtning av teammedlemmar fungerar
- Skapande av team fungerar
- Uppdatering av team fungerar
- Borttagning av team fungerar
- Hämtning av användarroll fungerar

## Teststruktur
Vår testuppsättning följer ett strukturerat mönster:

1. **Enkel verifiering av rendering**: Verifierar att komponenten renderas utan fel
2. **Verifiering av innehåll**: Kontrollerar att rätt data visas
3. **Interaktionstester**: Testar användarinteraktioner som klick och formulärinmatning
4. **Tillståndstester**: Verifierar att komponenten uppdateras korrekt vid tillståndsändringar
5. **Fel- och gränsfalltester**: Testar hur systemet hanterar fel och extremfall

## Mockning
Vi använder omfattande mockning för att isolera testerna från externa beroenden:

- **React Query**: För datahämtningslogik
- **Supabase**: För databasåtkomst och autentisering
- **React Navigation/Expo Router**: För navigering
- **Komponenter från tredjepartsbibliotek**: För UI-element

## Test-utils
Vi har skapat gemensamma testverktyg i `test-utils.jsx` för att förenkla testskrivning:
- `renderWithProviders`: Renderar komponenter med nödvändiga providers
- `mockTeams`: Testdata för team
- `createTestProps`: Skapar mock-props för komponenter
- `mockSupabaseClient`: Mock för Supabase-klienten

## Fördelar med vår testuppsättning
1. **Komponentbaserad testning**: Tester fokuserar på enskilda komponenter för enklare felsökning
2. **Bred täckning**: Täcker komponenter, hooks och services
3. **Användarbeteendefokus**: Tester simulerar verkliga användarscenarion
4. **Isolerade tester**: Tester är isolerade för att förhindra påverkan mellan tester
5. **Återanvändbar kod**: Gemensamma testverktyg minskar kodduplicering

## Nästa steg
1. **Utöka testtäckning**: Lägg till tester för återstående komponenter
2. **Integrationstester**: Testa integration mellan komponenter
3. **End-to-end-tester**: Testa hela användarflöden
4. **Prestandatester**: Testa laddningstider och responsivitet
5. **Automatisering**: Integrera tester i CI/CD-pipeline 