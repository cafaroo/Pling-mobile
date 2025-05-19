# Guide för användning av EventDataAdapter i tester

## Problem med event-hantering

I Pling-mobils testsystem har vi identifierat tre olika mönster för hur data lagras i events:

1. **Direkta properties**:
   ```typescript
   expect(event.userId).toBe('123');
   ```

2. **Data-objekt**:
   ```typescript
   expect(event.data.userId).toBe('123');
   ```

3. **Payload-objekt**:
   ```typescript
   expect(event.payload.userId).toBe('123');
   ```

Detta gör testerna bräckliga eftersom:
- Små förändringar i event-implementation kräver stora ändringar i tester
- Man måste veta exakt hur varje event lagrar sin data
- Tester är svåra att underhålla över tid

## Lösning: EventDataAdapter

`EventDataAdapter` är en abstraktion som hjälper oss att komma åt eventdata oavsett var den finns.

### Importera i dina tester

```typescript
import { getEventData, hasEventProperty } from '@/test-utils';
// eller
import { EventDataAdapter } from '@/test-utils';
```

### Använd getEventData

```typescript
// Istället för detta (bräckligt):
expect(event.userId).toBe('123');
// eller
expect(event.data.userId).toBe('123');
// eller
expect(event.payload.userId).toBe('123');

// Använd detta (robust):
expect(getEventData(event, 'userId')).toBe('123');
```

### Kontrollera om property existerar

```typescript
// Istället för detta:
expect(event.hasOwnProperty('userId') || 
       event.data?.hasOwnProperty('userId') || 
       event.payload?.hasOwnProperty('userId')).toBe(true);

// Använd detta:
expect(hasEventProperty(event, 'userId')).toBe(true);
```

## Tips för att konvertera befintliga tester

1. **Identifiera event-access i testerna**:
   - Sök efter `.payload.`, `.data.` eller direkta property-anrop

2. **Ersätt med getEventData**:
   - Ersätt direkta anrop med `getEventData(event, 'propertyName')`

3. **Använd hasEventProperty för kontroller**:
   - Ersätt property-kontroller med `hasEventProperty(event, 'propertyName')`

## Exempel: Före och efter

### Före konvertering:

```typescript
it('should create TeamMemberJoinedEvent', () => {
  // Act
  const result = team.addMember(member);
  
  // Assert
  expect(result.isOk()).toBe(true);
  const events = mockEventBus.getEvents();
  const event = events.find(e => e.eventType === 'TeamMemberJoinedEvent');
  
  expect(event).toBeDefined();
  expect(event.teamId).toBe(team.id.toString());
  expect(event.data.userId).toBe(userId.toString());
  expect(event.payload.role).toBe('MEMBER');
});
```

### Efter konvertering:

```typescript
it('should create TeamMemberJoinedEvent', () => {
  // Act
  const result = team.addMember(member);
  
  // Assert
  expect(result.isOk()).toBe(true);
  const events = mockEventBus.getEvents();
  const event = events.find(e => e.eventType === 'TeamMemberJoinedEvent');
  
  expect(event).toBeDefined();
  expect(getEventData(event, 'teamId')).toBe(team.id.toString());
  expect(getEventData(event, 'userId')).toBe(userId.toString());
  expect(getEventData(event, 'role')).toBe('MEMBER');
});
```

## Hantera komplex eventdata

### Värde-objekt som eventdata

För eventdata som innehåller värde-objekt:

```typescript
// Flexibel hantering av roller:
const roleValue = getEventData(event, 'role');
const actualRole = typeof roleValue === 'object' && roleValue !== null && 'props' in roleValue ? 
  roleValue.props.value : roleValue;
  
expect(['MEMBER', 'member']).toContain(actualRole);
```

## Prioriterade filer att konvertera

Följande filer bör prioriteras för konvertering till EventDataAdapter:

1. `domain/team/entities/__tests__/*.test.ts`
2. `domain/organization/entities/__tests__/*.test.ts`
3. `domain/user/events/__tests__/*.test.ts`
4. `application/user/eventHandlers/__tests__/*.test.ts`

## Slutsats

Genom att konsekvent använda EventDataAdapter i alla tester kan vi:

1. Minska antalet fel när domäneventen förändras
2. Göra testerna mer robusta mot implementation-förändringar
3. Minska behovet av att känna till exact event-struktur för varje test 