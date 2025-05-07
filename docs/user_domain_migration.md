# Användardomän Migrationsplan

## 1. Databasstruktur

### Nya Tabeller

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  settings JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### user_preferences
```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  notification_settings JSONB DEFAULT jsonb_build_object(
    'email', true,
    'push', true,
    'in_app', true
  ),
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'sv',
  timezone TEXT DEFAULT 'Europe/Stockholm',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### user_devices
```sql
CREATE TABLE user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  device_token TEXT NOT NULL,
  device_type TEXT NOT NULL,
  device_name TEXT,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Migreringsordning

1. Skapa nya tabeller
2. Migrera data från profiles till users
3. Uppdatera alla foreign keys
4. Validera data
5. Ta bort profiles-tabellen

## 2. Kodbasstruktur

### Nya Komponenter

```
app/
  domains/
    user/
      components/
        UserAvatar.tsx
        UserProfile.tsx
        UserSettings.tsx
        UserNotificationSettings.tsx
      hooks/
        useUser.ts
        useUserPreferences.ts
        useUserDevices.ts
      services/
        userService.ts
        userPreferencesService.ts
        userDevicesService.ts
      types/
        User.ts
        UserPreferences.ts
        UserDevice.ts
      constants/
        userConstants.ts
      utils/
        userUtils.ts
```

## 3. Migreringssekvens

1. Databasmigrering
   - Skapa nya tabeller
   - Migrera data
   - Uppdatera relationer
   - Validera

2. Kodbasmigrering
   - Implementera nya domänstruktur
   - Skapa nya komponenter
   - Implementera hooks och services
   - Uppdatera beroende komponenter

3. Testning
   - Enhetstester för nya komponenter
   - Integrationstester
   - E2E-tester
   - Prestandatester

4. Utrullning
   - Stegvis utrullning
   - Övervakning
   - Rollback-plan

## 4. SQL-migreringar

### Steg 1: Skapa nya tabeller
```sql
-- Skapa users tabell
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  settings JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Skapa user_preferences tabell
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  notification_settings JSONB DEFAULT jsonb_build_object(
    'email', true,
    'push', true,
    'in_app', true
  ),
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'sv',
  timezone TEXT DEFAULT 'Europe/Stockholm',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Skapa user_devices tabell
CREATE TABLE user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  device_token TEXT NOT NULL,
  device_type TEXT NOT NULL,
  device_name TEXT,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Steg 2: Migrera data
```sql
-- Migrera data från profiles till users
INSERT INTO users (id, email, name, avatar_url, created_at, updated_at)
SELECT id, email, name, avatar_url, created_at, updated_at
FROM profiles;

-- Skapa grundläggande preferences för alla användare
INSERT INTO user_preferences (user_id)
SELECT id FROM users;
```

### Steg 3: Uppdatera relationer
```sql
-- Uppdatera alla foreign keys att peka mot users istället för profiles
-- Detta görs för varje tabell som har en relation till profiles
```

### Steg 4: Validera
```sql
-- Kontrollera att all data har migrerats korrekt
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM users;

-- Kontrollera att alla relationer är intakta
-- Kör specifika valideringsqueries för varje relation
```

### Steg 5: Ta bort profiles
```sql
-- När allt är validerat och fungerar
DROP TABLE profiles;
```

## 5. Implementationsordning

1. Backend
   - Skapa nya tabeller
   - Implementera API-endpoints
   - Migrera data
   - Testa

2. Frontend
   - Implementera nya komponenter
   - Uppdatera befintliga komponenter
   - Testa

3. Integration
   - Integrera frontend med backend
   - Testa end-to-end
   - Prestandatesta

4. Utrullning
   - Stegvis utrullning till produktion
   - Övervakning
   - Hantera eventuella problem

## 6. Testplan

1. Enhetstester
   - Nya komponenter
   - Services
   - Hooks
   - Utils

2. Integrationstester
   - API-endpoints
   - Databasoperationer
   - Komponentintegration

3. E2E-tester
   - Användarflöden
   - Edge cases
   - Felhantering

## 7. Rollback-plan

1. Databas
   - Behåll profiles-tabellen tills migreringen är helt klar
   - Ha backup av all data
   - Skript för att återställa till tidigare tillstånd

2. Kod
   - Behåll gamla implementationen i separata branches
   - Möjlighet att snabbt växla tillbaka
   - Dokumentera alla ändringar

## 8. Övervakning

1. Metrics att övervaka
   - API-anrop
   - Databasprestanda
   - Felfrekvens
   - Användarfeedback

2. Larm
   - Sätt upp larm för kritiska metrics
   - Definiera tröskelvärden
   - Escalation path

## 9. Dokumentation

1. Teknisk dokumentation
   - API-specifikation
   - Databasschema
   - Kodstruktur

2. Användarguide
   - Nya funktioner
   - Ändringar i UI
   - FAQ

## 10. Tidplan

1. Förberedelse: 1 vecka
   - Planering
   - Setup
   - Initial dokumentation

2. Implementation: 2 veckor
   - Backend: 1 vecka
   - Frontend: 1 vecka

3. Testning: 1 vecka
   - Unit tests
   - Integration tests
   - E2E tests

4. Utrullning: 1 vecka
   - Stegvis utrullning
   - Övervakning
   - Stabilisering

Total tid: 5 veckor 