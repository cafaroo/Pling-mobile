# Notification Förbättringsplan

## Översikt

Detta dokument beskriver strukturen och implementationen av notifikationsdomänen i Pling-applikationen. Denna domän hanterar alla typer av meddelanden och notifikationer, inklusive push-notiser, in-app meddelanden och systemnotifikationer.

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
  /notification
    NotificationList.tsx       # Lista över notifikationer
    NotificationCard.tsx       # Enskild notifikation
    NotificationBadge.tsx      # Notifikationsindikator
    NotificationCenter.tsx     # Centraliserad notifikationshantering
    NotificationSettings.tsx   # Inställningar för notifikationer
    
/hooks
  /notification
    useNotifications.ts        # Hook för notifikationshantering
    useNotificationState.ts    # Hook för notifikationstillstånd
    usePushNotifications.ts    # Hook för push-notifikationer
    useNotificationSettings.ts # Hook för inställningar
    
/services
  /notification
    notificationService.ts     # Huvudservice för notifikationer
    pushService.ts            # Push-notifikationsservice
    messageService.ts         # In-app meddelandeservice
    notificationQueue.ts      # Köhantering för notifikationer
    
/types
  notification.ts             # Typdefinitioner för notifikationer
  message.ts                 # Meddelandetyper
  push.ts                    # Push-notifikationstyper
  
/utils
  /notification
    formatters.ts            # Formatteringsfunktioner
    filters.ts              # Filtreringsfunktioner
    schedulers.ts           # Schemaläggningsfunktioner
```

## Datamodell

### Huvudmodeller

```typescript
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  created_at: string;
  read_at?: string;
  
  // Metadata
  priority: NotificationPriority;
  category: NotificationCategory;
  
  // Relationer
  user_id: string;
  team_id?: string;
  
  // Källreferenser
  source: {
    type: NotificationSourceType;
    id: string;
    metadata?: Record<string, any>;
  };
  
  // Interaktionsdata
  action?: {
    type: NotificationActionType;
    route?: string;
    data?: Record<string, any>;
  };
  
  // Push-specifik data
  push_data?: {
    device_tokens: string[];
    sent_at?: string;
    delivered_at?: string;
    clicked_at?: string;
  };
}

export interface NotificationPreferences {
  user_id: string;
  
  // Generella inställningar
  enabled: boolean;
  quiet_hours: {
    start: string;
    end: string;
    timezone: string;
  };
  
  // Kategoriinställningar
  categories: {
    [key in NotificationCategory]: {
      enabled: boolean;
      push_enabled: boolean;
      email_enabled: boolean;
      priority_threshold: NotificationPriority;
    };
  };
  
  // Kanalinställningar
  channels: {
    push: boolean;
    email: boolean;
    in_app: boolean;
  };
}

export interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  
  // Mallinnehåll
  title_template: string;
  message_template: string;
  
  // Metadata
  category: NotificationCategory;
  default_priority: NotificationPriority;
  
  // Konfiguration
  config: {
    allow_scheduling: boolean;
    require_confirmation: boolean;
    ttl?: number;
  };
  
  // Variabler
  variables: {
    name: string;
    type: string;
    required: boolean;
    default?: any;
  }[];
}

export interface NotificationBatch {
  id: string;
  template_id: string;
  
  // Målgrupp
  recipients: {
    user_ids: string[];
    team_ids?: string[];
    filters?: NotificationFilter[];
  };
  
  // Schemaläggning
  schedule?: {
    send_at: string;
    expire_at?: string;
    repeat?: NotificationRepeatConfig;
  };
  
  // Status
  status: NotificationBatchStatus;
  stats: {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    clicked: number;
  };
}
```

## Integrationer

### 1. Push-notifikationer (Expo)

```typescript
export class PushNotificationService {
  async registerDevice(
    user_id: string,
    device_token: string
  ): Promise<void> {
    // Registrera enhet för push-notifikationer
  }
  
  async sendPushNotification(
    notification: Notification
  ): Promise<PushResult> {
    // Skicka push via Expo
  }
  
  async schedulePushNotification(
    notification: Notification,
    schedule: NotificationSchedule
  ): Promise<void> {
    // Schemalägg push-notifikation
  }
}
```

### 2. In-app meddelanden

```typescript
export class InAppMessageService {
  async showMessage(
    notification: Notification
  ): Promise<void> {
    // Visa in-app meddelande
  }
  
  async queueMessage(
    notification: Notification,
    priority: NotificationPriority
  ): Promise<void> {
    // Köa meddelande för visning
  }
}
```

### 3. Integrationer med andra domäner

```typescript
export class NotificationIntegrationService {
  // Team-integrationer
  async notifyTeam(
    team_id: string,
    template: NotificationTemplate,
    data: Record<string, any>
  ): Promise<void> {
    // Notifiera team
  }
  
  // Mål-integrationer
  async notifyGoalProgress(
    goal_id: string,
    progress: number
  ): Promise<void> {
    // Notifiera om måluppdatering
  }
  
  // Tävlings-integrationer
  async notifyCompetitionUpdate(
    competition_id: string,
    update: CompetitionUpdate
  ): Promise<void> {
    // Notifiera om tävlingsuppdatering
  }
  
  // Transaktions-integrationer
  async notifyTransactionComplete(
    transaction_id: string
  ): Promise<void> {
    // Notifiera om genomförd transaktion
  }
}
```

## Implementation

### Fas 1: Grundläggande infrastruktur

1. **Databasschema**
```sql
-- Notifikationer
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL,
  category TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  team_id UUID REFERENCES teams(id),
  source JSONB NOT NULL,
  action JSONB,
  push_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Notifikationsinställningar
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  enabled BOOLEAN DEFAULT true,
  quiet_hours JSONB DEFAULT '{}'::jsonb,
  categories JSONB DEFAULT '{}'::jsonb,
  channels JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifikationsmallar
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  category TEXT NOT NULL,
  default_priority TEXT NOT NULL,
  config JSONB NOT NULL,
  variables JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifikationsbatcher
CREATE TABLE notification_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES notification_templates(id),
  recipients JSONB NOT NULL,
  schedule JSONB,
  status TEXT NOT NULL,
  stats JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhetsregistreringar för push
CREATE TABLE device_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  device_token TEXT NOT NULL,
  device_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(device_token)
);
```

2. **Grundläggande services**

```typescript
export class NotificationService {
  async createNotification(
    data: CreateNotificationDTO
  ): Promise<Notification> {
    // Skapa notifikation
  }
  
  async markAsRead(
    notification_id: string
  ): Promise<void> {
    // Markera som läst
  }
  
  async updatePreferences(
    user_id: string,
    preferences: UpdatePreferencesDTO
  ): Promise<NotificationPreferences> {
    // Uppdatera inställningar
  }
  
  async processNotificationBatch(
    batch: NotificationBatch
  ): Promise<void> {
    // Processa notifikationsbatch
  }
}
```

### Fas 2: UI-komponenter

1. **NotificationCenter**
   - Central hantering av alla notifikationer
   - Realtidsuppdateringar
   - Filtreringsmöjligheter

2. **NotificationList**
   - Virtualiserad lista
   - Pull-to-refresh
   - Infinite scroll

3. **NotificationCard**
   - Interaktiva notifikationer
   - Stöd för olika typer
   - Animationer

4. **NotificationBadge**
   - Räknare för olästa
   - Animerade uppdateringar
   - Prioritetsindikation

### Fas 3: Push-integration

1. **Expo Push Setup**
2. **Device Registration**
3. **Token Management**
4. **Notification Scheduling**

## Testning

### Enhetstester
- Notifikationslogik
- Mallhantering
- Filterlogik

### Integrationstester
- Push-notifikationer
- Realtidsuppdateringar
- Batchprocesser

### Prestandatester
- Skalning av notifikationer
- Samtidiga leveranser
- Databasbelastning

## Tidplan

### Vecka 1: Grundstruktur
- Dag 1-2: Databasschema
- Dag 3-4: Grundläggande services
- Dag 5: TypeScript-interfaces

### Vecka 2: UI och logik
- Dag 1-2: NotificationCenter och List
- Dag 3-4: Card och Badge
- Dag 5: Inställningar

### Vecka 3: Push och integrationer
- Dag 1-2: Expo Push setup
- Dag 3-4: Device registration
- Dag 5: Batchprocesser

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
- 📝 Push-integration
- 📝 Realtidsuppdateringar

### Kommande arbete
- 📝 Batchprocesser
- 📝 Avancerade mallar
- 📝 Prestandaoptimering

## Nästa steg

1. Implementera databasstruktur
2. Skapa grundläggande services
3. Utveckla UI-komponenter
4. Implementera push-notifikationer
5. Testa och optimera 