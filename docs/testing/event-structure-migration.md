# Guide för migrering till standardiserad event-struktur

## Introduktion

En av nyckelorsakerna till testproblem i Pling-mobile har varit inkonsekventa event-strukturer. Denna guide förklarar hur vi löser dessa problem och standardiserar event-hanteringen i hela kodbasen.

## Problem med event-strukturer

Vi har identifierat följande problem med event-strukturer:

1. **Inkonsekvent dataåtkomst**: 
   - Vissa events exponerar data direkt (`event.userId`) 
   - Andra använder ett data-objekt (`event.data.userId`)
   - Ytterligare andra använder ett payload-objekt (`event.payload.userId`)

2. **Problem med ID-hantering**:
   - Ibland är ID:n objekt, ibland strängar
   - Vissa metoder förväntar sig `toString()` på ID-objekt som inte finns

3. **Inkonsekvent constructor-parametrar**:
   - Olika parametrar förväntas i olika events

## Lösning: EventDataAdapter

Vi har skapat en EventDataAdapter-hjälpklass som abstraherar bort dessa olikheter:

```typescript
import { getEventData } from '@/test-utils';

// Gamla sättet - bräckligt för olika event-implementationer
expect(event.data.userId).toBe('user-123');

// Nya sättet - fungerar med alla event-format
expect(getEventData(event, 'userId')).toBe('user-123');
```

### Viktiga funktioner

- **getEventData(event, propertyName, defaultValue)**: Hämtar data från ett event oavsett struktur
- **hasEventProperty(event, propertyName)**: Kontrollerar om ett event har en viss egenskap

## Standardisering av nya events

För nya eller uppdaterade domänevents, följ dessa principer:

1. **Tydlig struktur**:
   ```typescript
   class MyEvent implements IDomainEvent {
     public readonly eventType: string = 'MyEventType';
     public readonly aggregateId: string;
     public readonly data: { /* event data */ };
     
     // Direkta properties för testkompatibilitet
     public readonly userId: string;
     public readonly otherData: string;
   }
   ```

2. **Robust constructor**:
   ```typescript
   constructor(props: MyEventProps) {
     // Hantera null/undefined-värden
     const userIdString = this.safeToString(props.userId);
     
     this.aggregateId = userIdString;
     this.data = { userId: userIdString, /* andra fält */ };
     
     // Direkta properties
     this.userId = userIdString;
   }
   
   private safeToString(value: any): string {
     // Robust toString-konvertering
   }
   ```

3. **Data access metoder**:
   ```typescript
   public getEventData(): MyEventData {
     return this.data;
   }
   ```

## Använda i tester

### Exempel på robust testning

```typescript
import { getEventData } from '@/test-utils';

it('should publish the correct event', () => {
  // Arrange & Act
  const result = team.addMember(userId, role);
  
  // Assert
  const events = mockDomainEvents.getEvents();
  expect(events).toHaveLength(1);
  
  const event = events[0];
  expect(event.eventType).toBe('TeamMemberJoinedEvent');
  expect(getEventData(event, 'userId')).toBe(userId.toString());
  expect(getEventData(event, 'role')).toBe(role);
});
```

### Uppdatera befintliga tester

När du fixar befintliga tester, konvertera direkta accesser till användning av `getEventData`:

```typescript
// Från detta (bräckligt)
expect(event.payload.userId).toBe('user-123');

// Till detta (robust)
expect(getEventData(event, 'userId')).toBe('user-123');
```

## Hantera ID-objekt

För tester som kontrollerar ID-objekt, använd standardiserade sätt att göra jämförelser:

```typescript
// Bräckligt
expect(event.teamId).toBe(team.id);

// Robust
expect(getEventData(event, 'teamId')).toBe(team.id.toString());
```

## Slutsats

Genom att följa dessa principer för event-struktur och använda EventDataAdapter för testning, kan vi uppnå:

1. Mer robusta tester mot implementation-förändringar
2. Bättre konsistens i domänhändelser
3. Tydligare interface mellan domänlager och applikationslager

## Migrering av befintliga events

För att migrera befintliga events till den nya strukturen:

1. Lägg till direkta properties för testkompatibilitet
2. Implementera robust safeToString() för ID-hantering
3. Standardisera constructor-parametrar för att acceptera både objekt och strängar
4. Använd getEventData i tester för åtkomst till event-egenskaper 