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
- [x] Implementerat event handlers för team-relaterade domänevents:
  - [x] MemberJoinedHandler
  - [x] TeamCreatedHandler
  - [x] MemberLeftHandler
  - [x] TeamMemberRoleChangedHandler
  - [x] TeamMessageCreatedHandler

### Testning
- [x] Exporterat testmockar via `test-utils/index.ts` för enkel tillgång.
- [x] Förbättrat testbarhet genom korrekt implementation av `EventBus` och mock-objekt.
- [x] Skapat tester för subscription-relaterade hooks och komponenter.
- [x] Implementerat tester för team-relaterade event handlers.

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
- [x] Dokumentera nuvarande teststruktur och täckning
- [ ] Skapa skript för att automatiskt köra enhetstester på domännivå
- [ ] Förbered byggscript för att hantera nya mappstrukturer

## Fas 2: Domänlager

### 2.1 Entiteter
- [x] Standardisera basklass för entiteter (`Entity`)
- [x] Refaktorera `User` entitet för att följa DDD-principer
- [x] Refaktorera `Team` entitet för att följa DDD-principer
- [x] Refaktorera `Organization` entitet för att följa DDD-principer
- [x] Säkerställ att alla entiteter använder Result-typen korrekt
- [x] Implementera domänevent-publish i alla entiteter

### 2.2 Värde-objekt
- [x] Standardisera bas-implementationen för värde-objekt
- [x] Refaktorera `TeamName`, `TeamDescription` som värde-objekt
- [x] Refaktorera `UserProfile` som korrekt värde-objekt
- [x] Refaktorera `TeamSettings` som korrekt värde-objekt
- [x] Säkerställ att värde-objekt är oföränderliga (immutable)
- [x] Implementera validering i create-metoder för alla värde-objekt

### 2.3 Aggregatrotsystem
- [x] Definiera tydliga aggregatgränser
- [x] Implementera `AggregateRoot`-basklass korrekt
- [x] Refaktorera `Organization` för korrekt aggregatrotsbeteende
- [x] Refaktorera `Team` för korrekt aggregatrotsbeteende
- [x] Säkerställ att bara aggregatrötter publicerar domänevents

### 2.4 Repositories
- [x] Standardisera interface för repositories
- [x] Definiera `TeamRepository` interface
- [x] Definiera `UserRepository` interface
- [x] Definiera `OrganizationRepository` interface
- [x] Säkerställ att repositories bara arbetar mot aggregatrötter

### 2.5 Domäntjänster
- [x] Identifiera operationer som kräver domäntjänster
- [x] Implementera `PermissionService`
- [x] Implementera `SubscriptionService`
- [x] Säkerställ att domäntjänster är stateless

### 2.6 Domänevents
- [x] Definiera standardstruktur för domänevents
- [x] Refaktorera team-relaterade events
- [x] Refaktorera user-relaterade events
- [x] Refaktorera organisation-relaterade events
- [x] Säkerställ att events bara innehåller nödvändig information

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
- [x] Implementera mappers mellan domänentiteter och DTOs
  - [x] Implementerat TeamDTOMapper i `src/application/team/dto/TeamDTOMapper.ts`
  - [x] Implementerat UserDTOMapper i `src/application/user/dto/UserDTOMapper.ts`
  - [x] Implementerat OrganizationDTOMapper i `src/application/organization/dto/OrganizationDTOMapper.ts`
  - [x] Implementerat SubscriptionDTOMapper i `src/application/subscription/dto/SubscriptionDTOMapper.ts`

### 3.3 Hooks
- [x] Definiera standardstruktur för hooks
- [x] Implementera team-relaterade hooks
- [x] Implementera user-relaterade hooks
- [x] Säkerställ korrekt hantering av laddning och fel
- [x] Abstrahera React Query-logik för konsekvent användning

### 3.4 Queries
- [x] Identifiera behov av specialiserade queries
- [x] Implementera team-relaterade queries
  - [x] Implementerat TeamSearchQuery i `src/application/team/queries/team-search/TeamSearchQuery.ts`
  - [x] Implementerat TeamsByOrganizationQuery i `src/application/team/queries/teams-by-organization/TeamsByOrganizationQuery.ts`
  - [x] Implementerat TeamStatisticsDashboardQuery i `src/application/team/queries/team-statistics-dashboard/TeamStatisticsDashboardQuery.ts`
  - [x] Implementerat TeamMemberDetailsQuery i `src/application/team/queries/team-member-details/TeamMemberDetailsQuery.ts`
  - [x] Implementerat TeamActivityFeedQuery i `src/application/team/queries/team-activity-feed/TeamActivityFeedQuery.ts`
- [x] Implementera statistik-relaterade queries
  - [x] Implementerat i TeamStatisticsDashboardQuery
- [x] Optimera queries för responsivitet
  - [x] Implementerat lämpliga caching-strategier i React-hooks med varierande staleTime och cacheTime
  - [x] Använt optimeringsstrategier som keepPreviousData för paginering

## Fas 4: Infrastrukturlager

### 4.1 Repository-implementationer
- [x] Refaktorera `SupabaseTeamRepository`
- [x] Refaktorera `SupabaseUserRepository`
- [x] Refaktorera `SupabaseOrganizationRepository`
- [x] Säkerställ korrekt mocking för testsyften

### 4.2 Tekniska tjänster
- [x] Refaktorera `EventBus`-implementation
- [x] Refaktorera loggningssystem
  - [x] Skapat `ILogger` interface i `src/infrastructure/logger/ILogger.ts`
  - [x] Implementerat `LoggerService` i `src/infrastructure/logger/LoggerService.ts`
  - [x] Skapat formaterare i `src/infrastructure/logger/formatters/DefaultFormatter.ts`
  - [x] Skapat destinationer i `src/infrastructure/logger/destinations/`
  - [x] Implementerat factory i `src/infrastructure/logger/LoggerFactory.ts`
  - [x] Skapat omfattande tester i `src/infrastructure/logger/__tests__/LoggerService.test.ts`
- [x] Refaktorera caching-system
  - [x] Skapat `ICacheService` interface i `src/infrastructure/cache/ICacheService.ts`
  - [x] Skapat `IStorageAdapter` interface i `src/infrastructure/cache/IStorageAdapter.ts`
  - [x] Implementerat storage adapters i `src/infrastructure/cache/adapters/`
  - [x] Implementerat `CacheServiceImpl` i `src/infrastructure/cache/CacheServiceImpl.ts`
  - [x] Skapat factory i `src/infrastructure/cache/CacheFactory.ts`
  - [x] Förbättrat `TeamCacheService` i `src/infrastructure/cache/TeamCacheService.ts`
  - [x] Skapat omfattande tester i `src/infrastructure/cache/__tests__/CacheService.test.ts`
- [x] Säkerställ korrekt mocking av externa tjänster

### 4.3 DTO-mappning
- [x] Implementera mappning mellan databas och domänmodeller för Team
- [x] Implementera mappning mellan databas och domänmodeller för User
- [x] Implementera mappning mellan databas och domänmodeller för Organization
- [x] Säkerställ att all validering sker i domänlagret
- [x] Skapa separata mapper-klasser för komplex mappning

## Fas 5: UI-lager

### 5.1 Komponenter
- [x] Säkerställ att komponenter följer designsystemet
  - [x] Skapad `ErrorBoundary` för enhetlig felhantering
  - [x] Implementerat `EmptyState` för tomma datamängder
  - [x] Skapat `QueryErrorHandler` för standardiserad hantering av React Query-fel
  - [x] Byggt `PresentationAdapter` för konsekvent datahantering 
  - [x] Implementerat `DialogRenderer` för modala fönster
  - [x] Skapat `ToastRenderer` för notifikationer
- [x] Separera presentationskod från affärslogik
  - [x] Refaktorerat `TeamPermissionManager` till container/presentation
  - [x] Refaktorerat `MemberCard` till container/presentation
  - [x] Refaktorerat `AddMemberForm` till container/presentation
  - [x] Implementerat `TeamMemberList` med container/presentation
  - [x] Skapat indexfiler för korrekt exportering
- [x] Standardisera felhantering i UI
  - [x] Implementerat standardiserade UI-feltyper
  - [x] Skapat gemensamma felmeddelandekonverterare
  - [x] Använt `QueryErrorHandler` för konsekvent felvisning
  - [x] Gjort komponenter för att centralisera felhantering

### 5.2 Skärmar
- [ ] Refaktorera team-relaterade skärmar
  - [x] Refaktorera TeamScreen 
  - [x] Refaktorera TeamMemberRoleScreen
  - [x] Refaktorera TeamDetailsScreen
  - [x] Refaktorera TeamSettingsScreen
  - [ ] Refaktorera TeamMembersScreen
  - [ ] Refaktorera TeamActivitiesScreen
- [ ] Refaktorera user-relaterade skärmar
  - [x] Refaktorera ProfileScreen
  - [x] Refaktorera UserSettingsScreen
  - [ ] Refaktorera UserTeamsScreen
- [ ] Säkerställ användning av hooks från applikationslagret
  - [ ] Integrera refaktorerade hooks i skärmar
  - [ ] Säkerställ korrekt dataflöde genom komponentträdet
  - [ ] Implementera optimala laddningsstrategier

### 5.3 Kontext
- [x] Identifiera och begränsa anvädning av Kontext
  - [x] Skapad `UIStateContext` för UI-specifika tillstånd
  - [x] Definierad UIState-typ med tema, dialoger och toasts
  - [x] Separerat UI-tillstånd från domän- och applikationstillstånd
- [x] Refaktorera för att använda hooks där möjligt
  - [x] Skapat `useUIState` för åtkomst till UI-tillstånd
  - [x] Implementerat tillståndshanterare med useReducer
  - [x] Tillhandahållit hjälpfunktioner för vanliga UI-operationer
- [x] Säkerställ att endast UI-tillstånd lagras i Kontext
  - [x] Flyttat domändata från kontext till props
  - [x] Använt container/presentation-mönstret för att separera data och UI
  - [x] Dokumenterat mönster för kontextanvändning

### 5.4 UI-integrationstester
- [ ] Skapa integrationstester för UI-komponenter
  - [ ] Implementera tester för TeamMemberList med mocks
  - [ ] Skapa tester för TeamPermissionManager
  - [ ] Testa dialoger och modala fönster
  - [ ] Skapa tester för ProfileScreen med fokus på container/presentation
- [ ] Standardisera UI-testmönster
  - [ ] Definiera standardmönster för rendering och snapshottestning
  - [ ] Skapa hjälpfunktioner för UI-testning
  - [ ] Dokumentera teststrategier för UI-komponenter
- [ ] Implementera end-to-end tester för kritiska flöden
  - [ ] Testa medlemshanteringsflöde
  - [ ] Testa behörighetshanteringsflöde
  - [ ] Testa inställningsändringsflöde

### 5.5 UI-dokumentation
- [ ] Skapa komponentbibliotek
  - [ ] Dokumentera alla grundläggande UI-komponenter
  - [ ] Skapa användningsexempel för varje komponent
  - [ ] Tillhandahålla propTyper för alla komponenter
- [ ] Dokumentera UI-arkitektur
  - [ ] Illustrera container/presentation-mönstret
  - [ ] Beskriva dataflödet genom applikationen
  - [ ] Förklara mönster för felhantering

## Nästa steg

Baserat på den aktuella statusen i cleanup_tasks.md, är de rekommenderade nästa stegen:

1. **Refaktorera UserSettingsScreen** - Fortsätta med refaktorering av user-relaterade skärmar:
   - Implementera UserSettingsScreenPresentation och UserSettingsScreenContainer
   - Följa samma container/presentation-mönster som för ProfileScreen
   - Säkerställa bakåtkompatibilitet genom wrapper

2. **Påbörja UI-integrationstester** - Börja implementera tester för de refaktorerade UI-komponenterna:
   - Skapa tester för ProfileScreen som verifierar att container hanterar affärslogik korrekt
   - Implementera tester för presentation-komponenten som fokuserar på rendering och interaktion
   - Dokumentera testmönster för andra att följa

3. **Refaktorera TeamMembersScreen** - Fortsätta refaktorering av team-relaterade skärmar:
   - Implementera TeamMembersScreenPresentation och TeamMembersScreenContainer
   - Applicera lärdomar från tidigare refaktoreringar
   - Förbättra dataflöde och laddningstillstånd

4. **Dokumentera UI-arkitektur** - Dokumentera de standarder och mönster som används:
   - Dokumentera container/presentation-mönstret med exempel från ProfileScreen
   - Skapa diagram som visar dataflöde genom komponentträdet
   - Förklara olika ansvar för container- och presentation-komponenter

5. **Planera end-to-end tester** - Börja förbereda ramverk för end-to-end-testning:
   - Välj och konfigurera testverktyg (som Detox eller React Native Testing Library)
   - Skapa testplan för kritiska användarflöden
   - Implementera första testfallet för medlemshanteringsflödet

## Fas 6: Testning och Dokumentation

### 6.1 Domäntester
- [x] Skapa enhetstester för alla domänentiteter
- [x] Skapa enhetstester för alla värde-objekt
- [x] Skapa enhetstester för domäntjänster
  - [x] Implementerat tester för PermissionService i `src/domain/core/services/__tests__/PermissionService.test.ts`
  - [x] Implementerat tester för FeatureFlagService i `src/domain/subscription/services/__tests__/FeatureFlagService.test.ts`
  - [x] Skapat DomainServiceTestHelper i `src/test-utils/helpers/DomainServiceTestHelper.ts` för att underlätta testning

### 6.2 Use Case-tester
- [x] Skapa enhetstester för use cases
- [x] Skapa mock implementations för repositories
- [x] Säkerställ test av felhantering

### 6.3 UI-tester
- [x] Skapa integrationstester för hooks
  - [x] Implementerat team-user hooks integration i `src/application/team/hooks/integration-tests/team-user-hooks-integration.test.tsx`
  - [x] Implementerat subscription-feature integration i `