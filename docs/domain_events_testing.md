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

## Team Domain Events Testing

Team-relaterade domänhändelser testas med hjälp av den gemensamma testinfrastrukturen. Testerna fokuserar särskilt på:

1. Att TeamCreatedEvent publiceras korrekt när ett team skapas
2. Att TeamUpdatedEvent publiceras när ett team uppdateras
3. Att TeamDeletedEvent publiceras när ett team tas bort
4. Att TeamMemberAddedEvent publiceras när en medlem läggs till i ett team
5. Att TeamMemberRemovedEvent publiceras när en medlem tas bort från ett team

De viktigaste testerna finns i `src/domain/__tests__/team-events.test.ts` där vi använder DomainEventTestHelper för att fånga och verifiera events.

## Subscription Domain Events Testing

Prenumerationsdomänen är en kritisk komponent som påverkar många andra domäner i systemet. Testningen fokuserar på både interna aspekter av prenumerationshanteringen och på integrationspunkter med andra domäner.

### Viktiga testrelaterade filer

- `src/domain/__tests__/subscription-services.test.ts`: Enhets- och integrationstester för prenumerationstjänster
- `src/domain/__tests__/subscription-webhook-integration.test.ts`: Tester för Stripe webhook-flödet
- `src/domain/__tests__/subscription-domain-integration.test.ts`: Tester för integration mellan prenumerationsdomänen och andra domäner
- `src/domain/__tests__/subscription-scheduler.test.ts`: Tester för schemalagda prenumerationsjobb

### Testade domänhändelser

1. **SubscriptionCreatedEvent**: Publiceras när en ny prenumeration skapas
   - Verifierar att organisationsresurslimiter uppdateras baserat på den nya prenumerationen
   - Verifierar att relevant statistik uppdateras

2. **SubscriptionUpdatedEvent**: Publiceras när en prenumerations plan eller status ändras
   - Verifierar att resurshantering uppdateras korrekt vid plan-uppgradering/-nedgradering
   - Verifierar att tillgång till funktioner uppdateras baserat på ny plan

3. **SubscriptionCanceledEvent**: Publiceras när en prenumeration avbryts
   - Verifierar att åtkomst till betalda funktioner begränsas
   - Verifierar att användaren informeras om konsekvenserna av avbruten prenumeration

4. **SubscriptionPaymentSucceededEvent**: Publiceras när en betalning lyckas
   - Verifierar att prenumerationsstatus uppdateras korrekt
   - Verifierar att historik och statistik uppdateras

5. **SubscriptionPaymentFailedEvent**: Publiceras när en betalning misslyckas
   - Verifierar att notifikationer skickas till användare
   - Verifierar att prenumerationsstatus uppdateras till past_due

### Integrationstest mellan domäner

Testerna i `subscription-domain-integration.test.ts` fokuserar på interaktionen mellan prenumerationsdomänen och andra domäner:

```typescript
describe('Interaktion mellan prenumeration och organisation', () => {
  it('ska uppdatera organisationens resursgränser när en prenumeration skapas', async () => {
    // 1. Registrera subscribers på organisationssidan
    const organizationResourceUpdateHandler = jest.fn();
    eventBus.subscribe(SubscriptionCreatedEvent.name, organizationResourceUpdateHandler);
    
    // 2. Publicera subscription created event
    eventBus.publishEvent(new SubscriptionCreatedEvent({
      subscriptionId: 'sub-123',
      organizationId: 'org-123',
      planType: 'pro',
    }));
    
    // 3. Verifiera att organisationssidan hanterade händelsen
    expect(organizationResourceUpdateHandler).toHaveBeenCalled();
    const event = organizationResourceUpdateHandler.mock.calls[0][0];
    expect(event.type).toBe(SubscriptionCreatedEvent.name);
    expect(event.payload.organizationId).toBe('org-123');
  });
});
```

### Webhook Integration Testing

Testerna i `subscription-webhook-integration.test.ts` fokuserar på att verifiera hela flödet från en Stripe webhook-händelse till uppdateringar i databasen och publicering av rätt domänhändelser:

```typescript
it('ska hantera checkout.session.completed och uppdatera databasen', async () => {
  // 1. Setup webhook event från Stripe
  const sessionEvent = {
    id: 'cs_123',
    customer: 'cus_123',
    subscription: 'sub_123',
    metadata: { organization_id: 'org-123', plan_id: 'plan-pro' },
  };
  
  // 2. Konfigurera mock responses
  mockStripeClient.subscriptions.retrieve.mockResolvedValue({
    id: 'sub_123',
    status: 'active',
    // ...övriga fält
  });
  
  // 3. Utför webhook-hantering
  const result = await webhookHandler.handleCheckoutSessionCompleted(sessionEvent);
  
  // 4. Verifiera databassparning och publicerade händelser
  expect(subscriptionRepository.saveSubscription).toHaveBeenCalled();
  expect(eventBus.publishEvent).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'SubscriptionCreated' })
  );
});
```

### Schemalagda jobb Testing

Testerna i `subscription-scheduler.test.ts` verifierar att schemalagda jobb fungerar korrekt:

```typescript
it('ska synkronisera prenumerationsstatusar från Stripe', async () => {
  // Setup
  const subscriptions = [
    { id: 'sub-1', stripeSubscriptionId: 'stripe-sub-1', status: 'active' },
    { id: 'sub-2', stripeSubscriptionId: 'stripe-sub-2', status: 'past_due' },
  ];
  
  // Mock responses från databas och Stripe API
  mockSubscriptionRepository.getSubscriptionsByStatus.mockResolvedValue(
    mockResultOk(subscriptions)
  );
  
  mockStripeClient.subscriptions.retrieve
    .mockResolvedValueOnce({ id: 'stripe-sub-1', status: 'active' }) 
    .mockResolvedValueOnce({ id: 'stripe-sub-2', status: 'canceled' });
  
  // Utför schemalagt jobb
  const result = await schedulerService.syncSubscriptionStatuses();
  
  // Verifiera att uppdateringar gjordes korrekt
  expect(mockSubscriptionRepository.updateSubscriptionStatus)
    .toHaveBeenCalledWith('sub-2', 'canceled');
});
```

### Kompletta testscenarier

För att säkerställa att prenumerationsdomänen fungerar korrekt genom hela livscykeln har vi implementerat end-to-end tester som täcker följande scenarier:

1. **Prenumerationslivscykel**:
   - Skapande av prenumeration via Stripe Checkout
   - Betalning och aktivering av prenumeration
   - Uppdatering av prenumerationsplan
   - Avbrytande av prenumeration
   - Hantering av felaktiga betalningar och påminnelser

2. **Resursgränshantering**:
   - Verifiering att resursgränser tillämpas korrekt baserat på prenumerationsplan
   - Tester för uppgradering från Basic till Pro och verifiering av nya gränser
   - Tester för nedgradering och hantering av befintliga resurser som överstiger nya gränser

3. **Felhantering**:
   - Robusta tester för alla typer av Stripe API-fel
   - Verifiering av återförsök och resiliens i webhook-hantering
   - Säkerställande att systemet är robust mot ofullständiga eller felaktiga datastrukturer 