# Riktlinjer för domänevent-publicering från aggregatrötter

Detta dokument beskriver riktlinjer för att säkerställa att domänevents endast publiceras av aggregatrötter, inte av entiteter inom ett aggregat, i enlighet med DDD-principer.

## Grundprinciper

I Domain-Driven Design (DDD) bör endast aggregatrötter publicera domänevents, inte entiteter inom ett aggregat. Detta är viktigt av flera skäl:

1. **Konsistens** - Aggregatroten ansvarar för att upprätthålla invarianter inom hela aggregatet
2. **Transaktionsgränser** - Aggregat är transaktionella gränser, och events bör endast publiceras när en transaktion slutförs
3. **Enkelhet** - Det blir tydligare att förstå och underhålla systemet när events kommer från en enda källa per aggregat
4. **Ordning** - Aggregatroten kan kontrollera i vilken ordning events publiceras

## Nuvarande implementation

Vår nuvarande implementation baseras på följande struktur:

1. `AggregateRoot`-basklassen tillhandahåller metoder för att hantera domänevents:
   - `addDomainEvent(event: IDomainEvent): void`
   - `clearEvents(): void`
   - `getDomainEvents(): IDomainEvent[]`

2. Domänevents publiceras när en operation slutförs i ett repository:
   ```typescript
   // Repository-implementation
   async save(aggregate: AggregateRoot<any>): Promise<Result<void, Error>> {
     // Spara aggregatet i databasen...
     
     // Publicera domänevents
     const events = aggregate.getDomainEvents();
     await this.eventPublisher.publishAll(events);
     
     // Rensa events från aggregatet
     aggregate.clearEvents();
     
     return ok(undefined);
   }
   ```

## Problem att åtgärda

I vår nuvarande kodstruktur finns följande problem som behöver åtgärdas:

1. Vissa entiteter som inte är aggregatrötter publicerar events direkt
2. Vissa metoder i aggregatrötter lägger inte till events via `addDomainEvent()` 
3. Några aggregatmetoder skapar och publicerar events utanför aggregatet själv

## Refaktoreringsåtgärder

### 1. Identifiera alla entiteter som publicerar events

Analysera kodbasen för att hitta entiteter som inte är aggregatrötter men som publicerar events:

```typescript
// Exempel: TeamMember entitet som publicerar events (bör undvikas)
class TeamMember extends Entity<TeamMemberProps> {
  changeRole(newRole: TeamRole): Result<void, string> {
    // ... implementation ...
    
    // PROBLEM: Entiteten publicerar ett event direkt
    const event = new TeamMemberRoleChanged(this.teamId, this.id, this.role, newRole);
    eventBus.publish(event);
    
    return ok(undefined);
  }
}
```

### 2. Flytta event-publicering till aggregatrötter

Refaktorera entiteter så att de signalerar förändringar till aggregatroten, som sedan publicerar lämpliga events:

```typescript
// Refaktorerad TeamMember-entitet
class TeamMember extends Entity<TeamMemberProps> {
  changeRole(newRole: TeamRole): Result<RoleChangeResult, string> {
    // ... implementation ...
    
    // Returnera information om ändringen, publicera inget event
    return ok({
      oldRole: this.role,
      newRole: newRole
    });
  }
}

// Aggregatroten hanterar event-publiceringen
class Team extends AggregateRoot<TeamProps> {
  changeMemberRole(memberId: UniqueId, newRole: TeamRole): Result<void, string> {
    // Hitta medlemmen
    const member = this.findMember(memberId);
    if (!member) {
      return err('Medlem hittades inte');
    }
    
    // Ändra rollen
    const roleChangeResult = member.changeRole(newRole);
    if (roleChangeResult.isErr()) {
      return err(roleChangeResult.error);
    }
    
    // Aggregatroten publicerar eventet
    const { oldRole, newRole: updatedRole } = roleChangeResult.value;
    this.addDomainEvent(new TeamMemberRoleChanged(
      this.id, 
      memberId, 
      oldRole, 
      updatedRole
    ));
    
    return ok(undefined);
  }
}
```

### 3. Standardisera event-publiceringsmönster

Använd ett konsekvent mönster för att publicera events från aggregatrötter:

```typescript
// Standardmönster för metoder som ändrar aggregattillstånd
public performAction(...): Result<Output, Error> {
  try {
    // 1. Validera indataparametrar
    if (!this.canPerformAction(...)) {
      return err('Kan inte utföra åtgärden');
    }
    
    // 2. Utför ändringar i aggregattillståndet
    this.applyChanges(...);
    
    // 3. Publicera events för att kommunicera ändringen
    this.addDomainEvent(new ActionPerformed(...));
    
    // 4. Returnera resultat
    return ok(output);
  } catch (error) {
    return err(`Fel vid utförande av åtgärden: ${error.message}`);
  }
}
```

## Identifiering av invarianter för aggregatrötter

För att korrekt implementera event-publicering från aggregatrötter, måste vi identifiera och dokumentera invarianter för varje aggregat:

### Team-aggregatet
- Ett team måste alltid ha minst en ägare
- En medlem kan bara ha en roll i teamet
- En inbjudan kan bara skickas till användare som inte redan är medlemmar
- Medlemsantalsbegränsningar enligt prenumerationsnivå måste följas

### User-aggregatet
- E-postadressen måste vara unik och giltig
- Lösenordspolicyn måste följas
- En användare kan bara vara i ett visst status (active, inactive, etc.)

### Organization-aggregatet
- En organisation måste ha minst en ägare
- Organisationsnamnet måste vara unikt
- Resursbegränsningar enligt prenumerationsnivå måste följas

## Implementationsplan

### Fas 1: Identifiering
1. Kartlägg alla entiteter som publicerar events direkt
2. Identifiera events som saknas för viktiga domänförändringar
3. Dokumentera invarianter för varje aggregatrot

### Fas 2: Refaktorering
1. Uppdatera metoder i entiteter för att returnera data istället för att publicera events
2. Omimplementera aggregatrotsmetoder för att publicera events baserat på ändringar
3. Standardisera event-skapande och -publicering i alla aggregatrötter

### Fas 3: Validering
1. Skapa/uppdatera tester för att verifiera korrekt event-publicering
2. Säkerställ att alla invarianter valideras och upprätthålls
3. Implementera event handlers som reagerar på domänevents

## Testning av event-publicering

För att säkerställa korrekt implementation, testa följande:

```typescript
describe('Team aggregate', () => {
  it('ska publicera TeamMemberRoleChanged event när en medlems roll ändras', () => {
    // Arrange
    const team = createTestTeam();
    const memberId = new UniqueId();
    const newRole = TeamRole.ADMIN;
    
    // Act
    team.changeMemberRole(memberId, newRole);
    const events = team.getDomainEvents();
    
    // Assert
    expect(events.length).toBe(1);
    expect(events[0]).toBeInstanceOf(TeamMemberRoleChanged);
    expect(events[0].userId).toEqual(memberId);
    expect(events[0].newRole).toEqual(newRole);
  });
});
```

## Kodgranskningskontroller

Vid kodgranskning, kontrollera följande:

- Publiceras events endast från aggregatrötter?
- Är events korrekt typade och innehåller de all nödvändig information?
- Upprätthålls aggregatets invarianter innan events publiceras?
- Är event-publicering inkluderad i enhetstester?
- Dokumenteras domänregler som styr event-publicering?

## Nästa steg

För att implementera dessa förändringar i kodbasen, följ dessa steg:

1. Skapa en inventering av befintliga entiteter som publicerar events
2. Prioritera aggregaten efter deras betydelse för systemet 
3. Refaktorera ett aggregat i taget, börja med Team-aggregatet
4. Uppdatera event handlers för att hantera eventuella ändringar i event-strukturen
5. Utöka teststäckningen för att validera korrekt event-publicering 