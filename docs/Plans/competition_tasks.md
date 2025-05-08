# Competition Förbättringsplan

## Översikt

Detta dokument beskriver en plan för att implementera och förbättra tävlingsfunktionaliteten i Pling-applikationen. Målet är att skapa en engagerande och motiverande tävlingsmiljö som integreras väl med befintliga team- och målfunktioner.

## Innehållsförteckning

1. [Nulägesanalys](#nulägesanalys)
2. [Förbättringsområden](#förbättringsområden)
3. [Arkitekturell förändring](#arkitekturell-förändring)
4. [Designförbättringar](#designförbättringar)
5. [Funktionella förbättringar](#funktionella-förbättringar)
6. [Implementation](#implementation)
7. [Testning](#testning)
8. [Implementationsplan](#implementationsplan)

## Nulägesanalys

### Behov och möjligheter

- Behov av att öka engagemang och motivation inom teams
- Möjlighet att skapa hälsosam konkurrens mellan team och individer
- Potential att koppla tävlingar till befintliga mål och KPIs
- Behov av realtidsuppdateringar och notifieringar
- Möjlighet att visualisera framsteg och prestationer

### Tekniska förutsättningar

- Befintlig team- och målstruktur kan återanvändas
- Supabase-integration för realtidsuppdateringar
- React Native-komponenter för visualisering
- Expo-router för navigation

## Arkitekturell förändring

### Gemensam Competition-domän

```
/components
  /competition           # Gemensamma tävlingskomponenter
    CompetitionCard.tsx  # Kortvy för tävlingar
    CompetitionForm.tsx  # Formulär för att skapa/redigera tävlingar
    LeaderBoard.tsx      # Resultattavla
    CompetitionStats.tsx # Statistikkomponent
    PrizeDisplay.tsx     # Visning av priser/belöningar
    
/hooks
  useCompetition.ts      # Hook för tävlingshantering
  useLeaderboard.ts      # Hook för resultattavla
  
/services
  competitionService.ts  # API-integration för tävlingar
  
/types
  competition.ts         # Typdefinitioner för tävlingar
  
/app
  /competition
    /[id].tsx           # Detaljvy för specifik tävling
    /create.tsx         # Skapa ny tävling
    /leaderboard.tsx    # Global resultattavla
```

### Uppdaterad Datamodell

```typescript
export type CompetitionScope = 'individual' | 'team' | 'global';
export type CompetitionStatus = 'upcoming' | 'active' | 'completed' | 'canceled';

export interface Competition {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  scope: CompetitionScope;
  status: CompetitionStatus;
  created_by: string;
  team_id?: string;
  goal_id?: string;
  rules: CompetitionRule[];
  prizes: Prize[];
  participants: Participant[];
  metrics: CompetitionMetric[];
}

export interface CompetitionRule {
  id: string;
  competition_id: string;
  description: string;
  type: 'requirement' | 'restriction' | 'bonus';
  value: any;
}

export interface Prize {
  id: string;
  competition_id: string;
  title: string;
  description: string;
  rank: number;
  value?: number;
}

export interface Participant {
  id: string;
  competition_id: string;
  user_id: string;
  team_id?: string;
  joined_at: string;
  current_score: number;
  rank: number;
}

export interface CompetitionMetric {
  id: string;
  competition_id: string;
  name: string;
  type: 'numeric' | 'boolean' | 'progress';
  target_value?: number;
  weight: number;
}
```

## Designförbättringar

### 1. Tävlingskort

```jsx
const CompetitionCard: React.FC<CompetitionCardProps> = ({
  competition,
  onPress,
}) => {
  const { colors } = useTheme();
  
  return (
    <TouchableOpacity onPress={onPress}>
      <BlurView intensity={20} style={styles.container}>
        <View style={styles.header}>
          <Trophy size={24} color={colors.accent.yellow} />
          <Text style={styles.title}>{competition.title}</Text>
          <CompetitionStatus status={competition.status} />
        </View>
        
        <View style={styles.content}>
          <Text style={styles.description}>{competition.description}</Text>
          <ParticipantsList participants={competition.participants} />
          <PrizePreview prizes={competition.prizes} />
        </View>
        
        <View style={styles.footer}>
          <TimeRemaining
            startDate={competition.start_date}
            endDate={competition.end_date}
          />
          <ParticipateButton
            competitionId={competition.id}
            status={competition.status}
          />
        </View>
      </BlurView>
    </TouchableOpacity>
  );
};
```

### 2. Resultattavla

```jsx
const Leaderboard: React.FC<LeaderboardProps> = ({
  competitionId,
  scope,
}) => {
  const { data, isLoading } = useLeaderboard(competitionId);
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Medal size={24} color={colors.accent.gold} />
        <Text style={styles.title}>Topplista</Text>
      </View>
      
      <FlashList
        data={data?.rankings}
        renderItem={({ item, index }) => (
          <LeaderboardRow
            rank={index + 1}
            participant={item}
            isCurrentUser={item.user_id === currentUserId}
          />
        )}
        estimatedItemSize={70}
      />
      
      <CurrentUserRank competitionId={competitionId} />
    </View>
  );
};
```

## Funktionella förbättringar

### 1. Realtidsuppdateringar

```typescript
const useCompetitionUpdates = (competitionId: string) => {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const subscription = supabase
      .channel(`competition_${competitionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'competition_scores',
        filter: `competition_id=eq.${competitionId}`,
      }, (payload) => {
        queryClient.invalidateQueries(['competition', competitionId]);
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [competitionId]);
};
```

### 2. Automatisk poängberäkning

```typescript
const calculateScore = (metrics: CompetitionMetric[], values: MetricValue[]) => {
  return metrics.reduce((total, metric) => {
    const value = values.find(v => v.metric_id === metric.id);
    if (!value) return total;
    
    switch (metric.type) {
      case 'numeric':
        return total + (value.value * metric.weight);
      case 'boolean':
        return total + (value.value ? metric.weight : 0);
      case 'progress':
        return total + ((value.value / metric.target_value) * metric.weight);
      default:
        return total;
    }
  }, 0);
};
```

## Implementation

### Steg 1: Grundläggande infrastruktur

1. **Skapa databasstruktur**
```sql
CREATE TYPE competition_scope AS ENUM ('individual', 'team', 'global');
CREATE TYPE competition_status AS ENUM ('upcoming', 'active', 'completed', 'canceled');

CREATE TABLE competitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  scope competition_scope NOT NULL,
  status competition_status NOT NULL DEFAULT 'upcoming',
  created_by UUID REFERENCES auth.users(id),
  team_id UUID REFERENCES teams(id),
  goal_id UUID REFERENCES goals(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Triggers för att hantera status automatiskt
CREATE FUNCTION update_competition_status() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.start_date > NOW() THEN
    NEW.status = 'upcoming';
  ELSIF NEW.end_date < NOW() THEN
    NEW.status = 'completed';
  ELSE
    NEW.status = 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER competition_status_update
  BEFORE INSERT OR UPDATE ON competitions
  FOR EACH ROW
  EXECUTE FUNCTION update_competition_status();
```

2. **Implementera grundläggande services**
```typescript
export class CompetitionService {
  async createCompetition(data: CreateCompetitionDTO): Promise<Competition> {
    const { data: competition, error } = await supabase
      .from('competitions')
      .insert(data)
      .select()
      .single();
      
    if (error) throw error;
    return competition;
  }
  
  async getCompetition(id: string): Promise<Competition> {
    const { data: competition, error } = await supabase
      .from('competitions')
      .select(`
        *,
        rules (*),
        prizes (*),
        participants (
          *,
          user:users (id, name, avatar_url),
          team:teams (id, name)
        ),
        metrics (*)
      `)
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return competition;
  }
  
  // ... fler metoder för CRUD-operationer
}
```

### Steg 2: UI-komponenter

1. **CompetitionList**
2. **CompetitionForm**
3. **LeaderBoard**
4. **MetricsDisplay**
5. **PrizeList**

### Steg 3: Integration

1. **Team-integration**
2. **Mål-integration**
3. **Notifieringar**
4. **Realtidsuppdateringar**

## Testning

### UI/UX-testning
- Testa responsivitet
- Validera färgschema och kontrast
- Testa användarflöden
- Verifiera realtidsuppdateringar

### Funktionell testning
- Testa poängberäkning
- Validera regler och begränsningar
- Testa deltagarhantering
- Verifiera prisutdelning

### Prestandatestning
- Testa med stort antal deltagare
- Validera realtidsuppdateringar
- Testa databasbelastning

## Tidplan

### Fas 1: Grundstruktur (Vecka 1)
- Dag 1-2: Databasschema och migrations
- Dag 3-4: Grundläggande services och hooks
- Dag 5: TypeScript-interfaces och validering

### Fas 2: UI-komponenter (Vecka 2)
- Dag 1-2: CompetitionCard och CompetitionList
- Dag 3: CompetitionForm och validering
- Dag 4-5: LeaderBoard och MetricsDisplay

### Fas 3: Integration (Vecka 3)
- Dag 1-2: Team- och målintegration
- Dag 3: Realtidsuppdateringar
- Dag 4-5: Notifieringar och händelsehantering

### Fas 4: Testning och optimering (Vecka 4)
- Dag 1-2: Enhetstester och integrationstester
- Dag 3: Prestandaoptimering
- Dag 4-5: Buggfixar och polish

## Förväntat resultat

- En robust och skalbar tävlingsplattform
- Engagerande användarupplevelse
- Sömlös integration med team och mål
- Realtidsuppdateringar och notifieringar
- Tydlig visualisering av framsteg och resultat

## Implementationsstatus

### Implementerade komponenter
- ⏳ Grundläggande databasstruktur
- ⏳ Competition-services
- ⏳ UI-komponenter

### Pågående arbete
- 📝 Realtidsuppdateringar
- 📝 Poängberäkning
- 📝 Leaderboard-implementation

### Kommande arbete
- 📝 Team-integration
- 📝 Notifieringar
- 📝 Avancerade statistikfunktioner

## Nästa steg

1. Implementera databasstruktur
2. Skapa grundläggande UI-komponenter
3. Implementera tävlingslogik
4. Integrera med team och mål
5. Testa och optimera 