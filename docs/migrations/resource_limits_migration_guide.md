# Migrationsguide för resursbegränsningssystemet

Denna guide beskriver hur du migrerar och konfigurerar resursbegränsningssystemet i Supabase med MCP.

## Översikt

Följande migrationsfiler behöver köras för att implementera systemet:

1. `resource_limits_table.sql` - Definierar resursbegränsningar per prenumerationsnivå
2. `resource_usage_table.sql` - Spårar resursanvändning per organisation
3. `notifications_table.sql` - Hanterar notifikationer om resursbegränsningar
4. `device_tokens_table.sql` - Stödjer push-notifikationer

## Förberedelser

Innan du kör migrationerna, se till att:

1. Ha senaste versionen av Supabase-projektet
2. Ha administratörsrättigheter till projektet
3. Ha plockat upp alla migrationsfiler från `docs/migrations/`

## Migrationsordning

Migrationerna måste köras i följande ordning på grund av beroenden:

1. Kör `resource_limits_table.sql` först - denna definierar typer som andra tabeller använder
2. Kör `resource_usage_table.sql` - denna har beroenden till `resource_type` från första migrationen
3. Kör `notifications_table.sql` - denna har beroenden till både `resource_type` och skapar egna typer
4. Kör `device_tokens_table.sql` - denna kan köras sist

## Steg-för-steg instruktioner för MCP

### 1. Kör resource_limits_table.sql

```bash
# Ersätt PROJECT_ID med ditt Supabase-projektets ID
mcp_supabase_apply_migration \
  --project_id <PROJECT_ID> \
  --name create_resource_limits_table \
  --query "$(cat docs/migrations/resource_limits_table.sql)"
```

### 2. Kör resource_usage_table.sql

```bash
mcp_supabase_apply_migration \
  --project_id <PROJECT_ID> \
  --name create_resource_usage_table \
  --query "$(cat docs/migrations/resource_usage_table.sql)"
```

### 3. Kör notifications_table.sql

```bash
mcp_supabase_apply_migration \
  --project_id <PROJECT_ID> \
  --name create_notifications_table \
  --query "$(cat docs/migrations/notifications_table.sql)"
```

### 4. Kör device_tokens_table.sql

```bash
mcp_supabase_apply_migration \
  --project_id <PROJECT_ID> \
  --name create_device_tokens_table \
  --query "$(cat docs/migrations/device_tokens_table.sql)"
```

## Verifiera migrationen

Efter migrationerna bör du verifiera att alla tabeller skapats korrekt:

```sql
-- Kontrollera att alla tabeller skapats
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'resource_limits',
  'resource_usage',
  'resource_usage_history',
  'notifications',
  'resource_limit_notifications',
  'device_tokens'
);

-- Kontrollera att typerna skapats
SELECT typname 
FROM pg_type 
WHERE typname IN (
  'subscription_plan_type',
  'resource_type',
  'notification_type'
);
```

## Möjliga problem

### 1. Missing trigger_set_timestamp function

Om du får ett fel om att funktionen `trigger_set_timestamp` saknas, kör följande migration först:

```sql
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2. Problem med RLS-policyer

Om du får fel om överlappande RLS-policyer, kan du behöva droppa befintliga policyer:

```sql
DROP POLICY IF EXISTS <policy_name> ON <table_name>;
```

### 3. Beroendeproblem

Om du får fel om beroenden, kontrollera att du kör migrationerna i rätt ordning.

## Databasinställningar

För att optimera prestanda, kontrollera och uppdatera eventuellt följande inställningar:

1. **JIT-kompilering** - Se till att JIT-kompilering är aktiverad för bättre prestanda i komplexa frågor
2. **Shared Buffers** - Kan behöva ökas om tabellerna blir stora
3. **Vacuum** - Schemalägg regelbundna vacuums för historiktabellerna

## Nästa steg

Efter att migrationerna körts, behöver du:

1. Konfigurera frontend-komponenter för att använda de nya tabellerna
2. Uppdatera domäntjänster för att använda de nya databastabellerna
3. Testa att resursbegränsningssystemet fungerar som förväntat
4. Etablera övervakningsrutiner för att följa resursanvändning 