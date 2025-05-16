# Refaktoreringsplan för Domänevents

## Nuvarande tillstånd

Efter analys av kodbasen har vi identifierat följande mönster kring domänevents:

1. **Inkonsekvent eventpublicering**:
   - Vissa entiteter publicerar events direkt utan att gå via aggregatroten
   - Vissa eventsklasser innehåller sin egen dispatching-logik (t.ex. `this.dispatch()` i `OrganizationEvents.ts`)
   - Repository-klasser publicerar ibland domänevents direkt (`this.eventBus.publish(event)`)

2. **Varierande eventsformat**:
   - Vissa events följer `IDomainEvent`-interfacet
   - Andra events använder en äldre `DomainEvent`-bas
   - Inkonsekvent namngivning (blandat `Created`, `Added`, etc.)
   - Vissa events har event-specifika egenskaper, andra använder generiska datastrukturer

3. **AggregateRoot-implementationer**:
   - Korrekt basklass med `addDomainEvent` implementerad
   - Vissa aggregatrötter (Team, Organization) publicerar events korrekt via AggregateRoot
   - Men det saknas konsekvent upphämtning av events i repositories

## Refaktoreringsplan

### 1. Standardisera Event-struktur och namngivning

1. **Uppdatera alla events till att använda IDomainEvent-interfacet**:
   - Skapa konsistenta basklasser för varje domän (BaseTeamEvent, BaseUserEvent, BaseOrganizationEvent)
   - Säkerställ att alla events har konsistenta egenskaper (eventId, eventType, aggregateId, occurredAt)

2. **Standardisera namngivning av events**:
   - Använd namngivning `<Aggregate><Entity/ValueObject><Action>` (ex: TeamMemberRoleChanged, UserProfileUpdated)
   - Använd konsekvent tempusform (preteritum) för alla events
   - Lägg till dokumentation med XML-kommentarer för alla events

3. **Konsistenta constructors**:
   - Standardisera parametrar enligt aggregattyp
   - Kräv alltid aggregatrot-ID som första parameter
   - Använd lämplig typning för eventdata

### 2. Flytta event-publicering till aggregatrötter

1. **Ta bort direkt dispatch från events**:
   - Ersätt `this.dispatch()` i event-klasser med korrekt hantering via aggregatrot
   - Flytta all event-skapandelogik till aggregatrötter

2. **Refaktorera entiteter att använda aggregatrotens event-mekanismer**:
   - Skapa metoder i aggregatrötter som representerar alla möjliga domänhändelser
   - Uppdatera entiteter att notifiera sin aggregatrot om statusändringar

3. **Implementera standardiserad event-hantering i repositories**:
   - Refaktorera alla repository-metoder att publicera events via `publishEvents(aggregate.getDomainEvents())`
   - Säkerställ att events rensas efter publicering med `aggregate.clearEvents()`

### 3. Implementera validering av invarianter

1. **Identifiera och dokumentera invarianter för varje aggregat**:
   - Lägg till valideringsfunktioner för alla affärsregler
   - Skapa hjälpmetoder för att validera specifika invarianter

2. **Implementera metoder för att validera invarianter i alla aggregatrötter**:
   - Skapa en `validateInvariants()` metod i varje aggregatrot
   - Anropa validering före viktiga tillståndsändringar

3. **Säkerställ att alla aggregatoperationer verifierar invarianter**:
   - Alla publika metoder i en aggregatrot bör validera invarianter före tillståndsändring
   - Dokumentera vilka invarianter som gäller för olika operationer

### 4. Utvidga testningen

1. **Skapa tester för att verifiera korrekt event-publicering**:
   - Testa att alla aggregatoperationer producerar förväntade events
   - Verifiera att events har korrekta properties och data

2. **Skapa tester för att verifiera att invarianter kontrolleras**:
   - Testa att invarianter valideras
   - Verifiera att operationer misslyckas när invarianter bryts

3. **Skapa integrationstester för event-flöden**:
   - Testa kompletta flöden från aggregatoperation till eventhantering

## Konkreta ändringsuppgifter

### Fas 1: Standardisera events

1. **Uppdatera eventsbasklasser**:
   - Skapa standardiserade basklasser för alla domäner
   - Säkerställa korrekt implementering av IDomainEvent

2. **Migrera alla domänevents**:
   - Refaktorera TeamEvents
   - Refaktorera UserEvents
   - Refaktorera OrganizationEvents

### Fas 2: Refaktorera entiteter

1. **Refaktorera Team-domänen**:
   - Uppdatera TeamMember och TeamInvitation att notifiera sin aggregatrot
   - Säkerställ att TeamRepository publicerar alla events korrekt

2. **Refaktorera User-domänen**:
   - Identifiera och refaktorera entiteter som publicerar events direkt
   - Säkerställ att UserRepository publicerar alla events korrekt

3. **Refaktorera Organization-domänen**:
   - Uppdatera OrganizationMember och OrganizationInvitation att notifiera sin aggregatrot
   - Säkerställ att OrganizationRepository publicerar alla events korrekt

### Fas 3: Implementera validering av invarianter

1. **Identifiera invarianter**:
   - Kartlägg invarianter för Team-domänen
   - Kartlägg invarianter för User-domänen
   - Kartlägg invarianter för Organization-domänen

2. **Implementera validering**:
   - Implementera validering för Team-invarianter
   - Implementera validering för User-invarianter
   - Implementera validering för Organization-invarianter

### Fas 4: Utvidga testning

1. **Skapa testhjälpare**:
   - Skapa hjälpklasser för att mocka event publishing
   - Skapa hjälpmetoder för att verifiera events

2. **Implementera tester**:
   - Implementera tester för Team-aggregatet
   - Implementera tester för User-aggregatet
   - Implementera tester för Organization-aggregatet 