# Plan för fortsatta testförbättringar

## Prioriterade områden

1. **React Query Testkompatibilitet**
   - Skapa en stabil lösning för alla React Query-relaterade testproblem
   - Standardisera patch-metoder för att undvika batchNotifyFn-problem
   - Skapa reusable testhjälpare som garanterat fungerar med alla typer av hooks

2. **Förbättrade mock-repositories**
   - Säkerställ att alla mock-repositories implementerar fullständiga interfaces
   - Lägg till saknade metoder i MockTeamRepository
   - Standardisera skapandet av mock-data för tester

3. **Entitet och ValueObject konsistens**
   - Förbättra direkt användning av interna properties i Team och Organization entiteter
   - Se till att ValueObjects används konsekvent i alla entiteter och tester
   - Flytta all logik från test-utils/helpers till faktiska domain-entities

## Implementationsplan

### Fas 1: Standardisering (Nuvarande sprint)
- ✅ Separera providers från hooks
- ✅ Skapa TeamPermissionValue som robust ValueObject
- ✅ Implementera UseCases med konsekvent Result-hantering
- ✅ Skapa HooksIntegrationTestWrapper

### Fas 2: React Query Förbättringar (Nästa sprint)
- Skapa en dedikerad React Query TestProvider för integrationstester
- Skapa en konsekvent lösning för batchNotifyFn-problem
- Se till att alla hooks fungerar smidigt med mockade providers

### Fas 3: Datamodellförbättringar (Framtida sprints)
- Fullständig implementation av TeamMember som ValueObject
- Konsekvent användning av entitetsreferenser i alla relationer
- Minska användning av "any"-typer i testhjälpare
- Refaktorera all direkt manipulation av interna fält i tester

### Fas 4: Test-Driven Utveckling (Kontinuerligt)
- Säkerställ att alla nya features har tester innan implementation
- Skriva tester för att validera invarianter och domänregler
- Skapa standardmall för hur man skriver tester för nya features

## Verifikationer

För varje förbättring ska följande verifieras:
1. **Tester går igenom** - Alla befintliga tester måste gå igenom
2. **Ingen kodduplicering** - Refaktoreringar ska minska, inte öka, duplicering
3. **Förbättrad typning** - Alla lösningar ska vara väl typade med TypeScript
4. **Följer domänregler** - Alla lösningar måste följa etablerade domänregler
5. **Implementerar interfaces** - Alla mock-objekt måste korrekt implementera interfaces 