# Guide för testning av domäntjänster

Denna guide beskriver bästa praxis för att testa domäntjänster i vårt DDD-baserade system. Domäntjänster är stateless komponenter som innehåller domänlogik som inte naturligt hör hemma i någon specifik entitet eller värde-objekt.

## Grundläggande principer

1. **Mocka beroenden**: Domäntjänster använder ofta repositories och andra tjänster. Dessa bör alltid mockas i tester.
2. **Testa affärsregler**: Fokusera på att testa affärsreglerna, inte implementationsdetaljer.
3. **Kontrollera Result-objekt**: Kontrollera alltid att Result-objekt har rätt status (isOk/isErr) och innehåller förväntade värden/felmeddelanden.
4. **Testa felhantering**: Säkerställ att tjänsten korrekt hanterar fel från dependencies.
5. **Använd testhjälpare**: Använd DomainServiceTestHelper för att förenkla skapandet av mockar och testdata.

## Standardstruktur för domäntjänsttester

```typescript
import { DomainServiceTestHelper } from '@/test-utils/helpers/DomainServiceTestHelper';
import { SomeService } from '@/domain/core/services/SomeService';
import { ConcreteSomeService } from '@/infrastructure/services/ConcreteSomeService';

describe('SomeService', () => {
  let someService: SomeService;
  let mockDependency1: any;
  let mockDependency2: any;
  
  // Testdata
  const testData = { /* ... */ };
  
  beforeEach(() => {
    // Skapa mock dependencies
    mockDependency1 = /* ... */;
    mockDependency2 = /* ... */;
    
    // Skapa service med mockar
    someService = new ConcreteSomeService(
      mockDependency1,
      mockDependency2
    );
  });
  
  describe('someMethod', () => {
    it('ska returnera korrekt resultat när villkoren är uppfyllda', async () => {
      // Arrange
      const input = /* ... */;
      
      // Act
      const result = await someService.someMethod(input);
      
      // Assert
      DomainServiceTestHelper.validateSuccessResult(result, expectedValue);
    });
    
    it('ska returnera fel när villkoren inte är uppfyllda', async () => {
      // Arrange
      const input = /* ... */;
      
      // Act
      const result = await someService.someMethod(input);
      
      // Assert
      DomainServiceTestHelper.validateErrorResult(result, 'Förväntad felmeddelandetext');
    });
  });
});
```

## Mockning av beroenden

### Repositories

Använd MockRepositoryFactory eller DomainServiceTestHelper för att skapa mocks för repositories:

```typescript
const mockUsers = [user1, user2, user3];
const mockUserRepository = MockRepositoryFactory.createMockUserRepository(mockUsers);

// Eller för en enklare mock:
const mockRepository = DomainServiceTestHelper.createMockRepositoryWithEntity(someEntity);

// För ett repository som alltid misslyckas:
const mockFailingRepository = DomainServiceTestHelper.createMockErrorRepository('Database error');
```

### Andra domäntjänster

Använd MockServiceFactory eller DomainServiceTestHelper för att skapa mocks för andra domäntjänster:

```typescript
const mockPermissionService = DomainServiceTestHelper.createMockPermissionService({
  hasOrganizationPermission: jest.fn().mockImplementation((userId, orgId, permission) => {
    if (userId === 'admin-user') {
      return Promise.resolve({ isOk: () => true, value: true });
    }
    return Promise.resolve({ isOk: () => true, value: false });
  })
});

// För en tjänst som alltid lyckas:
const mockSuccessService = DomainServiceTestHelper.createMockSuccessService([
  'methodA', 'methodB', 'methodC'
]);

// För en tjänst som alltid misslyckas:
const mockFailingService = DomainServiceTestHelper.createMockErrorService([
  'methodA', 'methodB', 'methodC'
], 'Service failed');
```

## Exempel på test av PermissionService

Ett fullständigt exempel på testning av PermissionService:

```typescript
import { DefaultPermissionService } from '@/infrastructure/services/DefaultPermissionService';
import { PermissionService } from '@/domain/core/services/PermissionService';
import { MockRepositoryFactory } from '@/test-utils/mocks/mockRepositoryFactory';
import { DomainServiceTestHelper } from '@/test-utils/helpers/DomainServiceTestHelper';
import { OrganizationPermission } from '@/domain/organization/value-objects/OrganizationPermission';

describe('PermissionService', () => {
  let permissionService: PermissionService;
  let mockOrganizationRepository: any;
  let mockTeamRepository: any;
  let mockResourceRepository: any;
  
  const testData = DomainServiceTestHelper.createTestDomainData();
  
  beforeEach(() => {
    // Skapa mock repositories
    mockOrganizationRepository = MockRepositoryFactory.createMockOrganizationRepository([
      testData.organizations.main
    ]);
    
    mockTeamRepository = MockRepositoryFactory.createMockTeamRepository([
      testData.teams.main,
      testData.teams.private
    ]);
    
    mockResourceRepository = {
      findById: jest.fn().mockImplementation((id) => {
        // Mock implementering här
      })
    };
    
    // Skapa tjänsten med mockar
    permissionService = new DefaultPermissionService(
      mockOrganizationRepository,
      mockTeamRepository,
      mockResourceRepository
    );
  });
  
  describe('hasOrganizationPermission', () => {
    it('ska returnera true när användaren har behörigheten', async () => {
      const result = await permissionService.hasOrganizationPermission(
        'user-admin', // Admin-användare
        'org-1',      // Organisationen
        OrganizationPermission.MANAGE_MEMBERS // Behörigheten att testa
      );
      
      DomainServiceTestHelper.validateSuccessResult(result, true);
    });
    
    // Fler tester här...
  });
});
```

## Exempel på test av FeatureFlagService

```typescript
import { DefaultFeatureFlagService } from '@/domain/subscription/services/DefaultFeatureFlagService';
import { FeatureFlagService } from '@/domain/subscription/interfaces/FeatureFlagService';
import { DomainServiceTestHelper } from '@/test-utils/helpers/DomainServiceTestHelper';

describe('FeatureFlagService', () => {
  let featureFlagService: FeatureFlagService;
  let mockSubscriptionRepository: any;
  
  const testOrgId = 'org-123';
  
  beforeEach(() => {
    // Skapa mock repository
    mockSubscriptionRepository = {
      getByOrganizationId: jest.fn().mockImplementation((orgId) => {
        // Mock implementering här...
      }),
      
      getSubscriptionPlan: jest.fn().mockImplementation((planId) => {
        // Mock implementering här...
      }),
      
      getUsageMetrics: jest.fn().mockImplementation((orgId) => {
        // Mock implementering här...
      })
    };
    
    // Skapa service med mockad repository
    featureFlagService = new DefaultFeatureFlagService(mockSubscriptionRepository);
  });
  
  describe('isFeatureEnabled', () => {
    it('ska returnera true för en aktiverad funktion', async () => {
      const result = await featureFlagService.isFeatureEnabled(
        'org-123',
        'premium_analytics'
      );
      
      DomainServiceTestHelper.validateSuccessResult(result, true);
    });
    
    // Fler tester här...
  });
});
```

## Kontinuerlig testning

Se till att köra domäntjänsttester regelbundet med:

```bash
npm run test:domain
```

Eller för att köra specifika tester för en domäntjänst:

```bash
npx jest src/domain/core/services/__tests__/PermissionService.test.ts
```

## God praxis för testning av domäntjänster

1. **Skapa tydligt separerade testfall**: Varje testfall bör testa en specifik funktionalitet eller ett specifikt scenario.
2. **Använd beskrivande testnamn**: Namn bör förklara vad som testas och under vilka förhållanden.
3. **Följ AAA-mönstret**: Arrange (förbered), Act (utför), Assert (verifiera).
4. **Isolera tester**: Se till att tester inte påverkar varandra genom att återställa data i beforeEach.
5. **Testa edge cases**: Inkludera tester för extremvärden, null-värden och felscenarier.
6. **Håll tester enkla och läsbara**: Komplexa tester är svåra att underhålla och förstå.
7. **Använd testhjälpare**: Abstrahera återanvändbar funktionalitet till hjälpmetoder.

## Checklista för tester av domäntjänster

- [ ] Alla publika metoder i domäntjänsten är testade
- [ ] Både framgångs- och felscenarier är testade
- [ ] Alla beroenden är korrekt mockade
- [ ] Tester verifierar affärsregler, inte bara implementation
- [ ] Result-objekt kontrolleras korrekt
- [ ] Tester är isolerade från varandra
- [ ] Testnamn är beskrivande och följer konventionen

Genom att följa denna guide kommer våra tester för domäntjänster att vara robusta, underhållbara och effektiva för att hitta fel. 