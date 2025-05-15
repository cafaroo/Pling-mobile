# Aggregatgränser i domänmodellen

Detta dokument beskriver aggregatgränserna i vår domänmodell och definierar riktlinjer för hur domänevents ska publiceras.

## Vad är aggregat?

I Domain-Driven Design (DDD) är ett aggregat en samling av objekt som behandlas som en enhet. Varje aggregat har:

- En **aggregatrot** (Aggregate Root) - det yttre objektet som all extern kod interagerar med
- **Entiteter** som tillhör aggregatet och bildar en klunga
- **Värde-objekt** som beskriver koncept utan egen identitet

## Våra huvudsakliga aggregat

I vår domänmodell har vi följande huvudsakliga aggregat:

### User Aggregatet

**Aggregatrot**: `User`

Ingående komponenter:
- UserProfile (ValueObject)
- UserSettings (ValueObject)
- Email (ValueObject)
- PhoneNumber (ValueObject)

**Invarianter**:
- En användare måste ha en giltig Email
- Användarnamnet måste vara unikt
- Användarinställningar följer definierade regler

**Events publicerade av User**:
- UserCreated
- UserActivated
- UserDeactivated
- UserProfileUpdated
- UserSettingsUpdated
- UserPrivacySettingsChanged
- UserNotificationSettingsChanged

### Team Aggregatet

**Aggregatrot**: `Team`

Ingående komponenter:
- TeamMember (ValueObject)
- TeamInvitation (ValueObject)
- TeamSettings (ValueObject)
- TeamName (ValueObject)
- TeamDescription (ValueObject)

**Invarianter**:
- Ett team måste ha en ägare
- En medlem kan bara ha en roll
- Teamnamnet måste vara unikt inom en organisation
- Inställningar för maximalt antal medlemmar måste respekteras

**Events publicerade av Team**:
- TeamCreated
- TeamUpdated
- MemberJoined
- MemberLeft
- TeamMemberRoleChanged
- InvitationSent
- InvitationAccepted
- InvitationDeclined
- TeamSettingsUpdated

### Organization Aggregatet

**Aggregatrot**: `Organization`

Ingående komponenter:
- OrganizationMember (ValueObject)
- OrganizationSettings (ValueObject)
- OrganizationAddress (ValueObject)

**Invarianter**:
- En organisation måste ha minst en ägare
- Organisationsnamnet måste vara unikt

**Events publicerade av Organization**:
- OrganizationCreated
- OrganizationUpdated
- OrganizationMemberAdded
- OrganizationMemberRemoved
- OrganizationMemberRoleChanged
- OrganizationSettingsUpdated

### TeamMessage Aggregatet

**Aggregatrot**: `TeamMessage`

Ingående komponenter:
- MessageAttachment (ValueObject)
- MessageMention (ValueObject)

**Invarianter**:
- Ett meddelande måste ha en avsändare
- Ett meddelande måste tillhöra ett team

**Events publicerade av TeamMessage**:
- TeamMessageCreated
- TeamMessageEdited
- TeamMessageDeleted
- MessageReactionAdded
- MessageMentionAdded
- MessageAttachmentAdded

## Principer för publicering av domänevents

För att hålla domänmodellen ren och konsekvent, ska vi följa dessa principer:

1. **Endast aggregatrötter publicerar events** - Entiteter och värde-objekt inuti ett aggregat ska inte direkt publicera events
2. **Events representerar förflutna händelser** - Använd perfekt form i event-namn (ex: UserCreated, inte CreateUser)
3. **Events innehåller bara nödvändig information** - Inkludera bara data som behövs av konsumenter
4. **Events är immutabla** - Events ändras aldrig efter skapande
5. **Aggregat är transaktionella gränser** - En transaktion ska inte korsa aggregatgränser

## Implementationsriktlinjer

### Domänevents

Implementera domänevents med följande mönster:

```typescript
// Basklasser för domänevents per aggregat
abstract class BaseUserEvent implements IDomainEvent {
  // Grundläggande implementationsdetaljer
}

// Konkreta events ärver från basklassen
export class UserCreated extends BaseUserEvent {
  constructor(
    public readonly userId: UniqueId,
    public readonly email: string
  ) {
    super('UserCreated', userId);
  }
}
```

### Publicera events

Använd `addDomainEvent`-metoden från `AggregateRoot`-basklassen:

```typescript
// I en aggregatrot (t.ex. User.ts)
public updateProfile(profile: UserProfileProps): Result<void, string> {
  try {
    // Implementationsdetaljer...
    
    // Publicera event
    this.addDomainEvent(new UserProfileUpdated(
      this.id,
      profile
    ));
    
    return ok(undefined);
  } catch (error) {
    return err(`Kunde inte uppdatera profil: ${error.message}`);
  }
}
```

### Konsumera events

Hantera events i dedikerade handlers:

```typescript
// Exempel på event handler
export class UserProfileUpdatedHandler implements IDomainEventHandler<UserProfileUpdated> {
  constructor(private teamRepository: TeamRepository) {}
  
  async handle(event: UserProfileUpdated): Promise<void> {
    // Implementera hantering av eventet
  }
}
```

## Kontinuerlig förbättring

Vi arbetar aktivt med att förfina aggregatgränserna i systemet. Följande förbättringar planeras:

1. **Refaktorera entiteter** till att bara använda aggregatrötter för att publicera events
2. **Tydliggöra relationer** mellan aggregat genom att använda referenser (IDs) istället för komposition
3. **Dokumentera invarianter** för varje aggregat
4. **Standardisera event handlers** för bättre testbarhet

## Kontrollera efterlevnad

För att säkerställa att dessa principer följs:

1. **Kodgranskning** - Kontrollera att events endast publiceras av aggregatrötter
2. **Testning** - Verifiera att rätt events publiceras vid rätt tidpunkt
3. **Statisk kodanalys** - Om möjligt, implementera lintregler för att säkerställa rätt mönster

## Modellvisualisering

För en visualisering av domänmodellen och aggregatgränserna, se diagrammen i `docs/architecture/domain-model-diagrams/`. 