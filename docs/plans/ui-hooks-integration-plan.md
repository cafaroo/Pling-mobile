# Plan för integration av standardiserade hooks i skärmar

Detta dokument beskriver planen för att säkerställa att alla refaktorerade skärmar använder de standardiserade hooks från applikationslagret på ett konsekvent sätt.

## Bakgrund

Projektet har refaktorerat en stor del av hook-logiken till applikationslagret, vilket möjliggör en mer konsekvent datahantering, bättre felhantering och tydligare separering av ansvar. Dessa hooks behöver nu integreras korrekt i alla skärmar för att säkerställa att data flödar korrekt genom hela applikationen.

## Mål

1. Säkerställa att alla skärmar använder lämpliga hooks från applikationslagret
2. Optimera laddningsstrategier och caching med React Query
3. Verifiera korrekt dataflöde genom komponentträdet
4. Förbättra prestandaoptimeringen i skärmkomponenter

## Prioriterade skärmar

### Team-relaterade skärmar

1. **TeamScreen** ✅
   - ✅ Använd `useTeam` och `useTeamWithStandardHook` för datahämtning
   - ✅ Implementera korrekt felhantering och laddningstillstånd

2. **TeamMembersScreen** ✅
   - ✅ Använd `useTeamMembers` hook för att hämta och hantera medlemmar
   - ✅ Implementera sidnumrering och filtrering med optimerad caching

3. **TeamActivitiesScreen**
   - Använd `useTeamActivities` för att hämta aktivitetsflöde
   - Implementera oändlig scrollning och datapaginering

4. **TeamSettingsScreen**
   - Använd `useTeamSettings` och `useUpdateTeam` för inställningshantering
   - Implementera korrekt valideringslogik och tillståndsuppdatering

### User-relaterade skärmar

1. **ProfileScreen**
   - Använd `useUser` och `useUpdateProfile` för profildata och uppdateringar
   - Implementera optimistisk UI-uppdatering

2. **UserTeamsScreen**
   - Använd `useUserTeams` för att visa användarens team
   - Implementera lämplig filtrering och sortering

3. **SettingsScreen**
   - Använd `useUserSettings` och `useUpdateSettings` för inställningar
   - Implementera korrekt validering och felhantering

## Implementationsriktlinjer

För varje skärm, följ dessa steg:

1. **Identifiera lämpliga hooks**
   - Granska tillgängliga hooks i applikationslagret
   - Identifiera vilka hooks som är relevanta för skärmen

2. **Refaktorera container-komponenter**
   - Migrera befintlig datahämtningslogik till de standardiserade hooks
   - Säkerställ att alla operationer (läsning, skrivning, uppdatering, borttagning) använder lämpliga hooks

3. **Optimera React Query-konfiguration**
   - Finjustera `staleTime` och `cacheTime` baserat på datans natur
   - Implementera `keepPreviousData` för paginerad data
   - Använd `onError`-callbacks för konsekvent felhantering

4. **Standardisera presentationslogik**
   - Säkerställ att container-komponenter korrekt projicerar data till presentation-komponenter
   - Använd ConsumerProps-mönstret för tydlig typning av props

5. **Optimera prestanda**
   - Implementera `useMemo` och `useCallback` för att undvika onödiga renderingar
   - Använd `React.memo()` för att förhindra omrendering av oförändrade komponenter
   - Säkerställ korrekt avlyssning av hooks-beroenden

## Tillvägagångssätt

### Fas 1: Analys

För varje skärm:

1. Identifiera nuvarande datahämtningslogik
2. Dokumentera data som behövs av skärmen
3. Hitta motsvarande standardiserade hooks från applikationslagret 
4. Identifiera eventuella luckor där nya hooks kan behövas

### Fas 2: Implementation

För varje skärm:

1. Refaktorera container-komponenten till att använda de standardiserade hooks
2. Uppdatera testning för att täcka de nya integrerade hooks
3. Säkerställ att all nödvändig databehandling fortfarande hanteras korrekt

### Fas 3: Optimering

För varje skärm:

1. Finjustera React Query-konfigurationer för optimal caching och uppdatering
2. Implementera minnestekniker för att minska onödiga renderingar
3. Använd profileringsverktyg för att identifiera och åtgärda prestandaproblem

### Fas 4: Validering

För varje skärm:

1. Skapa eller uppdatera integrationstester för att verifiera korrekt hook-integration
2. Testa edge cases som nätverksfel, cachade data, och tillståndstransitioner
3. Verifiera att samtliga dataflöden fungerar som förväntat

## Detaljerad plan för TeamMembersScreen

Som exempelfall, nedan följer en detaljerad implementation för TeamMembersScreen:

1. **Nuvarande implementation:**
   - Hämtar team-medlemmar direkt via `fetch` eller gamla custom hooks
   - Hanterar pagination och filtrering lokalt
   - Tillstånd hanteras med `useState`

2. **Refaktorering:**
   - Använd `useTeamMembers` från `src/application/team/hooks/useTeamMembers.ts`
   - Hantera filtrering och paginering genom att skicka rätt parametrar till hooken
   - Använd laddnings- och felstatus direkt från React Query

3. **Specifik kod:**
   ```tsx
   // Nuvarande (exempel):
   const [members, setMembers] = useState<TeamMember[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<Error | null>(null);
   
   useEffect(() => {
     fetchMembers(teamId)
       .then(data => setMembers(data))
       .catch(err => setError(err))
       .finally(() => setIsLoading(false));
   }, [teamId]);
   
   // Refaktorerad:
   const { 
     data: members, 
     isLoading, 
     error,
     refetch,
     isRefetching
   } = useTeamMembers({ 
     teamId, 
     filter, 
     pagination: { page, limit } 
   });
   ```

## Spårning av framsteg

Implementera en checklista för varje skärm för att spåra refaktoreringsframsteg:

### TeamScreen
- [x] Identifierat lämpliga hooks
- [x] Refaktorerat container-komponent
- [x] Uppdaterat tester
- [x] Optimerat prestanda
- [x] Validerat med integrationstester

### TeamMembersScreen
- [x] Identifierat lämpliga hooks
- [x] Refaktorerat container-komponent
- [x] Uppdaterat tester
- [x] Optimerat prestanda
- [x] Validerat med integrationstester

### TeamActivitiesScreen
- [ ] Identifierat lämpliga hooks
- [ ] Refaktorerat container-komponent
- [ ] Uppdaterat tester
- [ ] Optimerat prestanda
- [ ] Validerat med integrationstester

### TeamSettingsScreen
- [ ] Identifierat lämpliga hooks
- [ ] Refaktorerat container-komponent
- [ ] Uppdaterat tester
- [ ] Optimerat prestanda
- [ ] Validerat med integrationstester

## Tidsuppskattning

För varje skärm uppskattas:
- Analys: 0.5 dagar
- Implementation: 1 dag
- Testning och optimering: 0.5 dagar

Total uppskattad tid: 14 dagar för alla prioriterade skärmar. 