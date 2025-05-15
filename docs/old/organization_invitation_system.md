# Organisation Inbjudningssystem

## Översikt

Detta dokument beskriver inbjudningssystemet för organisationsdomänen i Pling-applikationen. Systemet möjliggör för organisations-administratörer att bjuda in användare och för användare att acceptera eller avböja inbjudningar.

## Innehållsförteckning
1. [Domänmodell](#domänmodell)
2. [Databasstruktur](#databasstruktur)
3. [Flöden](#flöden)
4. [Domänhändelser](#domänhändelser)
5. [Användningsexempel](#användningsexempel)
6. [Säkerhet och behörigheter](#säkerhet-och-behörigheter)
7. [Migrationer](#migrationer)

## Domänmodell

### OrganizationInvitation

OrganizationInvitation är ett värdesobjekt som representerar en inbjudan till en organisation. Det har följande egenskaper:

```typescript
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface OrganizationInvitationProps {
  id?: UniqueId;
  organizationId: UniqueId;
  userId: UniqueId;
  invitedBy: UniqueId;
  email?: string;
  status: InvitationStatus;
  expiresAt?: Date;
  createdAt: Date;
  respondedAt?: Date;
}
```

#### Viktiga metoder

- `isPending()`: Kontrollerar om inbjudan är i väntande status
- `isAccepted()`: Kontrollerar om inbjudan är accepterad
- `isDeclined()`: Kontrollerar om inbjudan är avböjd
- `isExpired()`: Kontrollerar om inbjudan har gått ut
- `accept()`: Accepterar inbjudan om den är i väntande status
- `decline()`: Avböjer inbjudan om den är i väntande status
- `expire()`: Markerar en väntande inbjudan som utgången

### Organization

Organization-entiteten har utökats med följande metoder för att hantera inbjudningar:

- `inviteUser(userId, email, invitedBy, role)`: Bjuder in en användare till organisationen
- `acceptInvitation(invitationId, userId)`: Accepterar en inbjudan och gör användaren till medlem
- `declineInvitation(invitationId, userId)`: Avböjer en inbjudan
- `removeInvitation(invitationId)`: Tar bort en inbjudan
- `getPendingInvitations()`: Hämtar alla aktiva inbjudningar
- `expireInvitations()`: Markerar utgångna inbjudningar

## Databasstruktur

```sql
-- Enum-typ för inbjudningsstatus
CREATE TYPE invitation_status_enum AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- Inbjudningstabell
CREATE TABLE organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  email TEXT,
  status invitation_status_enum NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(organization_id, user_id, status)
);

-- Index för prestanda
CREATE INDEX idx_organization_invitations_org_id ON organization_invitations(organization_id);
CREATE INDEX idx_organization_invitations_user_id ON organization_invitations(user_id);
CREATE INDEX idx_organization_invitations_status ON organization_invitations(status);
```

## Flöden

### Inbjudningsflöde

1. **Skapa inbjudan**
   - En admin/owner skapar en inbjudan via `organization.inviteUser()`
   - Inbjudan sparas i databasen med status `pending`
   - En `MemberInvitedToOrganization`-händelse utlöses

2. **Acceptera inbjudan**
   - Användaren accepterar inbjudan via `organization.acceptInvitation()`
   - Inbjudans status uppdateras till `accepted` och `respondedAt` sätts
   - Användaren läggs till som medlem i organisationen
   - `OrganizationInvitationAccepted`- och `MemberJoinedOrganization`-händelser utlöses

3. **Avböja inbjudan**
   - Användaren avböjer inbjudan via `organization.declineInvitation()`
   - Inbjudans status uppdateras till `declined` och `respondedAt` sätts
   - En `OrganizationInvitationDeclined`-händelse utlöses

4. **Utgången inbjudan**
   - Inbjudningar som passerat `expiresAt` markeras som `expired` automatiskt
   - Detta sker antingen via databastriggers eller via `organization.expireInvitations()`

## Domänhändelser

Följande domänhändelser har implementerats för inbjudningssystemet:

```typescript
export class MemberInvitedToOrganization extends DomainEvent {
  constructor(
    public readonly organizationId: UniqueId,
    public readonly userId: UniqueId,
    public readonly invitedBy: UniqueId
  ) { /* ... */ }
}

export class OrganizationInvitationAccepted extends DomainEvent {
  constructor(
    public readonly organizationId: UniqueId,
    public readonly invitationId: UniqueId,
    public readonly userId: UniqueId
  ) { /* ... */ }
}

export class OrganizationInvitationDeclined extends DomainEvent {
  constructor(
    public readonly organizationId: UniqueId,
    public readonly invitationId: UniqueId,
    public readonly userId: UniqueId
  ) { /* ... */ }
}
```

## Användningsexempel

### Bjuda in användare

```typescript
// Hämta organisation
const organizationResult = await organizationRepository.findById(organizationId);
if (organizationResult.isErr()) {
  // Hantera fel
  return;
}

const organization = organizationResult.value;

// Bjud in användare
const inviteResult = organization.inviteUser(
  userId,          // Användarens ID
  userEmail,       // Användarens e-post
  currentUserId,   // Den som bjuder in
  OrganizationRole.MEMBER  // Roll (default: MEMBER)
);

if (inviteResult.isErr()) {
  // Hantera fel
  return;
}

// Spara organization med den nya inbjudan
await organizationRepository.save(organization);
```

### Acceptera inbjudan

```typescript
// Hämta användarens inbjudningar
const invitationsResult = await organizationRepository.findInvitationsByUserId(userId);
if (invitationsResult.isErr()) {
  // Hantera fel
  return;
}

const invitations = invitationsResult.value;
const invitation = invitations.find(i => i.id.equals(invitationId));

if (!invitation) {
  // Inbjudan hittades inte
  return;
}

// Hämta organisationen
const organizationResult = await organizationRepository.findById(invitation.organizationId);
if (organizationResult.isErr()) {
  // Hantera fel
  return;
}

const organization = organizationResult.value;

// Acceptera inbjudan
const acceptResult = organization.acceptInvitation(invitationId, userId);
if (acceptResult.isErr()) {
  // Hantera fel
  return;
}

// Spara organisationen med den accepterade inbjudan och den nya medlemmen
await organizationRepository.save(organization);
```

## Säkerhet och behörigheter

Inbjudningssystemet innehåller följande säkerhetsfunktioner:

1. **Row-Level Security (RLS)** i databasen:
   - Användare kan bara se sina egna inbjudningar
   - Bara organisationsägare och administratörer kan skapa inbjudningar
   - Bara organisationsägare, administratörer och den inbjudna användaren kan uppdatera inbjudningar

2. **Automatisk utgång**:
   - Inbjudningar går ut automatiskt efter en viss tid (7 dagar som standard)
   - Utgångna inbjudningar kan inte accepteras eller avböjas
   - Databastriggers hanterar automatisk uppdatering av utgångna inbjudningar

3. **Verifiering**:
   - Endast den inbjudna användaren kan acceptera/avböja en inbjudan
   - En användare kan inte bjudas in flera gånger till samma organisation
   - Det kontrolleras att användaren inte redan är medlem i organisationen

4. **Begränsningar**:
   - Organisationens `maxMembers`-inställning begränsar antalet medlemmar + aktiva inbjudningar
   - Inbjudningar kan bara hanteras av de med rätt behörigheter
   - Åtkomst till inbjudningar kontrolleras i både domänlager och databaslager 

## Migrationer

### Status

Alla nödvändiga migrationer för inbjudningssystemet har nu körts framgångsrikt i både test- och produktionsmiljö. För detaljerad information om migrationsprocessen och eventuella anmärkningar, se [`docs/updates/organization_migration_status.md`](updates/organization_migration_status.md).

Databasstrukturerna som behövs för att stödja organisationsinbjudningar finns nu på plats och är redo att användas av applikationen.

## Användargränssnitt

### Implementerade komponenter

Följande UI-komponenter har implementerats för att stödja inbjudningssystemet:

- **OrganizationInvitationList**: Visar användarens inbjudningar och låter användaren acceptera eller avböja dem
- **InviteUserForm**: Formulär för att bjuda in användare till en organisation
- **OrganizationMembersList**: Visar organisationsmedlemmar med roller och anslutningsdatum
- **OrganizationDashboard**: Integrerar alla komponenter för en komplett upplevelse

För mer detaljerad information om komponenterna och deras användning, se [`docs/updates/organization_ui_components.md`](updates/organization_ui_components.md).

### Användargränssnittsflöden

1. **Visa inbjudningar**
   - Användarens inbjudningar visas automatiskt i OrganizationProvider
   - OrganizationInvitationList visar alla aktiva inbjudningar med utgångsdatum
   - Användaren kan acceptera eller avböja direkt från denna vy

2. **Bjuda in användare**
   - Administratörer kan öppna InviteUserForm genom knapp på OrganizationMembersList
   - Användare kan bjudas in via e-post och/eller användar-ID
   - Formuläret validerar inmatning och visar eventuella fel

3. **Hantera medlemmar**
   - Efter att en inbjudan har accepterats läggs användaren till i medlemslistan
   - OrganizationMembersList visar alla medlemmar med roller markerade med färgkoder
   - Endast användare med rätt behörigheter kan bjuda in nya medlemmar 