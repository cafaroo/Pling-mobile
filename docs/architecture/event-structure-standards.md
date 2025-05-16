# Standarder för domänevent-struktur

Detta dokument definierar standarder för innehåll och struktur av domänevents i Pling-mobile, för att säkerställa konsekvent implementering av events i alla delar av applikationen.

## Grundläggande eventstruktur

### Obligatoriska egenskaper

Alla domänevents ska implementera `IDomainEvent`-interfacet och innehålla följande egenskaper:

```typescript
export interface IDomainEvent {
  eventId: UniqueId;        // Unikt ID för eventet
  occurredAt: Date;         // Tidpunkt när eventet inträffade
  eventType: string;        // Strängkonstant som identifierar eventtypen
  aggregateId: string;      // ID för aggregatroten som producerade eventet
  version?: number;         // (Valfritt) Versionnummer för eventet
}
```

### Aggregatspecifika basklasser

Varje aggregat ska ha en dedikerad basklass för sina events:

```typescript
abstract class BaseTeamEvent implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly occurredAt: Date;
  public readonly eventType: string;
  public readonly aggregateId: string;
  
  constructor(eventType: string, teamId: UniqueId) {
    this.eventId = new UniqueId();
    this.occurredAt = new Date();
    this.eventType = eventType;
    this.aggregateId = teamId.toString();
  }
}
```

## Innehåll i domänevents

### Design av eventinnehåll

1. **Orientering mot framtida behov**:
   - Anpassa innehåll för potentiella konsumenter av eventet
   - Tänk på vad andra delar av systemet behöver veta

2. **Begränsa innehållet**:
   - Inkludera bara direkt relevant information
   - Undvik att duplicera hela entiteter
   
3. **Standardisera datatyper**:
   - Använd värde-objekt för rika domänkoncept
   - Använd primitiva typer för enkel serialisering

### Obligatoriskt vs. valfritt innehåll

Olika typer av events kräver olika typer av innehåll:

#### Skapande-events (Created)
- ID för den nya entiteten
- Nödvändiga attribut för att identifiera entiteten
- ID för relaterade aggregat
- Primära egenskaper som definierar entiteten

#### Ändrings-events (Updated, Changed)
- ID för den ändrade entiteten
- Både gamla och nya värden för ändrade egenskaper
- Tidpunkt för ändringen
- ID för aktören som orsakade ändringen (om relevant)

#### Borttagnings-events (Deleted, Removed)
- ID för entiteten som togs bort
- Minimal kontext kring borttagningen
- Eventuell orsak till borttagningen

## Konkreta exempel på eventstruktur

### Exempel: TeamMemberRoleChanged

```typescript
export class TeamMemberRoleChanged extends BaseTeamEvent {
  constructor(
    public readonly teamId: UniqueId,         // Aggregat-ID
    public readonly userId: UniqueId,          // ID för berörd medlem
    public readonly oldRole: TeamRole,         // Tidigare roll
    public readonly newRole: TeamRole,         // Ny roll
    public readonly changedByUserId?: UniqueId // Vem som gjorde ändringen
  ) {
    super('TeamMemberRoleChanged', teamId);
  }
}
```

### Exempel: UserProfileUpdated

```typescript
export class UserProfileUpdated extends BaseUserEvent {
  constructor(
    user: User | UniqueId,                  // Användare eller användar-ID
    public readonly updatedFields: string[], // Lista på ändrade fält
    public readonly profileData: Partial<UserProfileProps> // Uppdaterad data
  ) {
    super('UserProfileUpdated', user, { 
      updatedFields,
      // Serialisera värden från profileData för enkel hantering
      profileValues: Object.entries(profileData)
        .reduce((acc, [key, value]) => ({
          ...acc,
          [key]: typeof value === 'object' && value !== null 
            ? value.toString() 
            : value
        }), {})
    });
  }
}
```

## Serialisering och deserialisering

### Serialisering till databas/transport

Events ska vara enkla att serialisera till JSON:

```typescript
// Exempel på serialisering
const serializedEvent = {
  eventId: event.eventId.toString(),
  eventType: event.eventType,
  occurredAt: event.occurredAt.toISOString(),
  aggregateId: event.aggregateId,
  payload: {
    // Eventets specifika data
    userId: event.userId.toString(),
    teamId: event.teamId.toString(),
    // ...andra eventspecifika fält
  }
};
```

### Deserialisering från databas/transport

```typescript
// Exempel på deserialisering
const deserializeEvent = (data: any): IDomainEvent => {
  // Skapa rätt event-instans baserat på eventType
  switch (data.eventType) {
    case 'TeamMemberRoleChanged':
      return new TeamMemberRoleChanged(
        new UniqueId(data.payload.teamId),
        new UniqueId(data.payload.userId),
        TeamRole.create(data.payload.oldRole).value,
        TeamRole.create(data.payload.newRole).value
      );
    // ... andra eventtyper
    default:
      throw new Error(`Unknown event type: ${data.eventType}`);
  }
};
```

## Versionshantering av events

I ett långlivat system kan events behöva utvecklas över tid. Följande strategier bör användas:

1. **Versionsnummer**:
   - Inkludera versionsnummer för eventet i eventType (ex: 'TeamCreated:v2')
   - Hantera olika versioner i event handlers

2. **Additiva ändringar**:
   - Lägg till nya egenskaper till events istället för att ändra befintliga
   - Ge nya egenskaper standardvärden för bakåtkompatibilitet

3. **Eventmigreringstjänst**:
   - Implementera en eventmigreringstjänst som kan uppgradera äldre events

## Testning av events

För att säkerställa korrekt implementation av events, testa:

1. **Konstruktion**: Verifiera att events skapas med rätt egenskaper
2. **Invarianter**: Testa att events validerar sina egenskaper korrekt
3. **Serialisering**: Kontrollera att events kan serialiseras/deserialiseras korrekt
4. **Event handlers**: Verifiera att handlers reagerar korrekt på events

## Kodgranskningskontroller

Vid kodgranskning, kontrollera följande:

- Följer eventet standardiserad namngivning?
- Har eventet rätt egenskaper baserat på sin typ?
- Innehåller eventet bara nödvändig information?
- Är eventet serializerbart till JSON?
- Finns det tester för eventet?

## Övergångsstrategi

För att standardisera befintliga events:

1. **Kartlägg** alla befintliga events och deras struktur
2. **Identifiera** gap i förhållande till dessa standarder
3. **Prioritera** events baserat på användning och betydelse
4. **Implementera** nya event-strukturer parallellt med befintliga
5. **Migrera** stegvis till nya event-strukturer
6. **Validera** implementationen genom tester 