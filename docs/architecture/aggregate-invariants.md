# Invarianter för domänaggregat

Detta dokument definierar och dokumenterar invarianter (regler som alltid måste vara sanna) för alla aggregat i Pling-mobile. Invarianter utgör kärnan i domänmodellen och måste upprätthållas vid varje operation.

## Vad är invarianter?

I Domain-Driven Design (DDD) är invarianter regler och begränsningar som alltid måste vara sanna för ett aggregat. Invarianter:

- Definierar giltiga tillstånd för aggregatet
- Ska valideras innan varje tillståndsförändring
- Upprätthålls av aggregatroten
- Utgör en central del av domänlogiken

## Team-aggregatet

### Grundläggande invarianter

1. **Ägarskap**
   - Ett team måste alltid ha minst en ägare
   - En ägare måste vara en medlem av teamet med rollen OWNER

2. **Medlemskap**
   - En medlem kan bara ha exakt en roll i teamet
   - En användare kan bara vara medlem i teamet en gång (unikt användar-ID)
   - En medlem måste ha giltig användarreferens

3. **Teamnamn**
   - Teamnamnet måste vara unikt inom en organisation
   - Teamnamnet måste vara mellan 2 och 50 tecken
   - Teamnamnet får inte innehålla ogiltiga tecken

### Operativa invarianter

4. **Inbjudningar**
   - En inbjudan kan bara skickas till användare som inte redan är medlemmar
   - En aktiv inbjudan kan inte skickas till en användare som redan har en aktiv inbjudan
   - Endast medlemmar med behörighet kan skicka inbjudningar

5. **Begränsningar**
   - Antalet medlemmar får inte överstiga den maximala gränsen definierad i TeamSettings
   - Premiumfunktioner kan bara aktiveras för team i organisationer med rätt prenumerationsnivå

### Säkerhetsinvarianter

6. **Behörigheter**
   - Endast team-ägare eller administratörer kan ändra teamets inställningar
   - Endast team-ägare kan ändra en annan medlems roll till/från OWNER
   - Endast medlemmar med rätt behörighet kan ta bort andra medlemmar

### Verifiering i kodexempel

```typescript
class Team extends AggregateRoot<TeamProps> {
  // Exempel på kontroll av invariant 1: Ett team måste alltid ha minst en ägare
  public removeMember(userId: UniqueId): Result<void, string> {
    // Hitta medlemmen
    const member = this.findMember(userId);
    if (!member) {
      return err('Medlem hittades inte');
    }
    
    // Kontrollera invariant: Team måste ha minst en ägare
    const isOwner = member.role === TeamRole.OWNER;
    const owners = this.getOwners();
    if (isOwner && owners.length <= 1) {
      return err('Kan inte ta bort den sista ägaren från teamet');
    }
    
    // Fortsätt med borttagning...
  }
  
  // Exempel på kontroll av invariant 3: Teamnamnet måste vara unikt
  public changeName(newName: TeamName): Result<void, string> {
    if (this.organization.hasTeamWithName(newName.value)) {
      return err('Ett team med detta namn finns redan i organisationen');
    }
    
    // Fortsätt med namnändring...
  }
}
```

## User-aggregatet

### Grundläggande invarianter

1. **Identitet**
   - En användare måste ha en unik e-postadress
   - E-postadressen måste vara giltig enligt definierade regler
   - Användar-ID måste vara unikt

2. **Profildata**
   - Användarens förnamn och efternamn måste följa format- och längdregler
   - Telefonnummer måste vara giltiga om de anges

3. **Status**
   - En användare kan bara ha en av de definierade status: 'pending', 'active', 'inactive', 'blocked'
   - Statusövergångar måste följa definierade flöden (t.ex. 'blocked' kan inte direkt övergå till 'active')

### Operativa invarianter

4. **Autentisering**
   - Lösenord måste följa säkerhetspolicyn
   - Osäkra operationer kräver nylig autentisering

5. **Teamkopplingar**
   - En användare kan bara vara medlem i ett unikt team en gång
   - Uppdateringar i användarens profil måste återspeglas i alla kopplade team

### Säkerhetsinvarianter

6. **Rättigheter**
   - Endast användaren själv eller administratörer kan uppdatera profilinformation
   - Vissa statusförändringar kräver administratörsrättigheter

### Verifiering i kodexempel

```typescript
class User extends AggregateRoot<UserProps> {
  // Exempel på kontroll av invariant 1: E-postadressen måste vara unik och giltig
  public updateEmail(newEmail: Email): Result<void, string> {
    // Validering av e-postadressen har redan skett i Email value-object
    
    // Kontrollera om e-postadressen är unik (antas finnas i repository)
    if (this.userRepository.emailExists(newEmail.value)) {
      return err('E-postadressen används redan av en annan användare');
    }
    
    // Fortsätt med uppdatering...
  }
  
  // Exempel på kontroll av invariant 3: Statusförändringar måste följa definierade flöden
  public changeStatus(newStatus: string): Result<void, string> {
    // Kontrollera att statusförändringen är tillåten
    if (this.props.status === 'blocked' && newStatus === 'active') {
      return err('En blockerad användare måste först aktiveras av en administratör');
    }
    
    // Fortsätt med statusändring...
  }
}
```

## Organization-aggregatet

### Grundläggande invarianter

1. **Identitet**
   - En organisation måste ha ett unikt namn
   - Organisationsnamnet måste vara mellan 2 och 100 tecken
   - En organisation måste ha minst en ägare

2. **Medlemskap**
   - En medlem kan bara ha en roll i organisationen
   - En användare kan bara vara medlem i organisationen en gång

3. **Resurser**
   - Alla resurser måste tillhöra en giltig organisationsmedlem
   - Resurser måste ha unika namn inom sin kategori

### Operativa invarianter

4. **Begränsningar**
   - Antal team och medlemmar får inte överstiga begränsningar för prenumerationsnivån
   - Vissa funktioner är endast tillgängliga för vissa prenumerationsnivåer

5. **Hierarki**
   - Team inom organisationen måste följa behörighetsstrukturen
   - Ägare av organisationen har implicita rättigheter över alla team

### Säkerhetsinvarianter

6. **Behörigheter**
   - Endast organisationsägare kan ändra kritiska inställningar
   - Endast behöriga användare kan bjuda in nya medlemmar
   - Endast ägare kan ändra prenumerationsplanen

### Verifiering i kodexempel

```typescript
class Organization extends AggregateRoot<OrganizationProps> {
  // Exempel på kontroll av invariant 1: Unik organisationsnamn
  public changeName(newName: string): Result<void, string> {
    if (this.organizationRepository.nameExists(newName)) {
      return err('En organisation med detta namn finns redan');
    }
    
    // Fortsätt med namnändring...
  }
  
  // Exempel på kontroll av invariant 4: Resursbegränsning
  public createTeam(teamData: TeamCreateDTO): Result<Team, string> {
    // Kontrollera begränsningar baserat på prenumerationsnivå
    const subscriptionLimit = this.subscriptionService.getTeamLimit(this.id);
    if (this.props.teamIds.length >= subscriptionLimit) {
      return err(`Maximalt antal team (${subscriptionLimit}) har uppnåtts för denna prenumerationsnivå`);
    }
    
    // Fortsätt med teamskapande...
  }
}
```

## TeamMessage-aggregatet

### Grundläggande invarianter

1. **Författarskap**
   - Ett meddelande måste ha en giltig avsändare (userId)
   - Avsändaren måste vara medlem i teamet

2. **Innehåll**
   - Meddelandet får inte vara tomt
   - Meddelandets längd får inte överstiga den maximala gränsen

3. **Kontext**
   - Ett meddelande måste vara kopplat till ett giltigt team
   - Om meddelandet är ett svar måste det vara kopplat till ett giltigt överliggande meddelande

### Operativa invarianter

4. **Bilagor**
   - Bilagor måste vara av tillåtna filtyper
   - Total filstorlek får inte överstiga prenumerationsgränsen

5. **Omnämnanden**
   - Omnämnda användare måste vara medlemmar i teamet

### Säkerhetsinvarianter

6. **Rättigheter**
   - Endast meddelandets författare eller en teamadministratör kan redigera meddelandet
   - Endast meddelandets författare eller en teamadministratör kan ta bort meddelandet
   - Redigering är bara tillåten inom en viss tidsgräns efter publicering

### Verifiering i kodexempel

```typescript
class TeamMessage extends AggregateRoot<TeamMessageProps> {
  // Exempel på kontroll av invariant 1 och 3: Avsändare och team-kontext
  public static create(props: TeamMessageCreateDTO): Result<TeamMessage, string> {
    // Kontrollera att användaren är medlem i teamet
    const team = props.team;
    if (!team.isMember(props.senderId)) {
      return err('Endast teammedlemmar kan skicka meddelanden');
    }
    
    // Kontrollera att innehållet är giltigt
    if (!props.content || props.content.trim().length === 0) {
      return err('Meddelandet får inte vara tomt');
    }
    
    // Fortsätt med meddelandeskapande...
  }
  
  // Exempel på kontroll av invariant 6: Redigeringsrättigheter
  public update(content: string, userId: UniqueId): Result<void, string> {
    // Kontrollera rättigheter
    if (!this.canEdit(userId)) {
      return err('Endast författaren eller en admin kan redigera meddelandet');
    }
    
    // Kontrollera tidsgräns
    const maxEditTimeMs = 30 * 60 * 1000; // 30 minuter
    if (Date.now() - this.props.createdAt.getTime() > maxEditTimeMs) {
      return err('Meddelandet kan inte längre redigeras (tidsgräns överskriden)');
    }
    
    // Fortsätt med uppdatering...
  }
  
  private canEdit(userId: UniqueId): boolean {
    // Författaren kan alltid redigera
    if (userId.equals(this.props.senderId)) return true;
    
    // Teamadministratörer kan också redigera
    const team = this.getTeam(); // Antas finnas
    return team.isAdmin(userId);
  }
}
```

## Implementationstips för att upprätthålla invarianter

### 1. Centralisera validering

Implementera validering av invarianter centralt i aggregatroten:

```typescript
class Team extends AggregateRoot<TeamProps> {
  private validateInvariants(): Result<void, string> {
    // Kontrollera alla invarianter
    
    // 1. Team måste ha minst en ägare
    const owners = this.members.filter(m => m.role === TeamRole.OWNER);
    if (owners.length === 0) {
      return err('Team måste ha minst en ägare');
    }
    
    // 2. Medlemmar måste vara unika
    const memberIds = this.members.map(m => m.userId.toString());
    if (new Set(memberIds).size !== memberIds.length) {
      return err('Duplicerade medlemmar hittades');
    }
    
    // Alla invarianter uppfylls
    return ok(undefined);
  }
  
  // Anropa validering före varje tillståndsändring
  public someStateChangingMethod(): Result<void, string> {
    // Ändra tillstånd...
    
    // Validera att invarianter fortfarande håller
    const validation = this.validateInvariants();
    if (validation.isErr()) {
      return validation;
    }
    
    // Fortsätt med metoden...
  }
}
```

### 2. Använd värde-objekt för validering

Delegera validering av delar av invarianter till värde-objekt:

```typescript
// TeamName värde-objekt hanterar namnvalideringsregler
export class TeamName extends ValueObject<{ value: string }> {
  public static create(name: string): Result<TeamName, string> {
    // Validera längd
    if (name.length < 2 || name.length > 50) {
      return err('Teamnamn måste vara mellan 2 och 50 tecken');
    }
    
    // Validera format
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
      return err('Teamnamn får endast innehålla alfanumeriska tecken, mellanslag, bindestreck och understreck');
    }
    
    return ok(new TeamName({ value: name }));
  }
  
  get value(): string {
    return this.props.value;
  }
}
```

### 3. Validera i fabriker och konstruktorer

Säkerställ att objektet är i ett giltigt tillstånd redan vid skapande:

```typescript
class Team extends AggregateRoot<TeamProps> {
  private constructor(props: TeamProps) {
    super(props);
  }
  
  public static create(props: TeamCreateDTO): Result<Team, string> {
    // Validera kritiska invarianter vid skapande
    if (!props.ownerId) {
      return err('Team måste ha en ägare');
    }
    
    // Skapa team
    const team = new Team({
      // ...properties
    });
    
    // Validera alla invarianter
    const validation = team.validateInvariants();
    if (validation.isErr()) {
      return err(validation.error);
    }
    
    return ok(team);
  }
}
```

## Att förhålla sig till invarianter över aggregatgränser

Ibland spänner affärsregler över flera aggregat, vilket är svårt att upprätthålla i en enda transaktion. Hantera detta genom:

1. **Eventual Consistency** - Använd domänevents för att kommunicera förändringar mellan aggregat
2. **Validera före operationen** - Kontrollera andra aggregat innan en operation utförs
3. **Kompenserade transaktioner** - Utför kompenserande åtgärder om en relation blir ogiltig

## Dokumentation och översyn

För att hålla invarianter uppdaterade och korrekta:

1. Dokumentera alla invarianter och deras verifiering i kodbasen
2. Inkludera invariantkontroller i kodgranskningar
3. Skapa omfattande tester som validerar invarianterna
4. Regelbundet se över invarianterna för att säkerställa att de fortfarande stämmer med affärsreglerna

## Aggregatinvarianter vs. Applikationsregler

Viktigt att skilja på domäninvarianter (som alltid måste vara sanna) och applikationsregler (som kan vara mer flexibla):

- **Domäninvarianter** upprätthålls av aggregatroten
- **Applikationsregler** upprätthålls av applikationslagret och use cases 