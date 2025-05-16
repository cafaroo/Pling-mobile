# Bundna Kontexter (Bounded Contexts)

Detta dokument visar en visualisering av de olika bundna kontexterna i systemet och hur de relaterar till varandra.

## Överblick över Bounded Contexts

Diagrammet nedan visar de huvudsakliga bundna kontexterna i systemet och deras relationer:

```mermaid
graph TB
    subgraph "Teamhantering"
        TM["Team Management"]
        TCS["Team Collaboration System"]
        TM --- TCS
    end
    
    subgraph "Användarhantering"
        IAM["Identity & Access Management"]
        UM["User Management"]
        PM["Profile Management"]
        IAM --- UM
        UM --- PM
    end
    
    subgraph "Organisationshantering"
        OM["Organization Management"]
        BM["Billing Management"]
        OM --- BM
    end
    
    subgraph "Kommunikation"
        CM["Communication"]
        NM["Notification Management"]
        CM --- NM
    end
    
    subgraph "Prenumerationshantering"
        SM["Subscription Management"]
        FM["Feature Management"]
        SM --- FM
    end
    
    %% Relations between contexts
    TM -.-> UM
    TM -.-> OM
    OM -.-> SM
    UM -.-> CM
    TCS -.-> CM
    OM -.-> UM
    NM -.-> UM
    FM -.-> OM
```

## Detaljerat Context Map

Detta diagram visar mer detaljerade relationer mellan de bundna kontexterna, inklusive vilka typer av relationer de har:

```mermaid
classDiagram
    class TeamManagement {
        <<bounded context>>
        Team
        TeamMember
        TeamInvitation
        TeamSettings
    }
    
    class UserManagement {
        <<bounded context>>
        User
        UserProfile
        UserSettings
        UserRole
    }
    
    class OrganizationManagement {
        <<bounded context>>
        Organization
        OrganizationMember
        OrganizationSettings
        OrganizationInvitation
    }
    
    class CommunicationSystem {
        <<bounded context>>
        TeamMessage
        TeamMessageReply
        TeamMessageReaction
        Notification
    }
    
    class SubscriptionSystem {
        <<bounded context>>
        Subscription
        SubscriptionTier
        FeatureFlag
        BillingInfo
    }
    
    TeamManagement -- UserManagement : använder som Shared Kernel
    TeamManagement -- OrganizationManagement : använder som Shared Kernel
    TeamManagement -- CommunicationSystem : använder som Customer/Supplier
    
    OrganizationManagement -- SubscriptionSystem : använder som Customer/Supplier
    OrganizationManagement -- UserManagement : använder som Shared Kernel
    
    UserManagement -- CommunicationSystem : använder som Partner
    
    SubscriptionSystem --|> OrganizationManagement : Conformist
```

## Integration mellan Bundna Kontexter

Detta diagram visar hur de olika kontexterna integrerar med varandra genom olika strategier:

```mermaid
flowchart TD
    %% Bounded Contexts
    TM[Team Management]
    UM[User Management]
    OM[Organization Management]
    CM[Communication Management]
    SM[Subscription Management]
    
    %% Integration patterns
    TM -->|ACL| UM
    TM -->|Shared Kernel| OM
    OM -->|Shared Kernel| UM
    OM -->|Anticorruption Layer| SM
    CM -->|Open Host Service| TM
    CM -->|Open Host Service| UM
    
    %% Domain Events
    TM -->|Domain Events| UM
    UM -->|Domain Events| TM
    OM -->|Domain Events| TM
    OM -->|Domain Events| UM
    
    %% Legend
    subgraph Legend
        SH[Shared Kernel]
        ACL[Anticorruption Layer]
        OHS[Open Host Service]
        DE[Domain Events]
    end
```

## Ubiquitous Language i Olika Kontexter

Detta diagram visar hur samma termer kan ha olika betydelser i olika bundna kontexter:

```mermaid
graph TD
    subgraph "User Management Context"
        UMember["Member = En användare med konto i systemet"]
        UTeam["Team = En grupp som användaren tillhör"]
        URole["Role = Behörighetsnivå i systemet"]
    end
    
    subgraph "Team Management Context"
        TMember["Member = En deltagare i teamet med specifik roll"]
        TTeam["Team = En samarbetsgrupp med medlemmar och inställningar"]
        TRole["Role = Funktion/ansvar inom teamet"]
    end
    
    subgraph "Organization Management Context"
        OMember["Member = En användare med position i organisationshierarkin"]
        OTeam["Team = En affärsenhet eller arbetsgrupp i organisationen"]
        ORole["Role = Organisatorisk position med ansvar"]
    end
    
    UMember -.-|"Översättning"| TMember
    TMember -.-|"Översättning"| OMember
    UTeam -.-|"Översättning"| TTeam
    TTeam -.-|"Översättning"| OTeam
    URole -.-|"Översättning"| TRole
    TRole -.-|"Översättning"| ORole
``` 