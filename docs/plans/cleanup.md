# DDD-strukturplan för Pling-mobile

Denna plan beskriver hur vi ska organisera och rensa upp koden enligt Domain-Driven Design (DDD) principer.

## Arkitekturlager

### 1. Domänlager (domain/)
Detta lager innehåller den centrala affärslogiken utan beroenden till externa system.

- **Entiteter (entities/)**
  - Representerar domänobjekt med identitet
  - Innehåller validerings- och affärsregler
  - Exempel: `User`, `Team`, `Organization`

- **Värde-objekt (value-objects/)**
  - Oföränderliga objekt utan identitet
  - Validerar värden vid skapande
  - Exempel: `TeamName`, `UserProfile`, `TeamStatistics`

- **Aggregatrotsystem**
  - Huvudentiteter som garanterar konsistens
  - Hanterar transaktionsgränser
  - Exempel: `Organization` (rot för resurser/behörigheter)

- **Domänevents (events/)**
  - Händelser som representerar fakta i systemet
  - Används för kommunikation mellan aggregat
  - Exempel: `UserCreated`, `TeamMemberAdded`

- **Repositories (interfaces)**
  - Abstrakta interfaces för datahämtning
  - Definierar endast kontrakt, ej implementation
  - Exempel: `TeamRepository`, `UserRepository`

- **Domäntjänster (services/)**
  - Hanterar operationer som berör flera entiteter
  - Exempel: `PermissionService`, `SubscriptionService`

### 2. Applikationslager (application/)
Detta lager koordinerar domänobjekt och orkestrerar användningsfall.

- **Use Cases**
  - Implementerar specifika användaroperationer
  - Använder domänobjekt för att utföra arbete
  - Exempel: `createTeam.ts`, `addTeamMember.ts`

- **DTOs (Data Transfer Objects)**
  - Datastrukturer för kommunikation med externa lager
  - Exempel: `CreateTeamDTO`, `TeamMemberDTO`

- **Hooks**
  - React-hooks som använder use cases
  - Förser UI med data och operationer
  - Exempel: `useTeamMembers`, `useCreateTeam`

- **Queries**
  - Läsoperationer från databas
  - Kan vara mer direkta än use cases för optimering
  - Exempel: `getTeamStatistics`, `listTeams`

### 3. Infrastrukturlager (infrastructure/)
Detta lager implementerar gränssnitt och integrerar med externa system.

- **Repository-implementationer**
  - Konkreta implementationer av domänrepositories
  - Exempel: `SupabaseTeamRepository`, `SupabaseUserRepository`

- **Externa integrationer**
  - API-klienter och tjänster
  - Exempel: `SupabaseClient`, `StorageAdapter`

- **Tekniska tjänster**
  - Logging, caching, event bus implementation
  - Exempel: `Logger`, `CacheService`

### 4. UI-lager (ui/)
Detta lager hanterar användargränssnittet.

- **Komponenter (components/)**
  - Återanvändbara UI-komponenter
  - Exempel: `Button`, `Card`, `Avatar`

- **Skärmar (screens/)**
  - Fullständiga skärmvyer
  - Använder hooks från applikationslagret
  - Exempel: `TeamScreen`, `ProfileScreen`

- **Kontext (context/)**
  - React Context för delad state
  - Exempel: `AuthContext`, `ThemeContext`

## Regler för lagerberoenden

1. **Riktning för beroenden**:
   - Inre lager får INTE bero på yttre lager
   - Domän → Applikation → Infrastruktur → UI

2. **Domänlager**:
   - Får endast importera från sitt eget lager eller shared/core
   - Får INTE importera från applikation, infrastruktur eller UI

3. **Applikationslager**:
   - Får importera från domänlager och shared/core
   - Får INTE importera från infrastruktur eller UI
   - Använder interfaces/abstraktion för externa tjänster

4. **Infrastrukturlager**:
   - Får importera från domän, applikation och shared/core
   - Implementerar interfaces från domänlagret

5. **UI-lager**:
   - Får importera från alla lager
   - Ska primärt kommunicera via hooks från applikationslagret

## Standardisering av komponenter

### Domänentiteter
- Ärver från `Entity` eller `AggregateRoot`
- Validerar alla ingångsparametrar
- Använder Result-typen för validering
- Publicerar domänevents för förändringar

### Value Objects
- Oföränderliga (immutable)
- Validerar vid skapande (create factory-metod)
- Returnerar Result-typen för felhantering

### Repositories
- Definition i domänlagret (interface)
- Implementation i infrastrukturlagret
- Använder Result-typen för felhantering

### Use Cases
- En fil per användningsfall
- Mottager beroenden via konstruktor eller input-objekt
- Returnerar Result-typen för felhantering

### UI-komponenter
- Följer designsystemet
- Använder hooks för datahämtning
- Separera visningslogik från affärslogik

## Nästa steg

1. Skapa en uppgiftslista för implementation
2. Prioritera centrala domänelement
3. Flytta/omstrukturera kod till rätt lager
4. Standardisera kodmönster enligt ovan regler
5. Uppdatera dokumentation och tester 