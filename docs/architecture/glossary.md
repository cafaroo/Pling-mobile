# Terminologi och ordlista

Detta dokument definierar viktiga termer som används i Pling Mobile-projektet för att säkerställa en gemensam förståelse över hela teamet.

## Domain-Driven Design termer

### A

#### Aggregate (Aggregat)
En grupp associerade objekt som behandlas som en enhet för dataändringar. Externa referenser är endast tillåtna till aggregatets rot. Exempel: Ett Team med medlemmar, där Team är aggregatrot.

#### Aggregate Root (Aggregatrot)
Entiteten inom ett aggregat som ansvarar för att upprätthålla invarianter och konsistens. Externa komponenter refererar till aggregatet via dess rot. Exempel: `Team` är aggregatroten för team-medlemsaggregatet.

### B

#### Bounded Context (Avgränsad kontext)
Ett explicit gränssnitt inom vilket en viss modell gäller. Definierar gränser där specifika termer och regler gäller. Exempel: Team-kontexten vs. User-kontexten.

### C

#### Command (Kommando)
En instruktion som utlöser en åtgärd, vanligtvis genom att ändra systemets tillstånd. Exempel: `CreateTeamCommand`.

#### Context Map
En dokumentation som visar relationerna mellan olika Bounded Contexts i systemet.

### D

#### Domain (Domän)
Det specifika problemområdet som en applikation adresserar. I vårt fall: teamhantering, användarhantering, organisationshantering etc.

#### Domain Event (Domänevent)
En registrering av något betydelsefullt som har hänt i domänen. Exempel: `TeamCreatedEvent`.

#### Domain Expert (Domänexpert)
En person med djup kunskap om det specifika problemområdet som applikationen adresserar.

#### Domain Layer (Domänlager)
Lagret i arkitekturen som innehåller affärsregler och -logik, inklusive entiteter och värde-objekt.

#### Domain Model (Domänmodell)
En representation av koncept och regler i domänen som uttrycks i kod.

#### Domain Service (Domäntjänst)
En tjänst som implementerar logik som inte naturligt passar in i en enskild entitet eller värde-objekt.

#### DTO (Data Transfer Object)
Ett objekt som används för att överföra data mellan olika lager i applikationen, särskilt mellan applikationslagret och UI-lagret.

### E

#### Entity (Entitet)
Ett objekt med en unik identitet som består över tid, även när dess attribut ändras. Exempel: `Team`, `User`, `Organization`.

#### Event Sourcing
Ett mönster där systemets tillstånd bestäms genom att återspela en serie händelser från början.

### F

#### Factory (Fabrik)
Ett objekt eller en metod ansvarig för att skapa komplexa objekt. Exempel: `TeamFactory.create()`.

### H

#### Hook
En React-hook som kopplar UI-lagret till applikationslagret. Exempel: `useTeamWithStandardHook()`.

### I

#### Invariant
En regel som alltid måste vara sann inom ett visst sammanhang, vanligtvis inom ett aggregat.

### R

#### Repository (Förråd)
Ett objekt som fungerar som en samling av domänobjekt och döljer detaljer om datalagring och hämtning. Exempel: `TeamRepository`.

#### Result
Ett värde-objekt som representerar resultatet av en operation, antingen lyckat eller misslyckat. Implementerat i Pling Mobile via `Result<T>` klassen.

### S

#### Service
En klass som implementerar domänlogik som inte naturligt passar in i en entitet eller värde-objekt.

### U

#### Ubiquitous Language (Genomgripande språk)
En gemensam språkvokabulär som används av både utvecklare och domänexperter för att beskriva domänen.

#### Unit of Work
Ett mönster som håller reda på allt du gör under en transaktion.

#### Use Case (Användningsfall)
En specifik operation som kan utföras i systemet som motsvarar ett användningsbehov. Implementerat i Pling Mobile via klasser som `CreateTeamUseCase`.

### V

#### Value Object (Värdeobjekt)
Ett objekt som definieras av dess attributvärden och saknar egen identitet. Exempel: `TeamName`, `Email`.

## Applikationsspecifika termer

### A

#### Activity (Aktivitet)
En registrerad händelse inom ett team, t.ex. när en användare skapar ett nytt inlägg.

### M

#### Member (Medlem)
En användare som tillhör ett team, med specifika roller och behörigheter.

### O

#### Organization (Organisation)
En överordnad entitet som kan innehålla flera team och användare.

### R

#### Role (Roll)
En uppsättning behörigheter som tilldelas en användare i ett specifikt sammanhang. Exempel: teamägare, teammedlem.

### S

#### Subscription (Prenumeration)
En relation mellan en organisation och en tjänstenivå som bestämmer tillgängliga funktioner och begränsningar.

### T

#### Team
En grupp användare som samarbetar kring gemensamma mål.

#### Thread (Tråd)
En konversationstråd i meddelandesystemet inom ett team.

### U

#### User (Användare)
En person som använder systemet, vanligtvis med en unik identitet och inloggningsuppgifter. 