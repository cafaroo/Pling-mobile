# Standardiserad testning av domänhändelser

Detta dokument beskriver hur domänhändelser testas i Pling-applikationen och ger riktlinjer för att implementera konsistenta tester för domänhändelser.

## Översikt

Domänhändelser är en viktig del av Domain-Driven Design och används i Pling för att kommunicera viktiga förändringar i domänobjekt. För att säkerställa korrekt beteende behöver vi testa:

1. Att rätt händelser genereras vid rätt operationer
2. Att händelserna innehåller korrekt data
3. Att händelserna hanteras korrekt av infrastrukturkomponenter
4. Att händelserna publiceras i rätt ordning

## Testhjälpklasser

Vi har skapat två centrala klasser för att underlätta testning av domänhändelser:

### 1. DomainEventTestHelper

Hjälpklass för att testa domänhändelser direkt på aggregatroter:

```typescript
// src/shared/core/__tests__/DomainEventTestHelper.ts
export class DomainEventTestHelper<T extends AggregateRoot<any>> {
  constructor(private readonly aggregate: T) {}
  
  // Metoder för att testa händelser
  getEvents(eventName: string): DomainEvent[]
  getLatestEvent(eventName: string): DomainEvent | undefined
  hasEvent(eventName: string): boolean
  eventCount(eventName: string): number
  expectEvent(eventName: string, expectedPayload: Record<string, any>): void
  expectEventSequence(eventNames: string[]): void
  expectNoEvent(eventName: string): void
  expectEventCount(eventName: string, count: number): void
  clearEvents(): void
}
```

### 2. MockEventBus

Mock-implementation av EventBus för att testa hur Repository hanterar domänhändelser:

```typescript
// src/shared/core/__mocks__/EventBus.ts
export class MockEventBus {
  private publishedEvents: DomainEvent[] = [];
  
  publish(event: DomainEvent): void
  getPublishedEvents(): DomainEvent[]
  clearEvents(): void
  findEventsByName(name: string): DomainEvent[]
  hasPublishedEventOfType(name: string): boolean
  getLatestEventOfType(name: string): DomainEvent | undefined
}
```

## Teststrategi på olika nivåer

### 1. Domänentitetstester

Testa att domänentiteter genererar korrekta händelser när operationer utförs:

```typescript
// Exempel från src/domain/team/entities/__tests__/Team.test.ts
it('ska skapa TeamCreated-händelse när ett team skapas', () => {
  // Arrange
  const ownerIdStr = 'test-owner-id';
  const teamName = 'Test Team';
  
  // Act
  const result = Team.create({
    name: teamName,
    description: 'Test description',
    ownerId: ownerIdStr
  });
  
  // Assert
  expect(result.isOk()).toBe(true);
  const team = result.getValue();
  const eventHelper = createDomainEventTestHelper(team);
  
  eventHelper.expectEvent('TeamCreated', {
    teamId: team.id.toString(),
    ownerId: ownerIdStr,
    name: teamName
  });
});
```

### 2. Repositorytester

Testa att Repository korrekt publicerar domänhändelser till EventBus:

```typescript
// Exempel från src/infrastructure/supabase/repositories/__tests__/SupabaseTeamRepository.test.ts
it('ska publicera domänhändelser när ett team sparas', async () => {
  // Arrange
  const team = createTestTeam();
  const memberId = new UniqueId('test-member-id');
  const member = TeamMember.create({
    userId: memberId,
    role: TeamRole.MEMBER,
    joinedAt: new Date()
  }).getValue();
  
  // Lägg till en medlem för att generera en MemberJoined-händelse
  team.addMember(member);
  
  // Mocka lyckade Supabase-operationer
  mockSupabase.upsert.mockResolvedValue({ error: null });
  mockSupabase.delete.mockResolvedValue({ error: null });
  
  // Act
  const result = await repository.save(team);
  
  // Assert
  expect(result.isOk()).toBe(true);
  
  // Verifiera att domänhändelser har publicerats
  expect(eventBus.getPublishedEvents().length).toBe(1);
  expect(eventBus.hasPublishedEventOfType('MemberJoined')).toBe(true);
  
  // Verifiera att domänhändelser har rensats från teamet
  expect(team.domainEvents.length).toBe(0);
});
```

### 3. Användningsfallstester

Testa att användningsfall korrekt delegerar till domänlagret som genererar händelser:

```typescript
// Exempel från src/application/team/useCases/__tests__/createTeam.test.ts
it('ska skapa ett team med rätt TeamCreated domänhändelse', async () => {
  // Arrange
  const dto = {
    name: 'Event Test Team',
    ownerId: 'event-test-owner'
  };
  
  // Act
  const result = await createTeamUseCase.execute(dto);
  
  // Assert
  expect(result.isOk()).toBe(true);
  
  const savedTeams = teamRepository.getSavedTeams();
  const team = savedTeams[0];
  
  // Verifiera att teamet har rätt struktur
  expect(team.id).toBeDefined();
  expect(team.members.length).toBe(1); // Bara ägaren som medlem
});
```

## Riktlinjer för domänhändelsestester

1. **Separera testuppsättning**:
   - Skapa enskilda testfall för varje typ av domänhändelse
   - Gruppera relaterade händelsetester under samma beskrivningsblock

2. **Rensa händelser mellan tester**:
   - Använd `eventHelper.clearEvents()` för att rensa händelsepublicering mellan tester
   - Rensa händelser i hjälpfunktioner som `createTestTeam()`

3. **Testa ordning när det är viktigt**:
   - Använd `expectEventSequence` för att verifiera ordningen på händelser
   - Särskilt viktigt när flera relaterade händelser skapas i samma operation

4. **Testa förväntat antal händelser**:
   - Använd `eventHelper.expectEventCount` eller kontrollera den totala längden
   - Säkerställer att inga oväntade händelser genereras

5. **Mockad EventBus**:
   - Använd MockEventBus i repositorytester
   - Verifiera att händelser publiceras till bussen och rensas från aggregatroter

## Vanliga händelsemönster att testa

- **Entitetsskapande**:
  - TeamCreated, UserCreated
  - Verifiera att alla nödvändiga attribut finns i händelsernas payload

- **Statusändringar**:
  - RoleChanged, StatusUpdated
  - Verifiera både gammal och ny status i payload när tillämpligt

- **Relationsändringar**:
  - MemberJoined, InvitationAccepted
  - Verifiera att händelser genereras i rätt ordning (t.ex. InvitationAccepted före MemberJoined)

- **Felhantering**:
  - Verifiera att inga händelser publiceras när en operation misslyckas
  - Testa att misslyckade databasoperationer inte triggar händelsepublicering

## Nästa steg

För att förbättra testningen av domänhändelser ytterligare bör vi:

1. Utöka testning till andra domäner (User, Activity)
2. Implementera e2e-tester för domänhändelser genom hela flödet
3. Skapa en mer omfattande testhjälpare för specifika domäner
4. Utöka testning för händelsehantering i UI-lagret genom React Query 