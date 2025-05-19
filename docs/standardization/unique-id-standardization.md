# Standardisering av UniqueId i Pling Mobile

## Bakgrund

Vi har identifierat att olika implementationer av `UniqueId` används i systemet, vilket leder till typkonfliktproblem i TypeScript. När två identiskt implementerade klasser importeras från olika platser uppfattas de som olika typer av TypeScript, vilket ger typfel som:

```typescript
// Exempel på typfel
Type 'import("@/shared/core/UniqueId").UniqueId' is not assignable to type 'import("@/shared/domain/UniqueId").UniqueId'.
  Types have separate declarations of a private property 'id'.
```

För att lösa dessa problem har vi standardiserat användningen av `UniqueId` till en enda implementation.

## Standard: Använd @/shared/core/UniqueId

**Alla nya och refaktorerade delar av systemet ska använda:**

```typescript
import { UniqueId } from '@/shared/core/UniqueId';
```

## Riktlinjer

### ✅ DO

- Använd **ENDAST** `import { UniqueId } from '@/shared/core/UniqueId';`
- Använd de hjälpmetoder som tillhandahålls:
  - `UniqueId.create()` för att skapa en ny med autogenererat ID
  - `UniqueId.fromString(id)` för att skapa från en befintlig string
  - `UniqueId.isUniqueId(obj)` som typguard
- Filtrera på varningar med "UniqueId" för att hitta platser i koden där de förlegade implementationerna används

### ❌ DON'T

- Skapa **INTE** nya implementationer av `UniqueId`
- Importera **INTE** från andra platser än `@/shared/core/UniqueId`
- Modifiera **INTE** implementationen utan att diskutera med teamet
- Ta **INTE** bort bryggimplementationerna under migrationsperioden

## Migration från andra versioner

Under en övergångsperiod finns bryggimplementationer på de tidigare platserna. Dessa visar varningar i utvecklingsmiljön och är markerade som @deprecated.

### Från shared/domain/UniqueId

Om du använder:
```typescript
import { UniqueId } from '@/shared/domain/UniqueId';
```

Byt till:
```typescript
import { UniqueId } from '@/shared/core/UniqueId';
```

### Från domain/core/UniqueId 

Om du använder `domain/core/UniqueId` med Result-API:

```typescript
import { UniqueId } from '@/domain/core/UniqueId';

// Nuvarande kod
const idResult = UniqueId.create('some-id');
if (idResult.isOk()) {
  const id = idResult.value;
  // ...
}
```

Byt till:
```typescript
import { UniqueId } from '@/shared/core/UniqueId';
import { ok, err, Result } from '@/shared/core/Result';

// Ny approach - alternativ 1
const id = new UniqueId('some-id');

// Ny approach - alternativ 2 (om Result-API behålls)
function createUniqueId(id?: string): Result<UniqueId, string> {
  try {
    return ok(new UniqueId(id));
  } catch (error) {
    return err('Ogiltigt UUID format');
  }
}

const idResult = createUniqueId('some-id');
```

## Tidplan för standardisering

1. **Fas 1 (Pågående)**: Implementera bryggimplementationer och dokumentation
2. **Fas 2 (Vecka X-Y)**: Migrera tester i shared-modulen 
3. **Fas 3 (Vecka Y-Z)**: Migrera Infrastructure-lagret
4. **Fas 4 (Vecka Z+)**: Migrera Domain- och Application-lager
5. **Fas 5**: Ta bort bryggimplementationerna och slutför standardiseringen

## Verktyg för att hitta användningar

För att hitta alla filer som använder någon av de förlegade implementationerna:

```bash
# För shared/domain/UniqueId
grep -r "import.*UniqueId.*from.*shared/domain/UniqueId" --include="*.ts" src/

# För domain/core/UniqueId
grep -r "import.*UniqueId.*from.*domain/core/UniqueId" --include="*.ts" src/
```

## Problem?

Om du stöter på problem med standardiseringen, kontakta ansvarig utvecklare eller rapportera ett problem. 