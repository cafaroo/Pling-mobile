# User-Team Integration Guide

## Översikt

Detta dokument beskriver integrationen mellan användar- och team-domänerna i Pling-applikationen. Denna integration följer Domain-Driven Design (DDD) principer och använder domänhändelser för att hantera kommunikation mellan aggregatroter.

## Innehållsförteckning

1. [Domänmodell](#domänmodell)
2. [Integration mellan User och Team](#integration-mellan-user-och-team)
3. [Domänhändelser](#domänhändelser)
4. [Event Dispatching Process](#event-dispatching-process)
5. [Synkronisering mellan domäner](#synkronisering-mellan-domäner)
6. [Transaktionshantering och rollback](#transaktionshantering-och-rollback)
7. [Viktiga klasser och komponenter](#viktiga-klasser-och-komponenter)
8. [Tester](#tester)
9. [Vanliga problem och lösningar](#vanliga-problem-och-lösningar)

## Domänmodell

### Typdiagram för domänrelationer

```
+----------------+       +----------------+       +---------------+
|                |       |                |       |               |
|      User      |       |  TeamMember    |       |     Team      |
|                |       |                |       |               |
+----------------+       +----------------+       +---------------+
| id: UniqueId   |       | userId: UniqueId <-----+ members[]     |
| email: string  |       | role: TeamRole  |       | id: UniqueId  |
| teamIds: string[] +--> | joinedAt: Date  +<---+ | name: string  |
|                |       |                |     | | ownerId       |
+----------------+       +----------------+     | +---------------+
                                                |
                          bidirektionell        |
                          referens via          |
                          värdesobjekt          |
```

### User Aggregatrot

User är en aggregatrot som representerar en användare i systemet. Viktiga egenskaper:

- `id`: Unik identifierare
- `email`: Användarens e-postadress
- `name`: Användarens namn
- `settings`: Användarinställningar
- `teamIds`: Lista med team som användaren är medlem i
- `roleIds`: Lista med roller som användaren har

### Team Aggregatrot

Team är en aggregatrot som representerar ett team i systemet. Viktiga egenskaper:

- `id`: Unik identifierare
- `name`: Teamets namn
- `description`: Beskrivning av teamet
- `ownerId`: Ägaren av teamet
- `members`: Lista med TeamMember (värdesobjekt)
- `settings`: Teaminställningar
- `invitations`: Lista med teamets inbjudningar

### Värdesobjekt

#### TeamMember

TeamMember är ett värdesobjekt som representerar en medlem i ett team:

- `userId`: Användarens ID
- `role`: Användarens roll i teamet (OWNER, ADMIN, MEMBER, GUEST)
- `joinedAt`: När användaren anslöt till teamet

#### TeamRole

TeamRole är en enum som representerar olika roller i ett team:
- `OWNER`: Äger teamet, har alla behörigheter
- `ADMIN`: Kan hantera medlemmar och inställningar
- `MEMBER`: Standardroll för medlemmar
- `GUEST`: Begränsad tillgång till teamet

## Integration mellan User och Team

### Medlemskap (Sekvensdiagram)

```
┌────────┐          ┌────────┐          ┌───────────┐          ┌───────────┐
│  User  │          │  Team  │          │  EventBus │          │ Repository│
└────┬───┘          └────┬───┘          └─────┬─────┘          └─────┬─────┘
     │                   │                     │                      │
     │                   │                     │                      │
     │  addMember(user)  │                     │                      │
     │<──────────────────│                     │                      │
     │                   │                     │                      │
     │                   │ MemberJoined Event  │                      │
     │                   │ ──────────────────> │                      │
     │                   │                     │                      │
     │                   │                     │     save(team)       │
     │                   │                     │ <─────────────────── │
     │                   │                     │                      │
     │                   │                     │  publish(events)     │
     │                   │                     │ ─────────────────────>
     │                   │                     │                      │
     │ Handle MemberJoined                     │                      │
     │ <───────────────── ─────────────────────│                      │
     │                   │                     │                      │
     │ addTeam(teamId)   │                     │                      │
     │ ─────────────────>│                     │                      │
     │                   │                     │                      │
     │                   │                     │     save(user)       │
     │                   │                     │ <─────────────────── │
     │                   │                     │                      │
```

När en användare ansluter till ett team sker följande:

1. En `TeamMember` skapas med användarens ID och medlemsrollen
2. `Team.addMember()` anropas för att lägga till medlemmen i teamet
3. En `MemberJoined`-domänhändelse publiceras och läggs till i Team-aggregatets domänhändelser
4. När Repository.save(team) anropas, publiceras alla domänhändelser till EventBus
5. En EventHandler (MemberJoinedHandler) lyssnar efter MemberJoined-händelser
6. Handlernfunktionen anropar `User.addTeam()` för att lägga till teamets ID i användarens lista över team
7. Användarrepository sparar den uppdaterade användaren

### Lämna team

När en användare lämnar ett team sker följande:

1. `Team.removeMember()` anropas för att ta bort medlemmen från teamet
2. En `MemberLeft`-domänhändelse publiceras
3. En EventHandler (MemberLeftHandler) lyssnar efter MemberLeft-händelser
4. Handlernfunktionen anropar `User.removeTeam()` för att ta bort teamets ID från användarens lista över team

### Rollförändring

När en användares roll ändras i ett team sker följande:

1. `Team.updateMemberRole()` anropas för att uppdatera medlemmens roll
2. En `TeamMemberRoleChanged`-domänhändelse publiceras
3. En EventHandler (TeamMemberRoleChangedHandler) lyssnar efter TeamMemberRoleChanged-händelser
4. Handlernfunktionen kan uppdatera eventuell cachelagring eller notifikationer

## Domänhändelser

### MemberJoined

Publiceras när en användare ansluter till ett team.

```typescript
export class MemberJoined extends DomainEvent {
  constructor(
    public readonly teamId: UniqueId,
    public readonly userId: UniqueId,
    public readonly role: TeamRole
  ) {
    super({
      name: 'MemberJoined',
      payload: {
        teamId: teamId.toString(),
        userId: userId.toString(),
        role: role,
        timestamp: new Date()
      }
    });
  }
}
```

### MemberLeft

Publiceras när en användare lämnar ett team.

```typescript
export class MemberLeft extends DomainEvent {
  constructor(
    public readonly teamId: UniqueId,
    public readonly userId: UniqueId
  ) {
    super({
      name: 'MemberLeft',
      payload: {
        teamId: teamId.toString(),
        userId: userId.toString(),
        timestamp: new Date()
      }
    });
  }
}
```

### TeamMemberRoleChanged

Publiceras när en medlems roll ändras i ett team.

```typescript
export class TeamMemberRoleChanged extends DomainEvent {
  constructor(
    public readonly teamId: UniqueId,
    public readonly userId: UniqueId,
    public readonly oldRole: TeamRole,
    public readonly newRole: TeamRole
  ) {
    super({
      name: 'TeamMemberRoleChanged',
      payload: {
        teamId: teamId.toString(),
        userId: userId.toString(),
        oldRole: oldRole,
        newRole: newRole,
        timestamp: new Date()
      }
    });
  }
}
```

## Event Dispatching Process

### Hur domänhändelser samlas in och publiceras

1. **Insamling i AggregateRoot**:
   ```typescript
   // I AggregateRoot-klassen
   protected addDomainEvent(event: DomainEvent): void {
     this._domainEvents.push(event);
   }
   
   get domainEvents(): DomainEvent[] {
     return this._domainEvents;
   }
   
   public clearEvents(): void {
     this._domainEvents = [];
   }
   ```

2. **Repository-lagring och publicering**:
   ```typescript
   // I SupabaseTeamRepository
   async save(team: Team): Promise<Result<Team, string>> {
     try {
       // Spara teamet i databasen
       // ...
       
       // Publicera alla domänhändelser
       const events = team.domainEvents;
       for (const event of events) {
         await this.eventBus.publish(event);
       }
       
       // Rensa händelser efter publicering
       team.clearEvents();
       
       return ok(team);
     } catch (error) {
       return err(`Kunde inte spara team: ${error.message}`);
     }
   }
   ```

3. **EventBus implementation**:
   ```typescript
   // I EventBus-klassen
   export class EventBus implements IEventBus {
     private handlers: Record<string, EventHandler[]> = {};
     
     public subscribe(eventName: string, handler: EventHandler): void {
       if (!this.handlers[eventName]) {
         this.handlers[eventName] = [];
       }
       this.handlers[eventName].push(handler);
     }
     
     public async publish(event: DomainEvent): Promise<void> {
       const eventName = event.name;
       if (this.handlers[eventName]) {
         for (const handler of this.handlers[eventName]) {
           await handler(event);
         }
       }
     }
   }
   ```

### Event Subscribers och Handlers

```typescript
// I applikationslagret
export class MemberJoinedHandler {
  constructor(private userRepository: UserRepository) {}
  
  async handle(event: MemberJoined): Promise<void> {
    // Hämta användaren
    const userResult = await this.userRepository.findById(event.userId);
    if (userResult.isErr()) {
      console.error(`Kunde inte hantera MemberJoined: ${userResult.error}`);
      return;
    }
    
    const user = userResult.value;
    
    // Lägg till teamet i användarens lista
    const addTeamResult = user.addTeam(event.teamId.toString());
    if (addTeamResult.isErr()) {
      console.error(`Kunde inte lägga till team: ${addTeamResult.error}`);
      return;
    }
    
    // Spara användaren
    const saveResult = await this.userRepository.save(user);
    if (saveResult.isErr()) {
      console.error(`Kunde inte spara användare: ${saveResult.error}`);
    }
  }
}

// I bootstrapEventHandlers.ts
export function setupEventHandlers(
  eventBus: IEventBus,
  userRepository: UserRepository
) {
  const memberJoinedHandler = new MemberJoinedHandler(userRepository);
  eventBus.subscribe('MemberJoined', memberJoinedHandler.handle.bind(memberJoinedHandler));
  
  // Fler handlers...
}
```

## Synkronisering mellan domäner

### Bi-direktionell synkronisering

Vi använder eventual consistency-modellen för att hålla User och Team synkroniserade via domänhändelser. Detta innebär att:

1. **User.teamIds** och **Team.members** representerar samma relation men från olika perspektiv
2. När en användare läggs till i ett team, sker följande synkronisering:
   - Team.addMember() → MemberJoined event → UserHandler.addTeam()
3. När en användare tas bort från ett team:
   - Team.removeMember() → MemberLeft event → UserHandler.removeTeam()

### Fördelar med denna approach

- **Löst kopplade domäner**: User- och Team-domänerna kan utvecklas oberoende av varandra
- **Eventual Consistency**: Systemet kommer alltid att nå ett konsistent tillstånd över tid
- **Skalbarhet**: Kan hantera höga volymer av händelser asynkront

### Alternativ: Read model / Projection

För vissa användningsfall kan en dedikerad läsmodell användas för att optimera läsoperationer:

```typescript
// TeamMemberProjection i infrastrukturlagret
export class TeamMemberProjection {
  constructor(private db: Database) {}
  
  async updateProjection(event: DomainEvent): Promise<void> {
    if (event instanceof MemberJoined) {
      await this.db.execute(`
        INSERT INTO team_member_view (team_id, user_id, role, joined_at)
        VALUES ($1, $2, $3, $4)
      `, [event.teamId.toString(), event.userId.toString(), event.role, new Date()]);
    } else if (event instanceof MemberLeft) {
      await this.db.execute(`
        DELETE FROM team_member_view 
        WHERE team_id = $1 AND user_id = $2
      `, [event.teamId.toString(), event.userId.toString()]);
    }
    // Fler händelser...
  }
}
```

## Transaktionshantering och rollback

### Utmaning med domänhändelser

En utmaning med domänhändelser är att säkerställa atomicitet - antingen ska alla ändringar genomföras eller inga alls. Detta är särskilt viktigt när händelser orsakar sidoeffekter som inte kan återställas, som att skicka e-post eller externa API-anrop.

### Försenad händelsepublicering

För att hantera detta problem implementerar vi en "försenad händelsepublicering" där händelser samlas in men inte publiceras förrän alla databasoperationer har lyckats:

```typescript
// I UnitOfWork-klassen (transaktionshantering)
export class UnitOfWork {
  private pendingEvents: DomainEvent[] = [];
  
  registerEvents(events: DomainEvent[]): void {
    this.pendingEvents.push(...events);
  }
  
  async commit(transaction: Transaction): Promise<Result<void, string>> {
    try {
      // Commit databastransaktionen
      await transaction.commit();
      
      // Publicera alla händelser efter lyckad commit
      for (const event of this.pendingEvents) {
        await this.eventBus.publish(event);
      }
      
      this.pendingEvents = [];
      return ok(undefined);
    } catch (error) {
      // Rollback vid fel
      await transaction.rollback();
      return err(`Kunde inte commita transaktionen: ${error.message}`);
    }
  }
}
```

### Användning i repository

```typescript
// Användning i repository
async saveWithTransaction(team: Team, unitOfWork: UnitOfWork): Promise<Result<Team, string>> {
  try {
    const tx = await this.db.beginTransaction();
    
    // Spara teamet i databasen inom transaktionen
    // ...
    
    // Registrera händelser för senare publicering
    unitOfWork.registerEvents(team.domainEvents);
    
    // Rensa händelser efter registrering
    team.clearEvents();
    
    // Commita transaktionen och publicera händelser
    const commitResult = await unitOfWork.commit(tx);
    if (commitResult.isErr()) {
      return err(commitResult.error);
    }
    
    return ok(team);
  } catch (error) {
    return err(`Kunde inte spara team: ${error.message}`);
  }
}
```

## Viktiga klasser och komponenter

### AggregateRoot

Basklassen för alla aggregatroter i systemet. Hanterar domänhändelser och identitet.

```typescript
export abstract class AggregateRoot<T extends AggregateRootProps> {
  private _domainEvents: DomainEvent[] = [];
  protected readonly props: T;

  get id(): UniqueId {
    return this.props.id;
  }

  get domainEvents(): DomainEvent[] {
    return this._domainEvents;
  }

  protected constructor(props: T) {
    this.props = props;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }
}
```

### Entity

Basklassen för alla entiteter i systemet. Hanterar identitet och likhet.

```typescript
export abstract class Entity<T extends EntityProps> {
  protected readonly props: T;

  get id(): UniqueId {
    return this.props.id;
  }

  protected constructor(props: T) {
    this.props = props;
  }

  public equals(entity?: Entity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }

    if (this === entity) {
      return true;
    }

    if (!(entity instanceof Entity)) {
      return false;
    }

    return this.id.equals(entity.id);
  }
}
```

### ValueObject

Basklassen för alla värdesobjekt i systemet. Värdesobjekt identifieras av sina egenskaper, inte av identitet.

```typescript
export abstract class ValueObject<T extends ValueObjectProps> {
  protected readonly props: T;

  protected constructor(props: T) {
    this.props = Object.freeze(props);
  }

  public equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    if (vo.props === undefined) {
      return false;
    }
    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }
}
```

## Tester

### Integrationstester

Tester för integrationen mellan User och Team finns i `src/domain/__tests__/user-team-integration.test.ts`. Dessa tester verifierar att:

1. En användare kan läggas till i ett team och rätt domänhändelse publiceras
2. En användare inte kan läggas till i ett team där den redan är medlem
3. En medlems roll kan uppdateras och rätt domänhändelse publiceras
4. Ägarens roll inte kan ändras
5. En medlem kan lämna ett team och rätt domänhändelse publiceras
6. Ägaren inte kan tas bort från teamet

### Testning av domänhändelser med mocks

För att testa domänhändelser använder vi en MockEventBus som fångar alla publicerade händelser:

```typescript
// Exempel på testning av domänhändelser med mockad EventBus
it('ska publicera MemberJoined-händelse när en medlem läggs till', async () => {
  // Arrange
  const mockEventBus = new MockEventBus();
  const team = createTestTeam();
  const userId = new UniqueId('test-user-id');
  const member = TeamMember.create({
    userId,
    role: TeamRole.MEMBER,
    joinedAt: new Date()
  }).value;
  
  // Act
  team.addMember(member);
  
  // Publicera händelser manuellt i testet
  for (const event of team.domainEvents) {
    await mockEventBus.publish(event);
  }
  
  // Assert
  expect(mockEventBus.publish).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'MemberJoined',
      payload: expect.objectContaining({
        teamId: team.id.toString(),
        userId: userId.toString()
      })
    })
  );
});
```

### Exempel på test

```typescript
it('ska skapa korrekt relation och publicera MemberJoined-händelse', async () => {
  // Arrange
  const userId = new UniqueId('test-user-id');
  const ownerId = new UniqueId('test-owner-id');

  const user = await createTestUser('test-user-id');
  const team = createTestTeam('test-team-id', ownerId.toString());

  const memberResult = TeamMember.create({
    userId,
    role: TeamRole.MEMBER,
    joinedAt: new Date()
  });

  if (memberResult.isErr()) {
    throw new Error(`Kunde inte skapa TeamMember: ${memberResult.error}`);
  }

  const member = memberResult.value;
  
  // Act
  const addMemberResult = team.addMember(member);

  // Assert
  expect(addMemberResult.isOk()).toBeTruthy();
  
  if (addMemberResult.isOk()) {
    // Verifiera att användaren lades till i teamet
    const addedMember = team.members.find(m => m.userId.equals(userId));
    expect(addedMember).toBeDefined();
    expect(addedMember?.role).toBe(TeamRole.MEMBER);

    // Verifiera att MemberJoined-händelsen publicerades
    const events = team.domainEvents;
    const joinedEvent = events.find(e => e instanceof MemberJoined) as MemberJoined;
    expect(joinedEvent).toBeDefined();
    expect(joinedEvent.teamId.equals(team.id)).toBeTruthy();
    expect(joinedEvent.userId.equals(userId)).toBeTruthy();
    expect(joinedEvent.role).toBe(TeamRole.MEMBER);
  }
});
```

## Vanliga problem och lösningar

### Problem med att skapa och manipulera entiteter

**Problem**: Entity och AggregateRoot har olika förväntan på hur props och id ska hanteras.

**Lösning**: Standardisera hur props hanteras genom att introducera `EntityProps` och `AggregateRootProps` interface och se till att alla entiteter och aggregatroter följer samma mönster.

```typescript
export interface EntityProps {
  id: UniqueId;
}

export abstract class Entity<T extends EntityProps> {
  protected readonly props: T;

  get id(): UniqueId {
    return this.props.id;
  }

  protected constructor(props: T) {
    this.props = props;
  }
}
```

### Problem med domänhändelser

**Problem**: Domänhändelser publiceras inte korrekt eller fangas inte upp.

**Lösning**: Säkerställ att domänhändelser skapas korrekt med relevanta data, och att eventtyperna överensstämmer mellan publicering och konsumtion.

```typescript
// Publicering av händelse
this.addDomainEvent(new MemberJoined(
  this.id,
  member.userId,
  member.role
));

// Fångst och verifiering i test
const joinedEvent = events.find(e => e instanceof MemberJoined) as MemberJoined;
expect(joinedEvent).toBeDefined();
expect(joinedEvent.teamId.equals(team.id)).toBeTruthy();
```

### Problem med asynkrona operationer

**Problem**: Asynkrona operationer som create-metoder kan orsaka problem i tester.

**Lösning**: Använd async/await konsekvent och hantera Promise-baserade resultat korrekt.

```typescript
// Exempel på asynkron create-metod
public static async create(props: CreateProps): Promise<Result<Entity, string>> {
  try {
    // Implementation...
    return ok(new Entity({ ... }));
  } catch (error) {
    return err(`Error: ${error.message}`);
  }
}

// Användning i test
const result = await Entity.create({ ... });
expect(result.isOk()).toBeTruthy();
```

### Problem med ValueObject jämförelser

**Problem**: Värdesobjekt jämförs felaktigt eller inkonsekvent.

**Lösning**: Implementera en standard equals-metod i ValueObject basklassen.

```typescript
public equals(vo?: ValueObject<T>): boolean {
  if (vo === null || vo === undefined) {
    return false;
  }
  if (vo.props === undefined) {
    return false;
  }
  return JSON.stringify(this.props) === JSON.stringify(vo.props);
}
```

### Problem med event-baserad synkronisering

**Problem**: Inkonsistent tillstånd kan uppstå om en händelse misslyckas med att processas.

**Lösning**: Implementera återförsök och loggning för kritiska händelser, samt periodiska kontrollprocesser som synkroniserar data.

```typescript
// Återförsöksmekanism för event handling
export class ResilientEventHandler {
  constructor(
    private handler: EventHandler,
    private maxRetries: number = 3
  ) {}
  
  async handle(event: DomainEvent): Promise<void> {
    let retries = 0;
    let success = false;
    
    while (!success && retries < this.maxRetries) {
      try {
        await this.handler(event);
        success = true;
      } catch (error) {
        retries++;
        console.error(`Fel vid hantering av händelse (försök ${retries}/${this.maxRetries}): ${error.message}`);
        
        if (retries >= this.maxRetries) {
          // Logga till permanent lagringsplats för manuell hantering
          await this.logFailedEvent(event, error);
        } else {
          // Vänta innan återförsök
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }
    }
  }
  
  private async logFailedEvent(event: DomainEvent, error: Error): Promise<void> {
    // Implementera permanent loggning
  }
} 