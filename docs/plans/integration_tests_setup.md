# Konfiguration av integrationstester för resursbegränsningssystemet

## Översikt

Detta dokument beskriver hur man konfigurerar och kör integrationstester för resursbegränsningssystemet i Pling-applikationen. Integrationstesterna är utformade för att testa samspelet mellan komponenter som ResourceLimitProvider, ResourceUsageTrackingService, PushNotificationService och databaslagret.

## Testmiljö

### Förutsättningar

Innan du konfigurerar integrationstester, se till att ha följande:

1. En lokal utvecklingsmiljö eller dedikerad testmiljö
2. Tillgång till Supabase-testprojektet (jgkfcqplopdncxbpwlyj)
3. Jest och testing-library installerade i projektet
4. Test-konfigurationsfiler för miljövariabler

### Konfiguration av Testdatabas

För att undvika påverkan på produktionsdata, konfigurerar vi en isolerad testmiljö:

1. **Använd dedikerat schema för tester**

    ```sql
    CREATE SCHEMA IF NOT EXISTS test_resource_limits;
    ```

2. **Skapa testversioner av tabeller**

    Kopiera schema från huvudtabellerna:

    ```sql
    CREATE TABLE test_resource_limits.resource_limits (LIKE public.resource_limits INCLUDING ALL);
    CREATE TABLE test_resource_limits.resource_usage (LIKE public.resource_usage INCLUDING ALL);
    CREATE TABLE test_resource_limits.resource_usage_history (LIKE public.resource_usage_history INCLUDING ALL);
    CREATE TABLE test_resource_limits.notifications (LIKE public.notifications INCLUDING ALL);
    CREATE TABLE test_resource_limits.device_tokens (LIKE public.device_tokens INCLUDING ALL);
    ```

3. **Populera med testdata**

    ```sql
    -- Populera resource_limits med testdata
    INSERT INTO test_resource_limits.resource_limits (
      plan_type, resource_type, limit_value, display_name, description
    ) VALUES
      ('basic', 'team', 5, 'Teams', 'Antal team per organisation'),
      ('pro', 'team', 25, 'Teams', 'Antal team per organisation'),
      ('enterprise', 'team', 100, 'Teams', 'Antal team per organisation'),
      ('basic', 'teamMember', 10, 'Teammedlemmar', 'Antal medlemmar per team'),
      ('pro', 'teamMember', 25, 'Teammedlemmar', 'Antal medlemmar per team'),
      ('enterprise', 'teamMember', 50, 'Teammedlemmar', 'Antal medlemmar per team');
    ```

## Testdrivrutiner

### Databashanterare för tester

Skapa en anpassad testdrivrutin för databasåtkomst:

```typescript
// src/tests/utils/test-db-manager.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class TestDbManager {
  private client: SupabaseClient;
  
  constructor() {
    this.client = createClient(
      process.env.SUPABASE_TEST_URL || '',
      process.env.SUPABASE_TEST_ANON_KEY || ''
    );
  }
  
  async setupTestData() {
    // Rensa befintlig testdata
    await this.cleanupTestData();
    
    // Skapa testorganisationer
    await this.client.from('organizations').insert([
      { id: 'test-basic-org', name: 'Test Basic Org', owner_id: 'test-admin-user' },
      { id: 'test-pro-org', name: 'Test Pro Org', owner_id: 'test-admin-user' },
      { id: 'test-enterprise-org', name: 'Test Enterprise Org', owner_id: 'test-admin-user' }
    ]);
    
    // Skapa testprenumerationer
    await this.client.from('subscriptions').insert([
      { organization_id: 'test-basic-org', plan_id: 'basic-plan-id', status: 'active' },
      { organization_id: 'test-pro-org', plan_id: 'pro-plan-id', status: 'active' },
      { organization_id: 'test-enterprise-org', plan_id: 'enterprise-plan-id', status: 'active' }
    ]);
    
    // Skapa testresursanvändning
    await this.client.from('resource_usage').insert([
      { organization_id: 'test-basic-org', resource_type: 'team', current_usage: 4 }, // 80% av gräns
      { organization_id: 'test-pro-org', resource_type: 'team', current_usage: 20 }, // 80% av gräns
      { organization_id: 'test-enterprise-org', resource_type: 'team', current_usage: 80 } // 80% av gräns
    ]);
  }
  
  async cleanupTestData() {
    // Rensa testdata i omvänd ordning för att undvika referensproblem
    await this.client.from('resource_usage').delete().in('organization_id', [
      'test-basic-org', 'test-pro-org', 'test-enterprise-org'
    ]);
    
    await this.client.from('subscriptions').delete().in('organization_id', [
      'test-basic-org', 'test-pro-org', 'test-enterprise-org'
    ]);
    
    await this.client.from('organizations').delete().in('id', [
      'test-basic-org', 'test-pro-org', 'test-enterprise-org'
    ]);
  }
  
  getClient() {
    return this.client;
  }
}
```

### Test Provider-Wrapper

Skapa en provider-wrapper för att förenkla testning av komponenter:

```typescript
// src/tests/utils/test-resource-provider.tsx
import React, { ReactNode } from 'react';
import { ResourceLimitProvider } from '@/components/subscription/ResourceLimitProvider';
import { AuthProvider } from '@/components/auth/AuthProvider';

export const TestResourceProvider: React.FC<{
  organizationId: string;
  children: ReactNode;
}> = ({ organizationId, children }) => {
  const mockUser = {
    id: 'test-admin-user',
    email: 'test@example.com',
    role: 'admin'
  };
  
  return (
    <AuthProvider initialUser={mockUser}>
      <ResourceLimitProvider organizationId={organizationId}>
        {children}
      </ResourceLimitProvider>
    </AuthProvider>
  );
};
```

## Testuppsättning och nedrivning

För att se till att testerna är isolerade och upprepningsbara:

```typescript
// src/tests/setup.ts
import { TestDbManager } from './utils/test-db-manager';

// Globala variabler som är tillgängliga i alla tester
declare global {
  namespace NodeJS {
    interface Global {
      testDbManager: TestDbManager;
    }
  }
}

// Kör innan alla tester
beforeAll(async () => {
  // Initiera testmiljö
  global.testDbManager = new TestDbManager();
  await global.testDbManager.setupTestData();
});

// Kör efter alla tester
afterAll(async () => {
  // Städa upp testmiljö
  await global.testDbManager.cleanupTestData();
});

// Kör före varje test
beforeEach(() => {
  // Återställ alla mocks
  jest.clearAllMocks();
});
```

## Exempel på integrationstester

### Test av ResourceUsageTrackingService

```typescript
// src/tests/integration/ResourceUsageTrackingService.test.ts
import { ResourceUsageTrackingService } from '@/services/ResourceUsageTrackingService';
import { TestDbManager } from '../utils/test-db-manager';

describe('ResourceUsageTrackingService Integration Tests', () => {
  let dbManager: TestDbManager;
  let service: ResourceUsageTrackingService;
  
  beforeAll(() => {
    dbManager = global.testDbManager;
    const client = dbManager.getClient();
    service = new ResourceUsageTrackingService();
  });
  
  it('should update resource usage and create history entry', async () => {
    // Hämta initial användning
    const initialUsage = await service.getResourceUsage('test-basic-org', 'team');
    const initialValue = initialUsage[0]?.currentUsage || 0;
    
    // Uppdatera användning
    const updateResult = await service.updateResourceUsage(
      'test-basic-org',
      'team',
      initialValue + 1
    );
    
    expect(updateResult).toBe(true);
    
    // Verifiera uppdatering
    const updatedUsage = await service.getResourceUsage('test-basic-org', 'team');
    expect(updatedUsage[0].currentUsage).toBe(initialValue + 1);
    
    // Verifiera historikpost
    const history = await service.getResourceUsageHistory(
      'test-basic-org',
      'team',
      1
    );
    
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].usageValue).toBe(initialValue + 1);
  });
});
```

### Test av PushNotificationService

```typescript
// src/tests/integration/PushNotificationService.test.ts
import { PushNotificationService } from '@/services/PushNotificationService';
import { TestDbManager } from '../utils/test-db-manager';

describe('PushNotificationService Integration Tests', () => {
  let dbManager: TestDbManager;
  let service: PushNotificationService;
  
  beforeAll(() => {
    dbManager = global.testDbManager;
    service = new PushNotificationService();
  });
  
  it('should register device token', async () => {
    const result = await service.registerDeviceToken(
      'test-admin-user',
      'test-device-token',
      'android',
      'Test Device',
      '1.0.0'
    );
    
    expect(result).toBe(true);
    
    // Verifiera att token finns i databasen
    const { data } = await dbManager.getClient()
      .from('device_tokens')
      .select('*')
      .eq('user_id', 'test-admin-user')
      .eq('token', 'test-device-token');
    
    expect(data).toBeDefined();
    expect(data?.length).toBe(1);
    expect(data?.[0].device_type).toBe('android');
  });
});
```

## Körning av tester

För att köra integrationstesterna:

```bash
# Kör alla tester
npm run test:integration

# Kör specifika tester
npm run test:integration -- -t "ResourceUsageTrackingService"
```

## Felsökningsguide

### Vanliga problem

1. **Databaskonnektionsproblem**
   - Kontrollera att miljövariabler för testdatabasen är korrekt konfigurerade
   - Verifiera att testanvändaren har korrekt behörighet

2. **Felaktiga testdata**
   - Kontrollera att setupTestData-metoden körs korrekt
   - Verifiera att testdata finns i databasen genom direkta frågor

3. **Flaky tester**
   - Isolera testerna bättre genom att skapa unika testidentifierare för varje testkörning
   - Lägg till fördröjningar där det behövs för asynkrona operationer

### Loggning

För förbättrad loggning i testmiljön:

```typescript
// src/tests/utils/test-logger.ts
export class TestLogger {
  static log(message: string) {
    if (process.env.TEST_VERBOSE === 'true') {
      console.log(`[TEST] ${message}`);
    }
  }
  
  static error(message: string, error?: any) {
    console.error(`[TEST ERROR] ${message}`, error || '');
  }
}
```

## Continuous Integration

För att integrera testmiljön med CI/CD-pipeline:

1. Konfigurera Docker-container för testmiljö
2. Använd environment secrets för testkonfiguration
3. Kör integrationstester som del av byggprocessen

```yaml
# .github/workflows/integration-tests.yml
name: Integration Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run integration tests
        env:
          SUPABASE_TEST_URL: ${{ secrets.SUPABASE_TEST_URL }}
          SUPABASE_TEST_ANON_KEY: ${{ secrets.SUPABASE_TEST_ANON_KEY }}
        run: npm run test:integration
``` 