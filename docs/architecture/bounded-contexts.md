# Bounded Contexts i Pling Mobile

Detta dokument beskriver de olika bounded contexts (avgränsade kontexter) som existerar i Pling Mobile-applikationen och hur de relaterar till varandra. En bounded context definierar en explicit gräns inom vilken en specifik domänmodell gäller och där begrepp har specifika betydelser.

## Innehåll

1. [Översikt](#översikt)
2. [Team-kontext](#team-kontext)
3. [User-kontext](#user-kontext)
4. [Organization-kontext](#organization-kontext)
5. [Subscription-kontext](#subscription-kontext)
6. [Kontextkartor](#kontextkartor)
7. [Anti-Corruption Layers](#anti-corruption-layers)
8. [Shared Kernel](#shared-kernel)

## Översikt

Pling Mobile är organiserad kring följande huvudsakliga bounded contexts:

- **Team-kontext**: Hantering av team, medlemmar, roller och teamaktiviteter.
- **User-kontext**: Hantering av användare, profiler, inställningar och autentisering.
- **Organization-kontext**: Hantering av organisationer, resurser och behörigheter.
- **Subscription-kontext**: Hantering av prenumerationer, funktioner och betalningar.

Varje kontext har sin egen domänmodell, repository, use cases och domänevents, som är designade för att fungera inom sin specifika kontext.

## Team-kontext

### Domänmodell

Innehåller koncepten kring team, medlemmar, kommunikation och aktiviteter. Nyckelentiteter är:

- **Team**: Aggregatrot som representerar ett arbets- eller projektteam.
- **TeamMember**: En medlem i ett team med specifika roller och behörigheter.
- **TeamActivity**: Registrerade aktiviteter inom ett team, t.ex. inlägg.
- **TeamMessage**: Meddelanden och interaktioner mellan medlemmar.
- **TeamThread**: Tråd av relaterade meddelanden.

### Värde-objekt

- **TeamName**: Identifierande namn för ett team.
- **TeamDescription**: Beskrivande text för ett team.
- **TeamMemberRole**: Definierar behörigheter och ansvar för en medlem.
- **TeamStatistics**: Sammanställd statistik om ett team.

### Repositories

- **TeamRepository**: Hantering av teams och relaterade entiteter.
- **TeamActivityRepository**: Hantering av aktiviteter inom teams.

### Domänevents

- **TeamCreatedEvent**: Ett nytt team har skapats.
- **MemberJoinedTeamEvent**: En användare har blivit medlem i ett team.
- **MemberLeftTeamEvent**: En användare har lämnat ett team.
- **TeamMessageCreatedEvent**: Ett nytt meddelande har skapats.
- **TeamThreadReplyEvent**: Ett svar har lagts till i en meddelandetråd.

### Use Cases

- **CreateTeamUseCase**: Skapa ett nytt team.
- **AddTeamMemberUseCase**: Lägg till en medlem till ett team.
- **RemoveTeamMemberUseCase**: Ta bort en medlem från ett team.
- **UpdateTeamMemberRoleUseCase**: Uppdatera en medlems roll i ett team.
- **InviteTeamMemberUseCase**: Bjud in en användare till ett team.
- **GetTeamStatisticsUseCase**: Hämta statistik för ett team.
- **CreateTeamMessageUseCase**: Skapa ett nytt meddelande i ett team.
- **CreateThreadReplyUseCase**: Svara på ett befintligt meddelande.

## User-kontext

### Domänmodell

Innehåller koncepten kring användare, profiler och inställningar. Nyckelentiteter är:

- **User**: Aggregatrot som representerar en användare i systemet.
- **UserProfile**: Användarens profilinformation.
- **UserSettings**: Användarinställningar som notifikationer och språkval.
- **UserPrivacySettings**: Inställningar relaterade till användarens integritet.
- **UserSession**: Information om användarens aktiva sessioner.

### Värde-objekt

- **Email**: Användarens e-postadress som används för identifiering.
- **FullName**: Användarens fullständiga namn.
- **ProfilePicture**: URL eller referens till användarens profilbild.
- **UserStatus**: Status för användarkontot (aktiv, inaktiv, etc).
- **Locale**: Språk- och regioninställningar.

### Repositories

- **UserRepository**: Hantering av användare och relaterade entiteter.
- **AuthRepository**: Hantering av autentisering och sessioner.

### Domänevents

- **UserCreatedEvent**: En ny användare har registrerats.
- **UserProfileUpdatedEvent**: En användares profil har uppdaterats.
- **UserStatusChangedEvent**: En användares status har ändrats.
- **UserSettingsUpdatedEvent**: En användares inställningar har uppdaterats.
- **UserPrivacySettingsUpdatedEvent**: En användares integritetsinställningar har uppdaterats.

### Use Cases

- **CreateUserUseCase**: Registrera en ny användare.
- **UpdateProfileUseCase**: Uppdatera en användares profilinformation.
- **DeactivateUserUseCase**: Inaktivera ett användarkonto.
- **ActivateUserUseCase**: Aktivera ett inaktiverat användarkonto.
- **UpdateSettingsUseCase**: Uppdatera en användares inställningar.
- **UpdatePrivacySettingsUseCase**: Uppdatera en användares integritetsinställningar.

## Organization-kontext

### Domänmodell

Innehåller koncepten kring organisationer, resurser och behörigheter. Nyckelentiteter är:

- **Organization**: Aggregatrot som representerar en organisation.
- **OrganizationMember**: En medlem i en organisation med specifika roller.
- **OrganizationResource**: En resurs som tillhör en organisation.
- **ResourcePermission**: Behörigheter för en specifik resurs.

### Värde-objekt

- **OrganizationName**: Namnet på en organisation.
- **OrganizationIdentifier**: Unik identifierare för en organisation.
- **MemberRole**: Roll för en organisationsmedlem.
- **ResourceType**: Typ av resurs (dokument, projekt, etc).
- **PermissionLevel**: Behörighetsnivå (läs, skriv, admin, etc).

### Repositories

- **OrganizationRepository**: Hantering av organisationer och relaterade entiteter.
- **ResourceRepository**: Hantering av organisationsresurser.

### Domänevents

- **OrganizationCreatedEvent**: En ny organisation har skapats.
- **OrganizationMemberAddedEvent**: En användare har lagts till i en organisation.
- **OrganizationMemberRemovedEvent**: En användare har tagits bort från en organisation.
- **ResourceCreatedEvent**: En ny resurs har skapats i en organisation.
- **ResourcePermissionAddedEvent**: En behörighet har lagts till för en resurs.

### Use Cases

- **CreateOrganizationUseCase**: Skapa en ny organisation.
- **AddOrganizationMemberUseCase**: Lägg till en medlem i en organisation.
- **RemoveOrganizationMemberUseCase**: Ta bort en medlem från en organisation.
- **CreateResourceUseCase**: Skapa en ny resurs i en organisation.
- **AddResourcePermissionUseCase**: Lägg till behörighet för en resurs.

## Subscription-kontext

### Domänmodell

Innehåller koncepten kring prenumerationer, planer och betalningar. Nyckelentiteter är:

- **Subscription**: Aggregatrot som representerar en prenumeration.
- **SubscriptionPlan**: Beskriver en prenumerationsplan och dess funktioner.
- **SubscriptionFeature**: En specifik funktion tillgänglig i en prenumerationsplan.
- **Payment**: Information om betalningar relaterade till prenumerationer.

### Värde-objekt

- **SubscriptionType**: Typ av prenumeration (fri, premium, enterprise).
- **SubscriptionStatus**: Status för en prenumeration (aktiv, pausad, uppsagd).
- **SubscriptionPeriod**: Periodicitet för en prenumeration (månadsvis, årlig).
- **FeatureFlag**: En flagga som aktiverar eller inaktiverar en specifik funktion.

### Repositories

- **SubscriptionRepository**: Hantering av prenumerationer och relaterade entiteter.
- **PaymentRepository**: Hantering av betalningsinformation.

### Domänevents

- **SubscriptionCreatedEvent**: En ny prenumeration har skapats.
- **SubscriptionChangedEvent**: En prenumeration har ändrats (uppgradering, nedgradering).
- **SubscriptionCanceledEvent**: En prenumeration har avslutats.
- **PaymentProcessedEvent**: En betalning har bearbetats.
- **PaymentFailedEvent**: En betalning misslyckades.

### Use Cases

- **CreateSubscriptionUseCase**: Skapa en ny prenumeration.
- **ChangeSubscriptionPlanUseCase**: Ändra prenumerationsplan.
- **CancelSubscriptionUseCase**: Avsluta en prenumeration.
- **ProcessPaymentUseCase**: Bearbeta en betalning.
- **CheckFeatureAvailabilityUseCase**: Kontrollera om en funktion är tillgänglig.

## Kontextkartor

Bounded contexts interagerar med varandra genom definierade relationer, summerade i följande kontextkartor:

### Team och User

**Relation**: Partnership  
**Interaktionsmönster**: 
- Team-kontext använder User-ID:n från User-kontext
- User-kontext spårar medlemskap i Team-kontext
- Events från Team-kontext (t.ex. MemberJoinedTeamEvent) konsumeras av User-kontext för att uppdatera användarens teamlista

### Organization och Team

**Relation**: Parent-Child  
**Interaktionsmönster**:
- Organization äger Teams (ett team tillhör alltid en organization)
- Organization kontrollerar behörigheter på team-nivå
- Team ärver vissa egenskaper och begränsningar från sin organization

### Organization och User

**Relation**: Partnership  
**Interaktionsmönster**:
- Organization-kontext spårar medlemmar med roller
- User-kontext spårar organisationstillhörighet
- Events delas för att hålla data synkroniserad

### Subscription och Organization

**Relation**: Customer-Supplier  
**Interaktionsmönster**:
- Subscription-kontext levererar funktionsinformation till Organization-kontext
- Organization-kontext är beroende av Subscription-kontext för att avgöra vilka funktioner som är tillgängliga
- Subscription-ändringar påverkar direkt vad Organization och dess Teams kan göra

## Anti-Corruption Layers

För att skydda integriteten hos varje bounded context har vi implementerat anti-corruption layers (ACL) på strategiska platser:

### FeatureFlagService

En ACL mellan Subscription-kontext och andra kontexter, som översätter prenumerationsdetaljer till enkel funktionalitetstillgänglighet genom ett standardiserat API:

```typescript
export interface FeatureFlagService {
  isFeatureEnabled(
    organizationId: string, 
    featureKey: string
  ): Promise<Result<boolean>>;
  
  getFeatureLimits(
    organizationId: string, 
    featureKey: string
  ): Promise<Result<FeatureLimit>>;
}
```

### TeamMapper och UserMapper

Mapper-klasser fungerar som ACL mellan infrastrukturlagret och domänmodellen, och säkerställer att data konverteras korrekt mellan olika kontexters representationer:

```typescript
export class TeamMapper {
  static toDomain(raw: any): Result<Team> {
    // Översätter från databasformat till domänmodell
  }

  static toPersistence(team: Team): any {
    // Översätter från domänmodell till databasformat
  }
}
```

## Shared Kernel

Vissa koncept delas mellan alla bounded contexts och utgör vår "shared kernel":

### Result

`Result<T>` är en generisk typad struktur för att hantera resultat och fel, som används konsekvent i alla kontexter:

```typescript
export class Result<T> {
  private readonly _isSuccess: boolean;
  private readonly _error: any;
  private readonly _value: T;

  private constructor(isSuccess: boolean, error?: any, value?: T) {
    this._isSuccess = isSuccess;
    this._error = error;
    this._value = value as T;
  }

  public static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, undefined, value);
  }

  public static fail<U>(error: any): Result<U> {
    return new Result<U>(false, error);
  }

  // Ytterligare metoder...
}
```

### Entity och AggregateRoot

Basklasser för entiteter och aggregatrötter, som används i alla domänmodeller:

```typescript
export abstract class Entity<T> {
  protected readonly _id: UniqueEntityID;
  protected props: T;

  // Gemensam funktionalitet för alla entiteter...
}

export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: IDomainEvent[] = [];

  // Gemensam funktionalitet för alla aggregatrötter...
}
```

### DomainEvents

Basstruktur för domänevents, som alla kontexter använder för att publicera och konsumera händelser:

```typescript
export interface IDomainEvent {
  readonly eventType: string;
  readonly occurredOn: Date;
  readonly aggregateId: string;
}
```

### UniqueEntityID

Värde-objekt för unika identifierare, som används i alla kontexter:

```typescript
export class UniqueEntityID {
  private readonly value: string;

  constructor(id?: string) {
    this.value = id || v4();  // Använder UUID v4 om inget ID ges
  }

  equals(id?: UniqueEntityID): boolean {
    if (id === null || id === undefined) {
      return false;
    }
    return this.toString() === id.toString();
  }

  toString(): string {
    return this.value;
  }
}
```

## Slutsats

Genom att tydligt definiera bounded contexts och deras relationer, tillsammans med anti-corruption layers och en shared kernel, uppnår vi en modulär och skalbar arkitektur för Pling Mobile. Denna struktur möjliggör:

1. **Tydlig ansvarsfördelning**: Varje kontext har ett specifikt ansvarsområde och en dedikerad modell.
2. **Isolerad utveckling**: Team kan arbeta parallellt i olika kontexter utan att påverka varandra.
3. **Minskad komplexitet**: Komplexitet begränsas inom varje kontext snarare än att spridas genom hela systemet.
4. **Förenklad integration**: Definierade kontaktpunkter mellan kontexter med tydliga kontrakt.
5. **Enklare underhåll**: Förändringar i en kontext påverkar inte andra kontexter om kontrakten respekteras.

Denna arkitektur stödjer kontinuerlig utveckling och förbättring av Pling Mobile, samtidigt som den säkerställer långsiktig underhållbarhet och anpassningsförmåga. 