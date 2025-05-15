# Refaktoreringsplan för DDD i Pling-mobile

## Genomförda refaktoreringar

### Domänlager
- Implementerat `Entity<T>` som basklass för alla entiteter
- Implementerat `AggregateRoot<T>` som basklass för alla aggregatrötter
- Standardiserat `IDomainEvent` för domänhändelser
- Refaktorerat Team- och User-entiteter till att använda AggregateRoot
- Standardiserat domänevents med BaseTeamEvent och BaseUserEvent
- Implementerat Organisation-domänen med repository-gränssnitt och mappers

### Infrastrukturlager
- Skapat `IDomainEventPublisher` för publicering av domänevents
- Implementerat `DomainEventPublisher` för event-hantering
- Skapat `IDomainEventSubscriber` för prenumeration på domänevents
- Implementerat Supabase-repositories med transaktionshantering

### Applikationslager
- Refaktorerat följande Use Cases till att använda AggregateRoot och domänevents:
  - `CreateTeamUseCase`
  - `AddTeamMemberUseCase`
  - `RemoveTeamMemberUseCase`
  - `UpdateTeamMemberRoleUseCase`
  - `InviteTeamMemberUseCase`
- Skapat factory-funktion för att enkelt skapa Team-relaterade Use Cases
- Standardiserat felhantering i Use Cases med typade felkoder
- Implementerat konsekvent mönster för validering och respons

## Plan för fortsatt refaktorering

### Prioriterade Use Cases att refaktorera
1. **Team-domänen**
   - `getTeamStatistics.ts`
   - `getTeamActivities.ts`
   - `createTeamActivity.ts`
   - `createTeamMessage.ts`
   - `createThreadReplyUseCase.ts`

2. **User-domänen**
   - `createUser.ts`
   - `updateProfile.ts`
   - `updateSettings.ts`
   - `deactivateUser.ts`
   - `activateUser.ts`

3. **Organisation-domänen**
   - `createOrganization.ts`
   - `updateOrganization.ts`
   - `addOrganizationMember.ts`

### Tekniska förbättringar
1. **Event Handlers**
   - Implementera konkreta event handlers för domänevents
   - Skapa `TeamEventHandlers` som hanterar och reagerar på team-events
   - Skapa `UserEventHandlers` som hanterar och reagerar på user-events
   - Implementera cross-domain events (t.ex. när Team-aktiviteter påverkar User-domänen)

2. **Repositories**
   - Säkerställa att alla repository-metoder följer nya mönster och använder Result
   - Förbättra transaktionshantering i Supabase-repositories
   - Optimera databas-queries för prestanda

3. **Testning**
   - Uppdatera alla tester för att spegla de nya domän- och applikationsmodellerna
   - Skapa specifika tester för domänevents och event-handlers
   - Implementera fler integrationstester som täcker event-flöden

## Implementationsordning
1. ✅ Refaktorera Team-domänens grundläggande Use Cases (Slutfört)
2. Slutför refaktorering av övriga Team-relaterade Use Cases
3. Refaktorera User-relaterade Use Cases
4. Implementera Event Handlers
5. Refaktorera Organisation-relaterade Use Cases
6. Uppdatera alla tester
7. Optimera prestanda där det behövs

## Tekniska standarder
- Alla Use Cases ska följa standardiserad struktur:
  - Använda klass-baserad implementation
  - Ha tydliga DTOs med konsekvent namngivning
  - Returnera typade responses och feltyper
  - Använda Result-objektet för felshantering
- Alla domänhändelser ska:
  - Implementera IDomainEvent-interfacet
  - Använda lämpliga basklasser (t.ex. BaseTeamEvent)
  - Innehålla minimal men tillräcklig information
- Alla repositories ska:
  - Följa repository-gränssnittet
  - Returnera Result-objektet för felhantering
  - Hantera domänevents korrekt
- Alla Event Publishers ska:
  - Hantera event-publicering asynkront
  - Ha robust felhantering
- Alla Event Subscribers ska:
  - Implementera idempotent event-hantering
  - Ha tydlig ansvarsfördelning

## Nästa steg
1. Refaktorera återstående team-relaterade Use Cases
2. Skapa en konkret TeamEventHandler-implementation
3. Uppdatera TeamRepository för att säkerställa kompatibilitet med nya entiteter och events
4. Uppdatera relaterade tester för att reflektera den nya strukturen 