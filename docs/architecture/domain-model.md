# Domänmodell för Pling Mobile

Detta dokument beskriver domänmodellen för Pling Mobile-applikationen med fokus på entiteter, värde-objekt, aggregater och deras relationer. Domänmodellen utgör kärnan i vår Domain-Driven Design och representerar de viktigaste affärskoncepten och reglerna.

## Innehåll

1. [Översikt](#översikt)
2. [Entiteter](#entiteter)
3. [Värde-objekt](#värde-objekt)
4. [Aggregatrötter](#aggregatrötter)
5. [Relationer mellan entiteter](#relationer-mellan-entiteter)
6. [Invarianter och affärsregler](#invarianter-och-affärsregler)
7. [Domänevents](#domänevents)
8. [Exempel på domänmodellimplementationer](#exempel-på-domänmodellimplementationer)

## Översikt

Pling Mobile är ett system för team- och organisationshantering med fokus på samarbete och kommunikation. Domänmodellen är strukturerad kring fyra huvudsakliga bounded contexts:

- **Team**: Hantering av team, medlemmar, roller och kommunikation
- **User**: Hantering av användare, profiler och inställningar
- **Organization**: Hantering av organisationer och resurser
- **Subscription**: Hantering av prenumerationer och funktioner

Varje kontext har sin egen domänmodell som fokuserar på att representera de relevanta affärskoncepten.

## Entiteter

Entiteter är objekt med en unik identitet som består över tid, även när dess attribut ändras. Här är de centrala entiteterna i vår domänmodell:

### Basklass för entiteter

Alla entiteter ärver från den generiska basklassen `Entity<T>`:

```typescript
export abstract class Entity<T> {
  protected readonly _id: UniqueEntityID;
  protected props: T;

  constructor(props: T, id?: UniqueEntityID) {
    this._id = id || new UniqueEntityID();
    this.props = props;
  }

  public equals(object?: Entity<T>): boolean {
    if (object === null || object === undefined) {
      return false;
    }

    if (this === object) {
      return true;
    }

    return this._id.equals(object._id);
  }

  get id(): UniqueEntityID {
    return this._id;
  }
}
```

### Team-kontext

#### Team

```typescript
export interface TeamProps {
  name: TeamName;
  description: string;
  createdBy: string;
  createdAt: Date;
  organizationId: string;
  members?: TeamMember[];
}

export class Team extends AggregateRoot<TeamProps> {
  // Implementation...
  
  get name(): TeamName { 
    return this.props.name; 
  }
  
  get description(): string { 
    return this.props.description; 
  }
  
  get createdBy(): string { 
    return this.props.createdBy; 
  }
  
  get organizationId(): string { 
    return this.props.organizationId; 
  }
  
  get members(): TeamMember[] { 
    return this.props.members || []; 
  }
  
  // Metoder för att manipulera medlemskap...
  public addMember(userId: string, role: string): Result<void> {
    // Implementationsdetaljer...
  }
  
  public removeMember(userId: string): Result<void> {
    // Implementationsdetaljer...
  }
  
  public updateMemberRole(userId: string, newRole: string): Result<void> {
    // Implementationsdetaljer...
  }
}
```

#### TeamMember

```typescript
export interface TeamMemberProps {
  userId: string;
  role: string;
  joinedAt: Date;
}

export class TeamMember extends Entity<TeamMemberProps> {
  // Implementation...
  
  get userId(): string { 
    return this.props.userId; 
  }
  
  get role(): string { 
    return this.props.role; 
  }
  
  get joinedAt(): Date { 
    return this.props.joinedAt; 
  }
  
  // Metoder för att ändra roll...
  public changeRole(newRole: string): void {
    this.props.role = newRole;
  }
}
```

### User-kontext

#### User

```typescript
export interface UserProps {
  email: Email;
  fullName: string;
  profilePicture?: string;
  isActive: boolean;
  createdAt: Date;
  settings?: UserSettings;
  privacySettings?: UserPrivacySettings;
}

export class User extends AggregateRoot<UserProps> {
  // Implementation...
  
  get email(): Email { 
    return this.props.email; 
  }
  
  get fullName(): string { 
    return this.props.fullName; 
  }
  
  get isActive(): boolean { 
    return this.props.isActive; 
  }
  
  // Metoder för att hantera användare...
  public deactivate(): void {
    this.props.isActive = false;
    this.addDomainEvent(new UserStatusChangedEvent(this));
  }
  
  public activate(): void {
    this.props.isActive = true;
    this.addDomainEvent(new UserStatusChangedEvent(this));
  }
  
  public updateProfile(fullName: string, profilePicture?: string): Result<void> {
    // Implementationsdetaljer...
  }
}
```

### Organization-kontext

#### Organization

```typescript
export interface OrganizationProps {
  name: string;
  identifier: string;
  createdBy: string;
  createdAt: Date;
  members?: OrganizationMember[];
  resources?: OrganizationResource[];
}

export class Organization extends AggregateRoot<OrganizationProps> {
  // Implementation...
  
  get name(): string { 
    return this.props.name; 
  }
  
  get identifier(): string { 
    return this.props.identifier; 
  }
  
  get members(): OrganizationMember[] { 
    return this.props.members || []; 
  }
  
  // Metoder för att hantera medlemmar och resurser...
  public addMember(userId: string, role: string): Result<void> {
    // Implementationsdetaljer...
  }
  
  public createResource(resourceData: ResourceCreationData): Result<OrganizationResource> {
    // Implementationsdetaljer...
  }
}
```

### Subscription-kontext

#### Subscription

```typescript
export interface SubscriptionProps {
  organizationId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: Date;
  endDate?: Date;
  features: SubscriptionFeature[];
}

export class Subscription extends AggregateRoot<SubscriptionProps> {
  // Implementation...
  
  get plan(): SubscriptionPlan { 
    return this.props.plan; 
  }
  
  get status(): SubscriptionStatus { 
    return this.props.status; 
  }
  
  get features(): SubscriptionFeature[] { 
    return this.props.features; 
  }
  
  // Metoder för att hantera prenumerationer...
  public changePlan(newPlan: SubscriptionPlan): Result<void> {
    // Implementationsdetaljer...
  }
  
  public cancel(): Result<void> {
    // Implementationsdetaljer...
  }
  
  public isFeatureEnabled(featureKey: string): boolean {
    // Implementationsdetaljer...
  }
}
```

## Värde-objekt

Värde-objekt är oföränderliga objekt som representerar beskrivande aspekter av domänen utan egen identitet. De identifieras genom sina attribut.

### TeamName

```typescript
export class TeamName {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  public static create(name: string): Result<TeamName> {
    if (!name || name.trim().length === 0) {
      return Result.fail('Teamnamn kan inte vara tomt');
    }

    if (name.length > 50) {
      return Result.fail('Teamnamn kan inte överstiga 50 tecken');
    }

    return Result.ok(new TeamName(name.trim()));
  }

  public getValue(): string {
    return this.value;
  }
}
```

### Email

```typescript
export class Email {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  public static create(email: string): Result<Email> {
    if (!email || email.trim().length === 0) {
      return Result.fail('E-postadress kan inte vara tom');
    }

    // Enkel regex för e-postvalidering
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Result.fail('Ogiltig e-postadress');
    }

    return Result.ok(new Email(email.trim().toLowerCase()));
  }

  public getValue(): string {
    return this.value;
  }
}
```

### SubscriptionPlan

```typescript
export enum PlanType {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE'
}

export class SubscriptionPlan {
  private readonly type: PlanType;
  private readonly maxTeams: number;
  private readonly maxMembersPerTeam: number;
  private readonly maxStorage: number;

  private constructor(
    type: PlanType, 
    maxTeams: number, 
    maxMembersPerTeam: number,
    maxStorage: number
  ) {
    this.type = type;
    this.maxTeams = maxTeams;
    this.maxMembersPerTeam = maxMembersPerTeam;
    this.maxStorage = maxStorage;
  }

  public static create(type: PlanType): SubscriptionPlan {
    switch (type) {
      case PlanType.FREE:
        return new SubscriptionPlan(type, 1, 5, 100);
      case PlanType.PREMIUM:
        return new SubscriptionPlan(type, 5, 15, 1000);
      case PlanType.ENTERPRISE:
        return new SubscriptionPlan(type, 100, 100, 10000);
      default:
        throw new Error('Ogiltig prenumerationsplan');
    }
  }

  public getType(): PlanType {
    return this.type;
  }

  public getMaxTeams(): number {
    return this.maxTeams;
  }

  public getMaxMembersPerTeam(): number {
    return this.maxMembersPerTeam;
  }

  public getMaxStorage(): number {
    return this.maxStorage;
  }
}
```

### TeamStatistics

```typescript
export class TeamStatistics {
  private readonly totalMembers: number;
  private readonly totalMessages: number;
  private readonly activeMembers: number;
  private readonly avgMessagesPerDay: number;

  private constructor(
    totalMembers: number,
    totalMessages: number,
    activeMembers: number,
    avgMessagesPerDay: number
  ) {
    this.totalMembers = totalMembers;
    this.totalMessages = totalMessages;
    this.activeMembers = activeMembers;
    this.avgMessagesPerDay = avgMessagesPerDay;
  }

  public static create(data: TeamStatisticsData): Result<TeamStatistics> {
    if (data.totalMembers < 0 || data.totalMessages < 0 || data.activeMembers < 0) {
      return Result.fail('Statistikvärden kan inte vara negativa');
    }

    if (data.activeMembers > data.totalMembers) {
      return Result.fail('Antalet aktiva medlemmar kan inte överstiga totala antalet medlemmar');
    }

    return Result.ok(new TeamStatistics(
      data.totalMembers,
      data.totalMessages,
      data.activeMembers,
      data.avgMessagesPerDay
    ));
  }

  public getTotalMembers(): number {
    return this.totalMembers;
  }

  public getTotalMessages(): number {
    return this.totalMessages;
  }

  public getActiveMembers(): number {
    return this.activeMembers;
  }

  public getAvgMessagesPerDay(): number {
    return this.avgMessagesPerDay;
  }

  public getActivityRate(): number {
    if (this.totalMembers === 0) {
      return 0;
    }
    return this.activeMembers / this.totalMembers;
  }
}
```

## Aggregatrötter

Aggregatrötter är entiteter som fungerar som inträdesgränser för en samling relaterade objekt. De upprätthåller invarianter och konsistens för hela aggregatet.

### Basklass för aggregatrötter

```typescript
export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: IDomainEvent[] = [];

  get domainEvents(): IDomainEvent[] {
    return this._domainEvents;
  }

  protected addDomainEvent(domainEvent: IDomainEvent): void {
    this._domainEvents.push(domainEvent);
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }
}
```

### Huvud-aggregatrötter

- **Team**: Aggregatrot för team-kontext, innehåller TeamMember, TeamMessage och TeamActivity
- **User**: Aggregatrot för user-kontext, innehåller UserSettings och UserPrivacySettings
- **Organization**: Aggregatrot för organization-kontext, innehåller OrganizationMember och OrganizationResource
- **Subscription**: Aggregatrot för subscription-kontext, innehåller SubscriptionFeature

## Relationer mellan entiteter

### Team och TeamMember

- Ett Team har många TeamMembers
- Relationen hanteras inom Team-aggregatet
- TeamMember har en referens till User genom userId
- TeamMember kan bara existera som en del av ett Team

```typescript
public addMember(userId: string, role: string): Result<void> {
  if (this.isMember(userId)) {
    return Result.fail('Användaren är redan medlem i teamet');
  }

  const member = new TeamMember({
    userId,
    role,
    joinedAt: new Date()
  });

  this.props.members = [...this.members, member];
  this.addDomainEvent(new MemberJoinedTeamEvent(this, userId, role));
  
  return Result.ok();
}
```

### Organization och Team

- En Organization har många Teams
- Team refererar till Organization genom organizationId
- Team är ett separat aggregat men har en referens till Organization

```typescript
// I Team-klassen
constructor(props: TeamProps, id?: UniqueEntityID) {
  super(props, id);
  
  if (!props.organizationId) {
    throw new Error('Ett team måste tillhöra en organisation');
  }
}
```

### User och TeamMember

- En User kan vara medlem i flera Teams genom TeamMember
- Relationen hanteras genom att TeamMember refererar till User genom userId
- User aggregatet har ingen direkt referens till TeamMember

### Organization och Subscription

- En Organization har en Subscription
- Subscription refererar till Organization genom organizationId

## Invarianter och affärsregler

Invarianter är regler som alltid måste vara sanna för att entiteter och aggregat ska vara i ett giltigt tillstånd.

### Team-invarianter

1. Ett team måste ha ett namn (valideras i TeamName value object)
2. En användare kan bara vara medlem i ett team en gång
3. Ett team måste tillhöra en organisation
4. Ett team måste ha minst en medlem med Owner-roll

```typescript
private validateInvariants(): boolean {
  // Validera att det finns minst en ägare
  const hasOwner = this.members.some(member => member.role === 'owner');
  
  if (!hasOwner) {
    throw new Error('Ett team måste ha minst en ägare');
  }
  
  return true;
}
```

### User-invarianter

1. En användare måste ha en giltig e-postadress (valideras i Email value object)
2. E-postadressen måste vara unik i systemet (valideras i repository)

### Organization-invarianter

1. En organisation måste ha ett namn
2. En organisation måste ha minst en administratör
3. En organisation måste ha en unik identifierare

### Subscription-invarianter

1. En prenumeration måste vara kopplad till en organisation
2. Prenumerationens start- och slutdatum måste vara giltiga
3. Funktioner måste vara kompatibla med prenumerationsplanen

## Domänevents

Domänevents representerar viktiga händelser som inträffar inom domänen och tillåter lös koppling mellan olika delar av systemet.

### Basstruktur för events

```typescript
export interface IDomainEvent {
  readonly eventType: string;
  readonly occurredOn: Date;
  readonly aggregateId: string;
}
```

### Team-relaterade events

```typescript
export class TeamCreatedEvent implements IDomainEvent {
  readonly eventType = 'team.created';
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly teamName: string;
  readonly createdBy: string;

  constructor(team: Team) {
    this.aggregateId = team.id.toString();
    this.teamName = team.name.getValue();
    this.createdBy = team.createdBy;
    this.occurredOn = new Date();
  }
}

export class MemberJoinedTeamEvent implements IDomainEvent {
  readonly eventType = 'team.member.joined';
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly memberId: string;
  readonly memberRole: string;

  constructor(team: Team, memberId: string, role: string) {
    this.aggregateId = team.id.toString();
    this.memberId = memberId;
    this.memberRole = role;
    this.occurredOn = new Date();
  }
}
```

### User-relaterade events

```typescript
export class UserCreatedEvent implements IDomainEvent {
  readonly eventType = 'user.created';
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly email: string;

  constructor(user: User) {
    this.aggregateId = user.id.toString();
    this.email = user.email.getValue();
    this.occurredOn = new Date();
  }
}

export class UserStatusChangedEvent implements IDomainEvent {
  readonly eventType = 'user.status.changed';
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly isActive: boolean;

  constructor(user: User) {
    this.aggregateId = user.id.toString();
    this.isActive = user.isActive;
    this.occurredOn = new Date();
  }
}
```

## Exempel på domänmodellimplementationer

### Exempel: Lägga till medlem i ett team

```typescript
// I Team-aggregatroten
public addMember(userId: string, role: string): Result<void> {
  try {
    // Validera att användaren inte redan är medlem
    if (this.isMember(userId)) {
      return Result.fail('Användaren är redan medlem i teamet');
    }
    
    // Validera att rollen är giltig
    const validRoles = ['owner', 'admin', 'member'];
    if (!validRoles.includes(role)) {
      return Result.fail('Ogiltig roll för teammedlem');
    }
    
    // Skapa ny TeamMember-entitet
    const member = new TeamMember({
      userId,
      role,
      joinedAt: new Date()
    });
    
    // Lägg till medlemmen i teamet
    this.props.members = [...this.members, member];
    
    // Skapa och lägg till domänevent
    this.addDomainEvent(new MemberJoinedTeamEvent(this, userId, role));
    
    return Result.ok();
  } catch (error) {
    return Result.fail(error);
  }
}
```

### Exempel: Factory för att skapa en ny användare

```typescript
export class UserFactory {
  public static create(
    email: string,
    fullName: string,
    profilePicture?: string
  ): Result<User> {
    // Validera e-post genom värde-objekt
    const emailOrError = Email.create(email);
    if (emailOrError.isFailure()) {
      return Result.fail(emailOrError.getError());
    }
    
    // Skapa användarentitet
    const user = new User({
      email: emailOrError.getValue(),
      fullName,
      profilePicture,
      isActive: true,
      createdAt: new Date(),
      settings: UserSettings.createDefault(),
      privacySettings: UserPrivacySettings.createDefault()
    });
    
    // Lägg till domänevent
    user.addDomainEvent(new UserCreatedEvent(user));
    
    return Result.ok(user);
  }
}
```

### Exempel: Validera och skapa ett nytt team

```typescript
export class TeamFactory {
  public static create(
    props: {
      name: string;
      description?: string;
      createdBy: string;
      organizationId: string;
    }
  ): Result<Team> {
    try {
      // Validera teamnamn genom värde-objekt
      const nameOrError = TeamName.create(props.name);
      if (nameOrError.isFailure()) {
        return Result.fail(nameOrError.getError());
      }
      
      // Skapa team med standardvärden
      const team = new Team({
        name: nameOrError.getValue(),
        description: props.description || '',
        createdBy: props.createdBy,
        createdAt: new Date(),
        organizationId: props.organizationId,
        members: []
      });
      
      // Lägg till skaparen som ägare
      const addCreatorResult = team.addMember(props.createdBy, 'owner');
      if (addCreatorResult.isFailure()) {
        return Result.fail(addCreatorResult.getError());
      }
      
      // Lägg till domänevent
      team.addDomainEvent(new TeamCreatedEvent(team));
      
      return Result.ok(team);
    } catch (error) {
      return Result.fail(`Fel vid skapande av team: ${error}`);
    }
  }
}
```

## Slutsats

Domänmodellen för Pling Mobile är strukturerad för att representera de centrala affärskoncepten och reglerna i applikationen. Genom att använda entiteter, värde-objekt, aggregatrötter och domänevents skapar vi en rik modell som:

1. Fångar domänregler och invarianter
2. Ger en gemensam språkmodell för utvecklare och domänexperter
3. Separerar identitet från värden
4. Säkerställer konsistens inom aggregatgränser
5. Möjliggör löst kopplade interaktioner mellan olika delar av systemet

Denna domänmodell ligger till grund för applikationslogiken och domäntjänsterna i Pling Mobile. 