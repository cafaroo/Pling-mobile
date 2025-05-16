# Visualiseringar av Testhjälpare för Domänmodellen

Detta dokument visar hur testhjälparna relaterar till domänmodellen och hur de används för att testa aggregat, invarianter och event-publicering.

## Testhjälpare för Domäntestning

```mermaid
classDiagram
    class TestHjälpare {
        <<diagram>>
    }
    
    class InvariantTestHelper {
        <<testhjälpare>>
        +checkInvariant(aggregate, operation, args)
        +expectInvariantViolation(aggregate, operation, args, errorMessage)
        +expectNoInvariantViolation(aggregate, operation, args)
    }
    
    class AggregateTestHelper {
        <<testhjälpare>>
        +expectEventPublished(aggregate, eventType)
        +expectNoEventPublished(aggregate, eventType)
        +expectEventWithData(aggregate, eventType, data)
        +verifyEventSequence(aggregate, expectedEvents)
    }
    
    class MockDomainEvents {
        <<testhjälpare>>
        -events: Event[]
        +captureEvents()
        +getEvents(): Event[]
        +clearEvents()
        +findEvent(eventType): Event
        +hasEvent(eventType): boolean
        +countEvents(eventType): number
    }
    
    class ResultTestHelper {
        <<testhjälpare>>
        +expectSuccess(result)
        +expectFailure(result)
        +getSuccessValue(result)
        +getErrorMessage(result)
        +compatValue(result)
        +compatIsSuccess(result)
        +compatIsFailure(result)
    }
    
    class UserProfileTestHelper {
        <<testhjälpare>>
        +createMockUserProfile(props)
        +createLegacyUserProfile(props)
        +wrapProfileForBackwardCompat(profile)
    }
    
    InvariantTestHelper --> AggregateTestHelper
    AggregateTestHelper --> MockDomainEvents
```

## Testflöde för Aggregat och Invarianter

```mermaid
flowchart TB
    Start([Starta test]) --> MockEv[Skapa MockDomainEvents]
    MockEv --> SetupAgg[Skapa aggregatet som ska testas]
    SetupAgg --> InvHelper[Använd InvariantTestHelper]
    InvHelper --> TestOp[Utför operation på aggregatet]
    TestOp --> CheckInv[Kontrollera invarianter]
    CheckInv --> CheckEv[Kontrollera publicerade events]
    CheckEv --> End([Test slutfört])
    
    subgraph "Kontroll av invarianter"
        CheckValid[Validera att invarianter uppfylls]
        ExpectViolation[Förvänta viss invariantöverträdelse]
        ExpectNoViolation[Förvänta inga invariantöverträdelser]
        
        CheckInv --> CheckValid
        CheckInv --> ExpectViolation
        CheckInv --> ExpectNoViolation
    end
    
    subgraph "Kontroll av domänevents"
        HasEvent[Kontrollera att event publicerades]
        CheckEventData[Verifiera event-data]
        EventSequence[Verifiera sekvens av events]
        EventCount[Kontrollera antal events]
        
        CheckEv --> HasEvent
        CheckEv --> CheckEventData
        CheckEv --> EventSequence
        CheckEv --> EventCount
    end
```

## Testexempel för Team-aggregatet

```mermaid
sequenceDiagram
    participant Test as TeamTest
    participant Helper as AggregateTestHelper
    participant Team as Team Aggregate
    participant Events as MockDomainEvents
    
    Test->>Team: Team.create(teamData)
    Team-->>Team: validateInvariants()
    Team-->>Team: addDomainEvent(TeamCreatedEvent)
    Team-->>Test: return team
    
    Test->>Helper: expectEventPublished(team, TeamCreatedEvent)
    Helper->>Events: hasEvent(TeamCreatedEvent)
    Events-->>Helper: true
    Helper-->>Test: pass
    
    Test->>Team: team.addMember(memberData)
    Team-->>Team: validateInvariants()
    Team-->>Team: addDomainEvent(TeamMemberJoinedEvent)
    Team-->>Test: return success
    
    Test->>Helper: expectEventWithData(team, TeamMemberJoinedEvent, {userId: 'user123', role: 'member'})
    Helper->>Events: findEvent(TeamMemberJoinedEvent)
    Events-->>Helper: event
    Helper->>Helper: verify event data
    Helper-->>Test: pass
```

## Testning av User-aggregatet med mockade events

```mermaid
sequenceDiagram
    participant Test as UserTest
    participant UserAgg as User Aggregate
    participant InvHelper as InvariantTestHelper
    participant EventHelper as AggregateTestHelper
    
    Test->>UserAgg: User.create(userData)
    UserAgg-->>UserAgg: validateInvariants()
    UserAgg-->>UserAgg: addDomainEvent(UserCreatedEvent)
    UserAgg-->>Test: return user
    
    Test->>InvHelper: expectNoInvariantViolation(user, 'addRole', ['admin'])
    InvHelper->>UserAgg: user.addRole('admin')
    UserAgg-->>UserAgg: validateInvariants() // Checks no duplicate roles
    UserAgg-->>UserAgg: addDomainEvent(UserRoleAddedEvent)
    UserAgg-->>InvHelper: success
    InvHelper-->>Test: pass
    
    Test->>InvHelper: expectInvariantViolation(user, 'addRole', ['admin'], 'Role already exists')
    InvHelper->>UserAgg: user.addRole('admin')
    UserAgg-->>UserAgg: validateInvariants() // Finds duplicate role
    UserAgg-->>InvHelper: throws error 'Role already exists'
    InvHelper-->>Test: pass
    
    Test->>EventHelper: expectEventPublished(user, UserRoleAddedEvent)
    EventHelper-->>Test: pass
```

## Integration med Result API-testning

```mermaid
flowchart TD
    subgraph "Result API Testning"
        ResultTest[Test med ResultTestHelper]
        OldAPI[Kod som använder gamla API:et]
        NewAPI[Kod som använder nya API:et]
        
        ResultTest --> OldAPI
        ResultTest --> NewAPI
        
        OldAPI -->|compatIsSuccess| ResultAPI
        OldAPI -->|compatValue| ResultAPI
        NewAPI -->|isOk| ResultAPI
        NewAPI -->|value| ResultAPI
    end
    
    subgraph "Domäntestning"
        DomainTest[Test av domänentitet]
        InvTest[Test av invarianter]
        EventTest[Test av events]
        
        DomainTest --> InvTest
        DomainTest --> EventTest
        
        InvTest -->|expectInvariantViolation| ResultAPI
        EventTest -->|expectEventPublished| EventVerification
    end
    
    ResultAPI[ResultTestHelper] --- EventVerification[AggregateTestHelper]
```

## Testhjälparnas struktur i projektet

```mermaid
graph TD
    subgraph "Test Utilities"
        TestUtils[test-utils/]
        Mocks[mocks/]
        Verification[verification/]
        Helpers[helpers/]
        
        TestUtils --> Mocks
        TestUtils --> Verification
        TestUtils --> Helpers
        
        Mocks --> DomainMocks[mockDomainEvents.ts]
        Mocks --> RepositoryMocks[mockRepositories.ts]
        
        Verification --> ResultVerify[resultApiVerification.ts]
        Verification --> InvariantVerify[invariantVerification.ts]
        
        Helpers --> InvHelper[invariantTestHelper.ts]
        Helpers --> AggregateHelper[aggregateTestHelper.ts]
        Helpers --> ResultHelper[resultTestHelper.ts]
        Helpers --> ProfileHelper[userProfileTestHelper.ts]
    end
    
    subgraph "Domain Tests"
        EntityTests[domain/.../entities/__tests__/]
        ValueObjTests[domain/.../value-objects/__tests__/]
        
        EntityTests --> TeamTests[Team.test.ts]
        EntityTests --> UserTests[User.test.ts]
        EntityTests --> OrgTests[Organization.test.ts]
        
        ValueObjTests --> TeamNameTests[TeamName.test.ts]
        ValueObjTests --> EmailTests[Email.test.ts]
        ValueObjTests --> ProfileTests[UserProfile.test.ts]
    end
    
    DomainMocks -.-> EntityTests
    InvHelper -.-> EntityTests
    AggregateHelper -.-> EntityTests
    ResultHelper -.-> EntityTests
    ProfileHelper -.-> EntityTests
    
    DomainMocks -.-> ValueObjTests
    ResultHelper -.-> ValueObjTests
``` 