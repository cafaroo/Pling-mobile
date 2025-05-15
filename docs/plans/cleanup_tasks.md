# Uppgiftslista för DDD-implementation

Denna fil innehåller konkreta uppgifter för att implementera DDD-strukturplanen i Pling-mobile.

## Genomförda uppgifter

### Domänlager
- [x] Eliminerat duplicerad kod i `TeamStatistics` klassen genom att extrahera gemensam logik till hjälpmetoden `createStatisticsFromData`.
- [x] Förbättrat `ResourcePermissionAdded` event i `ResourceEvents.ts` för att hantera `ResourcePermission`-typen korrekt.
- [x] Förbättrat `addPermission`-metoden i `OrganizationResource` för att hantera duplicerade behörigheter bättre.
- [x] Standardiserat `SubscriptionRepository` interface enligt DDD-principer.
- [x] Skapat ett omfattande värde-objekt `SubscriptionTypes.ts` med väldefinierade typer och hjälpmetoder.
- [x] Skapat `FeatureFlagService` interface för funktionskontroll baserat på prenumerationer.
- [x] Standardiserat `TeamRepository` interface med förbättrad dokumentation och Result-hantering.
- [x] Standardiserat `UserRepository` interface med förbättrad dokumentation och Result-hantering.
- [x] Standardiserat `OrganizationRepository` interface med förbättrad dokumentation och Result-hantering.
- [x] Implementerat standardiserade basklasser `Entity` och `AggregateRoot` för domänentiteter.
- [x] Skapat `IDomainEvent` interface för domänevents med standardiserad struktur.

### Infrastrukturlager
- [x] Förbättrat `EventBus`-implementation med `clearListeners`-metod som exporteras via interfacet.
- [x] Skapat mockningsstöd genom `SupabaseMock` för testning.
- [x] Implementerat stubbar för `SupabaseSubscriptionRepository` för testning.
- [x] Refaktorerat `SupabaseTeamRepository` för att följa DDD-principer och hantera domänevents korrekt.
- [x] Skapat robust `TeamMapper` för konvertering mellan domän- och databasmodeller.
- [x] Skapat robust `UserMapper` för konvertering mellan domän- och databasmodeller.
- [x] Skapat robust `OrganizationMapper` för konvertering mellan domän- och databasmodeller.
- [x] Refaktorerat `SupabaseUserRepository` för att följa DDD-principer och hantera domänevents korrekt.
- [x] Implementerat `SupabaseOrganizationRepository` enligt DDD-principer med events och transaktionshantering.

### Applikationslager
- [x] Refaktorerat team-relaterade use cases:
  - [x] CreateTeamUseCase
  - [x] AddTeamMemberUseCase
  - [x] RemoveTeamMemberUseCase
  - [x] UpdateTeamMemberRoleUseCase
  - [x] InviteTeamMemberUseCase
  - [x] GetTeamStatisticsUseCase
  - [x] GetTeamActivitiesUseCase
  - [x] CreateTeamActivityUseCase
  - [x] CreateTeamMessageUseCase
  - [x] CreateThreadReplyUseCase
- [x] Refaktorerat user-relaterade use cases:
  - [x] CreateUserUseCase
  - [x] UpdateProfileUseCase
  - [x] DeactivateUserUseCase
  - [x] ActivateUserUseCase
  - [x] UpdateSettingsUseCase
  - [x] UpdatePrivacySettingsUseCase

### Testning
- [x] Exporterat testmockar via `test-utils/index.ts` för enkel tillgång.
- [x] Förbättrat testbarhet genom korrekt implementation av `EventBus` och mock-objekt.

## Fas 1: Förberedelse och Analys

### 1.1 Kodanalys
- [x] Identifiera och katalogisera aktuella domänentiteter
- [x] Identifiera och katalogisera existerande värde-objekt
- [x] Identifiera och katalogisera repositories
- [x] Identifiera och katalogisera domäntjänster
- [ ] Dokumentera aktuella mönster för dataflöde
- [x] Lista existerande konventioner för kodskrivning

### 1.2 Test- och Byggförberedelser
- [x] Säkerställ att existerande tester körs korrekt
- [ ] Dokumentera nuvarande teststruktur och täckning
- [ ] Skapa skript för att automatiskt köra enhetstester på domännivå
- [ ] Förbered byggscript för att hantera nya mappstrukturer

## Fas 2: Domänlager

### 2.1 Entiteter
- [x] Standardisera basklass för entiteter (`Entity`)
- [ ] Refaktorera `User` entitet för att följa DDD-principer
- [ ] Refaktorera `Team` entitet för att följa DDD-principer
- [x] Refaktorera `Organization` entitet för att följa DDD-principer
- [x] Säkerställ att alla entiteter använder Result-typen korrekt
- [ ] Implementera domänevent-publish i alla entiteter

### 2.2 Värde-objekt
- [ ] Standardisera bas-implementationen för värde-objekt
- [ ] Refaktorera `TeamName`, `TeamDescription` som värde-objekt
- [ ] Refaktorera `UserProfile` som korrekt värde-objekt
- [x] Säkerställ att värde-objekt är oföränderliga (immutable)
- [x] Implementera validering i create-metoder för alla värde-objekt

### 2.3 Aggregatrotsystem
- [ ] Definiera tydliga aggregatgränser
- [x] Implementera `AggregateRoot`-basklass korrekt
- [x] Refaktorera `Organization` för korrekt aggregatrotsbeteende
- [ ] Refaktorera `Team` för korrekt aggregatrotsbeteende
- [ ] Säkerställ att bara aggregatrötter publicerar domänevents

### 2.4 Repositories
- [x] Standardisera interface för repositories
- [x] Definiera `TeamRepository` interface
- [x] Definiera `UserRepository` interface
- [x] Definiera `OrganizationRepository` interface
- [x] Säkerställ att repositories bara arbetar mot aggregatrötter

### 2.5 Domäntjänster
- [x] Identifiera operationer som kräver domäntjänster
- [ ] Implementera `PermissionService`
- [x] Implementera `SubscriptionService`
- [ ] Säkerställ att domäntjänster är stateless

### 2.6 Domänevents
- [x] Definiera standardstruktur för domänevents
- [ ] Refaktorera team-relaterade events
- [ ] Refaktorera user-relaterade events
- [ ] Säkerställ att events bara innehåller nödvändig information

## Fas 3: Applikationslager

### 3.1 Use Cases
- [x] Definiera standardstruktur för use cases
- [x] Refaktorera team-relaterade use cases
  - [x] Refaktorera grundläggande team use cases (createTeam, addTeamMember, removeTeamMember, updateTeamMemberRole, inviteTeamMember)
  - [x] Refaktorera återstående team use cases (getTeamStatistics, getTeamActivities, createTeamActivity, createTeamMessage, createThreadReply)
- [x] Refaktorera user-relaterade use cases
  - [x] CreateUserUseCase
  - [x] UpdateProfileUseCase
  - [x] DeactivateUserUseCase
  - [x] ActivateUserUseCase
  - [x] UpdateSettingsUseCase
  - [x] UpdatePrivacySettingsUseCase
- [x] Säkerställ korrekt felhantering med Result-typen
- [x] Implementera tydlig beroendehantering

### 3.2 DTOs
- [x] Definiera standard för DTOs
- [x] Skapa DTOs för team-relaterad data
- [x] Skapa DTOs för user-relaterad data
- [ ] Implementera mappers mellan domänentiteter och DTOs

### 3.3 Hooks
- [x] Definiera standardstruktur för hooks
- [x] Implementera team-relaterade hooks
- [x] Implementera user-relaterade hooks
- [x] Säkerställ korrekt hantering av laddning och fel
- [x] Abstrahera React Query-logik för konsekvent användning

### 3.4 Queries
- [ ] Identifiera behov av specialiserade queries
- [ ] Implementera team-relaterade queries
- [ ] Implementera statistik-relaterade queries
- [ ] Optimera queries för responsivitet

## Fas 4: Infrastrukturlager

### 4.1 Repository-implementationer
- [x] Refaktorera `SupabaseTeamRepository`
- [x] Refaktorera `SupabaseUserRepository`
- [x] Refaktorera `SupabaseOrganizationRepository`
- [x] Säkerställ korrekt mocking för testsyften

### 4.2 Tekniska tjänster
- [x] Refaktorera `EventBus`-implementation
- [ ] Refaktorera loggningssystem
- [ ] Refaktorera caching-system
- [x] Säkerställ korrekt mocking av externa tjänster

### 4.3 DTO-mappning
- [x] Implementera mappning mellan databas och domänmodeller för Team
- [x] Implementera mappning mellan databas och domänmodeller för User
- [x] Implementera mappning mellan databas och domänmodeller för Organization
- [x] Säkerställ att all validering sker i domänlagret
- [x] Skapa separata mapper-klasser för komplex mappning

## Fas 5: UI-lager

### 5.1 Komponenter
- [ ] Säkerställ att komponenter följer designsystemet
- [ ] Separera presentationskod från affärslogik
- [ ] Standardisera felhantering i UI

### 5.2 Skärmar
- [ ] Refaktorera team-relaterade skärmar
- [ ] Refaktorera user-relaterade skärmar
- [ ] Säkerställ användning av hooks från applikationslagret

### 5.3 Kontext
- [ ] Identifiera och begränsa anvädning av Kontext
- [ ] Refaktorera för att använda hooks där möjligt
- [ ] Säkerställ att endast UI-tillstånd lagras i Kontext

## Fas 6: Testning och Dokumentation

### 6.1 Domäntester
- [x] Skapa enhetstester för alla domänentiteter
- [x] Skapa enhetstester för alla värde-objekt
- [ ] Skapa enhetstester för domäntjänster

### 6.2 Use Case-tester
- [ ] Skapa enhetstester för use cases
- [x] Skapa mock implementations för repositories
- [ ] Säkerställ test av felhantering

### 6.3 UI-tester
- [ ] Skapa integrationstester för hooks
- [ ] Skapa enhetstester för UI-komponenter
- [ ] Säkerställ mocking av applikationslager

### 6.4 Dokumentation
- [x] Uppdatera README.md med nya strukturen
- [ ] Dokumentera domänentiteter och deras samband
- [x] Skapa översiktlig arkitekturdokumentation
- [ ] Dokumentera conventions och riktlinjer

## Nästa steg

1. ~~Refaktorera User och Team-entiteter för att använda de nya basklasserna~~
2. ~~Refaktorera domänevents för att implementera IDomainEvent~~
3. ~~Förbättra domäntestning med den nya strukturen~~
4. ~~Slutför refaktorering av team-relaterade use cases~~
5. ~~Slutför refaktorering av user-relaterade use cases~~
6. ~~Implementera event handlers för team-relaterade domänevents~~
7. ~~Implementera hooks för att använda de refaktorerade use cases~~
8. Utöka hooks-implementationen med ytterligare beteenden och förbättrad felhantering
9. ~~Implementera standardiserade hooks för user-domänen~~
10. Förbättra providers med fler domäner och tydliga gränssnitt
11. Skapa fullständig testning för hooks och providers
12. [PAUSAD] UI-integration med de nya hooksen - flyttad till senare fas

## Prioriteringsordning

1. ~~Förberedelse och Analys (Fas 1)~~ ✓
2. ~~Domänlager - Entiteter och Värde-objekt (Fas 2.1, 2.2)~~ ✓
3. ~~Repositories (Fas 2.4, 4.1)~~ ✓
4. ~~Use Cases (Fas 3.1)~~ ✓
   - ~~Team-relaterade use cases~~ ✓
   - ~~User-relaterade use cases~~ ✓
5. ~~Domäntjänster och Domänevents (Fas 2.5, 2.6)~~ ✓
   - ~~Event handlers~~ ✓
6. ~~Hooks (Fas 3.3)~~ ✓
   - ~~Standardiserade hooks för team och user~~ ✓
   - Vidareutveckling av hooks och providers (Fokus i nästa fas)
7. [PAUSAD] UI-integration (Fas 5) - flyttad till senare fas
8. Testning och Dokumentation (Fas 6) - Delvis genomfört ✓

## Plan för Application Layer Improvements

För att förbättra applikationslagret ytterligare, fokuserar vi på:

### 1. Hook Standardisering
- Skapa en gemensam bas för hook-implementationer
- Standardisera hantering av laddningstillstånd
- Förbättra felhantering med typad DTO för felmeddelanden
- Implementera returmönster för att förenkla användning i UI

### 2. Provider Förbättringar
- Utveckla providers för fler domäner (user, organization)
- Skapa tydliga gränssnitt för provider-förbättringar
- Förbättra prestanda genom optimerad caching

### 3. Testing
- Utöka testning av hooks med fokus på edge cases
- Skapa integrationstester för sammansatta providerfunktionalitet
- Utveckla mockverktyg för enklare testning

## Definition av Klar

En uppgift anses klar när:
1. Koden följer definierade DDD-principer
2. Alla tester passerar
3. Koden har genomgått kodgranskning
4. Dokumentationen är uppdaterad 