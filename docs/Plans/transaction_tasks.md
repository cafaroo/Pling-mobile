# Transaction Förbättringsplan

## Översikt

Detta dokument beskriver strukturen och implementationen av transaktionsdomänen i Pling-applikationen. Denna domän hanterar alla transaktioner, produkter och kundinteraktioner, med fokus på integration med mål och tävlingar samt framtida externa system.

## Innehållsförteckning

1. [Nulägesanalys](#nulägesanalys)
2. [Domänstruktur](#domänstruktur)
3. [Datamodell](#datamodell)
4. [Integrationer](#integrationer)
5. [Implementation](#implementation)
6. [Testning](#testning)
7. [Tidplan](#tidplan)

## Domänstruktur

### Mappstruktur

```
/components
  /transaction
    TransactionList.tsx      # Lista över transaktioner
    TransactionCard.tsx      # Kortvy för enskild transaktion
    ProductList.tsx          # Produktlista
    ProductCard.tsx          # Produktkort
    CustomerInteraction.tsx  # Kundinteraktionsvy
    
/hooks
  /transaction
    useTransactions.ts       # Hook för transaktionshantering
    useProducts.ts          # Hook för produkthantering
    useCustomers.ts         # Hook för kundhantering
    useMetrics.ts           # Hook för transaktionsmetrik
    
/services
  /transaction
    transactionService.ts   # Huvudservice för transaktioner
    productService.ts       # Produkthantering
    customerService.ts      # Kundhantering
    metricService.ts        # Metriktjänst
    integrationService.ts   # Extern systemintegration
    
/types
  transaction.ts            # Typdefinitioner för transaktioner
  product.ts               # Produkttyper
  customer.ts              # Kundtyper
  metric.ts               # Metriktyper

/utils
  /transaction
    calculators.ts         # Beräkningsfunktioner
    formatters.ts         # Formatteringsfunktioner
    validators.ts         # Valideringsfunktioner
```

## Datamodell

### Huvudmodeller

```typescript
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  created_at: string;
  updated_at: string;
  
  // Relationer
  customer_id: string;
  product_id: string;
  team_id?: string;
  user_id: string;
  
  // Metadata
  payment_method?: PaymentMethod;
  reference?: string;
  notes?: string;
  tags: string[];
  
  // Integrationsdata
  external_id?: string;
  external_system?: string;
  
  // Mål och tävlingsreferenser
  goal_references?: GoalReference[];
  competition_references?: CompetitionReference[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  status: ProductStatus;
  category: ProductCategory;
  
  // Metadata
  tags: string[];
  attributes: ProductAttribute[];
  
  // Målrelaterat
  goal_metrics?: GoalMetric[];
  competition_metrics?: CompetitionMetric[];
}

export interface Customer {
  id: string;
  external_id?: string;
  name: string;
  email?: string;
  phone?: string;
  
  // Metadata
  tags: string[];
  segment?: CustomerSegment;
  
  // Statistik
  total_transactions: number;
  total_value: number;
  last_transaction_date?: string;
  
  // Integrationsdata
  external_system?: string;
  external_data?: Record<string, any>;
}

export interface TransactionMetric {
  id: string;
  transaction_id: string;
  metric_type: MetricType;
  value: number;
  
  // Kopplingar
  goal_id?: string;
  competition_id?: string;
}
```

### Integrationsgränssnitt

```typescript
export interface ExternalSystemIntegration {
  system_id: string;
  name: string;
  type: 'crm' | 'payment' | 'analytics';
  config: IntegrationConfig;
  status: IntegrationStatus;
  
  // Mappningar
  field_mappings: FieldMapping[];
  webhook_config?: WebhookConfig;
}

export interface FieldMapping {
  local_field: string;
  external_field: string;
  transformation?: TransformationRule;
}
```

## Integrationer

### 1. Mål-integration

```typescript
export class TransactionGoalService {
  async updateGoalProgress(transaction: Transaction): Promise<void> {
    const metrics = await this.calculateGoalMetrics(transaction);
    
    for (const metric of metrics) {
      await this.goalService.updateProgress({
        goal_id: metric.goal_id,
        progress: metric.value,
        source: {
          type: 'transaction',
          id: transaction.id
        }
      });
    }
  }
  
  private async calculateGoalMetrics(
    transaction: Transaction
  ): Promise<GoalMetric[]> {
    // Implementera beräkningslogik här
  }
}
```

### 2. Tävlingsintegration

```typescript
export class TransactionCompetitionService {
  async updateCompetitionScores(transaction: Transaction): Promise<void> {
    const metrics = await this.calculateCompetitionMetrics(transaction);
    
    for (const metric of metrics) {
      await this.competitionService.updateScore({
        competition_id: metric.competition_id,
        participant_id: transaction.user_id,
        score: metric.value,
        source: {
          type: 'transaction',
          id: transaction.id
        }
      });
    }
  }
}
```

### 3. Extern systemintegration

```typescript
export class ExternalSystemService {
  async syncTransaction(
    transaction: Transaction,
    system: ExternalSystemIntegration
  ): Promise<void> {
    const mappedData = this.mapTransactionData(transaction, system.field_mappings);
    
    switch (system.type) {
      case 'crm':
        await this.syncToCRM(mappedData, system);
        break;
      case 'payment':
        await this.syncToPaymentSystem(mappedData, system);
        break;
      case 'analytics':
        await this.syncToAnalytics(mappedData, system);
        break;
    }
  }
}
```

## Implementation

### Fas 1: Grundläggande infrastruktur

1. **Databasschema**
```sql
-- Transaktioner
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id),
  product_id UUID REFERENCES products(id),
  team_id UUID REFERENCES teams(id),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  external_data JSONB DEFAULT '{}'::jsonb
);

-- Produkter
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  category TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kunder
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id TEXT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(external_id)
);

-- Transaktionsmetriker
CREATE TABLE transaction_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES transactions(id),
  metric_type TEXT NOT NULL,
  value DECIMAL NOT NULL,
  goal_id UUID REFERENCES goals(id),
  competition_id UUID REFERENCES competitions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Externa systemintegrationer
CREATE TABLE external_system_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  config JSONB NOT NULL,
  status TEXT NOT NULL,
  field_mappings JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

2. **Grundläggande services**

```typescript
export class TransactionService {
  async createTransaction(data: CreateTransactionDTO): Promise<Transaction> {
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    
    // Uppdatera mål och tävlingar
    await this.updateGoals(transaction);
    await this.updateCompetitions(transaction);
    
    // Synka med externa system
    await this.syncExternalSystems(transaction);
    
    return transaction;
  }
  
  private async updateGoals(transaction: Transaction): Promise<void> {
    const goalService = new TransactionGoalService();
    await goalService.updateGoalProgress(transaction);
  }
  
  private async updateCompetitions(transaction: Transaction): Promise<void> {
    const competitionService = new TransactionCompetitionService();
    await competitionService.updateCompetitionScores(transaction);
  }
  
  private async syncExternalSystems(transaction: Transaction): Promise<void> {
    const externalService = new ExternalSystemService();
    const systems = await this.getActiveExternalSystems();
    
    for (const system of systems) {
      await externalService.syncTransaction(transaction, system);
    }
  }
}
```

### Fas 2: UI-komponenter

1. **TransactionList med filtrering**
2. **TransactionCard med detaljvy**
3. **ProductList med kategorier**
4. **CustomerInteraction med historik**

### Fas 3: Integrationer

1. **Mål-koppling**
2. **Tävlings-koppling**
3. **Externa system**

## Testning

### Enhetstester
- Transaktionslogik
- Beräkningar
- Valideringar

### Integrationstester
- Mål-uppdateringar
- Tävlingspoäng
- Externa system

### Prestandatester
- Stora datamängder
- Samtidiga transaktioner
- Synkroniseringar

## Tidplan

### Vecka 1: Grundstruktur
- Dag 1-2: Databasschema
- Dag 3-4: Grundläggande services
- Dag 5: TypeScript-interfaces

### Vecka 2: UI och logik
- Dag 1-2: TransactionList och Card
- Dag 3-4: ProductList och Card
- Dag 5: CustomerInteraction

### Vecka 3: Integrationer
- Dag 1-2: Mål-integration
- Dag 3-4: Tävlings-integration
- Dag 5: Externa system

### Vecka 4: Testning och optimering
- Dag 1-2: Enhetstester
- Dag 3: Integrationstester
- Dag 4-5: Prestandaoptimering

## Implementationsstatus

### Implementerade komponenter
- ⏳ Databasstruktur
- ⏳ Grundläggande services
- ⏳ TypeScript-interfaces

### Pågående arbete
- 📝 UI-komponenter
- 📝 Mål-integration
- 📝 Tävlings-integration

### Kommande arbete
- 📝 Externa systemintegrationer
- 📝 Avancerade metriker
- 📝 Rapportering och analys

## Nästa steg

1. Implementera databasstruktur
2. Skapa grundläggande services
3. Utveckla UI-komponenter
4. Implementera integrationer
5. Testa och optimera 