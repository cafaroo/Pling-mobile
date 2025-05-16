# Event-flöden i Systemet

Detta dokument visar detaljerade flödesdiagram för hur domänevents flödar mellan aggregat och domäner i systemet.

## Övergripande Event-flöde

```mermaid
flowchart TB
    subgraph Domain[Domänlager]
        subgraph Aggregates[Aggregatrötter]
            User[[User]]
            Team[[Team]]
            Organization[[Organization]]
            TeamMessage[[TeamMessage]]
        end
        
        subgraph DomainEvents[Domänevents]
            UserEvents[User Events]
            TeamEvents[Team Events]
            OrgEvents[Organization Events]
            MsgEvents[Message Events]
        end
        
        User --> UserEvents
        Team --> TeamEvents
        Organization --> OrgEvents
        TeamMessage --> MsgEvents
    end
    
    subgraph Application[Applikationslager]
        subgraph EventHandlers[Event Handlers]
            UserHandlers[User Event Handlers]
            TeamHandlers[Team Event Handlers]
            OrgHandlers[Organization Event Handlers]
            MsgHandlers[Message Event Handlers]
        end
        
        subgraph UseCases[Use Cases]
            UserUseCases[User Use Cases]
            TeamUseCases[Team Use Cases]
            OrgUseCases[Organization Use Cases]
            MsgUseCases[Message Use Cases]
        end
        
        UserEvents --> UserHandlers
        TeamEvents --> TeamHandlers
        OrgEvents --> OrgHandlers
        MsgEvents --> MsgHandlers
        
        UserHandlers --> UseCases
        TeamHandlers --> UseCases
        OrgHandlers --> UseCases
        MsgHandlers --> UseCases
    end
    
    subgraph Infrastructure[Infrastrukturlager]
        EventBus[Event Bus]
        UserRepo[User Repository]
        TeamRepo[Team Repository]
        OrgRepo[Organization Repository]
        MsgRepo[Message Repository]
        
        UserEvents --> EventBus
        TeamEvents --> EventBus
        OrgEvents --> EventBus
        MsgEvents --> EventBus
        
        EventBus --> UserHandlers
        EventBus --> TeamHandlers
        EventBus --> OrgHandlers
        EventBus --> MsgHandlers
    end
    
    subgraph UI[UI-lager]
        Hooks[React Hooks]
        Components[UI Components]
        
        UseCases --> Hooks
        Hooks --> Components
    end
```

## Detaljerat Event-flöde för Team Management

```mermaid
sequenceDiagram
    participant Client as Klient
    participant TeamController as TeamController
    participant CreateTeamUC as CreateTeamUseCase
    participant TeamAgg as Team (Aggregat)
    participant EventBus as EventBus
    participant UserHandler as UserEventHandler
    participant UserAgg as User (Aggregat)
    
    Client->>TeamController: Skapa team
    TeamController->>CreateTeamUC: createTeam(dto)
    CreateTeamUC->>TeamAgg: Team.create(props)
    TeamAgg-->>TeamAgg: validateInvariants()
    TeamAgg-->>TeamAgg: addDomainEvent(TeamCreatedEvent)
    TeamAgg-->>CreateTeamUC: return new Team
    CreateTeamUC->>EventBus: publish(TeamCreatedEvent)
    EventBus->>UserHandler: notify(TeamCreatedEvent)
    UserHandler->>UserAgg: addTeam(teamId)
    UserAgg-->>UserAgg: validateInvariants()
    UserAgg-->>UserAgg: addDomainEvent(UserTeamAddedEvent)
    UserHandler->>EventBus: publish(UserTeamAddedEvent)
    CreateTeamUC-->>TeamController: return Result.ok(team)
    TeamController-->>Client: return response
```

## Team Member Flow

```mermaid
flowchart LR
    TeamCreated[TeamCreatedEvent]
    TeamMemberJoined[TeamMemberJoinedEvent]
    TeamMemberLeft[TeamMemberLeftEvent]
    UserTeamAdded[UserTeamAddedEvent]
    UserTeamRemoved[UserTeamRemovedEvent]
    OrgMemberJoined[OrganizationMemberJoinedEvent]
    
    TeamCreated -->|initierar| TeamMemberJoined
    TeamMemberJoined -->|triggar| UserTeamAdded
    TeamMemberLeft -->|triggar| UserTeamRemoved
    OrgMemberJoined -->|kan leda till| TeamMemberJoined
    
    subgraph Handlers[Event Handlers]
        TCH[TeamCreatedHandler]
        TMJH[TeamMemberJoinedHandler]
        TMLH[TeamMemberLeftHandler]
        UTJH[UserTeamJoinedHandler]
    end
    
    TeamCreated --> TCH
    TeamMemberJoined --> TMJH
    TeamMemberLeft --> TMLH
    UserTeamAdded --> UTJH
    
    style TeamCreated fill:#f96,stroke:#333,stroke-width:2px
    style TeamMemberJoined fill:#f96,stroke:#333,stroke-width:2px
    style TeamMemberLeft fill:#f96,stroke:#333,stroke-width:2px
    style UserTeamAdded fill:#69f,stroke:#333,stroke-width:2px
    style UserTeamRemoved fill:#69f,stroke:#333,stroke-width:2px
    style OrgMemberJoined fill:#9c6,stroke:#333,stroke-width:2px
```

## Organization Member Flow

```mermaid
flowchart TD
    subgraph Org[Organization Events]
        OrgCreated[OrganizationCreatedEvent]
        OrgMemberInvited[OrganizationMemberInvitedEvent]
        OrgMemberJoined[OrganizationMemberJoinedEvent]
        OrgMemberLeft[OrganizationMemberLeftEvent]
        OrgMemberRoleChanged[OrganizationMemberRoleChangedEvent]
    end
    
    subgraph Team[Team Events]
        TeamMemberJoined[TeamMemberJoinedEvent]
        TeamMemberLeft[TeamMemberLeftEvent]
        TeamMemberRoleChanged[TeamMemberRoleChangedEvent]
    end
    
    subgraph User[User Events]
        UserOrgAdded[UserOrganizationAddedEvent]
        UserOrgRemoved[UserOrganizationRemovedEvent]
        UserRoleChanged[UserRoleChangedEvent]
    end
    
    OrgMemberInvited -->|"Acceptera inbjudan"| OrgMemberJoined
    OrgMemberJoined -->|"Lägg till i teams"| TeamMemberJoined
    OrgMemberJoined -->|"Uppdatera användare"| UserOrgAdded
    OrgMemberLeft -->|"Ta bort från teams"| TeamMemberLeft
    OrgMemberLeft -->|"Uppdatera användare"| UserOrgRemoved
    OrgMemberRoleChanged -->|"Uppdatera roller i teams"| TeamMemberRoleChanged
    OrgMemberRoleChanged -->|"Uppdatera användarroller"| UserRoleChanged
    
    style OrgMemberInvited fill:#9c6,stroke:#333,stroke-width:2px
    style OrgMemberJoined fill:#9c6,stroke:#333,stroke-width:2px
    style OrgMemberLeft fill:#9c6,stroke:#333,stroke-width:2px
    style OrgMemberRoleChanged fill:#9c6,stroke:#333,stroke-width:2px
    style TeamMemberJoined fill:#f96,stroke:#333,stroke-width:2px
    style TeamMemberLeft fill:#f96,stroke:#333,stroke-width:2px
    style TeamMemberRoleChanged fill:#f96,stroke:#333,stroke-width:2px
    style UserOrgAdded fill:#69f,stroke:#333,stroke-width:2px
    style UserOrgRemoved fill:#69f,stroke:#333,stroke-width:2px
    style UserRoleChanged fill:#69f,stroke:#333,stroke-width:2px
```

## Event Publishing Process

```mermaid
sequenceDiagram
    participant Aggregat as Aggregat
    participant Event as DomainEvent
    participant Repo as Repository
    participant EventBus as EventBus
    participant Handler as EventHandler
    participant UseCase as UseCase
    
    Aggregat->>Aggregat: addDomainEvent(event)
    Aggregat->>Repo: save()
    Repo->>EventBus: publishEvents(aggregate.domainEvents)
    loop For each event
        EventBus->>Handler: notify(event)
        Handler->>UseCase: execute(event data)
        UseCase-->>Handler: return result
    end
    Repo->>Aggregat: clearEvents()
    Repo-->>Aggregat: return result
```

## Cross-Domain Event Flow

```mermaid
graph TD
    %% Events
    UC[UserCreatedEvent]
    UPU[UserProfileUpdatedEvent]
    USC[UserStatusChangedEvent]
    UTA[UserTeamAddedEvent]
    UTR[UserTeamRemovedEvent]
    
    TC[TeamCreatedEvent]
    TD[TeamDeletedEvent]
    TMJ[TeamMemberJoinedEvent]
    TML[TeamMemberLeftEvent]
    TMRC[TeamMemberRoleChangedEvent]
    
    OC[OrganizationCreatedEvent]
    OMJ[OrganizationMemberJoinedEvent]
    OML[OrganizationMemberLeftEvent]
    OMRC[OrganizationMemberRoleChangedEvent]
    TATO[TeamAddedToOrganizationEvent]
    TRFO[TeamRemovedFromOrganizationEvent]
    
    %% Cross-domain connections
    UC -->|"UserCreatedHandler"| TMJ
    UPU -->|"UserProfileUpdatedHandler"| TMJ
    USC -->|"UserStatusChangedHandler"| TML
    
    TC -->|"TeamCreatedHandler"| UTA
    TD -->|"TeamDeletedHandler"| UTR
    TMJ -->|"TeamMemberJoinedHandler"| UTA
    TML -->|"TeamMemberLeftHandler"| UTR
    
    OC -->|"OrganizationCreatedHandler"| TC
    OMJ -->|"OrganizationMemberJoinedHandler"| TMJ
    OML -->|"OrganizationMemberLeftHandler"| TML
    
    TC -->|"TeamCreatedHandler"| TATO
    TD -->|"TeamDeletedHandler"| TRFO
    
    %% Grouping
    subgraph UserDomain[User Domain]
        UC
        UPU
        USC
        UTA
        UTR
    end
    
    subgraph TeamDomain[Team Domain]
        TC
        TD
        TMJ
        TML
        TMRC
    end
    
    subgraph OrgDomain[Organization Domain]
        OC
        OMJ
        OML
        OMRC
        TATO
        TRFO
    end
    
    %% Styling
    classDef userEvent fill:#69f,stroke:#333,stroke-width:1px;
    classDef teamEvent fill:#f96,stroke:#333,stroke-width:1px;
    classDef orgEvent fill:#9c6,stroke:#333,stroke-width:1px;
    
    class UC,UPU,USC,UTA,UTR userEvent;
    class TC,TD,TMJ,TML,TMRC teamEvent;
    class OC,OMJ,OML,OMRC,TATO,TRFO orgEvent;
``` 