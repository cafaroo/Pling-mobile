# Riktlinjer för domäntjänster

Denna dokumentation beskriver arkitekturella riktlinjer för domäntjänster i Pling-mobile-projektet enligt Domain-Driven Design (DDD) principer.

## Vad är en domäntjänst?

Domäntjänster representerar domänoperationer som inte naturligt hör hemma i en enskild entitet eller värde-objekt. De ansvarar för att utföra operationer som kräver samarbete mellan flera aggregat eller implementerar domänlogik som inte passar inom en entitets gränser.

## Centrala principer

### 1. Stateless implementering

Domäntjänster ska alltid vara **stateless** - det vill säga de ska inte innehålla sitt eget tillstånd över tid. Alla tjänster ska uppfylla följande kriterier:

- **Inga instansvariabler** som lagrar tillstånd mellan metodanrop
- **Tillståndshantering via inparametrar** - all nödvändig data för en operation skickas via parametrar
- **Idempotenta operationer** - upprepade anrop med samma parametrar ger samma resultat
- **Inga cacher** inom tjänsten - caching hanteras utanför domäntjänsten i infrastrukturlagret
- **Inga sessionsdata** sparas mellan anrop

### 2. Fokus på domänoperationer

- Domäntjänster ska lösa specifika domänproblem, inte tekniska problem
- Varje domäntjänst har ett tydligt och avgränsat ansvarsområde
- Operationer representerar "verb" i domänen (beräkna, validera, kontrollera, etc.)

### 3. Beroenden

- Domäntjänster får vara beroende av repositories för att hämta domänobjekt
- Alla beroenden ska injiceras via konstruktorn
- Domäntjänster kan anropa andra domäntjänster
- Domäntjänster ska inte vara direkt beroende av infrastrukturkomponenter

## Implementationsmönster

### Interface och implementation

Domäntjänster definieras alltid med ett interface i domänlagret:

```typescript
// I domänlagret
export interface PermissionService {
  hasPermission(userId: string, resourceId: string, permission: string): Promise<Result<boolean>>;
  // Andra metoder...
}
```

Konkreta implementationer placeras i infrastrukturlagret:

```typescript
// I infrastrukturlagret
export class DefaultPermissionService implements PermissionService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly resourceRepository: ResourceRepository
  ) {}
  
  async hasPermission(userId: string, resourceId: string, permission: string): Promise<Result<boolean>> {
    // Implementation...
  }
}
```

### Factory-mönster

För att förenkla instansiering och beroendehantering, använd alltid en factory:

```typescript
export class PermissionServiceFactory {
  static create(
    userRepository: UserRepository,
    resourceRepository: ResourceRepository
  ): PermissionService {
    return new DefaultPermissionService(userRepository, resourceRepository);
  }
}
```

## Exempel på domäntjänster

I Pling-mobile finns följande domäntjänster:

1. **PermissionService** - Hanterar behörighetskontroller över domängränser
2. **FeatureFlagService** - Kontrollerar funktionalitet baserat på prenumerationstyp
3. **ValidationService** - Validerar komplexa affärsregler över flera aggregat

## Att säkerställa stateless domäntjänster

För att säkerställa att domäntjänster förblir stateless:

1. **Kodgranskning** - Verifiera att inga instansvariabler används för att lagra tillstånd
2. **Enhetstester** - Testa att upprepade anrop med samma parametrar ger samma resultat
3. **Dokumentation** - Tydliggör att tjänsten är stateless i kommentarer
4. **Invarianter** - Om metoder ändrar interna variabler, säkerställ att ändringarna återställs innan metoden returnerar

## Vanliga misstag att undvika

1. **Cache i domäntjänster** - Flytta caching till infrastrukturlagret eller repositories
2. **Globala variabler** - Använd aldrig globala variabler för att lagra tillstånd
3. **Singleton med tillstånd** - Även om tjänsten implementeras som en singleton ska den inte innehålla tillstånd
4. **Inkapslad tillståndshantering** - Lagra inte information från ett anrop till ett annat

## Sammanfattning

Genom att säkerställa att domäntjänster är stateless uppnår vi följande fördelar:

- **Skalbarhet** - Tjänsterna kan enkelt skalas horisontellt
- **Testbarhet** - Enklare att testa utan att behöva återställa tillstånd
- **Förutsägbarhet** - Upprepade anrop ger samma resultat
- **Trådssäkerhet** - Inga problem med samtidig åtkomst till delat tillstånd 