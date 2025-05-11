# Organisation Inbjudningssystem - Implementationssammanfattning

## Översikt

Detta dokument beskriver implementationen av inbjudningssystemet för organisationsdomänen i Pling-applikationen. Systemet möjliggör för organisations-administratörer att bjuda in användare och för användare att acceptera eller avböja inbjudningar.

## Implementerade komponenter

### Domänlager

- **OrganizationInvitation (Value Object)**
  - Representerar en inbjudan med status: pending, accepted, declined, expired
  - Implementerar metoder för statushantering: `accept()`, `decline()`, `expire()`
  - Hanterar valideringar och begränsningar

- **Organization (Entity) - Utökad med inbjudningsfunktionalitet**
  - Nya metoder för inbjudningshantering:
    - `inviteUser()`: Bjuder in en användare till organisationen
    - `acceptInvitation()`: Accepterar en inbjudan och lägger till användaren som medlem
    - `declineInvitation()`: Avböjer en inbjudan
    - `removeInvitation()`: Tar bort en inbjudan
    - `getPendingInvitations()`: Hämtar aktiva inbjudningar
    - `expireInvitations()`: Markerar utgångna inbjudningar

- **Domänhändelser**
  - `MemberInvitedToOrganization`: Utlöses när en användare blir inbjuden
  - `OrganizationInvitationAccepted`: Utlöses när en inbjudan accepteras
  - `OrganizationInvitationDeclined`: Utlöses när en inbjudan avböjs

### Infrastrukturlager

- **OrganizationMapper**
  - Konverterar mellan domänobjekt och databas-DTO:er
  - Hanterar organisationer, medlemmar och inbjudningar

- **SupabaseOrganizationRepository**
  - Implementerar `OrganizationRepository`-gränssnittet
  - Hanterar CRUD-operationer för organisationer och inbjudningar
  - Optimerad med caching, prestandaövervakning och loggning
  - Implementerar domänhändelsehantering

- **InfrastructureFactory**
  - Uppdaterad för att tillhandahålla SupabaseOrganizationRepository-instans

### Databasmigration

- **organization_invitations.sql**
  - Databasschema för inbjudningar
  - Row-Level Security (RLS) policyer för säker dataåtkomst
  - Automatiska triggers för utgångna inbjudningar
  - Prestandaoptimerade index

## Tekniska detaljer

### Cachingstrategier

Implementationen använder caching för att optimera prestanda:
- Organisation-data cachas i 5 minuter
- Cache-invalidering sker vid uppdateringar
- Använder cacheversionering för säker cache-invalidering

### Säkerhet

- **Behörighetshantering**:
  - Endast ägare och administratörer kan skapa inbjudningar
  - Endast ägare, administratörer och inbjudna användare kan hantera inbjudningar

- **Databasskydd**:
  - Row-Level Security i Supabase begränsar dataåtkomst
  - Triggers för automatisk utgångshantering av inbjudningar

### Prestandaoptimeringar

- **Nested queries** för att minska antalet databasanrop
- **Selektiv caching** för att minska databaslast
- **Indexering** för snabbare sökningar

## Användningsexempel

### Bjuda in en användare

```typescript
// Hämta organization
const organizationResult = await organizationRepository.findById(orgId);
if (organizationResult.isErr()) {
  console.error(organizationResult.error);
  return;
}

const organization = organizationResult.value;

// Bjud in användare
const inviteResult = organization.inviteUser(
  userId,
  userEmail,
  currentUserId,
  OrganizationRole.MEMBER
);

if (inviteResult.isErr()) {
  console.error(inviteResult.error);
  return;
}

// Spara ändringarna
await organizationRepository.save(organization);
```

### Acceptera en inbjudan

```typescript
// Hämta inbjudningar för användaren
const invitationsResult = await organizationRepository.findInvitationsByUserId(userId);
if (invitationsResult.isErr()) {
  console.error(invitationsResult.error);
  return;
}

// Hitta specifik inbjudan
const invitation = invitationsResult.value.find(inv => inv.id.equals(invitationId));
if (!invitation) {
  console.error("Inbjudan hittades inte");
  return;
}

// Hämta organization
const organizationResult = await organizationRepository.findById(invitation.organizationId);
if (organizationResult.isErr()) {
  console.error(organizationResult.error);
  return;
}

const organization = organizationResult.value;

// Acceptera inbjudan
const acceptResult = organization.acceptInvitation(invitationId, userId);
if (acceptResult.isErr()) {
  console.error(acceptResult.error);
  return;
}

// Spara ändringarna
await organizationRepository.save(organization);
```

## Koppling mot UI-lager

Inbjudningssystemet exponeras till UI-lagret genom OrganizationRepository och InfrastructureFactory. UI-komponenter kan använda dessa för att visa, hantera och reagera på inbjudningar.

## Nästa steg

- Utveckla UI-komponenter för inbjudningshantering
- Implementera notifieringar för inbjudningar 
- Förbättra e-postintegration för inbjudningar 