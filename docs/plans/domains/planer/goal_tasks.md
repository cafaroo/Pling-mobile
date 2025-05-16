# TeamGoals Förbättringsplan

## Översikt

Detta dokument beskriver en plan för att förbättra mål-funktionaliteten i Pling-applikationen genom att ta inspiration från designen och funktionaliteten i TeamDashboard. Målet är att skapa en konsekvent användarupplevelse och förbättra både användbarheten och den visuella representationen av mål, både på team- och individuell nivå.

## Innehållsförteckning

1. [Nulägesanalys](#nulägesanalys)
2. [Förbättringsområden](#förbättringsområden)
3. [Arkitekturell förändring](#arkitekturell-förändring)
4. [Designförbättringar](#designförbättringar)
5. [Funktionella förbättringar](#funktionella-förbättringar)
6. [Implementation](#implementation)
7. [Testning](#testning)
8. [Implementationsplan](#implementationsplan)

## Senaste uppdateringar (2024-06-16)

### Nya förbättringar
1. **Team Analytics**
   - ✅ Implementerat TeamContext-integration för korrekt team-hantering
   - ✅ Förbättrad felhantering när inget team är valt
   - ✅ Lagt till navigering till team-val när team saknas
   - ✅ Optimerad prestanda genom korrekta komponentimporter
   - ✅ Förbättrad användarupplevelse med tydliga felmeddelanden
   - ✅ Implementerat responsiv design för olika skärmstorlekar

2. **UI-komponenter**
   - ✅ Standardiserat export/import-hantering för alla UI-komponenter
   - ✅ Förbättrad TypeScript-integration
   - ✅ Konsekvent felhantering och laddningstillstånd
   - ✅ Optimerad rendering av listor och statistik

### Pågående arbete
1. **Team Analytics**
   - ⏳ Implementering av realtidsuppdateringar för team-statistik
   - ⏳ Utökad visualisering av försäljningstrender
   - ⏳ Integration med tävlingsfunktionalitet

2. **Prestanda**
   - ⏳ Optimering av datahämtning och caching
   - ⏳ Förbättrad hantering av stora datamängder
   - ⏳ Implementering av virtualisering för långa listor

### Kommande uppgifter
1. **Team Analytics**
   - 📝 Implementera jämförelsevy mellan olika team
   - 📝 Lägga till historisk data och trendanalys
   - 📝 Utveckla prediktiv analys för måluppfyllelse

2. **UI/UX**
   - 📝 Förbättra animationer och övergångar
   - 📝 Implementera mer interaktiva datavisualiseringar
   - 📝 Utöka tillgänglighetsanpassningar

## Implementationsstatus (Uppdaterad 2024-06-16)

### Implementerade komponenter

#### Team Analytics
- ✅ **TeamAnalyticsScreen**: Grundläggande analytics-vy med team-statistik
  - Ranking-visning
  - Försäljningsstatistik
  - Medlemsöversikt
  - Prestationsmått
- ✅ **TeamContext-integration**: Korrekt hantering av team-val och behörigheter
- ✅ **Responsiv design**: Anpassad för olika skärmstorlekar
- ✅ **Felhantering**: Tydliga felmeddelanden och användarinstruktioner

#### UI-komponenter
- ✅ **Card**: Förbättrad design med stöd för olika varianter
- ✅ **ProgressBar**: Animerad framstegsindikator
- ✅ **Button**: Standardiserad knappkomponent med olika varianter
- ✅ **Header**: Konsekvent header-design
- ✅ **Tabs**: Förbättrad navigation mellan olika vyer

### Pågående utveckling
- ⏳ **Realtidsuppdateringar**: Implementation av live-uppdateringar för statistik
- ⏳ **Datavisualisering**: Utökade diagram och grafer
- ⏳ **Prestandaoptimering**: Förbättrad datahämtning och rendering

### Planerade förbättringar
- 📝 **Avancerad statistik**: Djupare insikter och analyser
- 📝 **Teamjämförelser**: Möjlighet att jämföra olika teams prestanda
- 📝 **Prediktiv analys**: AI-baserade förutsägelser för måluppfyllelse

## Tidplan (Uppdaterad)

### Fas 1: Grundläggande funktionalitet (Avslutad)
- ✅ Team Analytics grundstruktur
- ✅ Grundläggande statistikvisning
- ✅ Team-kontext integration

### Fas 2: Utökad funktionalitet (Pågående)
- ⏳ Realtidsuppdateringar (70% klart)
- ⏳ Förbättrad datavisualisering (50% klart)
- ⏳ Prestandaoptimering (60% klart)

### Fas 3: Avancerade funktioner (Planerad)
- 📝 Prediktiv analys
- 📝 Teamjämförelser
- 📝 Historisk dataanalys

## Nästa steg

### Kortsiktiga mål (1-2 veckor)
1. Slutföra realtidsuppdateringar
2. Implementera förbättrad datavisualisering
3. Optimera prestanda för stora datamängder

### Medellånga mål (2-4 veckor)
1. Implementera teamjämförelser
2. Utveckla historisk dataanalys
3. Förbättra användarupplevelsen

### Långsiktiga mål (1-2 månader)
1. Implementera prediktiv analys
2. Utveckla avancerade visualiseringar
3. Integrera med andra moduler

## Tekniska förbättringar

### Kodkvalitet
- ✅ Standardiserad komponentexport
- ✅ Förbättrad TypeScript-integration
- ✅ Konsekvent felhantering
- ⏳ Utökad testning

### Prestanda
- ✅ Optimerad rendering
- ✅ Förbättrad komponentstruktur
- ⏳ Avancerad caching
- ⏳ Lazy loading

### Användarupplevelse
- ✅ Tydlig felhantering
- ✅ Förbättrad navigation
- ⏳ Animationer och övergångar
- ⏳ Tillgänglighetsanpassningar

## Sammanfattning

Projektet har gjort betydande framsteg med implementationen av team-funktionaliteten, särskilt inom analytics-området. De senaste förbättringarna har fokuserat på att skapa en mer robust och användarvänlig upplevelse, med särskilt fokus på felhantering och team-kontext integration. Kommande arbete kommer att fokusera på att utöka funktionaliteten med mer avancerade analysmöjligheter och förbättrad datavisualisering.

## Nulägesanalys

### TeamDashboard

- Använder en grid-layout med BlurView-effekter för kort
- Visar olika kategorier av team-funktionalitet
- Använder ikoner med konsekventa färger
- Har tydlig hierarki och visuell struktur
- Integrerad med behörighetshantering (visar olika funktioner baserat på roll)
- Navigerar till olika delar av team-funktionalitet

### TeamGoals

- Använder en listvy för mål
- Har en sammanfattningsdel med statistik
- Använder tabbar för filtrering (aktiva/avslutade/alla)
- Har en FAB (Floating Action Button) för att skapa nya mål
- Har olika vyer baserat på om det finns mål eller ej
- Rollbaserad behörighetshantering för skapande av nya mål

### Individuella Goals (nuvarande status)

- Existerar som separat funktionalitet
- Använder annan design än TeamGoals
- Har begränsad koppling till TeamGoals
- Saknar tydlig relation till teamets övergripande mål

## Förbättringsområden

1. **Arkitektur**: Skapa en gemensam Goals-domän för både team- och individuella mål
2. **Visuell konsekvens**: Anpassa designen av både team- och individuella mål
3. **Användarupplevelse**: Förbättra navigering och interaktion
4. **Prestanda**: Optimera renderingen och datahantering
5. **Funktionalitet**: Utöka med mer team- och samarbetsfokuserade funktioner
6. **Tillgänglighet**: Förbättra för alla användare

## Arkitekturell förändring

### Gemensam Goals-domän

Istället för separata implementationer för teammål och individuella mål, skapa en gemensam domän:

```
/components
  /goals              # Gemensamma komponenter för mål
    GoalCard.tsx      # Generisk målkomponent  
    GoalForm.tsx      # Formulär för att skapa/redigera mål
    GoalStats.tsx     # Statistikkomponent för mål
    GoalFilters.tsx   # Komponent för filtrering av mål
    
/hooks
  useGoals.ts         # Generisk hook för målhantering
  
/services
  goalService.ts      # API-integration för målhantering
  
/types
  goal.ts             # Typdefinitioner för mål
  
/app
  /(tabs)
    /goals            # Individuella mål
    /team
      /goals          # Team-mål
```

### Uppdaterad Datamodell

```typescript
export type GoalScope = 'individual' | 'team';

export interface Goal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  deadline: string;
  status: GoalStatus;
  created_at: string;
  created_by: string;
  scope: GoalScope;
  team_id?: string;     // Endast för team-mål
  assignee_id?: string; // Kan användas för både individuella och delegerade mål
  parent_goal_id?: string; // För att visa relation mellan mål
  milestones?: Milestone[];
  tags?: string[];
}
```

### Gemensamma Service-funktioner

```typescript
// I goalService.ts
export async function getGoals(
  scope: GoalScope, 
  teamId?: string, 
  userId?: string
): Promise<Goal[]> {
  // Hämta mål baserat på scope, teamId och userId
}

export async function createGoal(
  goal: Omit<Goal, 'id' | 'created_at'>
): Promise<Goal> {
  // Skapa nytt mål
}

export async function updateGoalProgress(
  goalId: string,
  progress: number
): Promise<Goal> {
  // Uppdatera framsteg för ett mål
}
```

## Designförbättringar

### 1. Kart-baserad målvisning

Implementera kort-baserad visning av mål med samma BlurView-effekt som i TeamDashboard för både team- och individuella mål:

```jsx
const renderGoalCard = (goal) => (
  <TouchableOpacity
    style={styles.goalCard}
    onPress={() => handleGoalPress(goal)}
  >
    <BlurView intensity={20} style={styles.cardBlur}>
      <View style={styles.cardContent}>
        <GoalIconByType type={goal.type} size={24} color={colors.accent.yellow} />
        <Text style={[styles.cardTitle, { color: colors.text.main }]}>
          {goal.title}
        </Text>
        <View style={styles.goalMetadata}>
          {goal.scope === 'team' && (
            <Badge text="Team" color={colors.primary.light} />
          )}
          {goal.scope === 'individual' && goal.team_id && (
            <Badge text="Team-relaterad" color={colors.accent.pink} />
          )}
        </View>
        <Text style={[styles.cardDescription, { color: colors.text.light }]}>
          {getGoalProgress(goal)}
        </Text>
      </View>
    </BlurView>
  </TouchableOpacity>
);
```

### 2. Förbättrad statistikvisning

Ersätt den nuvarande statistikpanelen med kort-baserad statistik liknande TeamDashboard:

```jsx
<View style={styles.statsContainer}>
  {renderStatCard(
    <TrendingUp />,
    'Aktiva mål',
    `${activeGoals}`,
    activeGoals > 0
  )}
  {renderStatCard(
    <Award />,
    'Avklarade',
    `${completedGoals}`,
    false
  )}
  {goal.scope === 'team' ? 
    renderStatCard(
      <Users />,
      'Bidragsgivare',
      `${uniqueContributors}`,
      uniqueContributors > 2
    ) :
    renderStatCard(
      <Target />,
      'Team-relaterade',
      `${teamRelatedGoals}`,
      teamRelatedGoals > 0
    )
  }
</View>
```

### 3. Konsekvent färgschema

Använd samma färgkodning och visuella hierarki som i TeamDashboard:

- Gul accentfärg för viktiga handlingar och nyckelstatistik
- Blå/lila bakgrunder med gradient
- Konsekventa ikonavstånd och typografi
- Tydlig visuell skillnad mellan team- och individuella mål genom badges

## Funktionella förbättringar

### 1. Sammankopplade mål

Implementera relation mellan teammål och individuella mål:

```jsx
<View style={styles.relatedGoalsSection}>
  <Text style={styles.sectionTitle}>Relaterade mål</Text>
  {relatedGoals.map(goal => (
    <RelatedGoalCard
      key={goal.id}
      goal={goal}
      onPress={() => navigateToGoal(goal)}
      relation={goal.scope === 'team' ? 'Bidrar till' : 'Bidrag från'}
    />
  ))}
  {isTeamGoal && canManageTeamGoals && (
    <Button
      title="Koppla till individuella mål"
      icon={Link}
      onPress={handleLinkIndividualGoals}
      variant="outline"
    />
  )}
</View>
```

### 2. Smart målförslag

Implementera en ny funktion för att föreslå mål baserat på tidigare framgångar:

```jsx
<View style={styles.suggestionsContainer}>
  <Text style={styles.sectionTitle}>Föreslagna mål</Text>
  {suggestedGoals.map(goal => (
    <GoalSuggestionCard
      key={goal.id}
      suggestion={goal}
      onAccept={() => createGoalFromSuggestion(goal)}
      onDismiss={() => dismissSuggestion(goal.id)}
    />
  ))}
</View>
```

### 3. Förbättrad målprogression

Lägg till mer visuell presentation av målprogression:

- Cirkulära framstegsindikationer
- Milstolpar inom mål
- Bidragsgivare-avatarer

### 4. Team-insikter och individuella insikter

Lägg till insiktssektioner anpassade efter måltyp:

```jsx
{/* För team-mål */}
<Card style={styles.insightsCard}>
  <Text style={styles.cardTitle}>Teaminsikter</Text>
  <View style={styles.insightRow}>
    <Text style={styles.insightLabel}>Mest aktiva perioder</Text>
    <Text style={styles.insightValue}>Onsdagar & Torsdagar</Text>
  </View>
  <View style={styles.insightRow}>
    <Text style={styles.insightLabel}>Genomsnittlig måluppfyllelse</Text>
    <Text style={styles.insightValue}>{avgCompletionRate}%</Text>
  </View>
</Card>

{/* För individuella mål */}
<Card style={styles.insightsCard}>
  <Text style={styles.cardTitle}>Dina insikter</Text>
  <View style={styles.insightRow}>
    <Text style={styles.insightLabel}>Din målnivå jämfört med teamet</Text>
    <Text style={styles.insightValue}>{relativeLevelLabel}</Text>
  </View>
  <View style={styles.insightRow}>
    <Text style={styles.insightLabel}>Din mest produktiva tid</Text>
    <Text style={styles.insightValue}>{productiveTimeLabel}</Text>
  </View>
</Card>
```

## Implementation

### Steg 1: Omstrukturera arkitekturen

1. Skapa en gemensam Goals-domän med delad kod mellan individuella och team-mål
2. Migrera existerande TeamGoals och individuella Goals till den nya strukturen
3. Implementera uppdaterad datamodell med relationer mellan mål

### Steg 2: Uppdatera komponenter och stilar

1. Skapa delad GoalCard-komponent som fungerar för både team och individuella mål
2. Migrera från Card till BlurView-komponenter för mål
3. Uppdatera useStyles.ts med nya stilar för alla mål-komponenter
4. Implementera konsekventa animations- och interaktionsmönster

### Steg 3: Omstrukturera datahantering

1. Implementera React Query för optimerad datahantering
2. Skapa gemensamma hooks för målhantering
3. Lägg till stöd för paginering av längre mållistor
4. Implementera optimistiska uppdateringar för bättre användarupplevelse

### Steg 4: Utöka funktioner

1. Implementera relation mellan team- och individuella mål
2. Lägg till funktion för att länka mål till varandra
3. Skapa föreslagna mål-funktionalitet
4. Implementera insikter baserade på måldata

## Testning

### UI/UX-testning

- Testa med olika skärmstorlekar för att säkerställa responsivitet
- Validera färg/kontrast för tillgänglighet
- Genomför användartest för att validera nya interaktionsmönster
- Testa navigering mellan team- och individuella mål

### Funktionell testning

- Verifiera att behörigheter fungerar korrekt
- Testa datahämtningsscenarier inklusive fel- och offline-hantering
- Validera prestanda med stora dataset
- Testa relationer mellan mål och uppdatering av sammanhängande mål

## Tidplan

| Uppgift | Prioritet | Uppskattad tid |
|---------|-----------|----------------|
| Skapa gemensam Goals-domän | Hög | 3 dagar |
| Migrera existerande code till ny struktur | Hög | 2 dagar |
| Uppdatera styling för målkort | Hög | 2 dagar |
| Implementera gemensam statistikvy | Hög | 1 dag |
| Implementera relation mellan mål | Medium | 3 dagar |
| Refaktorera datahantering med React Query | Medium | 3 dagar |
| Implementera föreslagna mål | Medium | 2 dagar |
| Lägg till team- och individuella insikter | Låg | 2 dagar |
| Testning och buggfixar | Hög | 3 dagar |

## Förväntat resultat

- En enhetlig, skalbar och underhållbar Goals-struktur
- Mer konsekvent och attraktiv design för både team- och individuella mål
- Tydliga relationer mellan team- och individuella mål
- Förbättrad användarupplevelse vid målhantering
- Bättre integration mellan olika delar av applikationen
- Optimerad prestanda och datahantering
- Nya funktioner som ökar användar- och teamengagemang

## Implementationsplan

För att direkt börja med implementationen av den nya goal-modulen följer här en detaljerad steg-för-steg-plan:

### Fas 1: Grundläggande infrastruktur (Vecka 1)

#### Dag 1-2: Skapa typer och servicelager

1. **Skapa goals.ts i types-mappen**
   - Definiera `GoalScope` ('individual' | 'team')
   - Definiera `GoalStatus` ('active' | 'completed' | 'canceled')
   - Definiera `Goal`-interfacet med alla nödvändiga egenskaper
   - Definiera `Milestone`-interfacet för delmål

2. **Skapa goalService.ts i services-mappen**
   - Implementera grundläggande CRUD-operationer
   - Implementera hämtning av mål med olika filter
   - Implementera funktioner för att hantera relationer mellan mål

#### Dag 3-4: Implementera hooks och tillståndshantering

1. **Skapa useGoals.ts i hooks-mappen**
   - Implementera React Query-hook för att hämta mål
   - Implementera mutations för att skapa, uppdatera och ta bort mål
   - Implementera cachehantering och optimistiska uppdateringar

2. **Skapa useGoalState.ts för komplex tillståndshantering**
   - Använd useReducer för hantering av formulärtillstånd
   - Implementera logik för filtrering och sortering

#### Dag 5: Databasmigrering

1. **Skapa ny databasstruktur**
   - Skapa ny `goals`-tabell med stöd för både team- och individuella mål
   - Lägg till `scope`-fält för att skilja på måltyper
   - Lägg till relationsfält för koppling mellan mål

### Fas 2: UI-komponenter (Vecka 2)

#### Dag 1-2: Grundläggande komponenter

1. **Skapa components/goals-mappen**
2. **Implementera GoalCard.tsx**
   - Skapa grundläggande kortvy med BlurView
   - Implementera varianter för team/individuella mål
   - Lägg till stöd för framstegsindikatorer

3. **Implementera GoalForm.tsx**
   - Skapa formulär för att skapa och redigera mål
   - Lägg till olika fält baserat på måltyp
   - Implementera validering

#### Dag 3-4: Listning och filtrering

1. **Implementera GoalList.tsx**
   - Skapa komponent för att visa listan av mål
   - Implementera virtualisering med FlatList
   - Hantera tom-tillstånd och laddningstillstånd

2. **Implementera GoalFilters.tsx**
   - Skapa filterkomponent för olika vyer
   - Implementera sorteringsalternativ

#### Dag 5: Statistik och insikter

1. **Implementera GoalStats.tsx**
   - Skapa kort för statistikvisning
   - Hantera olika statistik baserat på måltyp
   - Lägg till animationer för förbättrad användarupplevelse

### Fas 3: Skärmimplementation (Vecka 3)

#### Dag 1-2: Individuella mål-skärm

1. **Uppdatera app/(tabs)/goals/index.tsx**
   - Implementera ny design med BlurView
   - Använd de nya komponenterna
   - Hantera navigation och interaktioner

#### Dag 3-4: Team-mål-skärm

1. **Uppdatera app/(tabs)/team/goals/index.tsx**
   - Implementera samma design och komponenter
   - Anpassa för team-specifika funktioner
   - Säkerställ behörighetshantering

#### Dag 5: Detaljvyer

1. **Implementera gemensam måldetaljvy**
   - Skapa detaljerad vy för ett specifikt mål
   - Lägg till funktioner för att redigera mål
   - Visa relaterade mål

### Fas 4: Avancerade funktioner (Vecka 4)

#### Dag 1-2: Sammankopplade mål

1. **Implementera RelatedGoals-komponent**
   - Visa relaterade mål
   - Hantera koppling mellan mål
   - Implementera UI för att hantera relationer

#### Dag 3-4: Målförslag och insikter

1. **Implementera GoalSuggestions-komponent**
   - Skapa algoritm för att föreslå mål
   - Implementera UI för förslagen
   - Hantera accepterande av förslag

2. **Implementera Insights-komponent**
   - Extrahera och beräkna insikter från måldata
   - Implementera visualiseringar
   - Anpassa för olika måltyper

#### Dag 5: Polering och optimering

1. **Prestandaoptimering**
   - Memoization för att förhindra onödiga omrenderingar
   - Optimera dataflöden
   - Kontrollera memoryläckor

2. **Animationsförbättringar**
   - Lägg till mikrointeraktioner
   - Förbättra övergångar

### Fas 5: Testning och lansering (Vecka 5)

#### Dag 1-2: Testning

1. **Enhets- och komponenttester**
   - Skriv tester för viktiga komponenter
   - Testa dataflöden och tillståndshantering

2. **E2E-tester**
   - Testa hela flöden från början till slut
   - Verifiera att allt fungerar som förväntat

#### Dag 3: Buggfixar och förbättringar

1. **Åtgärda problem som upptäckts under testning**
2. **Implementera feedback från första testarna**

#### Dag 4-5: Lansering och dokumentation

1. **Förbered för lansering**
   - Skapa migrations-script för existerande data
   - Förbered stegvis utrullning

2. **Dokumentation**
   - Uppdatera användarguider
   - Skapa teknisk dokumentation för teamet 

## Implementationsstatus (Uppdaterad 2024-06-15)

### Implementerade komponenter

#### Grundläggande infrastruktur
- ✅ **types/goal.ts**: GoalScope, GoalStatus, Goal och Milestone-interfaces har skapats
- ✅ **services/goalService.ts**: CRUD-operationer implementerade med Supabase-integration
- ✅ **hooks/useGoals.ts**: React Query-hooks för datahämtning och cachning har implementerats
- ✅ **services/tagService.ts**: Service för att hantera mål-taggar
- ✅ **hooks/useTags.ts**: React Query-hooks för tagghantering

#### UI-komponenter
- ✅ **GoalCard.tsx**: Grundläggande kortkomponent med BlurView-effekter för att visa mål
- ✅ **GoalForm.tsx**: Formulär för att skapa och redigera mål med validering
- ✅ **GoalList.tsx**: Virtualiserad lista av mål med laddningstillstånd och tom lista-hantering
- ✅ **GoalFilters.tsx**: Komponent för att filtrera och sortera mål
- ✅ **GoalDetailCard.tsx**: Komponent för att visa detaljerad information om ett mål
- ✅ **RelatedGoalCard.tsx**: Komponent för att visa relaterade mål
- ✅ **RelatedGoalsList.tsx**: Hantering av målrelationer (optimerad för att undvika nästlade scrollvyer)
- ✅ **TagBadge.tsx**: Visuell representation av en tagg med subtil gråskala design
- ✅ **TagList.tsx**: Lista med taggar för mål med förbättrad visuell design
- ✅ **TagSelector.tsx**: Komponent för att välja och hantera taggar för ett mål
- ✅ **TagFilterSelector.tsx**: Filterkomponent för att filtrera mål baserat på taggar med förbättrad UI

#### Skärmar
- ✅ **GoalListScreen.tsx**: Huvudskärm för att lista och filtrera mål
- ✅ **GoalDetailScreen.tsx**: Skärm för att visa detaljer om ett specifikt mål
- ✅ **GoalFormScreen.tsx**: Skärm för att skapa eller redigera mål

### Pågående arbete
- ⏳ **API-integration**: Optimering av datahämtning för relaterade data
- ⏳ **Prestandaförbättringar**: Fortsatt optimering av rendering och cachning
- ⏳ **Mobilanpassning**: Ytterligare förbättringar av responsiv design och touch-interaktioner

### Nyligen slutförda förbättringar
- ✅ **UI-förbättringar för taggar**: Implementerat neutral gråskala design för TagBadge och relaterade komponenter
- ✅ **Prestandaoptimering**: Ersatt nästlade VirtualizedLists med optimerad View+map implementation i RelatedGoalsList
- ✅ **Bugfixar**: Åtgärdat undefined-komponenter i GoalForm och TagSelector genom korrekta imports
- ✅ **Optimerad mobildesign**: Förbättrad BlurView-implementation och subtila gradienter för bättre mobilupplevelse
- ✅ **Tagghantering**: Uppdaterad TagSelector med förbättrad sökfunktionalitet och layout

### Kommande arbete
- 📝 **GoalStatistics.tsx**: Statistikkomponent för mål
- 📝 **TeamGoalDashboard.tsx**: Dashboard för team-mål
- 📝 **GoalShareSheet.tsx**: Komponent för att dela mål med team eller användare

## Nästa steg (Uppdaterad 2024-06-15)
1. ✅ Implementera grundläggande CRUD-operationer för mål
2. ✅ Implementera UI-komponenter för att visa och redigera mål
3. ✅ Skapa relaterade mål-funktionalitet
4. ✅ Implementera tagghantering för mål
5. ✅ Förbättra visuell design och prestanda för taggkomponenter
6. ⏳ Optimera mobilupplevelse och touch-interaktioner
7. 📝 Implementera målstatistik och rapportering
8. 📝 Förbättra UX för målframsteg
9. 📝 Lägga till meddelandesystem för att kommunicera om mål

### Tidplan
- **Vecka 1 (avslutad)**: Grundläggande infrastruktur och datamodell
- **Vecka 2 (avslutad)**: Implementering av UI-komponenter 
- **Vecka 3 (avslutad)**: Relaterade mål och API-förbättringar
- **Vecka 4 (avslutad)**: Tagghantering och filterförbättringar
- **Vecka 5 (avslutad)**: UI-polish, mobilanpassningar och prestandaoptimering
  - ✅ Förbättrad TagBadge-design med neutral gråskala
  - ✅ Optimerad RelatedGoalsList utan nästlade VirtualizedLists
  - ✅ Åtgärdade undefined-komponenter i GoalForm och TagSelector
  - ✅ Förbättrad BlurView-implementation för mobil
- **Vecka 6 (pågående)**: 
  - ⏳ Ytterligare mobilanpassningar och touch-interaktioner
  - ⏳ Prestandaoptimering för stora datamängder
  - 📝 Implementera målstatistik och rapportering
- **Vecka 7 (planerad)**:
  - 📝 Slutpolering av användarupplevelsen
  - 📝 Testning på olika enheter och plattformar
  - 📝 Dokumentation och förberedelser för lansering

## Tagghantering
Tagghanteringen är nu fullt implementerad med följande funktionalitet:

1. Visa taggar i både målkort och detaljvy med förbättrad visuell design
2. Skapa nya taggar direkt i målformuläret
3. Filtrera mål baserat på taggar
4. Hantera taggar för befintliga mål (lägga till/ta bort)

Taggarna använder en relationstabell (`goal_tag_relations`) för att koppla taggar till mål, vilket möjliggör många-till-många relationer. Varje tagg har en färg som användaren kan välja, och kan återanvändas över flera mål.

Service-lagret stödjer nu:
- Hämta alla taggar
- Skapa nya taggar
- Uppdatera befintliga taggar
- Ta bort taggar
- Lägga till/ta bort taggar från mål

Taggkomponenterna har nyligen genomgått visuella förbättringar för att få ett mer konsekvent och subtilt utseende, med neutrala gråa toner istället för starka färger, vilket förbättrar användarupplevelsen och läsbarheten på både webb- och mobilplattformar.

## UI-optimeringar
Vi har implementerat flera viktiga UI-förbättringar:

1. **Enhetlig färgpalett**: 
   - Implementerat subtil gråskala för TagBadge och containers
   - Förbättrad kontrast för text och ikoner
   - Konsekvent användning av transparens för djupeffekt

2. **Förbättrad mobilupplevelse**:
   - Optimerad BlurView-implementation för bättre prestanda
   - Anpassad touch-interaktion för taggval
   - Förbättrad scrollning genom eliminering av nästlade listor

3. **Prestandaförbättringar**:
   - Ersatt FlatList med optimerad View+map i RelatedGoalsList
   - Förbättrad renderingsprestanda för taggkomponenter
   - Optimerad hantering av stora datamängder

4. **Komponentförbättringar**:
   - Uppdaterad TagBadge med subtil gradient och förbättrad läsbarhet
   - Förbättrad TagSelector med optimerad sökfunktionalitet
   - Uppdaterad RelatedGoalsList med bättre prestanda och användbarhet

Dessa förbättringar bibehåller applikationens designspråk samtidigt som de förbättrar användarupplevelsen, särskilt på mindre skärmar och mobila enheter.

## Detaljerad planering för vecka 6

### Mobilanpassningar och touch-interaktioner

#### Touch-optimering
1. **Förbättrad dragkänslighet**
   ```typescript
   const TouchableGoalCard: React.FC<Props> = ({ goal, onPress }) => {
     const [gesture] = useState(() => {
       const gesture = Gesture.Pan()
         .onStart(() => {
           runOnJS(handleGestureStart)();
         })
         .onUpdate((e) => {
           runOnJS(handleGestureUpdate)(e);
         })
         .onEnd(() => {
           runOnJS(handleGestureEnd)();
         });
       return gesture;
     });

     return (
       <GestureDetector gesture={gesture}>
         <Animated.View>
           <GoalCard goal={goal} />
         </Animated.View>
       </GestureDetector>
     );
   };
   ```

2. **Haptic feedback**
   ```typescript
   const handleGoalComplete = async () => {
     try {
       await haptics.impactAsync(haptics.ImpactFeedbackStyle.Medium);
       await completeGoal(goalId);
       showSuccessToast('Mål avklarat!');
     } catch (error) {
       console.error('Fel vid måluppdatering:', error);
     }
   };
   ```

#### Responsiv layout
1. **Dynamisk anpassning**
   ```typescript
   const useResponsiveLayout = () => {
     const { width } = useWindowDimensions();
     const isTablet = width >= 768;
     
     return {
       containerStyle: {
         padding: isTablet ? 24 : 16,
         columnCount: isTablet ? 2 : 1
       },
       cardStyle: {
         width: isTablet ? '48%' : '100%'
       }
     };
   };
   ```

2. **Plattformsspecifika justeringar**
   ```typescript
   const platformStyles = StyleSheet.create({
     container: {
       ...Platform.select({
         ios: {
           shadowColor: colors.shadow,
           shadowOffset: { width: 0, height: 2 },
           shadowOpacity: 0.25,
           shadowRadius: 3.84,
         },
         android: {
           elevation: 5,
         },
       }),
     },
   });
   ```

### Prestandaoptimering

#### Memoization och renderingsoptimering
1. **Implementera useMemo för tunga beräkningar**
   ```typescript
   const GoalStatistics: React.FC<Props> = ({ goals }) => {
     const statistics = useMemo(() => {
       return calculateGoalStatistics(goals);
     }, [goals]);

     return (
       <StatisticsView data={statistics} />
     );
   };
   ```

2. **Virtualisering för stora listor**
   ```typescript
   const OptimizedGoalList: React.FC<Props> = ({ goals }) => {
     const renderItem = useCallback(({ item }) => (
       <GoalCard goal={item} />
     ), []);

     return (
       <FlashList
         data={goals}
         renderItem={renderItem}
         estimatedItemSize={200}
         keyExtractor={item => item.id}
       />
     );
   };
   ```

### Målstatistik och rapportering

#### Statistikkomponenter
1. **GoalProgress-komponent**
   ```typescript
   const GoalProgress: React.FC<Props> = ({ goal }) => {
     const progress = calculateProgress(goal);
     
     return (
       <View style={styles.progressContainer}>
         <CircularProgress
           value={progress}
           radius={30}
           duration={1000}
           textColor={colors.text.main}
           activeStrokeColor={colors.accent.green}
           inActiveStrokeColor={colors.background.light}
         />
         <Text style={styles.progressText}>
           {`${Math.round(progress)}% slutfört`}
         </Text>
       </View>
     );
   };
   ```

2. **TeamContribution-komponent**
   ```typescript
   const TeamContribution: React.FC<Props> = ({ goalId }) => {
     const { data: contributions } = useTeamContributions(goalId);
     
     return (
       <View style={styles.contributionsContainer}>
         <Text style={styles.sectionTitle}>Teambidrag</Text>
         {contributions.map(contribution => (
           <ContributionBar
             key={contribution.userId}
             user={contribution.user}
             percentage={contribution.percentage}
             color={contribution.color}
           />
         ))}
       </View>
     );
   };
   ```

#### Datavisualisering
1. **Trendanalys**
   ```typescript
   const GoalTrends: React.FC<Props> = ({ goalId }) => {
     const { data: trends } = useGoalTrends(goalId);
     
     return (
       <View style={styles.trendsContainer}>
         <Text style={styles.sectionTitle}>Framstegstrend</Text>
         <LineChart
           data={trends}
           width={Dimensions.get('window').width - 32}
           height={220}
           chartConfig={{
             backgroundColor: colors.background.main,
             backgroundGradientFrom: colors.background.light,
             backgroundGradientTo: colors.background.dark,
             decimalPlaces: 0,
             color: (opacity = 1) => colors.accent.yellow,
             labelColor: (opacity = 1) => colors.text.light,
             style: {
               borderRadius: 16
             }
           }}
           bezier
           style={{
             marginVertical: 8,
             borderRadius: 16
           }}
         />
       </View>
     );
   };
   ```

2. **Prestationsöversikt**
   ```typescript
   const PerformanceOverview: React.FC<Props> = ({ teamId }) => {
     const { data: performance } = useTeamPerformance(teamId);
     
     return (
       <View style={styles.performanceContainer}>
         <Text style={styles.sectionTitle}>Teamprestanda</Text>
         <View style={styles.statsGrid}>
           {renderStatCard('Genomsnittlig måluppfyllelse', 
             `${performance.avgCompletion}%`, 
             performance.avgCompletion > 80)}
           {renderStatCard('Aktiva mål', 
             performance.activeGoals, 
             performance.activeGoals > 0)}
           {renderStatCard('Mål i tid', 
             `${performance.onTimePercentage}%`, 
             performance.onTimePercentage > 90)}
         </View>
       </View>
     );
   };
   ```

### Implementationsordning för vecka 6

#### Dag 1-2: Touch och responsivitet
- Implementera förbättrad touch-hantering
- Lägg till haptic feedback
- Anpassa layouts för olika skärmstorlekar
- Implementera plattformsspecifika optimeringar

#### Dag 3-4: Prestandaoptimering
- Implementera memoization för tunga beräkningar
- Optimera renderingsprestanda
- Förbättra listhantering med FlashList
- Implementera lazy loading för bilder och innehåll

#### Dag 5: Statistik och rapportering
- Implementera grundläggande statistikkomponenter
- Skapa datavisualiseringskomponenter
- Integrera med befintlig måldata
- Testa och optimera prestanda 

## Förbättringsområden / Råd

- Tjänster som TransactionGoalService och liknande ska placeras i ett separat orchestration-lager, inte i domänen själv.
- Domänen ska hållas ren från cross-domain-logik. 