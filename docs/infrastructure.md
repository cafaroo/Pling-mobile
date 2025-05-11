# Infrastruktur för Pling-applikationen

Detta dokument beskriver infrastrukturlagret i Pling-applikationen, inklusive caching, loggning, databasoptimering och prestandaövervakning.

## Innehållsförteckning

1. [Översikt](#översikt)
2. [Cachingstrategi](#cachingstrategi)
3. [Loggning och övervakning](#loggning-och-övervakning)
4. [Prestandaövervakning](#prestandaövervakning)
5. [Databasoptimering](#databasoptimering)
6. [Användning](#användning)
7. [Viktiga integrationspunkter](#viktiga-integrationspunkter)

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

## Viktiga integrationspunkter

### Auth.users och Profiles

#### Aktuell implementation

Vi har uppdaterat hanteringen av användarautentisering och profiledata för att följa bästa praxis för Supabase:

1. **Email-hantering**: 
   - Email lagras nu enbart i `auth.users`-tabellen, inte i `profiles`
   - Detta eliminerar redundans och potentiella synkroniseringsproblem
   - AuthContext hämtar email från auth-systemet och profiledata separat

2. **Profildata**:
   - Profildata lagras i `profiles`-tabellen (first_name, last_name, display_name, etc.)
   - User-objektet komponeras ihop av data från båda källor:
     ```typescript
     setUser({
       id: profileData.id,
       email: email, // Från auth.users
       name: profileData.display_name || 
             (profileData.first_name && profileData.last_name 
               ? `${profileData.first_name} ${profileData.last_name}` 
               : profileData.first_name || null),
       // Övriga profilfält...
     });
     ```

3. **Hantering av saknade kolumner**:
   - Koden är nu robust mot ändringar i databasschema
   - Fallback-värden används när kolumner saknas
   - Felhantering är implementerad för att hantera databasförändringar

Detta säkerställer en korrekt separation av ansvarsområden mellan autentisering och användarprofildata, följer Supabase rekommendationer, och ökar systemets robusthet vid databasändringar.

## Supabase-integrering och säkerhet

### Supabase-klientarkitektur

Vi har implementerat en enhetlig arkitektur för Supabase-klienten:

1. **En enda källa:**
   - Hela applikationen använder Supabase-klienten som exporteras från `src/lib/supabase.ts`
   - Andra moduler som behöver Supabase-klienten importerar den från denna källa
   - Detta förhindrar problem med flera `GoTrueClient`-instanser

2. **Korrekt koddelning:**
   - Infrastrukturlagret re-exporterar supabase-klienten för att bibehålla rena gränser
   - Tjänster och repositories använder bara den centrala klienten
   - Testmockar använder konsekvent samma pattern

```typescript
// Exempel på korrekt import av supabase-klienten
import { supabase } from '@/lib/supabase';

// INTE detta (skapar en ny klient):
// import { createClient } from '@supabase/supabase-js';
// const supabase = createClient(...);
```

### Row Level Security (RLS)

Vi har implementerat robusta RLS-policyer för databasåtkomst:

1. **För profiles-tabellen:**
   - `Users can view their own profile` - Användare kan endast se sin egen profil
   - `Users can update their own profile` - Användare kan endast uppdatera sin egen profil
   - `Users can insert their own profile` - Användare kan skapa sin egen profil
   - `Service role can insert profiles` - Service role kan skapa profiler
   - `Admin role can do all operations` - Administratörer har full kontroll

2. **För andra tabeller:**
   - Liknande separation av behörigheter baserat på användarroller
   - Konsekvent användning av `auth.uid()` för att begränsa åtkomst

3. **Implementationsguide:**
   - Alla ändringar i RLS-policyer måste göras genom migrationsfiler
   - Alltid testa ändringar i RLS-policyer noggrant
   - Dokumentera alla RLS-policyer i projektdokumentationen 

## Organisationsinbjudningssystem

### Databasoptimering för inbjudningar

`SupabaseOrganizationRepository` har implementerats för att effektivt hantera organisationer och deras inbjudningar. Följande optimeringar har gjorts för inbjudningssystemet:

- Indexerade tabeller för snabb åtkomst till inbjudningar
- Triggerfunktioner för att automatiskt hantera utgångna inbjudningar
- Optimerade JOIN-frågor för att hämta organisations- och inbjudningsdata samtidigt
- Row-Level Security (RLS) för säkerhetsoptimerad filtrering
- Cachningsstrategi med 5 minuters TTL och automatisk cache-invalidering vid ändringar

### Databasindex för inbjudningssystemet

Följande index är implementerade för att optimera prestandan för inbjudningsrelaterade operationer:

- `idx_organization_invitations_org_id` - Index för organizations-ID i organization_invitations
- `idx_organization_invitations_user_id` - Index för användar-ID i organization_invitations
- `idx_organization_invitations_status` - Index för status i organization_invitations

Dessa index förbättrar prestandan för:

1. Hämtning av alla inbjudningar för en organisation
2. Hämtning av alla inbjudningar för en användare
3. Filtrering baserat på inbjudningsstatus (pending, accepted, etc.)

### Databastriggers för inbjudningshantering

För att automatiskt hantera utgångna inbjudningar har följande databastriggers implementerats:

```sql
-- Trigger för att automatiskt markera utgångna inbjudningar vid uppdatering
CREATE TRIGGER check_invitation_expiration
BEFORE UPDATE ON organization_invitations
FOR EACH ROW
EXECUTE FUNCTION handle_expired_invitations();
```

Triggerfunktionen kontrollerar utgångsdatum och uppdaterar status automatiskt:

```sql
CREATE OR REPLACE FUNCTION handle_expired_invitations()
RETURNS TRIGGER AS $$
BEGIN
  -- Om vi försöker uppdatera en inbjudan men den har gått ut, markera den som utgången
  IF OLD.status = 'pending' AND NEW.status = 'pending' AND NEW.expires_at < NOW() THEN
    NEW.status = 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Cachningsstrategier för organisationsdata

`SupabaseOrganizationRepository` implementerar nu följande cachningsstrategier:

1. **Entitets-caching**:
   - Hela organisationsobjekt med medlemmar, inbjudningar och team cachas
   - TTL på 5 minuter för balans mellan prestanda och datafräschhet
   - Automatisk cache-invalidering vid uppdateringar

2. **Cache-hantering**:
   - Selektiv invalidering vid ändringar: endast påverkade organisationer invalideras
   - Versionshantering av cache tillåter global invalidering vid större ändringar
   - Prestandaövervakning av cache-träffar och -missar

3. **Cache-nyckelstruktur**:
   ```
   organization:{id} -> Organisation-entitet med alla relationer
   ```

### Prestandaoptimerad repository-implementation

`SupabaseOrganizationRepository` implementerar flera prestandaoptimeringar:

1. **Optimerade Select-frågor** med nested struktur för att minska antalet databasfrågor:
   ```typescript
   const { data } = await this.supabase
     .from('organizations')
     .select(`
       *,
       members:organization_members(...)
     `)
     .eq('id', id.toString())
     .single();
   ```

2. **Batch-operationer** för effektivare databasuppdateringar:
   ```typescript
   // Uppdatera alla inbjudningar i en batch
   const { error } = await this.supabase
     .from('organization_invitations')
     .upsert(invitationsToUpdate);
   ```

3. **Prestandamätning och loggning**:
   - Alla operationer mäts och loggas för prestandaanalys
   - Långsamma operationer flaggas automatiskt

4. **Optimerad felhantering**:
   - Strukturerad felrapportering och loggning
   - Informativa felmeddelanden för enklare felsökning

Dessa optimeringar resulterar i väsentligt förbättrad prestanda för hantering av organisationsinbjudningar, särskilt i system med många organisationer och användare.

### Repository Factory och Dependency Injection

Infrastrukturlagret använder factory-pattern för att skapa repository-instanser med korrekt konfigurerad caching:

```typescript
// Från InfrastructureFactory
public getOrganizationRepository(): OrganizationRepository {
  if (!this.organizationRepository) {
    const cache = this.getCacheService('organization');
    const logger = this.getLogger();
    const performanceMonitor = this.getPerformanceMonitor();
    
    this.organizationRepository = new SupabaseOrganizationRepository(
      this.supabase,
      this.eventBus,
      cache,
      logger,
      performanceMonitor
    );
  }
  
  return this.organizationRepository;
}
```

Detta säkerställer att alla komponenter använder samma repository-instans med konsistent cachning och prestandamätning. 