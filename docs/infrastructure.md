# Infrastruktur för Pling-applikationen

Detta dokument beskriver infrastrukturlagret i Pling-applikationen, inklusive caching, loggning, databasoptimering och prestandaövervakning.

## Innehållsförteckning

1. [Översikt](#översikt)
2. [Cachingstrategi](#cachingstrategi)
3. [Loggning och övervakning](#loggning-och-övervakning)
4. [Prestandaövervakning](#prestandaövervakning)
5. [Databasoptimering](#databasoptimering)
6. [Användning](#användning)

## Översikt

Infrastrukturlagret i Pling-applikationen hanterar kommunikation med externa tjänster och resurser. Det är ansvarigt för:

- Databasåtkomst via Supabase
- Cachning av data för att minska databasfrågor
- Loggning av händelser och fel
- Prestandaövervakning och rapportering
- Optimering av databasfrågor

Alla dessa tjänster är implementerade med en singleton-mönster och tillgängliga via `InfrastructureFactory`.

## Cachingstrategi

### CacheService

`CacheService` är en centraliserad cachningtjänst som erbjuder:

- TTL (Time-To-Live) med automatisk utgång
- Versionshantering för cache-invalidering
- Transparent cache-missar
- Namnutrymmen för att isolera datamängder
- Loggning av cachehändelser

#### Viktiga funktioner:

- `get<T>(key: string): Promise<T | null>` - Hämtar ett värde från cachen eller null om det inte finns eller har gått ut
- `set<T>(key: string, value: T): Promise<void>` - Sparar ett värde i cachen
- `getOrSet<T>(key: string, loader: () => Promise<T>): Promise<T>` - Hämtar ett värde från cachen eller använder loader-funktionen om värdet inte finns
- `remove(key: string): Promise<void>` - Tar bort ett värde från cachen
- `clear(): Promise<void>` - Rensar hela cachen

### Implementerad caching

Användardataåtkomst är nu cachad med följande strategier:

- Användar-ID lookups (15 minuters TTL)
- E-post lookups (15 minuters TTL)
- Team lookups (15 minuters TTL)
- Automatisk cache-invalidering vid uppdateringar

## Loggning och övervakning

### LoggingService

`LoggingService` är en centraliserad loggningstjänst som erbjuder:

- Olika loggnivåer (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- Strukturerad loggning med kontext
- Fjärrloggning (tillval)
- Batch-loggning för prestandaoptimering
- Händelsetracking för analytics

#### Viktiga funktioner:

- `debug(message: string, context?: Record<string, any>): void`
- `info(message: string, context?: Record<string, any>): void`
- `warning(message: string, context?: Record<string, any>): void`
- `error(message: string, context?: Record<string, any>): void`
- `critical(message: string, context?: Record<string, any>): void`
- `trackEvent(eventName: string, properties?: Record<string, any>): void`
- `trackScreen(screenName: string, properties?: Record<string, any>): void`

## Prestandaövervakning

### PerformanceMonitor

`PerformanceMonitor` övervakar och rapporterar prestanda för olika operationer i applikationen:

- Mätning av operationstider
- Identifiering av långsamma operationer
- Statistikberäkning och rapportering
- Kategorisering av operationer (databas, nätverk, etc.)

#### Viktiga funktioner:

- `measure<T>(type: OperationType, name: string, operation: () => Promise<T>): Promise<T>` - Mäter tiden för en operation
- `startOperation(type: OperationType, name: string): string` - Startar mätning av en operation
- `endOperation(id: string, success: boolean): void` - Avslutar mätning av en operation

## Databasoptimering

### Optimerad databasåtkomst

`OptimizedUserRepository` erbjuder optimerad databasåtkomst genom:

- Indexerade frågor för snabbare sökningar
- Caching av vanliga frågor
- Batchade databasoperationer
- Prestandaövervakning och loggning
- Automatisk cache-invalidering

### Databasindex

Följande index är implementerade och driftsatta i produktionsmiljön för att förbättra prestanda:

- `idx_profiles_user_id` - Index för användar-ID i profiles
- `idx_user_settings_user_id` - Index för användar-ID i user_settings
- `idx_user_preferences_user_id` - Index för användar-ID i user_preferences
- `idx_users_email` - Index för e-post i users
- `idx_users_name` - Index för namn i users
- `idx_users_status` - Index för status i users
- `idx_users_settings` - GIN-index för JSONB-inställningar
- `idx_user_relationships_follower` - Index för följare i user_relationships
- `idx_user_relationships_following` - Index för följda i user_relationships
- `idx_user_permissions_user_id` - Index för användar-ID i user_permissions
- `idx_user_permissions_name` - Index för behörighetsnamn i user_permissions

Dessa index möjliggör följande prestandaförbättringar:

1. Snabbare användarinloggningar genom optimerade e-postsökningar
2. Effektivare filtrering baserat på användarstatus och namn
3. Förbättrad åtkomst till JSONB-data genom GIN-index för inställningar
4. Optimerade relationsbaserade frågor (följare/följda)
5. Snabbare behörighetskontroller med indexerade sökningar

### Genomförd databasmigrering

En SQL-migrering har framgångsrikt genomförts i produktionsmiljön via Supabase MCP. Migreringen skapade alla nödvändiga index och uppdaterade statistik för optimeraren, vilket resulterar i avsevärt snabbare frågor mot användarrelaterade tabeller.

Exempel på SQL-migrering:

```sql
-- Index för email i users-tabellen
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Index för status i users-tabellen
CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);

-- Index för namn i users-tabellen
CREATE INDEX IF NOT EXISTS idx_users_name ON users (name);

-- GIN-index för JSONB-inställningar
CREATE INDEX IF NOT EXISTS idx_users_settings ON users USING GIN (settings);

-- Index för user_id i user_settings
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings (user_id);

-- Analyser tabeller för att uppdatera statistik för optimering
ANALYZE users;
ANALYZE user_settings;
```

## Användning

### Använda InfrastructureFactory

```typescript
// Hämta infrastrukturfactory
const infrastructureFactory = InfrastructureFactory.getInstance(
  supabase,
  getEventBus(),
  {
    // Konfiguration här
  }
);

// Hämta användarrepository
const userRepository = infrastructureFactory.getUserRepository();

// Hämta loggningstjänst
const logger = infrastructureFactory.getLogger();

// Hämta prestandaövervakning
const performanceMonitor = infrastructureFactory.getPerformanceMonitor();
```

### Använda useOptimizedUserDependencies

```typescript
import { useOptimizedUserDependencies } from '@/application/user/hooks/useOptimizedUserDependencies';

const MyComponent = () => {
  const { userRepository, logger, performanceMonitor } = useOptimizedUserDependencies();
  
  // Använd dessa tjänster i din komponent
};
```

## Förbättringspunkter

Följande områden kan förbättras ytterligare i framtiden:

1. Implementera distribuerade cacher (t.ex. Redis) för klustermiljöer
2. Utöka prestandarapportering med grafiska dashboards
3. Implementera automatisk skalning baserat på prestandadata
4. Optimera cache-strategier baserat på användningsmönster
5. Utveckla mer avancerade databasfrågor med materializedviews
6. Implementera real-time synkronisering mellan cacher i olika klienter 