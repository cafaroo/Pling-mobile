# Repository-implementering

Detta dokument beskriver hur Repository-mönstret är implementerat i Pling Mobile-applikationen. Repository-mönstret är centralt för vår domändrivna design och spelar en viktig roll i att separera domänlogik från dataåtkomst.

## Innehåll

1. [Översikt](#översikt)
2. [Grundläggande struktur](#grundläggande-struktur)
3. [Supabase-implementeringar](#supabase-implementeringar)
4. [Mappning mellan domän och persistens](#mappning-mellan-domän-och-persistens)
5. [Hantering av domänevents](#hantering-av-domänevents)
6. [Transaktioner](#transaktioner)
7. [Caching](#caching)
8. [Testning](#testning)
9. [Best practices](#best-practices)

## Översikt

Repository-mönstret tillhandahåller en abstraktion av dataåtkomst i vår applikation, vilket möjliggör:

1. Separation av domänlogik från dataåtkomst
2. Standardiserad dataåtkomst över olika aggregat
3. Möjlighet att byta datalagring utan att påverka domänlogiken
4. Centraliserng av frågelogik
5. Enklare testning genom mockning av repositories

## Grundläggande struktur

Varje repository definieras genom ett interface i domänlagret och implementeras i infrastrukturlagret:

### Repository Interface (Domänlager)

```typescript
// src/domain/team/repositories/TeamRepository.ts
export interface TeamRepository {
  findById(id: string): Promise<Result<Team>>;
  findByIds(ids: string[]): Promise<Result<Team[]>>;
  findByMemberId(memberId: string): Promise<Result<Team[]>>;
  findAll(): Promise<Result<Team[]>>;
  save(team: Team): Promise<Result<void>>;
  delete(id: string): Promise<Result<void>>;
}
```

### Repository Implementation (Infrastrukturlager)

```typescript
// src/infrastructure/repositories/SupabaseTeamRepository.ts
export class SupabaseTeamRepository implements TeamRepository {
  private supabase: SupabaseClient;
  private teamMapper: TeamMapper;
  private publisher: IDomainEventPublisher;
  private logger: Logger;

  constructor(
    supabase: SupabaseClient,
    teamMapper: TeamMapper,
    publisher: IDomainEventPublisher
  ) {
    this.supabase = supabase;
    this.teamMapper = teamMapper;
    this.publisher = publisher;
    this.logger = createLogger('SupabaseTeamRepository');
  }

  async findById(id: string): Promise<Result<Team>> {
    try {
      this.logger.info('Hämtar team', { id });

      const { data, error } = await this.supabase
        .from('teams')
        .select('*, team_members(*)')
        .eq('id', id)
        .single();

      if (error) {
        this.logger.error('Fel vid hämtning av team', { error, id });
        return Result.fail(error);
      }

      if (!data) {
        this.logger.warn('Team hittades inte', { id });
        return Result.fail(`Team med ID ${id} hittades inte`);
      }

      return this.teamMapper.toDomain(data);
    } catch (error) {
      this.logger.error('Oväntat fel vid hämtning av team', { error, id });
      return Result.fail(error);
    }
  }

  // Ytterligare metodimplementationer...
}
```

## Supabase-implementeringar

Våra repositories använder Supabase som underliggande datalagring. Detta innebär:

### Initialisering

```typescript
// src/infrastructure/supabase/config/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### Dataåtkomstmönster

Vi använder Supabase Query Builder för dataåtkomst:

```typescript
// Select med relationer
const { data, error } = await this.supabase
  .from('teams')
  .select('*, team_members(*, user:users(*))')
  .eq('organization_id', organizationId);

// Insert
const { data, error } = await this.supabase
  .from('teams')
  .insert([teamData])
  .select()
  .single();

// Update
const { error } = await this.supabase
  .from('teams')
  .update({ name: team.name.getValue() })
  .eq('id', team.id.toString());

// Delete
const { error } = await this.supabase
  .from('teams')
  .delete()
  .eq('id', id);
```

### RLS och säkerhet

```typescript
// RLS-policyer hanteras i Supabase-migrationer
// exempel på en RLS-policy för teams
// Endast användare som är medlemmar i teamet kan läsa teamdata
CREATE POLICY "Team members can view team"
ON teams
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM team_members WHERE team_id = id
  )
);
```

## Mappning mellan domän och persistens

För att översätta mellan domänmodeller och databaspersistens använder vi mapper-klasser:

### Mapper-klass

```typescript
// src/infrastructure/mappers/TeamMapper.ts
export class TeamMapper {
  static toDomain(raw: any): Result<Team> {
    try {
      // Validera raw-data
      if (!raw || !raw.id || !raw.name) {
        return Result.fail('Ogiltig team-data för mappning');
      }

      // Skapa värde-objekt
      const nameOrError = TeamName.create(raw.name);
      if (nameOrError.isFailure()) {
        return Result.fail(nameOrError.getError());
      }

      // Skapa team-entitet
      const team = Team.create(
        {
          name: nameOrError.getValue(),
          description: raw.description || '',
          createdBy: raw.created_by,
          createdAt: new Date(raw.created_at),
          organizationId: raw.organization_id
        },
        new UniqueEntityID(raw.id)
      );

      // Lägg till medlemmar om tillgängliga
      if (raw.team_members && Array.isArray(raw.team_members)) {
        raw.team_members.forEach((memberRaw: any) => {
          team.addMember(memberRaw.user_id, memberRaw.role);
        });
      }

      return Result.ok(team);
    } catch (error) {
      return Result.fail(`Fel vid mappning av team: ${error}`);
    }
  }

  static toPersistence(team: Team): any {
    return {
      id: team.id.toString(),
      name: team.name.getValue(),
      description: team.description,
      created_by: team.createdBy,
      created_at: team.createdAt.toISOString(),
      organization_id: team.organizationId,
      // Ytterligare egenskaper...
    };
  }
}
```

## Hantering av domänevents

Repositories ansvarar för att publicera domänevents när aggregater sparas:

```typescript
async save(team: Team): Promise<Result<void>> {
  try {
    // Implementera databaslogik...
    
    // Publicera domänevents
    const events = team.domainEvents;
    events.forEach(event => this.publisher.publish(event));
    
    // Rensa events efter publicering
    team.clearEvents();
    
    return Result.ok();
  } catch (error) {
    return Result.fail(error);
  }
}
```

## Transaktioner

För operationer som kräver transaktionsintegritet:

```typescript
async saveWithTransaction(team: Team, member: TeamMember): Promise<Result<void>> {
  try {
    // Starta transaktion
    const { error: beginError } = await this.supabase.rpc('begin_transaction');
    if (beginError) throw beginError;

    try {
      // Spara team
      const { error: teamError } = await this.supabase
        .from('teams')
        .upsert(this.teamMapper.toPersistence(team));
      
      if (teamError) throw teamError;

      // Spara medlem
      const { error: memberError } = await this.supabase
        .from('team_members')
        .upsert(this.teamMemberMapper.toPersistence(member));
      
      if (memberError) throw memberError;

      // Commit transaktion
      const { error: commitError } = await this.supabase.rpc('commit_transaction');
      if (commitError) throw commitError;

      // Publicera events...
      
      return Result.ok();
    } catch (innerError) {
      // Rollback vid fel
      await this.supabase.rpc('rollback_transaction');
      throw innerError;
    }
  } catch (error) {
    this.logger.error('Transaktionsfel vid sparande av team med medlem', { error });
    return Result.fail(error);
  }
}
```

## Caching

För att förbättra prestanda implementerar vi caching i vissa repositories:

```typescript
export class CachedTeamRepository implements TeamRepository {
  private repository: TeamRepository;
  private cache: Map<string, Team>;
  private ttl: number;  // Time-to-live i millisekunder
  private cacheTimestamps: Map<string, number>;

  constructor(repository: TeamRepository, ttl = 5 * 60 * 1000) {
    this.repository = repository;
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    this.ttl = ttl;
  }

  async findById(id: string): Promise<Result<Team>> {
    // Kontrollera om objektet finns i cachen och inte har förfallit
    const now = Date.now();
    const timestamp = this.cacheTimestamps.get(id);
    
    if (this.cache.has(id) && timestamp && now - timestamp < this.ttl) {
      return Result.ok(this.cache.get(id)!);
    }

    // Hämta från underliggande repository om inte i cache
    const result = await this.repository.findById(id);
    
    if (result.isSuccess()) {
      this.cache.set(id, result.getValue());
      this.cacheTimestamps.set(id, now);
    }
    
    return result;
  }

  async save(team: Team): Promise<Result<void>> {
    // Invalidera cache vid uppdateringar
    this.cache.delete(team.id.toString());
    this.cacheTimestamps.delete(team.id.toString());
    
    return this.repository.save(team);
  }

  // Ytterligare metodimplementationer...
}
```

## Testning

Repositories testas både med enhetstester och integrationstester:

### Mockat repository för enhetstester

```typescript
// src/test-utils/mocks/MockTeamRepository.ts
export class MockTeamRepository implements TeamRepository {
  private teams: Map<string, Team> = new Map();

  async findById(id: string): Promise<Result<Team>> {
    const team = this.teams.get(id);
    if (!team) {
      return Result.fail(`Team med ID ${id} hittades inte`);
    }
    return Result.ok(team);
  }

  async save(team: Team): Promise<Result<void>> {
    this.teams.set(team.id.toString(), team);
    return Result.ok();
  }

  // Hjälpmetoder för testning
  setTeam(team: Team): void {
    this.teams.set(team.id.toString(), team);
  }

  clear(): void {
    this.teams.clear();
  }

  // Övriga implementationer...
}
```

### Integrationstester

```typescript
describe('SupabaseTeamRepository Integration', () => {
  let repository: SupabaseTeamRepository;
  let testTeam: Team;

  beforeAll(async () => {
    // Konfigurera testmiljö
    const client = createTestClient();
    const mapper = new TeamMapper();
    const publisher = new DomainEventPublisher();
    
    repository = new SupabaseTeamRepository(client, mapper, publisher);
    
    // Skapa testdata
    const nameResult = TeamName.create('Testteam');
    const team = Team.create({
      name: nameResult.getValue(),
      description: 'Test description',
      createdBy: 'test-user',
      createdAt: new Date(),
      organizationId: 'test-org'
    });
    
    testTeam = team;
  });

  afterAll(async () => {
    // Städa upp testdata
    await repository.delete(testTeam.id.toString());
  });

  it('ska kunna spara och hämta ett team', async () => {
    // Spara team
    const saveResult = await repository.save(testTeam);
    expect(saveResult.isSuccess()).toBe(true);
    
    // Hämta team
    const findResult = await repository.findById(testTeam.id.toString());
    expect(findResult.isSuccess()).toBe(true);
    
    const retrievedTeam = findResult.getValue();
    expect(retrievedTeam.id.toString()).toBe(testTeam.id.toString());
    expect(retrievedTeam.name.getValue()).toBe(testTeam.name.getValue());
  });
});
```

## Best practices

### 1. Repository per aggregatrot

Skapa ett dedikerat repository för varje aggregatrot-typ, inte för varje entitet:

```
TeamRepository - Ja (Team är en aggregatrot)
TeamMemberRepository - Nej (TeamMember är en del av Team-aggregatet)
```

### 2. Håll metoder fokuserade

Varje repository-metod bör vara fokuserad på en specifik frågetyp:

```typescript
// Bra
findById(id: string): Promise<Result<Team>>;
findByMemberId(memberId: string): Promise<Result<Team[]>>;

// Undvik - För generisk och otydlig
findByCondition(condition: any): Promise<Result<Team[]>>;
```

### 3. Returnera domänmodeller, inte DTO:er

Repositories ska alltid returnera fullständiga domänmodeller:

```typescript
// Bra
async findById(id: string): Promise<Result<Team>>;

// Undvik
async findById(id: string): Promise<Result<TeamDTO>>;
```

### 4. Hantera fel konsekvent

Använd Result-mönstret för att hantera fel:

```typescript
// Bra
async findById(id: string): Promise<Result<Team>> {
  try {
    // ...
    if (!data) {
      return Result.fail(`Team hittades inte`);
    }
    return this.mapper.toDomain(data);
  } catch (error) {
    return Result.fail(error);
  }
}

// Undvik
async findById(id: string): Promise<Team> {
  // ...
  if (!data) {
    throw new Error(`Team hittades inte`);
  }
  return this.mapper.toDomain(data);
}
```

### 5. Använd dependency injection

Injicera beroenden som mappers och event publishers:

```typescript
constructor(
  supabase: SupabaseClient,
  teamMapper: TeamMapper,
  publisher: IDomainEventPublisher
) {
  this.supabase = supabase;
  this.teamMapper = teamMapper;
  this.publisher = publisher;
}
```

### 6. Hantera relationer inom aggregatrötter

När du hämtar en aggregatrot, hämta också dess relaterade entiteter inom samma aggregat:

```typescript
async findById(id: string): Promise<Result<Team>> {
  // ...
  const { data } = await this.supabase
    .from('teams')
    .select('*, team_members(*)')  // Hämta team med dess medlemmar
    .eq('id', id)
    .single();
  // ...
}
```

### 7. Skild från affärslogik

Repositories bör fokusera på dataåtkomst och inte innehålla affärslogik:

```typescript
// Undvik detta i repositories
if (team.members.length >= 10) {
  return Result.fail('Teamet har redan maximalt antal medlemmar');
}

// Detta bör istället vara i domänlagret
```

## Slutsats

Repository-mönstret är grundläggande för vår domändrivna design och ger oss en tydlig separation mellan domänlogik och dataåtkomst. Genom att följa dessa principer kan vi bygga robusta, testbara och underhållbara repositories som utgör en viktig del av vår applikationsarkitektur. 